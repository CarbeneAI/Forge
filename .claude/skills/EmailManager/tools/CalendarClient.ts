#!/usr/bin/env bun
/**
 * CalendarClient.ts - Google Calendar API wrapper for EmailManager
 *
 * Usage:
 *   bun CalendarClient.ts list --account personal --days 7
 *   bun CalendarClient.ts get --account personal --event-id <id>
 *   bun CalendarClient.ts create --account personal --title "Meeting" --start "2026-02-10T10:00:00" --duration 60
 *   bun CalendarClient.ts freebusy --account personal --start "2026-02-10T09:00:00" --end "2026-02-10T17:00:00"
 *   bun CalendarClient.ts delete --account personal --event-id <id>
 */

import { google, calendar_v3 } from "googleapis";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { parseArgs } from "util";

// Types
interface TokenData {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  token_type: string;
  scope: string;
}

interface EncryptedToken {
  encrypted: string;
  iv: string;
  tag: string;
  email: string;
  created: string;
  scopes: string[];
}

interface TokenStore {
  personal?: EncryptedToken;
  workspace?: EncryptedToken;
}

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  attendees?: { email: string; responseStatus?: string }[];
  organizer?: { email: string; displayName?: string };
  status: string;
  htmlLink?: string;
}

interface FreeBusySlot {
  start: string;
  end: string;
}

// Constants
const SKILL_DIR = path.dirname(path.dirname(import.meta.path));
const DATA_DIR = path.join(SKILL_DIR, "data");
const TOKEN_FILE = path.join(DATA_DIR, "oauth-tokens.json");

/**
 * Load environment variables
 */
function loadEnv(): {
  clientId: string;
  clientSecret: string;
  encryptionKey: Buffer;
} {
  const envPath = path.join(process.env.HOME || "", ".claude", ".env");

  if (!fs.existsSync(envPath)) {
    throw new Error("~/.claude/.env not found");
  }

  const envContent = fs.readFileSync(envPath, "utf-8");
  const env: Record<string, string> = {};

  for (const line of envContent.split("\n")) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
    }
  }

  const clientId = env.GMAIL_CLIENT_ID;
  const clientSecret = env.GMAIL_CLIENT_SECRET;
  const encryptionKeyHex = env.EMAIL_ENCRYPTION_KEY;

  if (!clientId || !clientSecret || !encryptionKeyHex) {
    throw new Error("Missing GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, or EMAIL_ENCRYPTION_KEY in .env");
  }

  return {
    clientId,
    clientSecret,
    encryptionKey: Buffer.from(encryptionKeyHex, "hex"),
  };
}

/**
 * Decrypt token data
 */
function decryptToken(data: EncryptedToken, key: Buffer): TokenData {
  const iv = Buffer.from(data.iv, "base64");
  const tag = Buffer.from(data.tag, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(data.encrypted, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return JSON.parse(decrypted);
}

/**
 * Encrypt token data
 */
function encryptToken(token: TokenData, key: Buffer): { encrypted: string; iv: string; tag: string } {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(JSON.stringify(token), "utf8", "base64");
  encrypted += cipher.final("base64");

  const tag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
}

/**
 * Save token store
 */
function saveTokenStore(store: TokenStore): void {
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(store, null, 2));
  fs.chmodSync(TOKEN_FILE, 0o600);
}

/**
 * Get authenticated Calendar client
 */
export async function getCalendarClient(account: "personal" | "workspace"): Promise<calendar_v3.Calendar> {
  if (!fs.existsSync(TOKEN_FILE)) {
    throw new Error(`No tokens found. Run: bun OAuth2Setup.ts --account ${account}`);
  }

  const { clientId, clientSecret, encryptionKey } = loadEnv();
  const store: TokenStore = JSON.parse(fs.readFileSync(TOKEN_FILE, "utf-8"));

  const encryptedToken = store[account];
  if (!encryptedToken) {
    throw new Error(`No token for ${account}. Run: bun OAuth2Setup.ts --account ${account}`);
  }

  // Check if calendar scopes are present
  if (!encryptedToken.scopes.some(s => s.includes("calendar"))) {
    throw new Error(`Calendar scopes not authorized. Re-run: bun OAuth2Setup.ts --account ${account}`);
  }

  const tokenData = decryptToken(encryptedToken, encryptionKey);

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    "http://localhost:8888/oauth2callback"
  );

  oauth2Client.setCredentials({
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expiry_date: tokenData.expiry_date,
    token_type: tokenData.token_type,
  });

  // Set up automatic token refresh
  oauth2Client.on("tokens", (tokens) => {
    const newTokenData: TokenData = {
      access_token: tokens.access_token || tokenData.access_token,
      refresh_token: tokens.refresh_token || tokenData.refresh_token,
      expiry_date: tokens.expiry_date || tokenData.expiry_date,
      token_type: tokens.token_type || tokenData.token_type,
      scope: tokenData.scope,
    };

    const encrypted = encryptToken(newTokenData, encryptionKey);
    store[account] = {
      ...encrypted,
      email: encryptedToken.email,
      created: encryptedToken.created,
      scopes: encryptedToken.scopes,
    };
    saveTokenStore(store);
  });

  return google.calendar({ version: "v3", auth: oauth2Client });
}

/**
 * List upcoming events
 */
export async function listEvents(
  account: "personal" | "workspace",
  days: number = 7,
  maxResults: number = 50
): Promise<CalendarEvent[]> {
  const calendar = await getCalendarClient(account);

  const now = new Date();
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: now.toISOString(),
    timeMax: future.toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: "startTime",
  });

  return (response.data.items || []).map((event) => ({
    id: event.id || "",
    summary: event.summary || "(No title)",
    description: event.description,
    start: event.start?.dateTime || event.start?.date || "",
    end: event.end?.dateTime || event.end?.date || "",
    location: event.location,
    attendees: event.attendees?.map((a) => ({
      email: a.email || "",
      responseStatus: a.responseStatus,
    })),
    organizer: event.organizer
      ? { email: event.organizer.email || "", displayName: event.organizer.displayName }
      : undefined,
    status: event.status || "confirmed",
    htmlLink: event.htmlLink,
  }));
}

/**
 * Get a single event by ID
 */
export async function getEvent(
  account: "personal" | "workspace",
  eventId: string
): Promise<CalendarEvent> {
  const calendar = await getCalendarClient(account);

  const response = await calendar.events.get({
    calendarId: "primary",
    eventId,
  });

  const event = response.data;
  return {
    id: event.id || "",
    summary: event.summary || "(No title)",
    description: event.description,
    start: event.start?.dateTime || event.start?.date || "",
    end: event.end?.dateTime || event.end?.date || "",
    location: event.location,
    attendees: event.attendees?.map((a) => ({
      email: a.email || "",
      responseStatus: a.responseStatus,
    })),
    organizer: event.organizer
      ? { email: event.organizer.email || "", displayName: event.organizer.displayName }
      : undefined,
    status: event.status || "confirmed",
    htmlLink: event.htmlLink,
  };
}

/**
 * Create a new event
 */
export async function createEvent(
  account: "personal" | "workspace",
  title: string,
  startTime: string,
  durationMinutes: number,
  options?: {
    description?: string;
    location?: string;
    attendees?: string[];
    sendUpdates?: boolean;
  }
): Promise<CalendarEvent> {
  const calendar = await getCalendarClient(account);

  const start = new Date(startTime);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  const event: calendar_v3.Schema$Event = {
    summary: title,
    start: {
      dateTime: start.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: end.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  };

  if (options?.description) {
    event.description = options.description;
  }

  if (options?.location) {
    event.location = options.location;
  }

  if (options?.attendees && options.attendees.length > 0) {
    event.attendees = options.attendees.map((email) => ({ email }));
  }

  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody: event,
    sendUpdates: options?.sendUpdates ? "all" : "none",
  });

  const created = response.data;
  return {
    id: created.id || "",
    summary: created.summary || "(No title)",
    description: created.description,
    start: created.start?.dateTime || created.start?.date || "",
    end: created.end?.dateTime || created.end?.date || "",
    location: created.location,
    attendees: created.attendees?.map((a) => ({
      email: a.email || "",
      responseStatus: a.responseStatus,
    })),
    organizer: created.organizer
      ? { email: created.organizer.email || "", displayName: created.organizer.displayName }
      : undefined,
    status: created.status || "confirmed",
    htmlLink: created.htmlLink,
  };
}

/**
 * Update an existing event
 */
export async function updateEvent(
  account: "personal" | "workspace",
  eventId: string,
  updates: {
    title?: string;
    startTime?: string;
    endTime?: string;
    description?: string;
    location?: string;
    attendees?: string[];
    sendUpdates?: boolean;
  }
): Promise<CalendarEvent> {
  const calendar = await getCalendarClient(account);

  // Get existing event first
  const existing = await calendar.events.get({
    calendarId: "primary",
    eventId,
  });

  const event: calendar_v3.Schema$Event = {
    ...existing.data,
  };

  if (updates.title) {
    event.summary = updates.title;
  }

  if (updates.startTime) {
    event.start = {
      dateTime: new Date(updates.startTime).toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  if (updates.endTime) {
    event.end = {
      dateTime: new Date(updates.endTime).toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  if (updates.description !== undefined) {
    event.description = updates.description;
  }

  if (updates.location !== undefined) {
    event.location = updates.location;
  }

  if (updates.attendees) {
    event.attendees = updates.attendees.map((email) => ({ email }));
  }

  const response = await calendar.events.update({
    calendarId: "primary",
    eventId,
    requestBody: event,
    sendUpdates: updates.sendUpdates ? "all" : "none",
  });

  const updated = response.data;
  return {
    id: updated.id || "",
    summary: updated.summary || "(No title)",
    description: updated.description,
    start: updated.start?.dateTime || updated.start?.date || "",
    end: updated.end?.dateTime || updated.end?.date || "",
    location: updated.location,
    attendees: updated.attendees?.map((a) => ({
      email: a.email || "",
      responseStatus: a.responseStatus,
    })),
    organizer: updated.organizer
      ? { email: updated.organizer.email || "", displayName: updated.organizer.displayName }
      : undefined,
    status: updated.status || "confirmed",
    htmlLink: updated.htmlLink,
  };
}

/**
 * Delete an event
 */
export async function deleteEvent(
  account: "personal" | "workspace",
  eventId: string,
  sendUpdates: boolean = false
): Promise<void> {
  const calendar = await getCalendarClient(account);

  await calendar.events.delete({
    calendarId: "primary",
    eventId,
    sendUpdates: sendUpdates ? "all" : "none",
  });
}

/**
 * Get free/busy information
 */
export async function getFreeBusy(
  account: "personal" | "workspace",
  startTime: string,
  endTime: string,
  additionalCalendars?: string[]
): Promise<{ calendar: string; busy: FreeBusySlot[] }[]> {
  const calendar = await getCalendarClient(account);

  // Get the user's email from the token store
  const store: TokenStore = JSON.parse(fs.readFileSync(TOKEN_FILE, "utf-8"));
  const email = store[account]?.email || "primary";

  const calendars = [email, ...(additionalCalendars || [])];

  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: new Date(startTime).toISOString(),
      timeMax: new Date(endTime).toISOString(),
      items: calendars.map((id) => ({ id })),
    },
  });

  const result: { calendar: string; busy: FreeBusySlot[] }[] = [];

  for (const [calendarId, data] of Object.entries(response.data.calendars || {})) {
    result.push({
      calendar: calendarId,
      busy: (data.busy || []).map((slot) => ({
        start: slot.start || "",
        end: slot.end || "",
      })),
    });
  }

  return result;
}

/**
 * Find available meeting slots
 */
export async function findAvailableSlots(
  account: "personal" | "workspace",
  startTime: string,
  endTime: string,
  durationMinutes: number,
  options?: {
    workingHoursStart?: number; // Hour in 24h format, default 9
    workingHoursEnd?: number; // Hour in 24h format, default 17
    additionalCalendars?: string[];
    maxSlots?: number;
  }
): Promise<{ start: string; end: string }[]> {
  const freeBusy = await getFreeBusy(account, startTime, endTime, options?.additionalCalendars);

  // Merge all busy times
  const allBusy: { start: Date; end: Date }[] = [];
  for (const cal of freeBusy) {
    for (const slot of cal.busy) {
      allBusy.push({
        start: new Date(slot.start),
        end: new Date(slot.end),
      });
    }
  }

  // Sort by start time
  allBusy.sort((a, b) => a.start.getTime() - b.start.getTime());

  const workStart = options?.workingHoursStart ?? 9;
  const workEnd = options?.workingHoursEnd ?? 17;
  const maxSlots = options?.maxSlots ?? 10;

  const availableSlots: { start: string; end: string }[] = [];
  const searchStart = new Date(startTime);
  const searchEnd = new Date(endTime);

  // Iterate through each day
  let currentDay = new Date(searchStart);
  currentDay.setHours(0, 0, 0, 0);

  while (currentDay < searchEnd && availableSlots.length < maxSlots) {
    // Skip weekends
    const dayOfWeek = currentDay.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      currentDay.setDate(currentDay.getDate() + 1);
      continue;
    }

    // Set working hours for this day
    const dayStart = new Date(currentDay);
    dayStart.setHours(workStart, 0, 0, 0);
    const dayEnd = new Date(currentDay);
    dayEnd.setHours(workEnd, 0, 0, 0);

    // Adjust for search window
    const effectiveStart = dayStart < searchStart ? searchStart : dayStart;
    const effectiveEnd = dayEnd > searchEnd ? searchEnd : dayEnd;

    // Find available slots in this day
    let slotStart = effectiveStart;

    for (const busy of allBusy) {
      if (busy.end <= effectiveStart) continue;
      if (busy.start >= effectiveEnd) break;

      // Check if there's a slot before this busy period
      if (slotStart < busy.start) {
        const slotEnd = busy.start;
        const slotDuration = (slotEnd.getTime() - slotStart.getTime()) / (60 * 1000);

        if (slotDuration >= durationMinutes) {
          availableSlots.push({
            start: slotStart.toISOString(),
            end: new Date(slotStart.getTime() + durationMinutes * 60 * 1000).toISOString(),
          });

          if (availableSlots.length >= maxSlots) break;
        }
      }

      // Move past this busy period
      slotStart = busy.end > slotStart ? busy.end : slotStart;
    }

    // Check for slot after all busy periods
    if (availableSlots.length < maxSlots && slotStart < effectiveEnd) {
      const slotDuration = (effectiveEnd.getTime() - slotStart.getTime()) / (60 * 1000);

      if (slotDuration >= durationMinutes) {
        availableSlots.push({
          start: slotStart.toISOString(),
          end: new Date(slotStart.getTime() + durationMinutes * 60 * 1000).toISOString(),
        });
      }
    }

    currentDay.setDate(currentDay.getDate() + 1);
  }

  return availableSlots;
}

/**
 * Main CLI
 */
async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    options: {
      account: { type: "string", short: "a" },
      days: { type: "string", short: "d" },
      "event-id": { type: "string" },
      title: { type: "string", short: "t" },
      start: { type: "string" },
      end: { type: "string" },
      duration: { type: "string" },
      description: { type: "string" },
      location: { type: "string", short: "l" },
      attendees: { type: "string", multiple: true },
      "send-updates": { type: "boolean" },
      "max-slots": { type: "string" },
      help: { type: "boolean", short: "h" },
    },
    allowPositionals: true,
  });

  const command = positionals[0];

  if (values.help || !command) {
    console.log(`
CalendarClient.ts - Google Calendar API wrapper

Commands:
  list       List upcoming events
  get        Get a single event by ID
  create     Create a new event
  update     Update an existing event
  delete     Delete an event
  freebusy   Get free/busy information
  available  Find available meeting slots

Options:
  -a, --account      Account: 'personal' or 'workspace' (required)
  -d, --days         Days to look ahead for list (default: 7)
  --event-id         Event ID for get/update/delete
  -t, --title        Event title for create/update
  --start            Start time (ISO 8601 format)
  --end              End time (ISO 8601 format)
  --duration         Duration in minutes for create/available
  --description      Event description
  -l, --location     Event location
  --attendees        Attendee emails (can repeat)
  --send-updates     Send email notifications to attendees
  --max-slots        Max available slots to return (default: 10)

Examples:
  bun CalendarClient.ts list --account personal --days 7
  bun CalendarClient.ts get --account personal --event-id abc123
  bun CalendarClient.ts create --account personal --title "Meeting" --start "2026-02-10T10:00:00" --duration 60
  bun CalendarClient.ts freebusy --account personal --start "2026-02-10T09:00:00" --end "2026-02-10T17:00:00"
  bun CalendarClient.ts available --account personal --start "2026-02-10" --end "2026-02-14" --duration 30
  bun CalendarClient.ts delete --account personal --event-id abc123
`);
    process.exit(0);
  }

  const account = values.account as "personal" | "workspace";
  if (!account || !["personal", "workspace"].includes(account)) {
    console.error("Error: --account must be 'personal' or 'workspace'");
    process.exit(1);
  }

  try {
    switch (command) {
      case "list": {
        const days = parseInt((values.days as string) || "7", 10);
        const events = await listEvents(account, days);
        console.log(JSON.stringify({ count: events.length, events }, null, 2));
        break;
      }

      case "get": {
        if (!values["event-id"]) {
          console.error("Error: --event-id is required for get");
          process.exit(1);
        }
        const event = await getEvent(account, values["event-id"] as string);
        console.log(JSON.stringify(event, null, 2));
        break;
      }

      case "create": {
        if (!values.title || !values.start || !values.duration) {
          console.error("Error: --title, --start, and --duration are required for create");
          process.exit(1);
        }
        const event = await createEvent(
          account,
          values.title as string,
          values.start as string,
          parseInt(values.duration as string, 10),
          {
            description: values.description as string,
            location: values.location as string,
            attendees: values.attendees as string[],
            sendUpdates: values["send-updates"] as boolean,
          }
        );
        console.log(JSON.stringify({ success: true, event }, null, 2));
        break;
      }

      case "update": {
        if (!values["event-id"]) {
          console.error("Error: --event-id is required for update");
          process.exit(1);
        }
        const event = await updateEvent(account, values["event-id"] as string, {
          title: values.title as string,
          startTime: values.start as string,
          endTime: values.end as string,
          description: values.description as string,
          location: values.location as string,
          attendees: values.attendees as string[],
          sendUpdates: values["send-updates"] as boolean,
        });
        console.log(JSON.stringify({ success: true, event }, null, 2));
        break;
      }

      case "delete": {
        if (!values["event-id"]) {
          console.error("Error: --event-id is required for delete");
          process.exit(1);
        }
        await deleteEvent(account, values["event-id"] as string, values["send-updates"] as boolean);
        console.log(JSON.stringify({ success: true, id: values["event-id"] }));
        break;
      }

      case "freebusy": {
        if (!values.start || !values.end) {
          console.error("Error: --start and --end are required for freebusy");
          process.exit(1);
        }
        const freeBusy = await getFreeBusy(
          account,
          values.start as string,
          values.end as string
        );
        console.log(JSON.stringify({ freeBusy }, null, 2));
        break;
      }

      case "available": {
        if (!values.start || !values.end || !values.duration) {
          console.error("Error: --start, --end, and --duration are required for available");
          process.exit(1);
        }
        const slots = await findAvailableSlots(
          account,
          values.start as string,
          values.end as string,
          parseInt(values.duration as string, 10),
          {
            maxSlots: values["max-slots"] ? parseInt(values["max-slots"] as string, 10) : undefined,
          }
        );
        console.log(JSON.stringify({ count: slots.length, slots }, null, 2));
        break;
      }

      default:
        console.error(`Error: Unknown command '${command}'`);
        process.exit(1);
    }
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Export types
export { CalendarEvent, FreeBusySlot };

// Run if called directly
if (import.meta.main) {
  main();
}
