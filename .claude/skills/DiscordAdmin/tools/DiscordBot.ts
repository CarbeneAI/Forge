#!/usr/bin/env bun
/**
 * DiscordBot.ts - PAI Discord Bot Server
 *
 * Gateway WebSocket bot providing full PAI access via a private Discord channel.
 * Mirrors the Telegram bot's capabilities with Discord-native formatting.
 *
 * Usage:
 *   bun DiscordBot.ts [--help]
 *
 * Environment:
 *   DISCORD_BOT_TOKEN - Bot token
 *   DISCORD_GUILD_ID - Server ID
 *   DISCORD_PAI_CHANNEL_ID - Private channel ID
 *   OPENAI_API_KEY - OpenAI API key
 */

import { DiscordClient, DiscordMessage } from './lib/DiscordClient';
import { ClaudeClient } from '../../TelegramBot/tools/lib/ClaudeClient';
import { ConversationState } from '../../TelegramBot/tools/lib/ConversationState';
import { handleChat } from './handlers/Chat';
import { handleHelp } from './handlers/Help';
import { handleFabric } from './handlers/Fabric';
import { handleSave, handleListSaves } from './handlers/Save';
import { handleResearch } from './handlers/Research';
import { handleAgent } from './handlers/Agent';
import { handleJoseph } from './handlers/Joseph';

// ============================================================================
// Configuration
// ============================================================================

const VERSION = '1.0.0';

// ============================================================================
// Help
// ============================================================================

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
PAI Discord Bot Server v${VERSION}

Gateway WebSocket bot providing full PAI access via Discord.

Usage:
  bun DiscordBot.ts [--help]

Commands (in Discord #pai-command channel):
  (plain text)          Chat with PAI
  !agent <name> <task>  Invoke specialized PAI agent
  !research <topic>     Deep research (Perplexity + ChatGPT), auto-saves
  !ideas <topic>        Blog post ideas with research, auto-saves
  !wisdom <url>         Extract insights from URL
  !summarize <url>      Quick summary of URL
  !fabric <url>         Auto-select pattern for URL
  !fabric <pattern>     Apply specific Fabric pattern
  !save [tag]           Save last response to Obsidian
  !status               PAI system status
  !help                 Show commands

Environment Variables Required:
  DISCORD_BOT_TOKEN     Bot token
  DISCORD_GUILD_ID      Server ID
  DISCORD_PAI_CHANNEL_ID  Private channel ID
  OPENAI_API_KEY        OpenAI API key
  PERPLEXITY_API_KEY    Perplexity API key (for research)

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
  message: DiscordMessage,
  args: string,
  discord: DiscordClient,
  claude: ClaudeClient | null,
  state: ConversationState
) => Promise<void>;

// ============================================================================
// Command Handlers
// ============================================================================

const handlers: Record<string, CommandHandler> = {
  '!help': async (message, args, discord) => {
    await handleHelp(message, args, discord);
  },

  '!status': async (message, _args, discord, _claude, state) => {
    const stats = state.getGlobalStats();
    const claudeStatus = claude ? 'Connected' : 'Not configured';

    const statusText = `**PAI Discord Bot Status**

**Bot:** Online
**Version:** ${VERSION}
**Connection:** Gateway WebSocket

**OpenAI API:** ${claudeStatus}
**Active Chats:** ${stats.activeChats}
**Messages:** ${stats.totalMessages}
**Unsaved:** ${stats.unsavedResponses}

*All systems operational*`;

    await discord.send(message.channel_id, statusText);
  },

  '!research': async (message, args, discord, claude, state) => {
    await handleResearch(message, args, discord, claude, state);
  },

  '!ideas': async (message, args, discord, claude, state) => {
    // Reuse research handler for ideas - same flow
    if (!args.trim()) {
      await discord.send(
        message.channel_id,
        '**Blog Post Ideas Generator**\n\nUsage: `!ideas <topic>`\n\nExample: `!ideas AI security trends`\n\n*Uses Perplexity to research and generate ideas. Auto-saves to Obsidian.*'
      );
      return;
    }

    // Import and use PerplexityClient directly for ideas
    const { PerplexityClient } = await import('../../TelegramBot/tools/lib/PerplexityClient');
    const { ObsidianWriter } = await import('../../TelegramBot/tools/lib/ObsidianWriter');

    const writer = new ObsidianWriter();

    let perplexity;
    try {
      perplexity = new PerplexityClient();
    } catch {
      await discord.send(message.channel_id, 'Perplexity API not configured.');
      return;
    }

    try {
      await discord.sendTyping(message.channel_id);
      await discord.send(message.channel_id, `Researching and generating blog post ideas for: *${args.trim()}*...`);

      const result = await perplexity.generateIdeas(args.trim());

      let fullContent = `# Blog Post Ideas: ${args.trim()}\n\n*Generated: ${new Date().toISOString().split('T')[0]}*\n\n---\n\n${result.content}`;

      if (result.citations.length > 0) {
        fullContent += '\n\n## Sources\n\n';
        result.citations.slice(0, 10).forEach((url: string, i: number) => {
          try {
            const domain = new URL(url).hostname.replace('www.', '');
            fullContent += `${i + 1}. [${domain}](${url})\n`;
          } catch {
            fullContent += `${i + 1}. ${url}\n`;
          }
        });
      }

      const saveResult = await writer.save(fullContent, {
        type: 'research',
        userQuery: args.trim(),
        topic: `ideas-${args.trim()}`,
        tags: ['blog-ideas', 'discord', 'content-planning'],
      });

      state.saveResponse(message.channel_id, fullContent, 'research', args.trim(), { topic: `Blog ideas: ${args.trim()}` });

      // Send truncated to Discord
      if (fullContent.length > 1800) {
        const truncated = fullContent.substring(0, 1700) + '\n\n---\n*More ideas saved to Obsidian.*';
        await discord.send(message.channel_id, truncated);
      } else {
        await discord.send(message.channel_id, fullContent);
      }

      const filename = saveResult.filePath?.split('/').pop() || 'unknown';
      let statusMsg = '**Ideas generated!**';
      if (saveResult.success) statusMsg += `\n\nSaved to: \`${filename}\``;
      await discord.send(message.channel_id, statusMsg);
    } catch (error) {
      await discord.send(message.channel_id, `Failed to generate ideas: ${error}`);
    }
  },

  '!wisdom': async (message, args, discord, claude, state) => {
    if (!args.trim()) {
      await discord.send(message.channel_id, 'Usage: `!wisdom <url>`\n\nExtracts insights and wisdom from a webpage.');
      return;
    }
    await handleFabric(message, `extract_wisdom ${args}`, discord, claude, state);
  },

  '!summarize': async (message, args, discord, claude, state) => {
    if (!args.trim()) {
      await discord.send(message.channel_id, 'Usage: `!summarize <url>`\n\nCreates a quick summary of a webpage.');
      return;
    }
    await handleFabric(message, `summarize ${args}`, discord, claude, state);
  },

  '!fabric': async (message, args, discord, claude, state) => {
    await handleFabric(message, args, discord, claude, state);
  },

  '!save': async (message, args, discord, _claude, state) => {
    await handleSave(message, args, discord, state);
  },

  '!saves': async (message, args, discord) => {
    await handleListSaves(message, args, discord);
  },

  '!clear': async (message, _args, discord, claude, state) => {
    state.clearState(message.channel_id);
    if (claude) {
      claude.clearHistory(message.channel_id);
    }
    await discord.send(message.channel_id, 'Conversation cleared.');
  },

  '!agent': async (message, args, discord, _claude, state) => {
    await handleAgent(message, args, discord, state);
  },
};

// ============================================================================
// URL Detection
// ============================================================================

function containsUrl(text: string): boolean {
  const urlPattern = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/i;
  return urlPattern.test(text);
}

// ============================================================================
// Message Router
// ============================================================================

async function processMessage(
  message: DiscordMessage,
  discord: DiscordClient
): Promise<void> {
  const text = message.content || '';
  const channelId = message.channel_id;

  log(
    `Message from ${message.author.username} in ${channelId}: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`
  );

  // Route Joseph channel to its own handler
  if (channelId === process.env.DISCORD_JOSEPH_CHANNEL_ID) {
    return handleJoseph(message, text, discord, claude, state);
  }

  // Send typing indicator
  await discord.sendTyping(channelId);

  // Check for commands (! prefix)
  if (text.startsWith('!')) {
    const spaceIndex = text.indexOf(' ');
    const command =
      spaceIndex > 0
        ? text.substring(0, spaceIndex).toLowerCase()
        : text.toLowerCase();
    const args = spaceIndex > 0 ? text.substring(spaceIndex + 1).trim() : '';

    const handler = handlers[command];
    if (handler) {
      try {
        await handler(message, args, discord, claude, state);
      } catch (error) {
        log(`Handler error for ${command}: ${error}`);
        await discord.send(channelId, 'Error processing command. Please try again.');
      }
    } else {
      await discord.send(
        channelId,
        `Unknown command: ${command}\n\nUse \`!help\` to see available commands.`
      );
    }
  } else if (containsUrl(text)) {
    // Auto-route URLs to research handler
    log('URL detected, routing to research handler');
    await handleResearch(message, text, discord, claude, state);
  } else {
    // Default: Chat mode
    if (claude) {
      await handleChat(message, text, discord, claude, state);
    } else {
      await discord.send(
        channelId,
        'OpenAI API not configured.\n\nAdd OPENAI_API_KEY to ~/.claude/.env and restart the bot.'
      );
    }
  }
}

// ============================================================================
// Graceful Shutdown
// ============================================================================

let discord: DiscordClient | null = null;
let isShuttingDown = false;

function handleShutdown(signal: string): void {
  if (isShuttingDown) return;
  isShuttingDown = true;
  log(`Received ${signal}, shutting down gracefully...`);
  if (discord) {
    discord.disconnect();
  }
  process.exit(0);
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  log('Starting PAI Discord Bot...');

  // Initialize Discord client
  try {
    discord = new DiscordClient();

    const botInfo = await discord.getMe();
    log(`Bot info: @${botInfo.username} (${botInfo.id})`);
  } catch (error) {
    log(`Failed to initialize Discord: ${error}`);
    process.exit(1);
  }

  // Initialize OpenAI client (optional)
  try {
    claude = new ClaudeClient();
    log('OpenAI API connected');
  } catch (error) {
    log(`OpenAI API not available: ${error}`);
    log('Bot will run with limited functionality');
  }

  // Set up message handler
  discord.onMessage(async (message: DiscordMessage) => {
    await processMessage(message, discord!);
  });

  log(`Listening on channels: ${discord.getChannelIds().join(', ')}`);
  log(`Guild: ${discord.getGuildId()}`);
  log(`Authorized owner: ${discord.getOwnerId()}`);

  // Connect to Gateway
  await discord.connect();

  log('Gateway connected, listening for messages...');
}

main().catch((error) => {
  log(`Fatal error: ${error}`);
  process.exit(1);
});
