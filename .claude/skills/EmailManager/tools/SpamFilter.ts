#!/usr/bin/env bun
/**
 * SpamFilter.ts - 4-layer spam detection for EmailManager
 *
 * Usage:
 *   bun SpamFilter.ts analyze --account personal --message-id <id>
 *   bun SpamFilter.ts analyze --account personal --message-id <id> --verbose
 *
 * Layers:
 *   1. Auth Headers (0.4) - SPF, DKIM, DMARC
 *   2. Sender Reputation (0.2) - Known vs unknown, domain analysis
 *   3. Content Analysis (0.2) - Suspicious URLs, urgency, display name
 *   4. AI Analysis (0.2) - Claude Haiku spam probability
 *
 * Scoring: >80 = spam, 50-80 = suspicious, <50 = legitimate
 */

import * as fs from "fs";
import * as path from "path";
import { parseArgs } from "util";
import Anthropic from "@anthropic-ai/sdk";
import { getMessage, getMessageHeaders, EmailMessage } from "./GmailClient";

// Types
interface SpamScore {
  total: number;
  verdict: "spam" | "suspicious" | "legitimate";
  layers: {
    authHeaders: {
      score: number;
      weight: number;
      details: {
        spf: string;
        dkim: string;
        dmarc: string;
        raw?: string;
      };
    };
    senderReputation: {
      score: number;
      weight: number;
      details: {
        email: string;
        domain: string;
        isKnown: boolean;
        hasValidMx: boolean;
        flags: string[];
      };
    };
    contentAnalysis: {
      score: number;
      weight: number;
      details: {
        suspiciousUrls: number;
        urgencyLanguage: boolean;
        displayNameMismatch: boolean;
        hasUnsubscribe: boolean;
        flags: string[];
      };
    };
    aiAnalysis: {
      score: number;
      weight: number;
      details: {
        reasoning: string;
        confidence: number;
      };
    };
  };
  timestamp: string;
  messageId: string;
  account: string;
}

// Constants
const SKILL_DIR = path.dirname(path.dirname(import.meta.path));
const DATA_DIR = path.join(SKILL_DIR, "data");
const SPAM_LOG_DIR = path.join(DATA_DIR, "spam-log");

// Layer weights
const WEIGHTS = {
  authHeaders: 0.4,
  senderReputation: 0.2,
  contentAnalysis: 0.2,
  aiAnalysis: 0.2,
};

// Known good domains (add more as needed)
const KNOWN_GOOD_DOMAINS = new Set([
  "google.com",
  "github.com",
  "microsoft.com",
  "apple.com",
  "amazon.com",
  "anthropic.com",
  "carbene.ai",
  // Add your domain here: "yourdomain.com",
  "stripe.com",
  "vercel.com",
  "cloudflare.com",
  "linear.app",
  "notion.so",
  "slack.com",
  "zoom.us",
  "linkedin.com",
  "twitter.com",
  "x.com",
]);

// Suspicious URL patterns
const SUSPICIOUS_URL_PATTERNS = [
  /bit\.ly/i,
  /tinyurl/i,
  /t\.co/i,
  /goo\.gl/i,
  /is\.gd/i,
  /short\.link/i,
  /click\.track/i,
  /redirect/i,
  /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/, // IP addresses
];

// Urgency language patterns
const URGENCY_PATTERNS = [
  /urgent/i,
  /immediate action/i,
  /act now/i,
  /limited time/i,
  /expires today/i,
  /account suspended/i,
  /verify immediately/i,
  /security alert/i,
  /unusual activity/i,
  /confirm your identity/i,
  /click here to avoid/i,
];

/**
 * Load Anthropic API key from environment
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
 * Parse Authentication-Results header
 */
function parseAuthResults(header: string): { spf: string; dkim: string; dmarc: string } {
  const result = { spf: "none", dkim: "none", dmarc: "none" };

  // SPF
  const spfMatch = header.match(/spf=(pass|fail|softfail|neutral|none)/i);
  if (spfMatch) result.spf = spfMatch[1].toLowerCase();

  // DKIM
  const dkimMatch = header.match(/dkim=(pass|fail|neutral|none)/i);
  if (dkimMatch) result.dkim = dkimMatch[1].toLowerCase();

  // DMARC
  const dmarcMatch = header.match(/dmarc=(pass|fail|none)/i);
  if (dmarcMatch) result.dmarc = dmarcMatch[1].toLowerCase();

  return result;
}

/**
 * Layer 1: Auth Headers Analysis (weight 0.4)
 */
function analyzeAuthHeaders(headers: Record<string, string>): {
  score: number;
  details: { spf: string; dkim: string; dmarc: string; raw?: string };
} {
  const authResults = headers["authentication-results"] || "";
  const parsed = parseAuthResults(authResults);

  let score = 0;
  const weights = { spf: 30, dkim: 40, dmarc: 30 };

  // SPF scoring
  if (parsed.spf === "pass") score += weights.spf;
  else if (parsed.spf === "softfail") score += weights.spf * 0.5;
  else if (parsed.spf === "fail") score += 0; // Add to spam score

  // DKIM scoring
  if (parsed.dkim === "pass") score += weights.dkim;
  else if (parsed.dkim === "neutral") score += weights.dkim * 0.5;

  // DMARC scoring
  if (parsed.dmarc === "pass") score += weights.dmarc;

  // Invert: 0 = definitely spam, 100 = definitely legitimate
  // If score is high, it's legitimate (low spam score)
  const spamScore = 100 - score;

  return {
    score: spamScore,
    details: {
      ...parsed,
      raw: authResults.substring(0, 200),
    },
  };
}

/**
 * Extract email and name from From header
 */
function parseFromHeader(from: string): { name: string; email: string; domain: string } {
  // "John Doe <john@example.com>" or just "john@example.com"
  const match = from.match(/^(?:"?([^"<]*)"?\s*)?<?([^>]+@([^>]+))>?$/);
  if (match) {
    return {
      name: (match[1] || "").trim(),
      email: match[2].toLowerCase(),
      domain: match[3].toLowerCase(),
    };
  }
  return { name: "", email: from, domain: "" };
}

/**
 * Layer 2: Sender Reputation Analysis (weight 0.2)
 */
function analyzeSenderReputation(headers: Record<string, string>): {
  score: number;
  details: {
    email: string;
    domain: string;
    isKnown: boolean;
    hasValidMx: boolean;
    flags: string[];
  };
} {
  const from = headers["from"] || "";
  const { name, email, domain } = parseFromHeader(from);

  const flags: string[] = [];
  let score = 50; // Start neutral

  // Known good domain
  if (KNOWN_GOOD_DOMAINS.has(domain)) {
    score -= 40; // Reduce spam score significantly
    flags.push("known_good_domain");
  }

  // Check for suspicious domain patterns
  if (domain.includes("-") && domain.split("-").length > 2) {
    score += 15;
    flags.push("hyphenated_domain");
  }

  // Check for numeric domain
  if (/\d{3,}/.test(domain)) {
    score += 20;
    flags.push("numeric_domain");
  }

  // Check for recently registered domain patterns
  if (/^[a-z]{2,4}\d{2,4}\./.test(domain)) {
    score += 15;
    flags.push("suspicious_domain_pattern");
  }

  // No-reply addresses are usually legitimate automated emails
  if (email.includes("noreply") || email.includes("no-reply")) {
    score -= 10;
    flags.push("noreply_address");
  }

  // Clamp to 0-100
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    details: {
      email,
      domain,
      isKnown: KNOWN_GOOD_DOMAINS.has(domain),
      hasValidMx: true, // Would need DNS lookup for real check
      flags,
    },
  };
}

/**
 * Layer 3: Content Analysis (weight 0.2)
 */
function analyzeContent(
  headers: Record<string, string>,
  body: string
): {
  score: number;
  details: {
    suspiciousUrls: number;
    urgencyLanguage: boolean;
    displayNameMismatch: boolean;
    hasUnsubscribe: boolean;
    flags: string[];
  };
} {
  const flags: string[] = [];
  let score = 30; // Start slightly below neutral

  // Check for suspicious URLs
  let suspiciousUrlCount = 0;
  for (const pattern of SUSPICIOUS_URL_PATTERNS) {
    if (pattern.test(body)) {
      suspiciousUrlCount++;
    }
  }
  if (suspiciousUrlCount > 0) {
    score += suspiciousUrlCount * 10;
    flags.push(`suspicious_urls_${suspiciousUrlCount}`);
  }

  // Check for urgency language
  let urgencyLanguage = false;
  for (const pattern of URGENCY_PATTERNS) {
    if (pattern.test(body) || pattern.test(headers["subject"] || "")) {
      urgencyLanguage = true;
      break;
    }
  }
  if (urgencyLanguage) {
    score += 20;
    flags.push("urgency_language");
  }

  // Check display name mismatch
  const from = headers["from"] || "";
  const { name, domain } = parseFromHeader(from);
  let displayNameMismatch = false;
  if (name && domain) {
    // Check if display name contains a different domain
    const domainInName = name.match(/@([a-z0-9.-]+\.[a-z]{2,})/i);
    if (domainInName && domainInName[1].toLowerCase() !== domain) {
      displayNameMismatch = true;
      score += 30;
      flags.push("display_name_mismatch");
    }
  }

  // Check for List-Unsubscribe header (legitimate newsletters have this)
  const hasUnsubscribe = !!headers["list-unsubscribe"];
  if (hasUnsubscribe) {
    score -= 15;
    flags.push("has_unsubscribe");
  }

  // Check for HTML with many images (potential phishing)
  const imageCount = (body.match(/<img/gi) || []).length;
  if (imageCount > 5) {
    score += 10;
    flags.push(`many_images_${imageCount}`);
  }

  // Clamp to 0-100
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    details: {
      suspiciousUrls: suspiciousUrlCount,
      urgencyLanguage,
      displayNameMismatch,
      hasUnsubscribe,
      flags,
    },
  };
}

/**
 * Layer 4: AI Analysis using Claude Haiku (weight 0.2)
 */
async function analyzeWithAI(
  headers: Record<string, string>,
  body: string
): Promise<{
  score: number;
  details: { reasoning: string; confidence: number };
}> {
  try {
    const apiKey = loadAnthropicKey();
    const client = new Anthropic({ apiKey });

    const from = headers["from"] || "Unknown";
    const subject = headers["subject"] || "No subject";
    const preview = body.substring(0, 500);

    const response = await client.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `Analyze this email for spam/phishing probability. Return ONLY a JSON object with "score" (0-100, where 100 is definitely spam), "reasoning" (one sentence), and "confidence" (0-100).

From: ${from}
Subject: ${subject}
Preview: ${preview}

Return only valid JSON, no markdown.`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Parse JSON response
    const parsed = JSON.parse(text);
    return {
      score: Math.max(0, Math.min(100, parsed.score || 50)),
      details: {
        reasoning: parsed.reasoning || "Unable to analyze",
        confidence: parsed.confidence || 50,
      },
    };
  } catch (error) {
    // Fallback if AI analysis fails
    return {
      score: 50, // Neutral
      details: {
        reasoning: `AI analysis unavailable: ${error instanceof Error ? error.message : "Unknown error"}`,
        confidence: 0,
      },
    };
  }
}

/**
 * Log spam decision to JSONL file
 */
function logSpamDecision(score: SpamScore): void {
  const today = new Date().toISOString().split("T")[0];
  const logFile = path.join(SPAM_LOG_DIR, `${today}.jsonl`);

  if (!fs.existsSync(SPAM_LOG_DIR)) {
    fs.mkdirSync(SPAM_LOG_DIR, { recursive: true });
  }

  fs.appendFileSync(logFile, JSON.stringify(score) + "\n");
}

/**
 * Main spam analysis function
 */
export async function analyzeEmail(
  account: "personal" | "workspace",
  messageId: string,
  skipAi: boolean = false
): Promise<SpamScore> {
  // Get message headers and body
  const headers = await getMessageHeaders(account, messageId);
  const message = await getMessage(account, messageId);
  const body = message.body || message.snippet || "";

  // Run all layers
  const authHeaders = analyzeAuthHeaders(headers);
  const senderReputation = analyzeSenderReputation(headers);
  const contentAnalysis = analyzeContent(headers, body);
  const aiAnalysis = skipAi
    ? { score: 50, details: { reasoning: "AI analysis skipped", confidence: 0 } }
    : await analyzeWithAI(headers, body);

  // Calculate weighted total
  const total =
    authHeaders.score * WEIGHTS.authHeaders +
    senderReputation.score * WEIGHTS.senderReputation +
    contentAnalysis.score * WEIGHTS.contentAnalysis +
    aiAnalysis.score * WEIGHTS.aiAnalysis;

  // Determine verdict
  let verdict: "spam" | "suspicious" | "legitimate";
  if (total > 80) verdict = "spam";
  else if (total > 50) verdict = "suspicious";
  else verdict = "legitimate";

  const score: SpamScore = {
    total: Math.round(total * 10) / 10,
    verdict,
    layers: {
      authHeaders: { ...authHeaders, weight: WEIGHTS.authHeaders },
      senderReputation: { ...senderReputation, weight: WEIGHTS.senderReputation },
      contentAnalysis: { ...contentAnalysis, weight: WEIGHTS.contentAnalysis },
      aiAnalysis: { ...aiAnalysis, weight: WEIGHTS.aiAnalysis },
    },
    timestamp: new Date().toISOString(),
    messageId,
    account,
  };

  // Log decision
  logSpamDecision(score);

  return score;
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

  const command = positionals[0] || "analyze";

  if (values.help) {
    console.log(`
SpamFilter.ts - 4-layer spam detection

Commands:
  analyze    Analyze a message for spam (default)

Options:
  -a, --account      Account: 'personal' or 'workspace' (required)
  -m, --message-id   Message ID to analyze (required)
  -v, --verbose      Show detailed layer analysis
  --skip-ai          Skip AI analysis layer (faster, uses default score)
  -h, --help         Show this help message

Layers:
  1. Auth Headers (40%) - SPF, DKIM, DMARC authentication results
  2. Sender Reputation (20%) - Known domains, suspicious patterns
  3. Content Analysis (20%) - URLs, urgency language, display name
  4. AI Analysis (20%) - Claude Haiku spam probability

Scoring:
  >80  = Spam (auto-filter)
  50-80 = Suspicious (deliver with warning)
  <50  = Legitimate (deliver normally)

Examples:
  bun SpamFilter.ts analyze --account personal --message-id 18d5a7b2c3e4f5a6
  bun SpamFilter.ts analyze --account workspace --message-id 18d5a7b2c3e4f5a6 --verbose
  bun SpamFilter.ts analyze --account personal --message-id 18d5a7b2c3e4f5a6 --skip-ai
`);
    process.exit(0);
  }

  if (command !== "analyze") {
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
    const score = await analyzeEmail(account, messageId, values["skip-ai"] as boolean);

    if (values.verbose) {
      console.log(JSON.stringify(score, null, 2));
    } else {
      console.log(
        JSON.stringify(
          {
            total: score.total,
            verdict: score.verdict,
            messageId: score.messageId,
            account: score.account,
          },
          null,
          2
        )
      );
    }
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Export for module use
export { SpamScore };

// Run if called directly
if (import.meta.main) {
  main();
}
