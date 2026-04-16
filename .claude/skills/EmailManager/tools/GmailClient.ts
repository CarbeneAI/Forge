#!/usr/bin/env bun
/**
 * GmailClient.ts - Gmail API wrapper for EmailManager
 *
 * Usage:
 *   bun GmailClient.ts list --account personal --query "is:unread" --max 50
 *   bun GmailClient.ts get --account personal --id <message-id>
 *   bun GmailClient.ts headers --account personal --id <message-id>
 *   bun GmailClient.ts labels --account personal --id <message-id> --add IMPORTANT --remove UNREAD
 *   bun GmailClient.ts send --account personal --to "user@example.com" --subject "Test" --body "Hello"
 */

import { google, gmail_v1 } from "googleapis";
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

interface EmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  internalDate: string;
  sizeEstimate: number;
  headers: Record<string, string>;
  body?: string;
  parts?: {
    mimeType: string;
    filename: string;
    body: string;
  }[];
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
 * Get authenticated Gmail client
 */
export async function getGmailClient(account: "personal" | "workspace"): Promise<gmail_v1.Gmail> {
  if (!fs.existsSync(TOKEN_FILE)) {
    throw new Error(`No tokens found. Run: bun OAuth2Setup.ts --account ${account}`);
  }

  const { clientId, clientSecret, encryptionKey } = loadEnv();
  const store: TokenStore = JSON.parse(fs.readFileSync(TOKEN_FILE, "utf-8"));

  const encryptedToken = store[account];
  if (!encryptedToken) {
    throw new Error(`No token for ${account}. Run: bun OAuth2Setup.ts --account ${account}`);
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
    // Update stored tokens when refreshed
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

  return google.gmail({ version: "v1", auth: oauth2Client });
}

/**
 * List messages matching query
 */
export async function listMessages(
  account: "personal" | "workspace",
  query: string = "is:unread",
  maxResults: number = 50
): Promise<{ id: string; threadId: string }[]> {
  const gmail = await getGmailClient(account);

  const response = await gmail.users.messages.list({
    userId: "me",
    q: query,
    maxResults,
  });

  return response.data.messages || [];
}

/**
 * Get full message by ID
 */
export async function getMessage(
  account: "personal" | "workspace",
  messageId: string
): Promise<EmailMessage> {
  const gmail = await getGmailClient(account);

  const response = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });

  const message = response.data;
  const headers: Record<string, string> = {};

  // Extract headers
  for (const header of message.payload?.headers || []) {
    if (header.name && header.value) {
      headers[header.name.toLowerCase()] = header.value;
    }
  }

  // Extract body
  let body = "";
  const parts: { mimeType: string; filename: string; body: string }[] = [];

  function extractBody(payload: gmail_v1.Schema$MessagePart): void {
    if (payload.body?.data) {
      const decoded = Buffer.from(payload.body.data, "base64").toString("utf-8");
      if (payload.mimeType === "text/plain") {
        body = decoded;
      }
      parts.push({
        mimeType: payload.mimeType || "unknown",
        filename: payload.filename || "",
        body: decoded.substring(0, 1000), // Limit body size
      });
    }

    if (payload.parts) {
      for (const part of payload.parts) {
        extractBody(part);
      }
    }
  }

  if (message.payload) {
    extractBody(message.payload);
  }

  return {
    id: message.id || "",
    threadId: message.threadId || "",
    labelIds: message.labelIds || [],
    snippet: message.snippet || "",
    internalDate: message.internalDate || "",
    sizeEstimate: message.sizeEstimate || 0,
    headers,
    body: body.substring(0, 2000), // Limit for security
    parts,
  };
}

/**
 * Get message headers only (faster)
 */
export async function getMessageHeaders(
  account: "personal" | "workspace",
  messageId: string
): Promise<Record<string, string>> {
  const gmail = await getGmailClient(account);

  const response = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "metadata",
    metadataHeaders: [
      "From",
      "To",
      "Subject",
      "Date",
      "Reply-To",
      "Authentication-Results",
      "Received-SPF",
      "DKIM-Signature",
      "ARC-Authentication-Results",
      "X-Mailer",
      "List-Unsubscribe",
      "Precedence",
    ],
  });

  const headers: Record<string, string> = {};
  for (const header of response.data.payload?.headers || []) {
    if (header.name && header.value) {
      headers[header.name.toLowerCase()] = header.value;
    }
  }

  return headers;
}

/**
 * Set labels on a message
 */
export async function setLabels(
  account: "personal" | "workspace",
  messageId: string,
  addLabels: string[] = [],
  removeLabels: string[] = []
): Promise<void> {
  const gmail = await getGmailClient(account);

  await gmail.users.messages.modify({
    userId: "me",
    id: messageId,
    requestBody: {
      addLabelIds: addLabels,
      removeLabelIds: removeLabels,
    },
  });
}

/**
 * Send an email
 */
export async function sendMessage(
  account: "personal" | "workspace",
  to: string,
  subject: string,
  body: string
): Promise<string> {
  const gmail = await getGmailClient(account);

  // Get sender email
  const store: TokenStore = JSON.parse(fs.readFileSync(TOKEN_FILE, "utf-8"));
  const from = store[account]?.email || "me";

  // Create RFC 2822 message
  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    body,
  ].join("\r\n");

  const encoded = Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const response = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encoded,
    },
  });

  return response.data.id || "";
}

/**
 * Get account info
 */
export async function getAccountInfo(account: "personal" | "workspace"): Promise<{
  email: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}> {
  const gmail = await getGmailClient(account);

  const response = await gmail.users.getProfile({
    userId: "me",
  });

  return {
    email: response.data.emailAddress || "",
    messagesTotal: response.data.messagesTotal || 0,
    threadsTotal: response.data.threadsTotal || 0,
    historyId: response.data.historyId || "",
  };
}

/**
 * Main CLI
 */
async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    options: {
      account: { type: "string", short: "a" },
      query: { type: "string", short: "q" },
      max: { type: "string", short: "m" },
      id: { type: "string" },
      to: { type: "string" },
      subject: { type: "string", short: "s" },
      body: { type: "string", short: "b" },
      add: { type: "string", multiple: true },
      remove: { type: "string", multiple: true },
      help: { type: "boolean", short: "h" },
    },
    allowPositionals: true,
  });

  const command = positionals[0];

  if (values.help || !command) {
    console.log(`
GmailClient.ts - Gmail API wrapper

Commands:
  list       List messages matching query
  get        Get full message by ID
  headers    Get message headers only
  labels     Modify message labels
  send       Send an email
  info       Get account info

Options:
  -a, --account   Account: 'personal' or 'workspace' (required)
  -q, --query     Gmail search query (default: "is:unread")
  -m, --max       Max results for list (default: 50)
  --id            Message ID for get/headers/labels
  --to            Recipient for send
  -s, --subject   Subject for send
  -b, --body      Body for send
  --add           Labels to add (can repeat)
  --remove        Labels to remove (can repeat)

Examples:
  bun GmailClient.ts list --account personal --query "is:unread" --max 10
  bun GmailClient.ts get --account workspace --id 18d5a7b2c3e4f5a6
  bun GmailClient.ts headers --account personal --id 18d5a7b2c3e4f5a6
  bun GmailClient.ts labels --account personal --id 18d5a7b2c3e4f5a6 --add STARRED --remove UNREAD
  bun GmailClient.ts send --account personal --to "user@example.com" --subject "Test" --body "Hello"
  bun GmailClient.ts info --account personal
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
        const query = (values.query as string) || "is:unread";
        const max = parseInt((values.max as string) || "50", 10);
        const messages = await listMessages(account, query, max);
        console.log(JSON.stringify({ count: messages.length, messages }, null, 2));
        break;
      }

      case "get": {
        if (!values.id) {
          console.error("Error: --id is required for get");
          process.exit(1);
        }
        const message = await getMessage(account, values.id as string);
        console.log(JSON.stringify(message, null, 2));
        break;
      }

      case "headers": {
        if (!values.id) {
          console.error("Error: --id is required for headers");
          process.exit(1);
        }
        const headers = await getMessageHeaders(account, values.id as string);
        console.log(JSON.stringify(headers, null, 2));
        break;
      }

      case "labels": {
        if (!values.id) {
          console.error("Error: --id is required for labels");
          process.exit(1);
        }
        await setLabels(
          account,
          values.id as string,
          (values.add as string[]) || [],
          (values.remove as string[]) || []
        );
        console.log(JSON.stringify({ success: true, id: values.id }));
        break;
      }

      case "send": {
        if (!values.to || !values.subject || !values.body) {
          console.error("Error: --to, --subject, and --body are required for send");
          process.exit(1);
        }
        const id = await sendMessage(
          account,
          values.to as string,
          values.subject as string,
          values.body as string
        );
        console.log(JSON.stringify({ success: true, id }));
        break;
      }

      case "info": {
        const info = await getAccountInfo(account);
        console.log(JSON.stringify(info, null, 2));
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

// Export for use as module
export { TokenData, EncryptedToken, TokenStore, EmailMessage };

// Run if called directly
if (import.meta.main) {
  main();
}
