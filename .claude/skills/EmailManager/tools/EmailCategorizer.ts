#!/usr/bin/env bun
/**
 * EmailCategorizer.ts - Smart email classification for EmailManager
 *
 * Categories:
 *   - urgent: Time-sensitive, requires immediate attention
 *   - action_needed: Requires response or action but not urgent
 *   - fyi: Informational only, no action needed
 *   - newsletter: Subscribed content, bulk mail
 *   - receipt: Purchase confirmations, shipping notifications
 *   - direct: Personal emails directly to you
 *   - contact_form: Website contact form submissions
 *
 * Usage:
 *   bun EmailCategorizer.ts categorize --account personal --message-id <id>
 *   bun EmailCategorizer.ts categorize --account personal --message-id <id> --verbose
 */

import * as fs from "fs";
import * as path from "path";
import { parseArgs } from "util";
import Anthropic from "@anthropic-ai/sdk";
import { getMessage, getMessageHeaders } from "./GmailClient";

// Types
export interface EmailCategory {
  category: "urgent" | "action_needed" | "fyi" | "newsletter" | "receipt" | "direct" | "contact_form";
  priority: number; // 0-100, higher = more important
  confidence: number; // 0-100, how confident in categorization
  reasoning: string;
  flags: string[];
}

// Category definitions
const CATEGORIES = {
  urgent: { priority: 100, description: "Time-sensitive, requires immediate attention" },
  action_needed: { priority: 80, description: "Requires response or action but not urgent" },
  direct: { priority: 70, description: "Personal emails directly addressed to you" },
  contact_form: { priority: 65, description: "Website contact form submissions" },
  fyi: { priority: 40, description: "Informational only, no action needed" },
  receipt: { priority: 30, description: "Purchase confirmations, shipping notifications" },
  newsletter: { priority: 20, description: "Subscribed content, bulk mail" },
};

// Heuristic patterns
const PATTERNS = {
  urgent: {
    subjects: [
      /urgent/i,
      /asap/i,
      /immediate/i,
      /time.?sensitive/i,
      /deadline today/i,
      /expir(es?|ing) (today|soon|in \d)/i,
      /action required/i,
      /final notice/i,
      /last chance/i,
    ],
    senders: [],
  },
  newsletter: {
    subjects: [
      /newsletter/i,
      /weekly digest/i,
      /daily digest/i,
      /monthly update/i,
      /your \w+ roundup/i,
      /this week in/i,
    ],
    senders: [
      /noreply@/i,
      /no-reply@/i,
      /newsletter@/i,
      /digest@/i,
      /news@/i,
      /updates@/i,
      /marketing@/i,
      /hello@/i,
    ],
    headers: ["list-unsubscribe", "x-campaign-id", "x-mailchimp", "x-mc-user"],
  },
  receipt: {
    subjects: [
      /order confirm/i,
      /purchase confirm/i,
      /receipt for/i,
      /your order/i,
      /your receipt/i,
      /shipping confirm/i,
      /has shipped/i,
      /out for delivery/i,
      /delivered/i,
      /payment received/i,
      /invoice #?\d+/i,
    ],
    senders: [
      /orders?@/i,
      /receipts?@/i,
      /shipping@/i,
      /delivery@/i,
      /payments?@/i,
      /billing@/i,
      /notifications?@amazon/i,
      /auto-confirm@amazon/i,
    ],
  },
  contact_form: {
    subjects: [
      /contact form/i,
      /new (form )?submission/i,
      /website inquiry/i,
      /new inquiry/i,
      /new lead/i,
      /assessment request/i,
      /consultation request/i,
    ],
    senders: [
      /forms?@/i,
      /contact@/i,
      /notifications?@/i,
    ],
  },
  action_needed: {
    subjects: [
      /please (review|confirm|approve|sign|complete)/i,
      /action (needed|required)/i,
      /awaiting (your|response)/i,
      /requires? (your|approval)/i,
      /signature (requested|required)/i,
      /\?$/,  // Questions often need response
    ],
    senders: [],
  },
};

// Known newsletter domains
const NEWSLETTER_DOMAINS = new Set([
  "substack.com",
  "mailchimp.com",
  "sendgrid.net",
  "constantcontact.com",
  "beehiiv.com",
  "buttondown.email",
  "convertkit.com",
  "drip.com",
  "klaviyo.com",
  "mailerlite.com",
  "sendinblue.com",
]);

/**
 * Load Anthropic API key
 */
function loadAnthropicKey(): string {
  const envPath = path.join(process.env.HOME || "", ".claude", ".env");
  if (!fs.existsSync(envPath)) {
    throw new Error("~/.claude/.env not found");
  }

  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^ANTHROPIC_API_KEY=(.*)$/);
    if (match) {
      return match[1].trim().replace(/^["']|["']$/g, "");
    }
  }

  throw new Error("ANTHROPIC_API_KEY not found in .env");
}

/**
 * Parse email address from From header
 */
function parseFromHeader(from: string): { name: string; email: string; domain: string } {
  const match = from.match(/^(?:"?([^"<]*)"?\s*)?<?([^>]+@([^>]+))>?$/);
  if (match) {
    return {
      name: (match[1] || "").trim(),
      email: match[2].toLowerCase(),
      domain: match[3].toLowerCase(),
    };
  }
  return { name: "", email: from.toLowerCase(), domain: "" };
}

/**
 * Check if sender domain is a known newsletter service
 */
function isNewsletterDomain(domain: string): boolean {
  for (const nd of NEWSLETTER_DOMAINS) {
    if (domain === nd || domain.endsWith("." + nd)) {
      return true;
    }
  }
  return false;
}

/**
 * Heuristic categorization based on patterns
 */
function heuristicCategorize(
  headers: Record<string, string>,
  body: string
): { category: keyof typeof CATEGORIES | null; confidence: number; flags: string[] } {
  const from = headers["from"] || "";
  const subject = headers["subject"] || "";
  const to = headers["to"] || "";
  const { email: senderEmail, domain: senderDomain } = parseFromHeader(from);

  const flags: string[] = [];
  let category: keyof typeof CATEGORIES | null = null;
  let confidence = 0;

  // Check for contact form (highest priority for business)
  for (const pattern of PATTERNS.contact_form.subjects) {
    if (pattern.test(subject)) {
      category = "contact_form";
      confidence = 85;
      flags.push("contact_form_subject");
      return { category, confidence, flags };
    }
  }

  // Check for urgent
  for (const pattern of PATTERNS.urgent.subjects) {
    if (pattern.test(subject)) {
      category = "urgent";
      confidence = 75;
      flags.push("urgent_subject");
      break;
    }
  }

  // Check for newsletter (multiple signals)
  let newsletterScore = 0;

  // Newsletter subject patterns
  for (const pattern of PATTERNS.newsletter.subjects) {
    if (pattern.test(subject)) {
      newsletterScore += 30;
      flags.push("newsletter_subject");
      break;
    }
  }

  // Newsletter sender patterns
  for (const pattern of PATTERNS.newsletter.senders) {
    if (pattern.test(senderEmail)) {
      newsletterScore += 25;
      flags.push("newsletter_sender");
      break;
    }
  }

  // Newsletter headers
  for (const header of PATTERNS.newsletter.headers) {
    if (headers[header]) {
      newsletterScore += 20;
      flags.push(`has_${header.replace(/-/g, "_")}`);
    }
  }

  // Newsletter domain
  if (isNewsletterDomain(senderDomain)) {
    newsletterScore += 30;
    flags.push("newsletter_domain");
  }

  if (newsletterScore >= 50 && !category) {
    category = "newsletter";
    confidence = Math.min(90, newsletterScore);
  }

  // Check for receipt
  for (const pattern of PATTERNS.receipt.subjects) {
    if (pattern.test(subject)) {
      category = "receipt";
      confidence = 80;
      flags.push("receipt_subject");
      break;
    }
  }

  if (!category) {
    for (const pattern of PATTERNS.receipt.senders) {
      if (pattern.test(senderEmail)) {
        category = "receipt";
        confidence = 70;
        flags.push("receipt_sender");
        break;
      }
    }
  }

  // Check for action needed
  if (!category) {
    for (const pattern of PATTERNS.action_needed.subjects) {
      if (pattern.test(subject)) {
        category = "action_needed";
        confidence = 65;
        flags.push("action_needed_subject");
        break;
      }
    }
  }

  // Check if directly addressed (To field contains personal email)
  if (!category) {
    const toHeader = to.toLowerCase();
    // If CC list is present and has multiple recipients, probably FYI
    const ccHeader = headers["cc"] || "";
    if (ccHeader && ccHeader.includes(",")) {
      category = "fyi";
      confidence = 55;
      flags.push("has_cc_list");
    }
  }

  // Default to direct if no other category matches and it seems personal
  if (!category) {
    const isReply = /^re:/i.test(subject);
    const isForward = /^fwd?:/i.test(subject);

    if (isReply) {
      category = "action_needed"; // Replies often need response
      confidence = 50;
      flags.push("is_reply");
    } else if (isForward) {
      category = "fyi";
      confidence = 50;
      flags.push("is_forward");
    }
  }

  return { category, confidence, flags };
}

/**
 * AI-based categorization using Claude Haiku
 */
async function aiCategorize(
  headers: Record<string, string>,
  body: string,
  heuristicResult: { category: keyof typeof CATEGORIES | null; confidence: number; flags: string[] }
): Promise<{ category: keyof typeof CATEGORIES; confidence: number; reasoning: string }> {
  try {
    const apiKey = loadAnthropicKey();
    const client = new Anthropic({ apiKey });

    const from = headers["from"] || "Unknown";
    const subject = headers["subject"] || "No subject";
    const preview = body.substring(0, 400);

    const categoryList = Object.entries(CATEGORIES)
      .map(([k, v]) => `- ${k}: ${v.description}`)
      .join("\n");

    const heuristicHint = heuristicResult.category
      ? `Heuristic analysis suggests: ${heuristicResult.category} (confidence: ${heuristicResult.confidence}%)`
      : "Heuristic analysis was inconclusive";

    const response = await client.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `Categorize this email. Return ONLY a JSON object with "category", "confidence" (0-100), and "reasoning" (one sentence).

Categories:
${categoryList}

${heuristicHint}

From: ${from}
Subject: ${subject}
Preview: ${preview}

Return only valid JSON, no markdown.`,
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const parsed = JSON.parse(text);

    // Validate category
    const validCategory = parsed.category in CATEGORIES ? parsed.category : "fyi";

    return {
      category: validCategory as keyof typeof CATEGORIES,
      confidence: Math.max(0, Math.min(100, parsed.confidence || 70)),
      reasoning: parsed.reasoning || "AI categorization",
    };
  } catch (error) {
    // Fallback to heuristic or default
    return {
      category: heuristicResult.category || "fyi",
      confidence: heuristicResult.confidence || 30,
      reasoning: `AI unavailable: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Main categorization function
 */
export async function categorizeEmail(
  account: "personal" | "workspace",
  messageId: string,
  skipAi: boolean = false
): Promise<EmailCategory> {
  // Get message data
  const headers = await getMessageHeaders(account, messageId);
  const message = await getMessage(account, messageId);
  const body = message.body || message.snippet || "";

  // Run heuristic analysis
  const heuristic = heuristicCategorize(headers, body);

  let finalCategory: keyof typeof CATEGORIES;
  let finalConfidence: number;
  let reasoning: string;

  // If heuristic is confident (>=70), use it
  if (heuristic.confidence >= 70 && heuristic.category) {
    finalCategory = heuristic.category;
    finalConfidence = heuristic.confidence;
    reasoning = `Heuristic match: ${heuristic.flags.join(", ")}`;
  } else if (skipAi) {
    // Use heuristic result or default
    finalCategory = heuristic.category || "fyi";
    finalConfidence = heuristic.confidence || 30;
    reasoning = heuristic.category
      ? `Heuristic match (AI skipped): ${heuristic.flags.join(", ")}`
      : "Default category (AI skipped)";
  } else {
    // Use AI for ambiguous cases
    const ai = await aiCategorize(headers, body, heuristic);
    finalCategory = ai.category;
    finalConfidence = ai.confidence;
    reasoning = ai.reasoning;
  }

  // Calculate priority based on category and other factors
  let priority = CATEGORIES[finalCategory].priority;

  // Boost priority for VIP domains (handled elsewhere but could add here)
  // Boost priority for direct replies
  if (heuristic.flags.includes("is_reply")) {
    priority = Math.min(100, priority + 10);
  }

  return {
    category: finalCategory,
    priority,
    confidence: finalConfidence,
    reasoning,
    flags: heuristic.flags,
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
      verbose: { type: "boolean", short: "v" },
      "skip-ai": { type: "boolean" },
      help: { type: "boolean", short: "h" },
    },
    allowPositionals: true,
  });

  const command = positionals[0] || "categorize";

  if (values.help) {
    console.log(`
EmailCategorizer.ts - Smart email classification

Commands:
  categorize    Categorize a message (default)
  list          List available categories

Options:
  -a, --account      Account: 'personal' or 'workspace' (required)
  -m, --message-id   Message ID to categorize (required)
  -v, --verbose      Show detailed analysis
  --skip-ai          Skip AI analysis (faster, uses heuristics only)
  -h, --help         Show this help message

Categories:
  urgent        - Time-sensitive, requires immediate attention (priority: 100)
  action_needed - Requires response or action (priority: 80)
  direct        - Personal emails directly to you (priority: 70)
  contact_form  - Website contact form submissions (priority: 65)
  fyi           - Informational only (priority: 40)
  receipt       - Purchase/shipping confirmations (priority: 30)
  newsletter    - Subscribed content, bulk mail (priority: 20)

Examples:
  bun EmailCategorizer.ts categorize --account personal --message-id 18d5a7b2c3e4f5a6
  bun EmailCategorizer.ts categorize --account workspace --message-id 18d5a7b2c3e4f5a6 --verbose
  bun EmailCategorizer.ts list
`);
    process.exit(0);
  }

  if (command === "list") {
    console.log("Available Categories:\n");
    for (const [key, value] of Object.entries(CATEGORIES)) {
      console.log(`  ${key.padEnd(15)} - ${value.description} (priority: ${value.priority})`);
    }
    process.exit(0);
  }

  if (command !== "categorize") {
    console.error(`Error: Unknown command '${command}'`);
    process.exit(1);
  }

  const account = values.account as "personal" | "workspace";
  if (!account || !["personal", "workspace"].includes(account)) {
    console.error("Error: --account must be 'personal' or 'workspace'");
    process.exit(1);
  }

  const messageId = values["message-id"] as string;
  if (!messageId) {
    console.error("Error: --message-id is required");
    process.exit(1);
  }

  try {
    const result = await categorizeEmail(account, messageId, values["skip-ai"] as boolean);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.main) {
  main();
}
