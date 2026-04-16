#!/usr/bin/env bun
/**
 * ResponseDrafter.ts - Draft email replies using Claude Sonnet
 *
 * Usage:
 *   bun ResponseDrafter.ts draft --account personal --message-id <id> --intent "politely decline"
 *   bun ResponseDrafter.ts draft --account personal --message-id <id> --tone professional
 *   bun ResponseDrafter.ts send --account personal --message-id <id> --draft "draft text"
 *   bun ResponseDrafter.ts thread --account personal --thread-id <id>
 */

import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";
import { parseArgs } from "util";
import { getMessage, sendMessage, getGmailClient, EmailMessage } from "./GmailClient";

// Types
interface DraftResponse {
  subject: string;
  body: string;
  reasoning: string;
  suggestedTone: string;
  warnings?: string[];
}

interface ThreadMessage {
  id: string;
  from: string;
  to: string;
  date: string;
  subject: string;
  body: string;
}

// Constants
const SKILL_DIR = path.dirname(path.dirname(import.meta.path));
const DATA_DIR = path.join(SKILL_DIR, "data");
const DRAFTS_DIR = path.join(DATA_DIR, "drafts");

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
 * Get thread messages for context
 */
export async function getThreadMessages(
  account: "personal" | "workspace",
  threadId: string
): Promise<ThreadMessage[]> {
  const gmail = await getGmailClient(account);

  const response = await gmail.users.threads.get({
    userId: "me",
    id: threadId,
    format: "full",
  });

  const messages: ThreadMessage[] = [];

  for (const msg of response.data.messages || []) {
    const headers: Record<string, string> = {};
    for (const header of msg.payload?.headers || []) {
      if (header.name && header.value) {
        headers[header.name.toLowerCase()] = header.value;
      }
    }

    // Extract body
    let body = "";
    function extractBody(payload: any): void {
      if (payload?.body?.data) {
        const decoded = Buffer.from(payload.body.data, "base64").toString("utf-8");
        if (payload.mimeType === "text/plain") {
          body = decoded;
        }
      }
      if (payload?.parts) {
        for (const part of payload.parts) {
          extractBody(part);
        }
      }
    }
    extractBody(msg.payload);

    messages.push({
      id: msg.id || "",
      from: headers["from"] || "",
      to: headers["to"] || "",
      date: headers["date"] || "",
      subject: headers["subject"] || "",
      body: body.substring(0, 2000), // Limit for safety
    });
  }

  // Sort by date (oldest first)
  messages.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return messages;
}

/**
 * Draft a reply to an email using Claude Sonnet
 */
export async function draftReply(
  account: "personal" | "workspace",
  messageId: string,
  options?: {
    intent?: string; // What the user wants to say
    tone?: "professional" | "friendly" | "casual" | "formal";
    includeThread?: boolean;
    maxLength?: number;
  }
): Promise<DraftResponse> {
  const { anthropicApiKey } = loadEnv();
  const anthropic = new Anthropic({ apiKey: anthropicApiKey });

  // Get the original email
  const originalEmail = await getMessage(account, messageId);

  // Get thread context if requested
  let threadContext = "";
  if (options?.includeThread && originalEmail.threadId) {
    const threadMessages = await getThreadMessages(account, originalEmail.threadId);
    threadContext = threadMessages
      .map((m) => `From: ${m.from}\nDate: ${m.date}\nSubject: ${m.subject}\n\n${m.body}`)
      .join("\n\n---\n\n");
  }

  const tone = options?.tone || "professional";
  const maxLength = options?.maxLength || 500;

  const systemPrompt = `You are an email assistant helping draft professional email replies.
Your task is to draft a reply to the email provided.

Guidelines:
- Tone: ${tone}
- Maximum length: ${maxLength} words
- Be concise and clear
- Match the formality level of the original email
- Don't be overly verbose or use unnecessary filler
- Address all points raised in the original email
- Sign off appropriately

${options?.intent ? `User's intent for the reply: ${options.intent}` : ""}

Output your response as JSON with this structure:
{
  "subject": "Re: [original subject or modified if needed]",
  "body": "[the drafted reply body]",
  "reasoning": "[brief explanation of your approach]",
  "suggestedTone": "[the tone you used]",
  "warnings": ["any concerns or things to review"] // optional
}`;

  const userContent = `Please draft a reply to this email:

From: ${originalEmail.headers["from"]}
To: ${originalEmail.headers["to"]}
Date: ${originalEmail.headers["date"]}
Subject: ${originalEmail.headers["subject"]}

${originalEmail.body}

${threadContext ? `\n---\nThread context:\n${threadContext}` : ""}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: userContent,
      },
    ],
    system: systemPrompt,
  });

  // Parse the response
  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from Claude");
  }

  try {
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = textContent.text;
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const draft = JSON.parse(jsonStr) as DraftResponse;

    // Save draft to file for reference
    const draftFile = path.join(DRAFTS_DIR, `${messageId}-${Date.now()}.json`);
    if (!fs.existsSync(DRAFTS_DIR)) {
      fs.mkdirSync(DRAFTS_DIR, { recursive: true });
    }
    fs.writeFileSync(
      draftFile,
      JSON.stringify(
        {
          messageId,
          account,
          originalEmail: {
            from: originalEmail.headers["from"],
            subject: originalEmail.headers["subject"],
          },
          draft,
          createdAt: new Date().toISOString(),
        },
        null,
        2
      )
    );

    return draft;
  } catch (error) {
    throw new Error(`Failed to parse Claude response: ${textContent.text}`);
  }
}

/**
 * Send a drafted reply
 */
export async function sendReply(
  account: "personal" | "workspace",
  messageId: string,
  draftBody: string,
  options?: {
    subject?: string;
  }
): Promise<{ success: boolean; sentMessageId: string }> {
  // Get original email to get recipient and subject
  const originalEmail = await getMessage(account, messageId);

  const to = originalEmail.headers["reply-to"] || originalEmail.headers["from"];
  const subject = options?.subject || `Re: ${originalEmail.headers["subject"]}`;

  // Extract email address from "Name <email>" format
  const emailMatch = to.match(/<([^>]+)>/) || [null, to];
  const toEmail = emailMatch[1] || to;

  const sentId = await sendMessage(account, toEmail, subject, draftBody);

  return {
    success: true,
    sentMessageId: sentId,
  };
}

/**
 * Generate quick reply suggestions
 */
export async function suggestQuickReplies(
  account: "personal" | "workspace",
  messageId: string
): Promise<{ label: string; body: string }[]> {
  const { anthropicApiKey } = loadEnv();
  const anthropic = new Anthropic({ apiKey: anthropicApiKey });

  const originalEmail = await getMessage(account, messageId);

  const response = await anthropic.messages.create({
    model: "claude-3-5-haiku-20241022",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Given this email, suggest 3-4 quick reply options (1-2 sentences each):

From: ${originalEmail.headers["from"]}
Subject: ${originalEmail.headers["subject"]}

${originalEmail.body?.substring(0, 500)}

Output as JSON array:
[{"label": "short label", "body": "reply text"}, ...]`,
      },
    ],
  });

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    return [];
  }

  try {
    let jsonStr = textContent.text;
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }
    return JSON.parse(jsonStr);
  } catch {
    return [];
  }
}

/**
 * Analyze email for response needs
 */
export async function analyzeForResponse(
  account: "personal" | "workspace",
  messageId: string
): Promise<{
  requiresResponse: boolean;
  urgency: "high" | "medium" | "low";
  suggestedResponseTime: string;
  keyPoints: string[];
  questionsAsked: string[];
  actionItemsRequested: string[];
}> {
  const { anthropicApiKey } = loadEnv();
  const anthropic = new Anthropic({ apiKey: anthropicApiKey });

  const originalEmail = await getMessage(account, messageId);

  const response = await anthropic.messages.create({
    model: "claude-3-5-haiku-20241022",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Analyze this email for response needs:

From: ${originalEmail.headers["from"]}
Subject: ${originalEmail.headers["subject"]}

${originalEmail.body?.substring(0, 1000)}

Output as JSON:
{
  "requiresResponse": boolean,
  "urgency": "high" | "medium" | "low",
  "suggestedResponseTime": "e.g., within 24 hours",
  "keyPoints": ["main points"],
  "questionsAsked": ["questions needing answers"],
  "actionItemsRequested": ["action items requested of recipient"]
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
      requiresResponse: true,
      urgency: "medium",
      suggestedResponseTime: "within 24 hours",
      keyPoints: [],
      questionsAsked: [],
      actionItemsRequested: [],
    };
  }
}

/**
 * Main CLI
 */
async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    options: {
      account: { type: "string", short: "a" },
      "message-id": { type: "string", short: "m" },
      "thread-id": { type: "string" },
      intent: { type: "string", short: "i" },
      tone: { type: "string", short: "t" },
      draft: { type: "string" },
      subject: { type: "string", short: "s" },
      "include-thread": { type: "boolean" },
      help: { type: "boolean", short: "h" },
    },
    allowPositionals: true,
  });

  const command = positionals[0];

  if (values.help || !command) {
    console.log(`
ResponseDrafter.ts - Draft and send email replies using Claude

Commands:
  draft      Draft a reply to an email
  send       Send a drafted reply
  quick      Get quick reply suggestions
  analyze    Analyze email for response needs
  thread     Get full thread context

Options:
  -a, --account        Account: 'personal' or 'workspace' (required)
  -m, --message-id     Message ID to reply to
  --thread-id          Thread ID for thread command
  -i, --intent         What you want to say in the reply
  -t, --tone           Tone: professional, friendly, casual, formal (default: professional)
  --draft              Draft text to send (for send command)
  -s, --subject        Subject line override
  --include-thread     Include full thread context when drafting

Examples:
  bun ResponseDrafter.ts draft --account personal --message-id abc123 --intent "politely decline the meeting"
  bun ResponseDrafter.ts draft --account workspace --message-id abc123 --tone friendly --include-thread
  bun ResponseDrafter.ts send --account personal --message-id abc123 --draft "Thank you for your email..."
  bun ResponseDrafter.ts quick --account personal --message-id abc123
  bun ResponseDrafter.ts analyze --account personal --message-id abc123
  bun ResponseDrafter.ts thread --account personal --thread-id xyz789
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
      case "draft": {
        if (!values["message-id"]) {
          console.error("Error: --message-id is required for draft");
          process.exit(1);
        }
        const draft = await draftReply(account, values["message-id"] as string, {
          intent: values.intent as string,
          tone: values.tone as "professional" | "friendly" | "casual" | "formal",
          includeThread: values["include-thread"] as boolean,
        });
        console.log(JSON.stringify(draft, null, 2));
        break;
      }

      case "send": {
        if (!values["message-id"] || !values.draft) {
          console.error("Error: --message-id and --draft are required for send");
          process.exit(1);
        }
        const result = await sendReply(
          account,
          values["message-id"] as string,
          values.draft as string,
          { subject: values.subject as string }
        );
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case "quick": {
        if (!values["message-id"]) {
          console.error("Error: --message-id is required for quick");
          process.exit(1);
        }
        const suggestions = await suggestQuickReplies(account, values["message-id"] as string);
        console.log(JSON.stringify({ suggestions }, null, 2));
        break;
      }

      case "analyze": {
        if (!values["message-id"]) {
          console.error("Error: --message-id is required for analyze");
          process.exit(1);
        }
        const analysis = await analyzeForResponse(account, values["message-id"] as string);
        console.log(JSON.stringify(analysis, null, 2));
        break;
      }

      case "thread": {
        if (!values["thread-id"]) {
          console.error("Error: --thread-id is required for thread");
          process.exit(1);
        }
        const messages = await getThreadMessages(account, values["thread-id"] as string);
        console.log(JSON.stringify({ count: messages.length, messages }, null, 2));
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
export { DraftResponse, ThreadMessage };

// Run if called directly
if (import.meta.main) {
  main();
}
