#!/usr/bin/env bun
/**
 * DailyDigest.ts - End-of-day email summary for EmailManager
 *
 * Generates daily summary:
 * - Total emails processed
 * - Spam filtered count
 * - Category breakdown
 * - Urgent/action items listed
 * - VIP emails highlighted
 *
 * Usage:
 *   bun DailyDigest.ts --today                    # Generate digest for today
 *   bun DailyDigest.ts --date 2026-02-05          # Generate digest for specific date
 *   bun DailyDigest.ts --today --send-telegram    # Generate and send to Telegram
 *   bun DailyDigest.ts --today --dry-run          # Preview without sending
 */

import * as fs from "fs";
import * as path from "path";
import { parseArgs } from "util";

// Types
interface ProcessedEmail {
  id: string;
  account: "personal" | "workspace";
  from: string;
  subject: string;
  snippet: string;
  spamScore: {
    total: number;
    verdict: "spam" | "suspicious" | "legitimate";
  };
  processed: string;
  notified: boolean;
  filterReason?: string;
  category?: {
    category: string;
    priority: number;
    confidence: number;
  };
  tier?: 1 | 2 | 3;
  tierReason?: string;
  decisionScore?: number;
}

interface DailyStats {
  date: string;
  totalEmails: number;
  byAccount: {
    personal: number;
    workspace: number;
  };
  byVerdict: {
    legitimate: number;
    suspicious: number;
    spam: number;
  };
  byTier: {
    tier1: number;
    tier2: number;
    tier3: number;
  };
  byCategory: Record<string, number>;
  vipEmails: ProcessedEmail[];
  urgentEmails: ProcessedEmail[];
  actionNeededEmails: ProcessedEmail[];
  tier2Emails: ProcessedEmail[]; // Daily Review tier
  notifiedCount: number;
  filteredCount: number;
  blacklistedCount: number;
}

// Constants
const SKILL_DIR = path.dirname(path.dirname(import.meta.path));
const DATA_DIR = path.join(SKILL_DIR, "data");
const INBOX_DIR = path.join(DATA_DIR, "inbox");
const DIGEST_DIR = path.join(DATA_DIR, "digests");

/**
 * Load environment variables
 */
function loadEnv(): { telegramBotToken: string; telegramChatId: string } {
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

  const telegramBotToken = env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = env.TELEGRAM_CHAT_ID;

  if (!telegramBotToken || !telegramChatId) {
    throw new Error("TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set in .env");
  }

  return { telegramBotToken, telegramChatId };
}

/**
 * Parse From header to extract name/email
 */
function parseFromHeader(from: string): { name: string; email: string } {
  const match = from.match(/^(?:"?([^"<]*)"?\s*)?<?([^>]+)>?$/);
  if (match) {
    return {
      name: (match[1] || "").trim(),
      email: match[2].trim().toLowerCase(),
    };
  }
  return { name: "", email: from.toLowerCase() };
}

/**
 * Get all processed emails for a specific date
 */
function getEmailsForDate(date: string): ProcessedEmail[] {
  const emails: ProcessedEmail[] = [];
  const [year, month] = date.split("-");
  const monthFolder = `${year}-${month}`;
  const monthDir = path.join(INBOX_DIR, monthFolder);

  if (!fs.existsSync(monthDir)) {
    return emails;
  }

  // Read all JSON files in the month folder
  const files = fs.readdirSync(monthDir).filter((f) => f.endsWith(".json"));

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(monthDir, file), "utf-8");
      const email = JSON.parse(content) as ProcessedEmail;

      // Check if email was processed on the target date
      const processedDate = email.processed.split("T")[0];
      if (processedDate === date) {
        emails.push(email);
      }
    } catch (error) {
      // Skip malformed files
      console.error(`Error reading ${file}:`, error);
    }
  }

  return emails;
}

/**
 * Calculate daily statistics
 */
function calculateStats(date: string, emails: ProcessedEmail[]): DailyStats {
  const stats: DailyStats = {
    date,
    totalEmails: emails.length,
    byAccount: { personal: 0, workspace: 0 },
    byVerdict: { legitimate: 0, suspicious: 0, spam: 0 },
    byTier: { tier1: 0, tier2: 0, tier3: 0 },
    byCategory: {},
    vipEmails: [],
    urgentEmails: [],
    actionNeededEmails: [],
    tier2Emails: [],
    notifiedCount: 0,
    filteredCount: 0,
    blacklistedCount: 0,
  };

  for (const email of emails) {
    // Count by account
    stats.byAccount[email.account]++;

    // Count by verdict
    if (email.spamScore?.verdict) {
      stats.byVerdict[email.spamScore.verdict]++;
    }

    // Count by tier
    if (email.tier === 1) {
      stats.byTier.tier1++;
    } else if (email.tier === 2) {
      stats.byTier.tier2++;
      stats.tier2Emails.push(email);
    } else if (email.tier === 3) {
      stats.byTier.tier3++;
    }

    // Count by category
    const category = email.category?.category || "uncategorized";
    stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

    // Track notified vs filtered
    if (email.notified) {
      stats.notifiedCount++;
    } else {
      stats.filteredCount++;
    }

    // Track blacklisted
    if (email.filterReason?.includes("Blacklisted")) {
      stats.blacklistedCount++;
    }

    // Collect VIP emails
    if (email.filterReason === "vip") {
      stats.vipEmails.push(email);
    }

    // Collect urgent and action-needed
    if (email.category?.category === "urgent") {
      stats.urgentEmails.push(email);
    } else if (email.category?.category === "action_needed") {
      stats.actionNeededEmails.push(email);
    }
  }

  // Sort tier2 emails by decision score (highest first)
  stats.tier2Emails.sort((a, b) => (b.decisionScore || 0) - (a.decisionScore || 0));

  return stats;
}

/**
 * Format email for display
 */
function formatEmailBrief(email: ProcessedEmail): string {
  const { name, email: senderEmail } = parseFromHeader(email.from);
  const displayName = name || senderEmail;
  const subject = email.subject.substring(0, 50) + (email.subject.length > 50 ? "..." : "");
  return `• ${displayName}: "${subject}"`;
}

/**
 * Generate markdown digest
 */
function generateMarkdownDigest(stats: DailyStats): string {
  const lines: string[] = [];

  // Header
  lines.push(`# Email Digest: ${stats.date}`);
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");

  // Summary
  lines.push("## Summary");
  lines.push("");
  lines.push(`| Metric | Count |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Total Emails | ${stats.totalEmails} |`);
  lines.push(`| Notified (to Telegram) | ${stats.notifiedCount} |`);
  lines.push(`| Filtered (not notified) | ${stats.filteredCount} |`);
  lines.push(`| Blacklisted | ${stats.blacklistedCount} |`);
  lines.push("");

  // By Account
  lines.push("## By Account");
  lines.push("");
  lines.push(`| Account | Count |`);
  lines.push(`|---------|-------|`);
  lines.push(`| Personal | ${stats.byAccount.personal} |`);
  lines.push(`| Workspace | ${stats.byAccount.workspace} |`);
  lines.push("");

  // By Verdict
  lines.push("## By Spam Verdict");
  lines.push("");
  lines.push(`| Verdict | Count |`);
  lines.push(`|---------|-------|`);
  lines.push(`| Legitimate | ${stats.byVerdict.legitimate} |`);
  lines.push(`| Suspicious | ${stats.byVerdict.suspicious} |`);
  lines.push(`| Spam | ${stats.byVerdict.spam} |`);
  lines.push("");

  // By Category
  if (Object.keys(stats.byCategory).length > 0) {
    lines.push("## By Category");
    lines.push("");
    lines.push(`| Category | Count |`);
    lines.push(`|----------|-------|`);
    for (const [category, count] of Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1])) {
      lines.push(`| ${category} | ${count} |`);
    }
    lines.push("");
  }

  // VIP Emails
  if (stats.vipEmails.length > 0) {
    lines.push("## VIP Emails");
    lines.push("");
    for (const email of stats.vipEmails) {
      lines.push(formatEmailBrief(email));
    }
    lines.push("");
  }

  // Urgent Emails
  if (stats.urgentEmails.length > 0) {
    lines.push("## Urgent Emails");
    lines.push("");
    for (const email of stats.urgentEmails) {
      lines.push(formatEmailBrief(email));
    }
    lines.push("");
  }

  // Action Needed
  if (stats.actionNeededEmails.length > 0) {
    lines.push("## Action Needed");
    lines.push("");
    for (const email of stats.actionNeededEmails) {
      lines.push(formatEmailBrief(email));
    }
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Generate Telegram-friendly message
 */
function generateTelegramMessage(stats: DailyStats): string {
  const lines: string[] = [];

  // Header
  lines.push(`📧 *Email Digest: ${stats.date}*`);
  lines.push("");

  // Quick stats with tier breakdown
  lines.push("*Summary:*");
  lines.push(`• Total: ${stats.totalEmails} emails`);

  // Tier breakdown (the key metric now)
  if (stats.byTier.tier1 > 0 || stats.byTier.tier2 > 0 || stats.byTier.tier3 > 0) {
    lines.push(`• 🔴 Immediate (Telegram): ${stats.byTier.tier1}`);
    lines.push(`• 🟡 Daily Review: ${stats.byTier.tier2}`);
    lines.push(`• 🟢 Auto-archived: ${stats.byTier.tier3}`);
  } else {
    // Fallback for emails without tier data
    lines.push(`• Notified: ${stats.notifiedCount}`);
    lines.push(`• Filtered: ${stats.filteredCount}`);
  }

  if (stats.byVerdict.spam > 0) {
    lines.push(`• Spam blocked: ${stats.byVerdict.spam}`);
  }

  // TIER 2 EMAILS - This is the main feature of the daily digest now
  if (stats.tier2Emails.length > 0) {
    lines.push("");
    lines.push("━━━━━━━━━━━━━━━━━━━━");
    lines.push("📋 *DAILY REVIEW* (may need attention)");
    lines.push("");

    for (const email of stats.tier2Emails.slice(0, 10)) {
      const { name, email: senderEmail } = parseFromHeader(email.from);
      const displayName = name || senderEmail;
      const subject = email.subject.substring(0, 45) + (email.subject.length > 45 ? "..." : "");
      const scoreLabel = email.decisionScore ? ` [${email.decisionScore}]` : "";
      lines.push(`• *${displayName}*${scoreLabel}`);
      lines.push(`  "${subject}"`);
      lines.push(`  [Open](https://mail.google.com/mail/u/0/#inbox/${email.id})`);
      lines.push("");
    }

    if (stats.tier2Emails.length > 10) {
      lines.push(`_...and ${stats.tier2Emails.length - 10} more in daily review_`);
    }
    lines.push("━━━━━━━━━━━━━━━━━━━━");
  }

  // VIP Emails (already notified via Telegram, just a reminder)
  if (stats.vipEmails.length > 0) {
    lines.push("");
    lines.push("⭐ *VIP Emails (already notified):*");
    for (const email of stats.vipEmails.slice(0, 3)) {
      const { name, email: senderEmail } = parseFromHeader(email.from);
      lines.push(`• ${name || senderEmail}`);
    }
    if (stats.vipEmails.length > 3) {
      lines.push(`  _...and ${stats.vipEmails.length - 3} more_`);
    }
  }

  // Account breakdown
  lines.push("");
  lines.push(`*By Account:*`);
  lines.push(`• Personal: ${stats.byAccount.personal}`);
  lines.push(`• Workspace: ${stats.byAccount.workspace}`);

  // No emails case
  if (stats.totalEmails === 0) {
    lines.length = 0;
    lines.push(`📧 *Email Digest: ${stats.date}*`);
    lines.push("");
    lines.push("_No emails processed today._");
  }

  return lines.join("\n");
}

/**
 * Escape Telegram markdown
 */
function escapeMarkdown(text: string): string {
  return text.replace(/([_*\[\]()~`>#+=|{}.!-])/g, "\\$1");
}

/**
 * Save digest to file
 */
function saveDigest(date: string, markdown: string): string {
  if (!fs.existsSync(DIGEST_DIR)) {
    fs.mkdirSync(DIGEST_DIR, { recursive: true });
  }

  const filename = `${date}.md`;
  const filepath = path.join(DIGEST_DIR, filename);
  fs.writeFileSync(filepath, markdown);

  return filepath;
}

/**
 * Send digest to Telegram
 */
async function sendToTelegram(message: string, dryRun: boolean = false): Promise<boolean> {
  if (dryRun) {
    console.log("[DRY RUN] Would send to Telegram:");
    console.log(message);
    return true;
  }

  try {
    const { telegramBotToken, telegramChatId } = loadEnv();

    const response = await fetch(
      `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: message,
          parse_mode: "Markdown",
          disable_web_page_preview: true,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Telegram API error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to send to Telegram:", error);
    return false;
  }
}

/**
 * Main CLI
 */
async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      today: { type: "boolean", short: "t" },
      date: { type: "string", short: "d" },
      "send-telegram": { type: "boolean" },
      "dry-run": { type: "boolean" },
      json: { type: "boolean" },
      help: { type: "boolean", short: "h" },
    },
  });

  if (values.help) {
    console.log(`
DailyDigest.ts - End-of-day email summary

Usage:
  bun DailyDigest.ts --today                    # Generate digest for today
  bun DailyDigest.ts --date 2026-02-05          # Generate digest for specific date
  bun DailyDigest.ts --today --send-telegram    # Generate and send to Telegram
  bun DailyDigest.ts --today --dry-run          # Preview without sending
  bun DailyDigest.ts --today --json             # Output stats as JSON

Options:
  -t, --today          Generate digest for today
  -d, --date           Generate digest for specific date (YYYY-MM-DD)
  --send-telegram      Send digest to Telegram
  --dry-run            Preview without sending or saving
  --json               Output stats as JSON instead of markdown
  -h, --help           Show this help message

Output:
  Digests are saved to data/digests/YYYY-MM-DD.md

Cron Setup:
  To run daily at 6 PM CST, add to crontab on your host machine:
  0 0 * * * cd ~/.claude/skills/EmailManager && bun tools/DailyDigest.ts --today --send-telegram
`);
    process.exit(0);
  }

  // Determine date
  let targetDate: string;
  if (values.today) {
    targetDate = new Date().toISOString().split("T")[0];
  } else if (values.date) {
    targetDate = values.date as string;
    // Validate format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      console.error("Error: Date must be in YYYY-MM-DD format");
      process.exit(1);
    }
  } else {
    console.error("Error: Must specify --today or --date");
    console.error("Run with --help for usage");
    process.exit(1);
  }

  console.log(`Generating digest for ${targetDate}...`);

  // Get emails for date
  const emails = getEmailsForDate(targetDate);
  console.log(`Found ${emails.length} emails processed on ${targetDate}`);

  // Calculate stats
  const stats = calculateStats(targetDate, emails);

  // Output based on format
  if (values.json) {
    console.log(JSON.stringify(stats, null, 2));
  } else {
    // Generate markdown
    const markdown = generateMarkdownDigest(stats);

    // Save digest (unless dry-run)
    if (!values["dry-run"]) {
      const filepath = saveDigest(targetDate, markdown);
      console.log(`Digest saved to: ${filepath}`);
    }

    // Send to Telegram if requested
    if (values["send-telegram"]) {
      const telegramMessage = generateTelegramMessage(stats);
      const sent = await sendToTelegram(telegramMessage, values["dry-run"] as boolean);

      if (sent && !values["dry-run"]) {
        console.log("Digest sent to Telegram");
      }
    } else if (!values.json) {
      // Print markdown to console
      console.log("\n" + markdown);
    }
  }
}

// Export for module use
export { calculateStats, generateMarkdownDigest, generateTelegramMessage, DailyStats };

// Run if called directly
if (import.meta.main) {
  main();
}
