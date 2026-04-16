#!/usr/bin/env bun
/**
 * EmailMonitor.ts - Polling daemon for Gmail monitoring with Telegram notifications
 *
 * Usage:
 *   bun EmailMonitor.ts --daemon             # Run continuously (every 2 min)
 *   bun EmailMonitor.ts --once               # Single poll
 *   bun EmailMonitor.ts --once --dry-run     # Single poll, no notifications
 *   bun EmailMonitor.ts --interval 60000     # Custom interval (ms)
 */

import * as fs from "fs";
import * as path from "path";
import { parseArgs } from "util";
import { listMessages, getMessage, getAccountInfo } from "./GmailClient";
import { analyzeEmail, SpamScore } from "./SpamFilter";
import { categorizeEmail, EmailCategory } from "./EmailCategorizer";
import {
  analyzeEmailTier,
  quickDecisionScore,
  PriorityTier,
  TierResult,
  loadPriorityGateConfig,
} from "./PriorityGate";

// Types
interface EmailState {
  personal?: {
    lastMessageId: string;
    lastCheck: string;
  };
  workspace?: {
    lastMessageId: string;
    lastCheck: string;
  };
  // Global dedup: tracks message IDs already notified (across ALL accounts)
  notifiedMessageIds?: string[];
}

interface ProcessedEmail {
  id: string;
  account: "personal" | "workspace";
  from: string;
  subject: string;
  snippet: string;
  spamScore: SpamScore;
  processed: string;
  notified: boolean;
  filterReason?: string;
  category?: EmailCategory;
  tier?: PriorityTier;
  tierReason?: string;
  decisionScore?: number;
}

interface EmailConfig {
  version: number;
  thresholds: {
    spam: number;
    suspicious: number;
    notifyBelow: number;
  };
  vipSenders: {
    emails: string[];
    domains: string[];
  };
  whitelist: {
    emails: string[];
    domains: string[];
    subjectPatterns: string[];
  };
  blacklist: {
    emails: string[];
    domains: string[];
    subjectPatterns: string[];
  };
  categoryFilters: {
    enabled: boolean;
    allowedCategories: string[];
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
  };
}

// Constants
const SKILL_DIR = path.dirname(path.dirname(import.meta.path));
const DATA_DIR = path.join(SKILL_DIR, "data");
const STATE_FILE = path.join(DATA_DIR, "email-state.json");
const CONFIG_FILE = path.join(DATA_DIR, "email-config.json");
const CALLBACK_STATE_FILE = path.join(DATA_DIR, "telegram-callback-state.json");
const PID_FILE = path.join(DATA_DIR, "emailmonitor.pid");
const DEFAULT_INTERVAL = 2 * 60 * 1000; // 2 minutes

/**
 * Load email config
 */
function loadConfig(): EmailConfig {
  if (!fs.existsSync(CONFIG_FILE)) {
    // Return defaults if no config
    return {
      version: 1,
      thresholds: { spam: 80, suspicious: 50, notifyBelow: 50 },
      vipSenders: { emails: [], domains: [] },
      whitelist: { emails: [], domains: [], subjectPatterns: [] },
      blacklist: { emails: [], domains: [], subjectPatterns: [] },
      categoryFilters: { enabled: false, allowedCategories: [] },
      quietHours: { enabled: false, start: "22:00", end: "07:00", timezone: "America/Chicago" },
    };
  }
  return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
}

/**
 * Save email config
 */
function saveConfig(config: EmailConfig): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  (config as any).lastUpdated = new Date().toISOString();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

/**
 * Load callback state (last processed update_id)
 */
function loadCallbackState(): { lastUpdateId: number } {
  if (!fs.existsSync(CALLBACK_STATE_FILE)) {
    return { lastUpdateId: 0 };
  }
  return JSON.parse(fs.readFileSync(CALLBACK_STATE_FILE, "utf-8"));
}

/**
 * Save callback state
 */
function saveCallbackState(state: { lastUpdateId: number }): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(CALLBACK_STATE_FILE, JSON.stringify(state, null, 2));
}

/**
 * Add item to list if not present
 */
function addToList(list: string[], item: string): boolean {
  const normalized = item.toLowerCase();
  if (list.map((i) => i.toLowerCase()).includes(normalized)) {
    return false; // Already exists
  }
  list.push(item);
  return true;
}

/**
 * Process Telegram callback queries (button clicks)
 */
async function processTelegramCallbacks(): Promise<void> {
  try {
    const { telegramBotToken, telegramChatId } = loadEnv();
    const callbackState = loadCallbackState();

    // Get updates from Telegram
    const url = `https://api.telegram.org/bot${telegramBotToken}/getUpdates?offset=${callbackState.lastUpdateId + 1}&timeout=0`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error("Failed to get Telegram updates:", await response.text());
      return;
    }

    const data = await response.json() as any;
    if (!data.ok || !data.result || data.result.length === 0) {
      return; // No new updates
    }

    const config = loadConfig();
    let configChanged = false;

    for (const update of data.result) {
      // Update last processed ID
      if (update.update_id > callbackState.lastUpdateId) {
        callbackState.lastUpdateId = update.update_id;
      }

      // Only process callback queries (button clicks)
      if (!update.callback_query) {
        continue;
      }

      const callback = update.callback_query;
      const callbackData = callback.data;
      const callbackId = callback.id;

      console.log(`Processing callback: ${callbackData}`);

      // Parse callback data
      const [action, value] = callbackData.split(":");
      let responseText = "";

      switch (action) {
        case "block_email":
          if (addToList(config.blacklist.emails, value)) {
            responseText = `🚫 Blocked email: ${value}`;
            configChanged = true;
          } else {
            responseText = `Already blocked: ${value}`;
          }
          break;

        case "block_domain":
          if (addToList(config.blacklist.domains, value)) {
            responseText = `🚫 Blocked domain: ${value}`;
            configChanged = true;
          } else {
            responseText = `Already blocked: ${value}`;
          }
          break;

        case "vip_email":
          if (addToList(config.vipSenders.emails, value)) {
            responseText = `⭐ Added VIP: ${value}`;
            configChanged = true;
          } else {
            responseText = `Already VIP: ${value}`;
          }
          break;

        case "whitelist_domain":
          if (addToList(config.whitelist.domains, value)) {
            responseText = `✅ Whitelisted domain: ${value}`;
            configChanged = true;
          } else {
            responseText = `Already whitelisted: ${value}`;
          }
          break;

        default:
          responseText = `Unknown action: ${action}`;
      }

      // Answer the callback to dismiss the loading indicator
      await fetch(`https://api.telegram.org/bot${telegramBotToken}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callback_query_id: callbackId,
          text: responseText,
          show_alert: true,
        }),
      });

      console.log(responseText);
    }

    // Save config if changed
    if (configChanged) {
      saveConfig(config);
      console.log("Config updated from Telegram callbacks");
    }

    // Save callback state
    saveCallbackState(callbackState);
  } catch (error) {
    console.error("Error processing Telegram callbacks:", error);
  }
}

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
 * Load email state
 */
function loadState(): EmailState {
  if (!fs.existsSync(STATE_FILE)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
}

/**
 * Save email state
 */
function saveState(state: EmailState): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

/**
 * Check if a message ID has already been notified (cross-account dedup)
 */
function isAlreadyNotified(state: EmailState, messageId: string): boolean {
  return state.notifiedMessageIds?.includes(messageId) ?? false;
}

/**
 * Mark a message ID as notified (cross-account dedup)
 * Keeps only the last 500 IDs to prevent unbounded growth
 */
function markAsNotified(state: EmailState, messageId: string): void {
  if (!state.notifiedMessageIds) {
    state.notifiedMessageIds = [];
  }
  if (!state.notifiedMessageIds.includes(messageId)) {
    state.notifiedMessageIds.push(messageId);
    // Prune to last 500 entries to prevent unbounded growth
    if (state.notifiedMessageIds.length > 500) {
      state.notifiedMessageIds = state.notifiedMessageIds.slice(-500);
    }
  }
}

/**
 * Write PID file
 */
function writePid(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(PID_FILE, process.pid.toString());
}

/**
 * Remove PID file
 */
function removePid(): void {
  if (fs.existsSync(PID_FILE)) {
    fs.unlinkSync(PID_FILE);
  }
}

/**
 * Parse From header
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
 * Extract domain from email
 */
function extractDomain(email: string): string {
  const parts = email.split("@");
  return parts.length > 1 ? parts[1].toLowerCase() : "";
}

/**
 * Check if email matches VIP list
 */
function isVipSender(senderEmail: string, config: EmailConfig): boolean {
  const email = senderEmail.toLowerCase();
  const domain = extractDomain(email);

  // Check exact email match
  if (config.vipSenders.emails.some((e) => e.toLowerCase() === email)) {
    return true;
  }

  // Check domain match
  if (config.vipSenders.domains.some((d) => domain === d.toLowerCase() || domain.endsWith("." + d.toLowerCase()))) {
    return true;
  }

  return false;
}

/**
 * Check if email is blacklisted
 */
function isBlacklisted(
  senderEmail: string,
  subject: string,
  config: EmailConfig
): { blocked: boolean; reason: string } {
  const email = senderEmail.toLowerCase();
  const domain = extractDomain(email);
  const subjectLower = subject.toLowerCase();

  // Check email patterns (supports partial matches like "noreply@")
  for (const pattern of config.blacklist.emails) {
    if (email.includes(pattern.toLowerCase())) {
      return { blocked: true, reason: `Blacklisted email pattern: ${pattern}` };
    }
  }

  // Check domain
  for (const d of config.blacklist.domains) {
    if (domain === d.toLowerCase() || domain.endsWith("." + d.toLowerCase())) {
      return { blocked: true, reason: `Blacklisted domain: ${d}` };
    }
  }

  // Check subject patterns
  for (const pattern of config.blacklist.subjectPatterns) {
    if (subjectLower.includes(pattern.toLowerCase())) {
      return { blocked: true, reason: `Blacklisted subject pattern: ${pattern}` };
    }
  }

  return { blocked: false, reason: "" };
}

/**
 * Check if email is whitelisted (returns score adjustment)
 */
function getWhitelistBonus(senderEmail: string, subject: string, config: EmailConfig): number {
  const email = senderEmail.toLowerCase();
  const domain = extractDomain(email);
  const subjectLower = subject.toLowerCase();

  // Check email
  if (config.whitelist.emails.some((e) => e.toLowerCase() === email)) {
    return -30; // Lower score by 30
  }

  // Check domain
  if (config.whitelist.domains.some((d) => domain === d.toLowerCase() || domain.endsWith("." + d.toLowerCase()))) {
    return -30;
  }

  // Check subject patterns
  for (const pattern of config.whitelist.subjectPatterns) {
    if (subjectLower.includes(pattern.toLowerCase())) {
      return -20;
    }
  }

  return 0;
}

/**
 * Send Telegram notification with inline buttons
 */
async function sendTelegramNotification(
  email: ProcessedEmail,
  dryRun: boolean = false
): Promise<boolean> {
  if (dryRun) {
    console.log("[DRY RUN] Would send Telegram notification:");
    console.log(JSON.stringify(email, null, 2));
    return true;
  }

  try {
    const { telegramBotToken, telegramChatId } = loadEnv();

    const { name, email: senderEmail } = parseFromHeader(email.from);
    const displayName = name || senderEmail;
    const domain = extractDomain(senderEmail);

    // Format message
    let icon = "📧";
    let statusLine = "";

    if (email.filterReason === "vip") {
      icon = "⭐";
      statusLine = "\n\n⭐ *VIP Sender*";
    } else if (email.spamScore.verdict === "suspicious") {
      icon = "⚠️";
      statusLine = `\n\n⚠️ *Flagged as Suspicious* (score: ${email.spamScore.total})`;
    }

    // Add category badge
    let categoryBadge = "";
    if (email.category) {
      const cat = email.category.category;
      const badges: Record<string, string> = {
        urgent: "🚨 URGENT",
        action_needed: "📋 Action Needed",
        direct: "💬 Direct",
        contact_form: "📝 Contact Form",
        fyi: "ℹ️ FYI",
        receipt: "🧾 Receipt",
        newsletter: "📰 Newsletter",
      };
      categoryBadge = badges[cat] || cat;
    }

    const categoryLine = categoryBadge ? `\n*Category:* ${categoryBadge}` : "";

    const message = `${icon} *New Email*

*From:* ${escapeMarkdown(displayName)}
*To:* ${email.account}${categoryLine}
*Subject:* ${escapeMarkdown(email.subject)}

${escapeMarkdown(email.snippet.substring(0, 200))}...${statusLine}

[Open in Gmail](https://mail.google.com/mail/u/0/#inbox/${email.id})`;

    // Inline keyboard for feedback
    const inlineKeyboard = {
      inline_keyboard: [
        [
          { text: "🚫 Block Sender", callback_data: `block_email:${senderEmail}` },
          { text: "🚫 Block Domain", callback_data: `block_domain:${domain}` },
        ],
        [
          { text: "⭐ VIP Sender", callback_data: `vip_email:${senderEmail}` },
          { text: "✅ Whitelist Domain", callback_data: `whitelist_domain:${domain}` },
        ],
      ],
    };

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
          reply_markup: inlineKeyboard,
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
    console.error("Failed to send Telegram notification:", error);
    return false;
  }
}

/**
 * Escape Markdown special characters
 */
function escapeMarkdown(text: string): string {
  return text.replace(/([_*\[\]()~`>#+=|{}.!-])/g, "\\$1");
}

/**
 * Save processed email to inbox folder
 */
function saveProcessedEmail(email: ProcessedEmail): void {
  const now = new Date();
  const monthFolder = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const inboxDir = path.join(DATA_DIR, "inbox", monthFolder);

  if (!fs.existsSync(inboxDir)) {
    fs.mkdirSync(inboxDir, { recursive: true });
  }

  const filename = `${email.id}.json`;
  fs.writeFileSync(path.join(inboxDir, filename), JSON.stringify(email, null, 2));
}

/**
 * Poll a single account for new emails
 */
async function pollAccount(
  account: "personal" | "workspace",
  state: EmailState,
  config: EmailConfig,
  dryRun: boolean = false,
  skipAi: boolean = false
): Promise<ProcessedEmail[]> {
  const processed: ProcessedEmail[] = [];

  try {
    // Check if account is configured
    try {
      await getAccountInfo(account);
    } catch {
      console.log(`Account '${account}' not configured, skipping`);
      return processed;
    }

    console.log(`Polling ${account} account...`);

    // Get recent unread messages
    const messages = await listMessages(account, "is:unread is:inbox", 20);
    console.log(`Found ${messages.length} unread messages in ${account}`);

    const lastId = state[account]?.lastMessageId;
    let newLastId = lastId;

    for (const { id } of messages) {
      // Skip if we've already processed this message
      if (lastId && id <= lastId) {
        continue;
      }

      // Get full message
      const message = await getMessage(account, id);
      const from = message.headers["from"] || "Unknown";
      const subject = message.headers["subject"] || "No subject";
      const { email: senderEmail } = parseFromHeader(from);

      console.log(`Processing: "${subject}" from ${from}`);

      // Create processed email record
      const processedEmail: ProcessedEmail = {
        id,
        account,
        from,
        subject,
        snippet: message.snippet,
        spamScore: { total: 0, verdict: "legitimate", layers: {} as any },
        processed: new Date().toISOString(),
        notified: false,
      };

      // Check VIP status (used later for tier determination)
      const isVip = isVipSender(senderEmail, config);

      // Check blacklist - never notify
      const blacklistCheck = isBlacklisted(senderEmail, subject, config);
      if (blacklistCheck.blocked) {
        console.log(`Blacklisted: ${blacklistCheck.reason}`);
        processedEmail.filterReason = blacklistCheck.reason;
        processedEmail.spamScore.verdict = "spam";
        processedEmail.spamScore.total = 100;
        saveProcessedEmail(processedEmail);
        processed.push(processedEmail);
        if (!newLastId || id > newLastId) newLastId = id;
        continue;
      }

      // Run spam filter
      const spamScore = await analyzeEmail(account, id, skipAi);

      // Apply whitelist bonus
      const whitelistBonus = getWhitelistBonus(senderEmail, subject, config);
      if (whitelistBonus < 0) {
        spamScore.total = Math.max(0, spamScore.total + whitelistBonus);
        console.log(`Whitelist bonus applied: ${whitelistBonus}`);
      }

      // Re-evaluate verdict based on config thresholds
      if (spamScore.total >= config.thresholds.spam) {
        spamScore.verdict = "spam";
      } else if (spamScore.total >= config.thresholds.suspicious) {
        spamScore.verdict = "suspicious";
      } else {
        spamScore.verdict = "legitimate";
      }

      console.log(`Spam score: ${spamScore.total} (${spamScore.verdict})`);
      processedEmail.spamScore = spamScore;

      // Categorize the email (skip AI if skipAi flag set)
      try {
        const category = await categorizeEmail(account, id, skipAi);
        processedEmail.category = category;
        console.log(`Category: ${category.category} (priority: ${category.priority})`);
      } catch (error) {
        console.error(`Categorization error: ${error}`);
        // Continue without category
      }

      // Check if Priority Gate is enabled
      const priorityGateConfig = loadPriorityGateConfig();

      if (priorityGateConfig.enabled && spamScore.verdict !== "spam") {
        // NEW: Priority Gate tier-based notification system
        try {
          const tierResult = await analyzeEmailTier(
            account,
            id,
            processedEmail.category,
            isVip,
            skipAi
          );

          processedEmail.tier = tierResult.tier;
          processedEmail.tierReason = tierResult.reason;
          processedEmail.decisionScore = tierResult.decisionScore.score;

          const tierNames = { 1: "IMMEDIATE", 2: "DAILY_REVIEW", 3: "AUTO_ARCHIVE" };
          console.log(
            `Priority Tier: ${tierResult.tier} (${tierNames[tierResult.tier]}) - ${tierResult.reason}`
          );
          console.log(
            `Decision Score: ${tierResult.decisionScore.score} (${tierResult.decisionScore.urgency})`
          );

          // Only notify for Tier 1 (immediate)
          if (tierResult.tier === 1) {
            // Cross-account dedup: skip if already notified from another account
            if (isAlreadyNotified(state, id)) {
              console.log(`Tier 1: SKIPPED - already notified (cross-account dedup)`);
              processedEmail.notified = false;
              processedEmail.filterReason = "cross_account_dedup";
            } else {
              processedEmail.filterReason = isVip ? "vip" : "tier1_priority";
              const notified = await sendTelegramNotification(processedEmail, dryRun);
              processedEmail.notified = notified;
              if (notified) {
                markAsNotified(state, id);
                saveState(state);
              }
              console.log(`Tier 1: Telegram notification sent`);
            }
          } else if (tierResult.tier === 2) {
            console.log(`Tier 2: Saved for daily digest (no Telegram)`);
            processedEmail.notified = false;
          } else {
            console.log(`Tier 3: Auto-archived (no notification)`);
            processedEmail.notified = false;
          }
        } catch (error) {
          console.error(`Priority Gate error: ${error}`);
          // Fallback to old logic on error
          const shouldNotify =
            spamScore.verdict !== "spam" && spamScore.total < config.thresholds.notifyBelow;
          if (shouldNotify) {
            // Cross-account dedup check
            if (isAlreadyNotified(state, id)) {
              console.log(`Fallback: SKIPPED - already notified (cross-account dedup)`);
              processedEmail.notified = false;
            } else {
              const notified = await sendTelegramNotification(processedEmail, dryRun);
              processedEmail.notified = notified;
              if (notified) {
                markAsNotified(state, id);
                saveState(state);
              }
            }
          }
        }
      } else {
        // Fallback: old threshold-based notification (when Priority Gate disabled or spam)
        const shouldNotify =
          spamScore.verdict !== "spam" && spamScore.total < config.thresholds.notifyBelow;

        if (shouldNotify) {
          // Cross-account dedup check
          if (isAlreadyNotified(state, id)) {
            console.log(`Threshold fallback: SKIPPED - already notified (cross-account dedup)`);
            processedEmail.notified = false;
          } else {
            const notified = await sendTelegramNotification(processedEmail, dryRun);
            processedEmail.notified = notified;
            if (notified) {
              markAsNotified(state, id);
              saveState(state);
            }
          }
        } else {
          console.log(
            `Not notifying: score ${spamScore.total} >= threshold ${config.thresholds.notifyBelow}`
          );
        }
      }

      // Save processed email
      saveProcessedEmail(processedEmail);
      processed.push(processedEmail);

      // Update last processed ID
      if (!newLastId || id > newLastId) {
        newLastId = id;
      }
    }

    // Update state
    if (newLastId !== lastId) {
      state[account] = {
        lastMessageId: newLastId || "",
        lastCheck: new Date().toISOString(),
      };
    } else if (state[account]) {
      state[account].lastCheck = new Date().toISOString();
    }
  } catch (error) {
    console.error(`Error polling ${account}:`, error);
  }

  return processed;
}

/**
 * Run a single poll cycle
 */
async function pollOnce(
  dryRun: boolean = false,
  skipAi: boolean = false
): Promise<ProcessedEmail[]> {
  // First, process any pending Telegram callbacks (button clicks)
  if (!dryRun) {
    await processTelegramCallbacks();
  }

  const state = loadState();
  const config = loadConfig();
  const allProcessed: ProcessedEmail[] = [];

  console.log(`Config loaded: notifyBelow=${config.thresholds.notifyBelow}, VIPs=${config.vipSenders.emails.length + config.vipSenders.domains.length}`);

  // Poll both accounts
  for (const account of ["personal", "workspace"] as const) {
    const processed = await pollAccount(account, state, config, dryRun, skipAi);
    allProcessed.push(...processed);
  }

  // Save updated state
  saveState(state);

  return allProcessed;
}

/**
 * Run daemon mode
 */
async function runDaemon(
  interval: number,
  dryRun: boolean = false,
  skipAi: boolean = false
): Promise<void> {
  console.log(`Starting EmailMonitor daemon (interval: ${interval / 1000}s)`);
  console.log(`Dry run: ${dryRun}, Skip AI: ${skipAi}`);

  // Write PID file
  writePid();

  // Setup graceful shutdown
  const shutdown = () => {
    console.log("\nShutting down EmailMonitor...");
    removePid();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  // Initial poll
  await pollOnce(dryRun, skipAi);

  // Continue polling
  const poll = async () => {
    try {
      await pollOnce(dryRun, skipAi);
    } catch (error) {
      console.error("Poll error:", error);
    }
  };

  setInterval(poll, interval);

  // Keep process running
  console.log("EmailMonitor running. Press Ctrl+C to stop.");
}

/**
 * Main CLI
 */
async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      daemon: { type: "boolean", short: "d" },
      once: { type: "boolean", short: "o" },
      "dry-run": { type: "boolean" },
      "skip-ai": { type: "boolean" },
      interval: { type: "string", short: "i" },
      help: { type: "boolean", short: "h" },
    },
  });

  if (values.help) {
    console.log(`
EmailMonitor.ts - Polling daemon for Gmail monitoring

Usage:
  bun EmailMonitor.ts --daemon             # Run continuously
  bun EmailMonitor.ts --once               # Single poll
  bun EmailMonitor.ts --once --dry-run     # Single poll, no notifications
  bun EmailMonitor.ts --daemon --interval 60000  # Custom interval (ms)

Options:
  -d, --daemon     Run as daemon (continuous polling)
  -o, --once       Run single poll and exit
  --dry-run        Don't send notifications (log only)
  --skip-ai        Skip AI analysis in spam filter
  -i, --interval   Polling interval in ms (default: 120000 = 2 min)
  -h, --help       Show this help message

Configuration:
  Edit data/email-config.json to tune filtering:
  - vipSenders: Always notify, bypass spam filter
  - blacklist: Never notify, auto-block
  - whitelist: Lower spam score by 30 points
  - thresholds.notifyBelow: Only notify if score < this value

Environment:
  Requires TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in ~/.claude/.env

State:
  Last processed message IDs stored in data/email-state.json
  Processed emails saved to data/inbox/YYYY-MM/

Service:
  PID written to data/emailmonitor.pid when running as daemon
`);
    process.exit(0);
  }

  const interval = parseInt((values.interval as string) || String(DEFAULT_INTERVAL), 10);
  const dryRun = values["dry-run"] as boolean;
  const skipAi = values["skip-ai"] as boolean;

  if (values.daemon) {
    await runDaemon(interval, dryRun, skipAi);
  } else if (values.once) {
    console.log("Running single poll...");
    const processed = await pollOnce(dryRun, skipAi);
    console.log(`\nProcessed ${processed.length} new emails`);

    if (processed.length > 0) {
      console.log("\nSummary:");
      for (const email of processed) {
        const reason = email.filterReason ? ` [${email.filterReason}]` : "";
        console.log(
          `  - [${email.account}] "${email.subject}" (${email.spamScore.verdict}${reason}, notified: ${email.notified})`
        );
      }
    }
  } else {
    console.error("Error: Must specify --daemon or --once");
    console.error("Run with --help for usage");
    process.exit(1);
  }
}

// Export for module use
export { pollOnce, pollAccount, EmailState, ProcessedEmail, loadConfig, EmailConfig };
export type { PriorityTier } from "./PriorityGate";

// Run if called directly
if (import.meta.main) {
  main();
}
