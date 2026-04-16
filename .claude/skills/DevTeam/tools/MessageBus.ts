#!/usr/bin/env bun

/**
 * MessageBus - File-based inter-agent messaging system
 *
 * Enables agents to send, read, and acknowledge messages asynchronously.
 */

import { resolve, join, basename } from "path";
import { existsSync, mkdirSync, readdirSync, renameSync } from "fs";

interface Message {
  from: string;
  to: string;
  type: string;
  re: string;
  timestamp: string;
  body: string;
}

type MessageType =
  | "task_assignment"
  | "task_complete"
  | "task_failed"
  | "review_request"
  | "review_result"
  | "status_request"
  | "status_response";

const VALID_MESSAGE_TYPES: MessageType[] = [
  "task_assignment",
  "task_complete",
  "task_failed",
  "review_request",
  "review_result",
  "status_request",
  "status_response",
];

/**
 * Find .devteam/ directory by walking up from cwd
 */
function findDevTeamDir(startDir?: string): string | null {
  let currentDir = startDir || process.cwd();

  while (currentDir !== "/") {
    const devTeamPath = join(currentDir, ".devteam");
    if (existsSync(devTeamPath)) {
      return devTeamPath;
    }
    const parentDir = resolve(currentDir, "..");
    if (parentDir === currentDir) break;
    currentDir = parentDir;
  }

  return null;
}

/**
 * Generate ISO timestamp for filenames (no colons)
 */
function getTimestamp(): string {
  return new Date().toISOString().replace(/:/g, "").replace(/\.\d{3}/, "");
}

/**
 * Parse ISO timestamp from filename format
 */
function parseTimestamp(filename: string): string {
  const match = filename.match(/^(\d{4}-\d{2}-\d{2}T\d{6}Z)/);
  if (!match) return "Unknown";

  const ts = match[1];
  // Convert back to readable format
  return ts.replace(/(\d{4}-\d{2}-\d{2}T)(\d{2})(\d{2})(\d{2})(Z)/, "$1$2:$3:$4$5");
}

/**
 * Format message as markdown
 */
function formatMessage(msg: Message): string {
  return `# Message

**From:** ${msg.from}
**To:** ${msg.to}
**Type:** ${msg.type}
**Re:** ${msg.re}
**Timestamp:** ${msg.timestamp}

## Body

${msg.body}
`;
}

/**
 * Parse message from markdown file
 */
async function parseMessage(filepath: string): Promise<Message | null> {
  try {
    const content = await Bun.file(filepath).text();

    const fromMatch = content.match(/\*\*From:\*\* (.+)/);
    const toMatch = content.match(/\*\*To:\*\* (.+)/);
    const typeMatch = content.match(/\*\*Type:\*\* (.+)/);
    const reMatch = content.match(/\*\*Re:\*\* (.+)/);
    const timestampMatch = content.match(/\*\*Timestamp:\*\* (.+)/);
    const bodyMatch = content.match(/## Body\n\n([\s\S]+)/);

    if (!fromMatch || !toMatch || !typeMatch || !reMatch || !timestampMatch || !bodyMatch) {
      return null;
    }

    return {
      from: fromMatch[1],
      to: toMatch[1],
      type: typeMatch[1],
      re: reMatch[1],
      timestamp: timestampMatch[1],
      body: bodyMatch[1].trim(),
    };
  } catch (error) {
    return null;
  }
}

/**
 * Send a message
 */
async function sendMessage(args: {
  from: string;
  to: string;
  type: string;
  re: string;
  body: string;
  dir?: string;
}): Promise<void> {
  const devTeamDir = args.dir || findDevTeamDir();

  if (!devTeamDir) {
    console.error("Error: .devteam/ directory not found. Use --dir to specify location.");
    process.exit(1);
  }

  if (!VALID_MESSAGE_TYPES.includes(args.type as MessageType)) {
    console.error(`Error: Invalid message type '${args.type}'. Valid types: ${VALID_MESSAGE_TYPES.join(", ")}`);
    process.exit(1);
  }

  const timestamp = new Date().toISOString();
  const fileTimestamp = getTimestamp();
  const filename = `${fileTimestamp}-${args.from}-${args.type}.md`;

  const inboxDir = join(devTeamDir, "agents", args.to, "inbox");
  mkdirSync(inboxDir, { recursive: true });

  const filepath = join(inboxDir, filename);

  const message: Message = {
    from: args.from,
    to: args.to,
    type: args.type,
    re: args.re,
    timestamp: timestamp,
    body: args.body,
  };

  const content = formatMessage(message);
  await Bun.write(filepath, content);

  console.log(`Message sent to ${args.to}`);
  console.log(`File: ${filename}`);
}

/**
 * Read messages from inbox
 */
async function readMessages(args: {
  agent: string;
  type?: string;
  dir?: string;
}): Promise<void> {
  const devTeamDir = args.dir || findDevTeamDir();

  if (!devTeamDir) {
    console.error("Error: .devteam/ directory not found. Use --dir to specify location.");
    process.exit(1);
  }

  const inboxDir = join(devTeamDir, "agents", args.agent, "inbox");

  if (!existsSync(inboxDir)) {
    console.log(`No inbox found for agent: ${args.agent}`);
    return;
  }

  const files = readdirSync(inboxDir)
    .filter(f => f.endsWith(".md") && !f.startsWith("."))
    .sort();

  if (files.length === 0) {
    console.log("No unread messages.");
    return;
  }

  let count = 0;

  for (const file of files) {
    const filepath = join(inboxDir, file);
    const message = await parseMessage(filepath);

    if (!message) continue;

    if (args.type && message.type !== args.type) continue;

    count++;
    console.log("\n" + "=".repeat(80));
    console.log(`\x1b[1m${file}\x1b[0m`);
    console.log("=".repeat(80));
    console.log(`From: ${message.from}`);
    console.log(`Type: ${message.type}`);
    console.log(`Re: ${message.re}`);
    console.log(`Timestamp: ${message.timestamp}`);
    console.log("\nBody:");
    console.log(message.body);
  }

  if (count === 0 && args.type) {
    console.log(`No unread messages of type '${args.type}'.`);
  } else if (count > 0) {
    console.log("\n" + "=".repeat(80));
    console.log(`Total unread messages: ${count}`);
  }
}

/**
 * List messages (summary view)
 */
async function listMessages(args: {
  agent: string;
  unread?: boolean;
  dir?: string;
}): Promise<void> {
  const devTeamDir = args.dir || findDevTeamDir();

  if (!devTeamDir) {
    console.error("Error: .devteam/ directory not found. Use --dir to specify location.");
    process.exit(1);
  }

  const inboxDir = join(devTeamDir, "agents", args.agent, "inbox");

  if (!existsSync(inboxDir)) {
    console.log(`No inbox found for agent: ${args.agent}`);
    return;
  }

  const messages: Array<{
    filename: string;
    timestamp: string;
    from: string;
    type: string;
    re: string;
    status: string;
  }> = [];

  // Read unread messages
  const unreadFiles = readdirSync(inboxDir)
    .filter(f => f.endsWith(".md") && !f.startsWith("."))
    .sort();

  for (const file of unreadFiles) {
    const filepath = join(inboxDir, file);
    const message = await parseMessage(filepath);

    if (!message) continue;

    messages.push({
      filename: file,
      timestamp: parseTimestamp(file),
      from: message.from,
      type: message.type,
      re: message.re,
      status: "unread",
    });
  }

  // Read acknowledged messages (unless --unread flag is set)
  if (!args.unread) {
    const readDir = join(inboxDir, ".read");

    if (existsSync(readDir)) {
      const readFiles = readdirSync(readDir)
        .filter(f => f.endsWith(".md"))
        .sort();

      for (const file of readFiles) {
        const filepath = join(readDir, file);
        const message = await parseMessage(filepath);

        if (!message) continue;

        messages.push({
          filename: file,
          timestamp: parseTimestamp(file),
          from: message.from,
          type: message.type,
          re: message.re,
          status: "read",
        });
      }
    }
  }

  if (messages.length === 0) {
    console.log("No messages.");
    return;
  }

  // Print table header
  console.log("\n┌─────────────────────┬──────────────┬──────────────────┬──────────────┬────────┐");
  console.log("│ Timestamp           │ From         │ Type             │ Re           │ Status │");
  console.log("├─────────────────────┼──────────────┼──────────────────┼──────────────┼────────┤");

  // Print rows
  for (const msg of messages) {
    const ts = msg.timestamp.padEnd(19);
    const from = msg.from.padEnd(12).substring(0, 12);
    const type = msg.type.padEnd(16).substring(0, 16);
    const re = msg.re.padEnd(12).substring(0, 12);
    const status = msg.status.padEnd(6);

    console.log(`│ ${ts} │ ${from} │ ${type} │ ${re} │ ${status} │`);
  }

  console.log("└─────────────────────┴──────────────┴──────────────────┴──────────────┴────────┘");
  console.log(`\nTotal: ${messages.length} message(s)`);
}

/**
 * Acknowledge a message (move to .read/)
 */
function ackMessage(args: {
  agent: string;
  message: string;
  dir?: string;
}): void {
  const devTeamDir = args.dir || findDevTeamDir();

  if (!devTeamDir) {
    console.error("Error: .devteam/ directory not found. Use --dir to specify location.");
    process.exit(1);
  }

  const inboxDir = join(devTeamDir, "agents", args.agent, "inbox");
  const sourcePath = join(inboxDir, args.message);

  if (!existsSync(sourcePath)) {
    console.error(`Error: Message not found: ${args.message}`);
    process.exit(1);
  }

  const readDir = join(inboxDir, ".read");
  mkdirSync(readDir, { recursive: true });

  const destPath = join(readDir, args.message);
  renameSync(sourcePath, destPath);

  console.log(`Message acknowledged: ${args.message}`);
  console.log(`Moved to: .read/`);
}

/**
 * Parse command-line arguments
 */
function parseArgs(): any {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    console.log(`
MessageBus - File-based inter-agent messaging

Usage:
  bun MessageBus.ts send --from <agent> --to <agent> --type <type> --re <ref> --body <text>
  bun MessageBus.ts read --agent <agent> [--type <type>]
  bun MessageBus.ts list --agent <agent> [--unread]
  bun MessageBus.ts ack --agent <agent> --message <filename>

Commands:
  send    Send a message to an agent
  read    Read unread messages from agent's inbox
  list    List messages (summary view)
  ack     Acknowledge a message (mark as read)

Message Types:
  task_assignment, task_complete, task_failed, review_request,
  review_result, status_request, status_response

Options:
  --from <agent>       Sender agent name
  --to <agent>         Recipient agent name
  --type <type>        Message type
  --re <ref>           Reference (task ID, etc.)
  --body <text>        Message body
  --agent <agent>      Agent name (for read/list/ack)
  --message <file>     Message filename (for ack)
  --unread             Show only unread messages (for list)
  --dir <path>         Path to .devteam/ directory (optional)
`);
    process.exit(0);
  }

  const command = args[0];
  const parsed: any = { command };

  for (let i = 1; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].substring(2);

      if (key === "unread") {
        parsed[key] = true;
      } else if (i + 1 < args.length && !args[i + 1].startsWith("--")) {
        parsed[key] = args[i + 1];
        i++;
      } else {
        console.error(`Error: Option ${args[i]} requires a value`);
        process.exit(1);
      }
    }
  }

  return parsed;
}

/**
 * Main entry point
 */
async function main() {
  const args = parseArgs();

  switch (args.command) {
    case "send":
      if (!args.from || !args.to || !args.type || !args.re || !args.body) {
        console.error("Error: send requires --from, --to, --type, --re, and --body");
        process.exit(1);
      }
      await sendMessage(args);
      break;

    case "read":
      if (!args.agent) {
        console.error("Error: read requires --agent");
        process.exit(1);
      }
      await readMessages(args);
      break;

    case "list":
      if (!args.agent) {
        console.error("Error: list requires --agent");
        process.exit(1);
      }
      await listMessages(args);
      break;

    case "ack":
      if (!args.agent || !args.message) {
        console.error("Error: ack requires --agent and --message");
        process.exit(1);
      }
      ackMessage(args);
      break;

    default:
      console.error(`Error: Unknown command '${args.command}'`);
      console.error("Use --help for usage information");
      process.exit(1);
  }
}

main();
