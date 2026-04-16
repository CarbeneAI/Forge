#!/usr/bin/env bun
/**
 * MeetingScheduler.ts - Parse meeting requests and schedule meetings
 *
 * Usage:
 *   bun MeetingScheduler.ts parse --account personal --message-id <id>
 *   bun MeetingScheduler.ts suggest --account personal --duration 30 --start "2026-02-10" --end "2026-02-14"
 *   bun MeetingScheduler.ts schedule --account personal --message-id <id> --slot 1
 *   bun MeetingScheduler.ts respond --account personal --message-id <id> --slots "2026-02-10T10:00,2026-02-10T14:00,2026-02-11T09:00"
 */

import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";
import { parseArgs } from "util";
import { getMessage, sendMessage } from "./GmailClient";
import { findAvailableSlots, createEvent, CalendarEvent } from "./CalendarClient";

// Types
interface MeetingRequest {
  isMeetingRequest: boolean;
  confidence: number;
  suggestedDuration: number; // minutes
  preferredTimeframe?: {
    start?: string;
    end?: string;
    preferences?: string[];
  };
  topic?: string;
  attendees?: string[];
  location?: string;
  urgency: "high" | "medium" | "low";
  notes?: string;
}

interface TimeSlot {
  start: string;
  end: string;
  formatted: string;
}

interface ScheduleResult {
  success: boolean;
  event?: CalendarEvent;
  message?: string;
}

// Constants
const SKILL_DIR = path.dirname(path.dirname(import.meta.path));
const DATA_DIR = path.join(SKILL_DIR, "data");

/**
 * Load environment variables
 */
function loadEnv(): { anthropicApiKey: string } {
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

  const anthropicApiKey = env.ANTHROPIC_API_KEY;

  if (!anthropicApiKey) {
    throw new Error("ANTHROPIC_API_KEY not found in ~/.claude/.env");
  }

  return { anthropicApiKey };
}

/**
 * Format time slot for display
 */
function formatTimeSlot(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);

  const dateOpts: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
  };
  const timeOpts: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };

  const dateStr = startDate.toLocaleDateString("en-US", dateOpts);
  const startTimeStr = startDate.toLocaleTimeString("en-US", timeOpts);
  const endTimeStr = endDate.toLocaleTimeString("en-US", timeOpts);

  return `${dateStr}, ${startTimeStr} - ${endTimeStr}`;
}

/**
 * Parse an email to detect meeting requests
 */
export async function parseMeetingRequest(
  account: "personal" | "workspace",
  messageId: string
): Promise<MeetingRequest> {
  const { anthropicApiKey } = loadEnv();
  const anthropic = new Anthropic({ apiKey: anthropicApiKey });

  const email = await getMessage(account, messageId);

  const response = await anthropic.messages.create({
    model: "claude-3-5-haiku-20241022",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Analyze this email for meeting scheduling requests:

From: ${email.headers["from"]}
Subject: ${email.headers["subject"]}

${email.body?.substring(0, 1500)}

Output as JSON:
{
  "isMeetingRequest": boolean,
  "confidence": 0-100,
  "suggestedDuration": minutes (30, 45, 60, 90),
  "preferredTimeframe": {
    "start": "ISO date or null",
    "end": "ISO date or null",
    "preferences": ["morning", "afternoon", "specific times mentioned"]
  },
  "topic": "meeting topic if mentioned",
  "attendees": ["additional attendees if mentioned"],
  "location": "location if mentioned (or 'virtual')",
  "urgency": "high" | "medium" | "low",
  "notes": "any other relevant scheduling info"
}`,
      },
    ],
  });

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No response from Claude");
  }

  try {
    let jsonStr = textContent.text;
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }
    return JSON.parse(jsonStr);
  } catch {
    return {
      isMeetingRequest: false,
      confidence: 0,
      suggestedDuration: 30,
      urgency: "low",
    };
  }
}

/**
 * Suggest available meeting times
 */
export async function suggestMeetingTimes(
  account: "personal" | "workspace",
  options: {
    durationMinutes: number;
    startDate: string;
    endDate: string;
    maxSlots?: number;
    workingHoursStart?: number;
    workingHoursEnd?: number;
  }
): Promise<TimeSlot[]> {
  const slots = await findAvailableSlots(
    account,
    options.startDate,
    options.endDate,
    options.durationMinutes,
    {
      maxSlots: options.maxSlots || 5,
      workingHoursStart: options.workingHoursStart || 9,
      workingHoursEnd: options.workingHoursEnd || 17,
    }
  );

  return slots.map((slot) => ({
    start: slot.start,
    end: slot.end,
    formatted: formatTimeSlot(slot.start, slot.end),
  }));
}

/**
 * Schedule a meeting from a parsed request
 */
export async function scheduleMeeting(
  account: "personal" | "workspace",
  messageId: string,
  slotIndex: number,
  options?: {
    title?: string;
    description?: string;
    sendInvite?: boolean;
  }
): Promise<ScheduleResult> {
  // Parse the original email
  const email = await getMessage(account, messageId);
  const meetingRequest = await parseMeetingRequest(account, messageId);

  if (!meetingRequest.isMeetingRequest) {
    return {
      success: false,
      message: "Email doesn't appear to be a meeting request",
    };
  }

  // Get available slots
  const now = new Date();
  const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const slots = await suggestMeetingTimes(account, {
    durationMinutes: meetingRequest.suggestedDuration,
    startDate: meetingRequest.preferredTimeframe?.start || now.toISOString(),
    endDate: meetingRequest.preferredTimeframe?.end || twoWeeksLater.toISOString(),
    maxSlots: 5,
  });

  if (slotIndex < 0 || slotIndex >= slots.length) {
    return {
      success: false,
      message: `Invalid slot index. Available slots: 0-${slots.length - 1}`,
    };
  }

  const selectedSlot = slots[slotIndex];

  // Extract sender email for attendee
  const senderMatch = email.headers["from"]?.match(/<([^>]+)>/) || [null, email.headers["from"]];
  const senderEmail = senderMatch[1] || email.headers["from"];

  // Create the event
  const title =
    options?.title ||
    meetingRequest.topic ||
    `Meeting with ${email.headers["from"]?.split("<")[0]?.trim() || "Contact"}`;

  const attendees = [senderEmail, ...(meetingRequest.attendees || [])].filter(Boolean);

  const event = await createEvent(
    account,
    title,
    selectedSlot.start,
    meetingRequest.suggestedDuration,
    {
      description:
        options?.description ||
        `Meeting scheduled in response to email: "${email.headers["subject"]}"`,
      attendees,
      sendUpdates: options?.sendInvite ?? true,
    }
  );

  return {
    success: true,
    event,
    message: `Meeting scheduled for ${selectedSlot.formatted}`,
  };
}

/**
 * Generate a reply with available time slots
 */
export async function generateSchedulingResponse(
  account: "personal" | "workspace",
  messageId: string,
  timeSlots: string[], // ISO date strings
  options?: {
    tone?: "professional" | "friendly" | "casual";
    additionalNotes?: string;
  }
): Promise<{ subject: string; body: string }> {
  const { anthropicApiKey } = loadEnv();
  const anthropic = new Anthropic({ apiKey: anthropicApiKey });

  const email = await getMessage(account, messageId);
  const tone = options?.tone || "professional";

  // Format the time slots
  const formattedSlots = timeSlots.map((slot, i) => {
    const date = new Date(slot);
    const end = new Date(date.getTime() + 30 * 60 * 1000); // Assume 30 min
    return `${i + 1}. ${formatTimeSlot(slot, end.toISOString())}`;
  });

  const response = await anthropic.messages.create({
    model: "claude-3-5-haiku-20241022",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Generate a ${tone} email reply proposing these meeting times:

Original email from: ${email.headers["from"]}
Subject: ${email.headers["subject"]}

Proposed times:
${formattedSlots.join("\n")}

${options?.additionalNotes ? `Additional notes: ${options.additionalNotes}` : ""}

Output as JSON:
{
  "subject": "Re: [appropriate subject]",
  "body": "[the reply text proposing the times, asking recipient to choose one]"
}`,
      },
    ],
  });

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No response from Claude");
  }

  try {
    let jsonStr = textContent.text;
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }
    return JSON.parse(jsonStr);
  } catch {
    // Fallback response
    return {
      subject: `Re: ${email.headers["subject"]}`,
      body: `Thank you for reaching out. I have the following times available:\n\n${formattedSlots.join("\n")}\n\nPlease let me know which time works best for you.`,
    };
  }
}

/**
 * Send scheduling response with proposed times
 */
export async function sendSchedulingResponse(
  account: "personal" | "workspace",
  messageId: string,
  timeSlots: string[],
  options?: {
    tone?: "professional" | "friendly" | "casual";
    additionalNotes?: string;
  }
): Promise<{ success: boolean; sentMessageId: string }> {
  const email = await getMessage(account, messageId);
  const response = await generateSchedulingResponse(account, messageId, timeSlots, options);

  // Extract sender email
  const senderMatch = email.headers["from"]?.match(/<([^>]+)>/) || [null, email.headers["from"]];
  const senderEmail = senderMatch[1] || email.headers["from"];

  const sentId = await sendMessage(account, senderEmail, response.subject, response.body);

  return {
    success: true,
    sentMessageId: sentId,
  };
}

/**
 * Full workflow: Parse email, find slots, and prepare response
 */
export async function processMeetingRequest(
  account: "personal" | "workspace",
  messageId: string
): Promise<{
  meetingRequest: MeetingRequest;
  availableSlots: TimeSlot[];
  suggestedResponse: { subject: string; body: string };
}> {
  // Parse the meeting request
  const meetingRequest = await parseMeetingRequest(account, messageId);

  if (!meetingRequest.isMeetingRequest) {
    throw new Error("Email does not appear to be a meeting request");
  }

  // Find available slots
  const now = new Date();
  const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const availableSlots = await suggestMeetingTimes(account, {
    durationMinutes: meetingRequest.suggestedDuration,
    startDate: meetingRequest.preferredTimeframe?.start || now.toISOString(),
    endDate: meetingRequest.preferredTimeframe?.end || twoWeeksLater.toISOString(),
    maxSlots: 3,
  });

  // Generate suggested response
  const suggestedResponse = await generateSchedulingResponse(
    account,
    messageId,
    availableSlots.slice(0, 3).map((s) => s.start)
  );

  return {
    meetingRequest,
    availableSlots,
    suggestedResponse,
  };
}

/**
 * Main CLI
 */
async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    options: {
      account: { type: "string", short: "a" },
      "message-id": { type: "string", short: "m" },
      duration: { type: "string", short: "d" },
      start: { type: "string" },
      end: { type: "string" },
      slot: { type: "string" },
      slots: { type: "string" },
      title: { type: "string", short: "t" },
      tone: { type: "string" },
      "send-invite": { type: "boolean" },
      "max-slots": { type: "string" },
      help: { type: "boolean", short: "h" },
    },
    allowPositionals: true,
  });

  const command = positionals[0];

  if (values.help || !command) {
    console.log(`
MeetingScheduler.ts - Parse meeting requests and schedule meetings

Commands:
  parse      Parse an email to detect meeting requests
  suggest    Suggest available meeting times
  schedule   Schedule a meeting from a parsed request
  respond    Send a reply with proposed time slots
  process    Full workflow: parse, find slots, prepare response

Options:
  -a, --account      Account: 'personal' or 'workspace' (required)
  -m, --message-id   Message ID to process
  -d, --duration     Meeting duration in minutes (default: 30)
  --start            Start date for availability search
  --end              End date for availability search
  --slot             Slot index to schedule (0-based)
  --slots            Comma-separated ISO timestamps for respond command
  -t, --title        Meeting title override
  --tone             Response tone: professional, friendly, casual
  --send-invite      Send calendar invite to attendees
  --max-slots        Maximum slots to suggest (default: 5)

Examples:
  bun MeetingScheduler.ts parse --account personal --message-id abc123
  bun MeetingScheduler.ts suggest --account personal --duration 30 --start "2026-02-10" --end "2026-02-14"
  bun MeetingScheduler.ts schedule --account personal --message-id abc123 --slot 0 --send-invite
  bun MeetingScheduler.ts respond --account personal --message-id abc123 --slots "2026-02-10T10:00,2026-02-10T14:00"
  bun MeetingScheduler.ts process --account personal --message-id abc123
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
      case "parse": {
        if (!values["message-id"]) {
          console.error("Error: --message-id is required for parse");
          process.exit(1);
        }
        const request = await parseMeetingRequest(account, values["message-id"] as string);
        console.log(JSON.stringify(request, null, 2));
        break;
      }

      case "suggest": {
        if (!values.start || !values.end) {
          console.error("Error: --start and --end are required for suggest");
          process.exit(1);
        }
        const slots = await suggestMeetingTimes(account, {
          durationMinutes: parseInt((values.duration as string) || "30", 10),
          startDate: values.start as string,
          endDate: values.end as string,
          maxSlots: values["max-slots"] ? parseInt(values["max-slots"] as string, 10) : 5,
        });
        console.log(JSON.stringify({ count: slots.length, slots }, null, 2));
        break;
      }

      case "schedule": {
        if (!values["message-id"] || values.slot === undefined) {
          console.error("Error: --message-id and --slot are required for schedule");
          process.exit(1);
        }
        const result = await scheduleMeeting(
          account,
          values["message-id"] as string,
          parseInt(values.slot as string, 10),
          {
            title: values.title as string,
            sendInvite: values["send-invite"] as boolean,
          }
        );
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case "respond": {
        if (!values["message-id"] || !values.slots) {
          console.error("Error: --message-id and --slots are required for respond");
          process.exit(1);
        }
        const timeSlots = (values.slots as string).split(",").map((s) => s.trim());
        const result = await sendSchedulingResponse(account, values["message-id"] as string, timeSlots, {
          tone: values.tone as "professional" | "friendly" | "casual",
        });
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case "process": {
        if (!values["message-id"]) {
          console.error("Error: --message-id is required for process");
          process.exit(1);
        }
        const result = await processMeetingRequest(account, values["message-id"] as string);
        console.log(JSON.stringify(result, null, 2));
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
export { MeetingRequest, TimeSlot, ScheduleResult };

// Run if called directly
if (import.meta.main) {
  main();
}
