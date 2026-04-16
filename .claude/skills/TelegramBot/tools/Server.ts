#!/usr/bin/env bun
/**
 * Server.ts - PAI Telegram Bot Server
 *
 * Long-polling bot that provides full PAI access via Telegram:
 * - Chat: General Claude conversation (default)
 * - Research: Multi-source research
 * - Fabric: 248+ AI patterns
 * - Save: Export to Obsidian-compatible Markdown
 *
 * Usage:
 *   bun Server.ts [--help]
 *
 * Environment:
 *   TELEGRAM_BOT_TOKEN - Bot token from @BotFather
 *   TELEGRAM_CHAT_ID - Authorized chat ID
 *   OPENAI_API_KEY - OpenAI API key
 */

import { TelegramClient, TelegramMessage, TelegramCallbackQuery } from './lib/TelegramClient';
import { handleEmailCallback } from './handlers/EmailCallback';
import { ClaudeClient } from './lib/ClaudeClient';
import { ConversationState } from './lib/ConversationState';
import { handleChat } from './handlers/Chat';
import { handleHelp } from './handlers/Help';
import { handleFabric } from './handlers/Fabric';
import { handleSave, handleListSaves } from './handlers/Save';
import { handleResearch } from './handlers/Research';
import { handleIdeas } from './handlers/Ideas';
import { handleAgent } from './handlers/Agent';

// ============================================================================
// Configuration
// ============================================================================

const POLLING_TIMEOUT = 30; // seconds
const RETRY_DELAY = 5000; // ms
const VERSION = '2.0.0';

// ============================================================================
// Help
// ============================================================================

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
PAI Telegram Bot Server v${VERSION}

Long-polling bot providing full PAI access via Telegram.

Usage:
  bun Server.ts [--help]

Commands (in Telegram):
  (plain text)          Chat with PAI
  /agent <name> <task>  Invoke specialized PAI agent
  /research <topic>     Deep research (Perplexity + ChatGPT), auto-saves
  /ideas <topic>        Blog post ideas with research, auto-saves
  /wisdom <url>         Extract insights from URL
  /summarize <url>      Quick summary of URL
  /fabric <url>         Auto-select pattern for URL
  /fabric <pattern>     Apply specific Fabric pattern
  /save [tag]           Save last response to Obsidian
  /status               PAI system status
  /help                 Show commands

Environment Variables Required:
  TELEGRAM_BOT_TOKEN    Bot token from @BotFather
  TELEGRAM_CHAT_ID      Authorized chat ID
  OPENAI_API_KEY        OpenAI API key
  PERPLEXITY_API_KEY    Perplexity API key (for research/ideas)

Service Management:
  ./Manage.sh start     Start bot in background
  ./Manage.sh stop      Stop bot
  ./Manage.sh status    Check if running
`);
  process.exit(0);
}

// ============================================================================
// Logging
// ============================================================================

function log(message: string): void {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ${message}`);
}

// ============================================================================
// Global State
// ============================================================================

let claude: ClaudeClient | null = null;
const state = new ConversationState();

// ============================================================================
// Command Handler Type
// ============================================================================

type CommandHandler = (
  message: TelegramMessage,
  args: string,
  telegram: TelegramClient,
  claude: ClaudeClient | null,
  state: ConversationState
) => Promise<void>;

// ============================================================================
// Command Handlers
// ============================================================================

const handlers: Record<string, CommandHandler> = {
  '/help': async (message, args, telegram) => {
    await handleHelp(message, args, telegram);
  },

  '/status': async (message, _args, telegram, _claude, state) => {
    const stats = state.getGlobalStats();
    const claudeStatus = claude ? 'Connected' : 'Not configured';

    const statusText = `*PAI Telegram Bot Status*

*Bot:* Online
*Version:* ${VERSION}
*Polling:* Active

*OpenAI API:* ${claudeStatus}
*Active Chats:* ${stats.activeChats}
*Messages:* ${stats.totalMessages}
*Unsaved:* ${stats.unsavedResponses}

_All systems operational_`;

    await telegram.send(message.chat.id, statusText);
  },

  // Deep research using Perplexity + ChatGPT, auto-saves to Obsidian
  '/research': async (message, args, telegram, claude, state) => {
    await handleResearch(message, args, telegram, claude, state);
  },

  // Blog post ideas using Perplexity, auto-saves to Obsidian
  '/ideas': async (message, args, telegram, _claude, state) => {
    await handleIdeas(message, args, telegram, state);
  },

  // Shortcut for /fabric extract_wisdom <url>
  '/wisdom': async (message, args, telegram, claude, state) => {
    if (!args.trim()) {
      await telegram.send(
        message.chat.id,
        'Usage: `/wisdom <url>`\n\nExtracts insights and wisdom from a webpage.\n\nExample: `/wisdom https://example.com/article`'
      );
      return;
    }
    await handleFabric(message, `extract_wisdom ${args}`, telegram, claude, state);
  },

  // Shortcut for /fabric summarize <url>
  '/summarize': async (message, args, telegram, claude, state) => {
    if (!args.trim()) {
      await telegram.send(
        message.chat.id,
        'Usage: `/summarize <url>`\n\nCreates a quick summary of a webpage.\n\nExample: `/summarize https://example.com/article`'
      );
      return;
    }
    await handleFabric(message, `summarize ${args}`, telegram, claude, state);
  },

  '/fabric': async (message, args, telegram, claude, state) => {
    await handleFabric(message, args, telegram, claude, state);
  },

  '/save': async (message, args, telegram, _claude, state) => {
    await handleSave(message, args, telegram, state);
  },

  '/saves': async (message, args, telegram, _claude, _state) => {
    await handleListSaves(message, args, telegram);
  },

  '/clear': async (message, _args, telegram, claude, state) => {
    state.clearState(String(message.chat.id));
    if (claude) {
      claude.clearHistory(String(message.chat.id));
    }
    await telegram.send(message.chat.id, 'Conversation cleared.');
  },

  // Invoke PAI agents
  '/agent': async (message, args, telegram, _claude, state) => {
    await handleAgent(message, args, telegram, state);
  },
};

// ============================================================================
// URL Detection
// ============================================================================

/**
 * Check if message contains a URL (for auto-routing to research)
 */
function containsUrl(text: string): boolean {
  const urlPattern = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/i;
  return urlPattern.test(text);
}

// ============================================================================
// Message Router
// ============================================================================

async function processMessage(
  message: TelegramMessage,
  telegram: TelegramClient
): Promise<void> {
  const text = message.text || '';
  const chatId = message.chat.id;

  log(
    `Message from ${message.from.first_name}: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`
  );

  // Send typing indicator
  await telegram.sendTyping(chatId);

  // Check for commands
  if (text.startsWith('/')) {
    const spaceIndex = text.indexOf(' ');
    const command =
      spaceIndex > 0
        ? text.substring(0, spaceIndex).toLowerCase()
        : text.toLowerCase();
    const args = spaceIndex > 0 ? text.substring(spaceIndex + 1).trim() : '';

    const handler = handlers[command];
    if (handler) {
      try {
        await handler(message, args, telegram, claude, state);
      } catch (error) {
        log(`Handler error for ${command}: ${error}`);
        await telegram.send(chatId, `Error processing command. Please try again.`);
      }
    } else {
      await telegram.send(
        chatId,
        `Unknown command: ${command}\n\nUse /help to see available commands.`
      );
    }
  } else if (containsUrl(text)) {
    // Auto-route URLs to research handler
    log(`URL detected, routing to research handler`);
    await handleResearch(message, text, telegram, claude, state);
  } else {
    // Default: Chat mode
    if (claude) {
      await handleChat(message, text, telegram, claude, state);
    } else {
      await telegram.send(
        chatId,
        'OpenAI API not configured.\n\nAdd OPENAI_API_KEY to ~/.claude/.env and restart the bot.'
      );
    }
  }
}

// ============================================================================
// Callback Router
// ============================================================================

async function processCallback(
  callback: TelegramCallbackQuery,
  telegram: TelegramClient
): Promise<void> {
  const data = callback.data || '';

  log(`Callback from ${callback.from.first_name}: ${data}`);

  // Route email-related callbacks
  if (data.startsWith('block_') || data.startsWith('vip_') || data.startsWith('whitelist_')) {
    try {
      await handleEmailCallback(callback, telegram);
    } catch (error) {
      log(`Email callback error: ${error}`);
      await telegram.answerCallbackQuery(callback.id, 'Error processing request', true);
    }
    return;
  }

  // Unknown callback
  await telegram.answerCallbackQuery(callback.id, 'Unknown action', true);
}

// ============================================================================
// Graceful Shutdown
// ============================================================================

let isShuttingDown = false;

function handleShutdown(signal: string): void {
  if (isShuttingDown) return;
  isShuttingDown = true;
  log(`Received ${signal}, shutting down gracefully...`);
  process.exit(0);
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

// ============================================================================
// Main Polling Loop
// ============================================================================

async function main(): Promise<void> {
  log('Starting PAI Telegram Bot...');

  let telegram: TelegramClient;

  // Initialize Telegram client
  try {
    telegram = new TelegramClient();

    // Delete any existing webhook to enable long polling
    await telegram.deleteWebhook();
    log('Webhook cleared, using long polling');

    const botInfo = await telegram.getMe();
    log(`Bot connected: @${botInfo.username} (${botInfo.first_name})`);
  } catch (error) {
    log(`Failed to initialize Telegram: ${error}`);
    process.exit(1);
  }

  // Initialize OpenAI client (optional - will work without it for /help, /status)
  try {
    claude = new ClaudeClient();
    log('OpenAI API connected');
  } catch (error) {
    log(`OpenAI API not available: ${error}`);
    log('Bot will run with limited functionality (no chat, research)');
  }

  log(`Authorized chat: ${telegram.getChatId()}`);
  log('Listening for messages...');

  // Main polling loop
  while (!isShuttingDown) {
    try {
      const updates = await telegram.getUpdates(POLLING_TIMEOUT);

      for (const update of updates) {
        if (update.message) {
          await processMessage(update.message, telegram);
        }
        if (update.callback_query) {
          await processCallback(update.callback_query, telegram);
        }
      }
    } catch (error) {
      if (!isShuttingDown) {
        log(`Polling error: ${error}`);
        log(`Retrying in ${RETRY_DELAY / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      }
    }
  }
}

main().catch((error) => {
  log(`Fatal error: ${error}`);
  process.exit(1);
});
