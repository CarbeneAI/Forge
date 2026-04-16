#!/usr/bin/env bun
/**
 * PriorityGate.ts - Decision-based priority scoring for high-volume inboxes
 *
 * Determines if an email requires a decision/action from the recipient.
 * Used to gate Telegram notifications to only truly important emails.
 *
 * Usage:
 *   bun PriorityGate.ts analyze --account personal --message-id <id>
 *   bun PriorityGate.ts tier --account personal --message-id <id>
 */

import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";
import { parseArgs } from "util";
import { getMessage } from "./GmailClient";
import { EmailCategory } from "./EmailCategorizer";

// Types
export interface DecisionScore {
  score: number; // 0-100, higher = more likely needs a decision
  requiresDecision: boolean;
  requiresAction: boolean;
  urgency: "immediate" | "today" | "this_week" | "whenever" | "none";
  reasoning: string;
  decisionType?: string; // "approval", "response", "scheduling", "payment", etc.
}

export type PriorityTier = 1 | 2 | 3;

export interface TierResult {
  tier: PriorityTier;
  tierName: "immediate" | "daily_review" | "auto_archive";
  reason: string;
  decisionScore: DecisionScore;
}

export interface PriorityGateConfig {
  enabled: boolean;
  tier1Threshold: number; // Score above this + urgent/action = Tier 1
  tier2Threshold: number; // Score above this = Tier 2
  vipAlwaysTier1: boolean; // VIP senders always get Tier 1
  urgentCategoriesForTier1: string[]; // Categories that qualify for Tier 1
}

// Constants
const SKILL_DIR = path.dirname(path.dirname(import.meta.path));
const DATA_DIR = path.join(SKILL_DIR, "data");
const CONFIG_FILE = path.join(DATA_DIR, "email-config.json");

// Default priority gate config
const DEFAULT_PRIORITY_GATE: PriorityGateConfig = {
  enabled: true,
  tier1Threshold: 70, // Decision score > 70 + urgent category = Telegram
  tier2Threshold: 40, // Decision score 40-70 = Daily digest
  vipAlwaysTier1: true,
  urgentCategoriesForTier1: ["urgent", "action_needed"],
};

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
 * Load priority gate config from email-config.json
 */
export function loadPriorityGateConfig(): PriorityGateConfig {
  if (!fs.existsSync(CONFIG_FILE)) {
    return DEFAULT_PRIORITY_GATE;
  }

  const config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
  return config.priorityGate || DEFAULT_PRIORITY_GATE;
}

/**
 * Save priority gate config
 */
export function savePriorityGateConfig(gateConfig: PriorityGateConfig): void {
  let config: any = {};
  if (fs.existsSync(CONFIG_FILE)) {
    config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
  }

  config.priorityGate = gateConfig;
  config.lastUpdated = new Date().toISOString();

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

/**
 * Score how likely an email requires a decision/action from the recipient
 * Uses Claude Haiku for fast, cheap analysis (~$0.25/1000 emails)
 */
export async function scoreDecisionRequired(
  account: "personal" | "workspace",
  messageId: string
): Promise<DecisionScore> {
  const { anthropicApiKey } = loadEnv();
  const anthropic = new Anthropic({ apiKey: anthropicApiKey });

  const message = await getMessage(account, messageId);
  const from = message.headers["from"] || "Unknown";
  const subject = message.headers["subject"] || "";
  const to = message.headers["to"] || "";
  const cc = message.headers["cc"] || "";
  const bodyPreview = (message.body || message.snippet || "").substring(0, 1500);

  const prompt = `Analyze this email and determine if it requires a DECISION or ACTION from the recipient.

From: ${from}
To: ${to}
CC: ${cc}
Subject: ${subject}

Body:
${bodyPreview}

Score 0-100 based on these criteria:
- 90-100: Requires IMMEDIATE decision (time-sensitive approval, urgent response needed)
- 70-89: Requires decision TODAY (meeting confirmation, document review, question that needs answer)
- 40-69: Requires action THIS WEEK (follow-up, non-urgent response, scheduling)
- 20-39: Optional action (newsletter to read, FYI that might need response)
- 0-19: No action needed (receipt, notification, automated email, marketing)

Consider:
1. Is this directly addressed to the recipient (not CC, not bulk)?
2. Does it contain a question requiring an answer?
3. Is there a deadline mentioned?
4. Is approval/confirmation explicitly requested?
5. Is this from a person (not automated/noreply)?
6. Would ignoring this have consequences?

Output JSON only:
{
  "score": <number 0-100>,
  "requiresDecision": <boolean - needs yes/no/approval/selection>,
  "requiresAction": <boolean - needs to do something>,
  "urgency": "<immediate|today|this_week|whenever|none>",
  "decisionType": "<approval|response|scheduling|payment|review|other|none>",
  "reasoning": "<brief explanation>"
}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 256,
      messages: [{ role: "user", content: prompt }],
    });

    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text response");
    }

    // Extract JSON from response
    let jsonStr = textContent.text;
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    return JSON.parse(jsonStr) as DecisionScore;
  } catch (error) {
    console.error("Decision scoring error:", error);
    // Return conservative default (low priority)
    return {
      score: 30,
      requiresDecision: false,
      requiresAction: false,
      urgency: "whenever",
      reasoning: "Error in analysis, defaulting to low priority",
    };
  }
}

/**
 * Fast heuristic decision scoring (no AI, instant)
 * Use this for quick filtering before AI analysis
 */
export function quickDecisionScore(
  from: string,
  subject: string,
  snippet: string
): { score: number; reason: string } {
  let score = 30; // Base score
  const reasons: string[] = [];

  const subjectLower = subject.toLowerCase();
  const snippetLower = snippet.toLowerCase();
  const fromLower = from.toLowerCase();

  // Negative signals (lower score)
  if (fromLower.includes("noreply") || fromLower.includes("no-reply")) {
    score -= 30;
    reasons.push("noreply sender");
  }
  if (fromLower.includes("newsletter") || fromLower.includes("marketing")) {
    score -= 25;
    reasons.push("newsletter/marketing");
  }
  if (subjectLower.includes("unsubscribe") || snippetLower.includes("unsubscribe")) {
    score -= 20;
    reasons.push("has unsubscribe");
  }
  if (subjectLower.includes("receipt") || subjectLower.includes("order confirmation")) {
    score -= 20;
    reasons.push("receipt/confirmation");
  }
  if (subjectLower.includes("weekly digest") || subjectLower.includes("daily summary")) {
    score -= 25;
    reasons.push("digest/summary");
  }

  // Positive signals (higher score)
  if (subjectLower.includes("urgent") || subjectLower.includes("asap")) {
    score += 35;
    reasons.push("urgent language");
  }
  if (subjectLower.includes("action required") || subjectLower.includes("action needed")) {
    score += 30;
    reasons.push("action required");
  }
  if (subjectLower.includes("approval") || subjectLower.includes("please approve")) {
    score += 30;
    reasons.push("approval request");
  }
  if (subjectLower.includes("deadline") || subjectLower.includes("due date")) {
    score += 25;
    reasons.push("deadline mentioned");
  }
  if (snippetLower.includes("?") && !fromLower.includes("noreply")) {
    score += 15;
    reasons.push("contains question");
  }
  if (subjectLower.startsWith("re:") || subjectLower.startsWith("fwd:")) {
    score += 10;
    reasons.push("reply/forward");
  }
  if (
    subjectLower.includes("meeting") ||
    subjectLower.includes("schedule") ||
    subjectLower.includes("call")
  ) {
    score += 20;
    reasons.push("meeting/scheduling");
  }
  if (subjectLower.includes("invoice") || subjectLower.includes("payment")) {
    score += 20;
    reasons.push("payment-related");
  }

  // Clamp to 0-100
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    reason: reasons.length > 0 ? reasons.join(", ") : "no strong signals",
  };
}

/**
 * Determine the priority tier for an email
 */
export function determineTier(
  decisionScore: DecisionScore,
  category: EmailCategory | undefined,
  isVip: boolean,
  config: PriorityGateConfig = DEFAULT_PRIORITY_GATE
): TierResult {
  // VIP always Tier 1 if configured
  if (isVip && config.vipAlwaysTier1) {
    return {
      tier: 1,
      tierName: "immediate",
      reason: "VIP sender",
      decisionScore,
    };
  }

  // Check for Tier 1: High decision score + urgent category
  const isUrgentCategory =
    category && config.urgentCategoriesForTier1.includes(category.category);

  if (decisionScore.score >= config.tier1Threshold && isUrgentCategory) {
    return {
      tier: 1,
      tierName: "immediate",
      reason: `High decision score (${decisionScore.score}) + ${category?.category} category`,
      decisionScore,
    };
  }

  // Immediate urgency always Tier 1
  if (decisionScore.urgency === "immediate") {
    return {
      tier: 1,
      tierName: "immediate",
      reason: `Immediate urgency: ${decisionScore.reasoning}`,
      decisionScore,
    };
  }

  // Check for Tier 2: Medium decision score OR action_needed category
  if (decisionScore.score >= config.tier2Threshold) {
    return {
      tier: 2,
      tierName: "daily_review",
      reason: `Decision score ${decisionScore.score} >= ${config.tier2Threshold}`,
      decisionScore,
    };
  }

  if (category?.category === "action_needed") {
    return {
      tier: 2,
      tierName: "daily_review",
      reason: "Action needed category",
      decisionScore,
    };
  }

  if (decisionScore.urgency === "today" || decisionScore.urgency === "this_week") {
    return {
      tier: 2,
      tierName: "daily_review",
      reason: `Urgency: ${decisionScore.urgency}`,
      decisionScore,
    };
  }

  // Default: Tier 3 (auto-archive, no notification)
  return {
    tier: 3,
    tierName: "auto_archive",
    reason: `Low priority: score ${decisionScore.score}, urgency ${decisionScore.urgency}`,
    decisionScore,
  };
}

/**
 * Full tier analysis for an email
 */
export async function analyzeEmailTier(
  account: "personal" | "workspace",
  messageId: string,
  category?: EmailCategory,
  isVip: boolean = false,
  skipAi: boolean = false
): Promise<TierResult> {
  const config = loadPriorityGateConfig();

  let decisionScore: DecisionScore;

  if (skipAi) {
    // Use quick heuristic only
    const message = await getMessage(account, messageId);
    const quick = quickDecisionScore(
      message.headers["from"] || "",
      message.headers["subject"] || "",
      message.snippet
    );
    decisionScore = {
      score: quick.score,
      requiresDecision: quick.score >= 50,
      requiresAction: quick.score >= 40,
      urgency: quick.score >= 70 ? "today" : quick.score >= 40 ? "this_week" : "whenever",
      reasoning: quick.reason,
    };
  } else {
    // Full AI analysis
    decisionScore = await scoreDecisionRequired(account, messageId);
  }

  return determineTier(decisionScore, category, isVip, config);
}

/**
 * Main CLI
 */
async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    options: {
      account: { type: "string", short: "a" },
      "message-id": { type: "string", short: "m" },
      "skip-ai": { type: "boolean" },
      help: { type: "boolean", short: "h" },
    },
    allowPositionals: true,
  });

  const command = positionals[0];

  if (values.help || !command) {
    console.log(`
PriorityGate.ts - Decision-based priority scoring for high-volume inboxes

Commands:
  analyze    Score how likely an email requires a decision
  tier       Determine priority tier (1=immediate, 2=daily, 3=archive)
  quick      Quick heuristic analysis (no AI)
  config     Show/update priority gate configuration

Options:
  -a, --account      Account: 'personal' or 'workspace' (required)
  -m, --message-id   Message ID to analyze
  --skip-ai          Use heuristics only, skip AI analysis

Examples:
  bun PriorityGate.ts analyze --account personal --message-id abc123
  bun PriorityGate.ts tier --account personal --message-id abc123
  bun PriorityGate.ts quick --account personal --message-id abc123
  bun PriorityGate.ts config

Tier System:
  Tier 1 (immediate): VIP OR (urgent + decision_score > 70) → Telegram
  Tier 2 (daily):     action_needed OR decision_score 40-70 → Daily digest
  Tier 3 (archive):   Everything else → Silent, no notification
`);
    process.exit(0);
  }

  const account = values.account as "personal" | "workspace";
  const messageId = values["message-id"] as string;
  const skipAi = values["skip-ai"] as boolean;

  try {
    switch (command) {
      case "analyze": {
        if (!account || !messageId) {
          console.error("Error: --account and --message-id required");
          process.exit(1);
        }
        const score = await scoreDecisionRequired(account, messageId);
        console.log(JSON.stringify(score, null, 2));
        break;
      }

      case "tier": {
        if (!account || !messageId) {
          console.error("Error: --account and --message-id required");
          process.exit(1);
        }
        const tierResult = await analyzeEmailTier(account, messageId, undefined, false, skipAi);
        console.log(JSON.stringify(tierResult, null, 2));
        break;
      }

      case "quick": {
        if (!account || !messageId) {
          console.error("Error: --account and --message-id required");
          process.exit(1);
        }
        const message = await getMessage(account, messageId);
        const quick = quickDecisionScore(
          message.headers["from"] || "",
          message.headers["subject"] || "",
          message.snippet
        );
        console.log(JSON.stringify(quick, null, 2));
        break;
      }

      case "config": {
        const config = loadPriorityGateConfig();
        console.log("\n📊 Priority Gate Configuration\n");
        console.log(`Enabled: ${config.enabled}`);
        console.log(`Tier 1 Threshold: ${config.tier1Threshold} (score > this + urgent = Telegram)`);
        console.log(`Tier 2 Threshold: ${config.tier2Threshold} (score > this = Daily digest)`);
        console.log(`VIP Always Tier 1: ${config.vipAlwaysTier1}`);
        console.log(`Urgent Categories: ${config.urgentCategoriesForTier1.join(", ")}`);
        break;
      }

      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.main) {
  main();
}
