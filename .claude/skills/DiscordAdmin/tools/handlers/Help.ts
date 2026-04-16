/**
 * Help.ts - Help command handler for PAI Discord Bot
 */

import { DiscordClient, DiscordMessage } from '../lib/DiscordClient';

const VERSION = '1.0.0';

export async function handleHelp(
  message: DiscordMessage,
  _args: string,
  discord: DiscordClient
): Promise<void> {
  const helpText = `**PAI Discord Bot** v${VERSION}

**Chat Mode (Default)**
Just send any message to chat with PAI.

**Agents:**
\`!agent <name> <task>\` - Invoke specialized AI agent
Available: grok-researcher, architect, engineer, designer, pentester, researcher, claude-researcher, perplexity-researcher, gemini-researcher

**Research & Ideas:**
\`!research <topic>\` - Deep research, auto-saves
\`!research <url> [instructions]\` - Research URL with optional focus
\`!ideas <topic>\` - Blog post ideas, auto-saves

**Content Processing:**
\`!wisdom <url>\` - Extract insights from URL
\`!summarize <url>\` - Quick summary of URL
\`!fabric <url>\` - Auto-select pattern for URL
\`!fabric <pattern> <content>\` - Apply specific pattern

**Saving & History:**
\`!save [tag]\` - Save last response to Obsidian
\`!saves\` - List recent saves

**System:**
\`!help\` - Show this help
\`!status\` - PAI system status
\`!clear\` - Clear conversation

**Examples:**
- \`!agent grok-researcher AI security trends\`
- \`!agent architect Design a login system\`
- \`!research AI agents 2025\`
- \`!research https://site.com what business ideas?\`
- \`!ideas cybersecurity startups\`
- \`!wisdom https://blog.com/article\`

*Agent and research commands auto-save to Obsidian.*`;

  await discord.send(message.channel_id, helpText);
}

export default handleHelp;
