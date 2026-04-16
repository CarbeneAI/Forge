/**
 * Fabric.ts - Fabric pattern handler for PAI Discord Bot
 *
 * Applies Fabric patterns to content from:
 * - Direct text input
 * - Website URLs (fetches and extracts content)
 * - Auto pattern selection when no pattern specified
 */

import { DiscordClient, DiscordMessage } from '../lib/DiscordClient';
import { ClaudeClient } from '../../../TelegramBot/tools/lib/ClaudeClient';
import { ConversationState } from '../../../TelegramBot/tools/lib/ConversationState';
import { PatternLoader } from '../../../TelegramBot/tools/lib/PatternLoader';

const patternLoader = new PatternLoader();

function log(message: string): void {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [Discord/Fabric] ${message}`);
}

function extractUrl(content: string): string | null {
  const urlPattern = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/i;
  const match = content.match(urlPattern);
  return match ? match[0] : null;
}

function isYouTubeUrl(url: string): boolean {
  return /youtube\.com|youtu\.be/i.test(url);
}

async function fetchWebsiteContent(url: string): Promise<{ success: boolean; content?: string; title?: string; error?: string }> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PAI/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
    });

    if (!response.ok) return { success: false, error: `HTTP ${response.status}` };

    const html = await response.text();
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Untitled';

    let text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim();

    if (text.length > 50000) text = text.substring(0, 50000);

    if (text.length < 100) return { success: false, error: 'Could not extract content' };

    return { success: true, content: text, title };
  } catch (error) {
    return { success: false, error: `Failed to fetch: ${error}` };
  }
}

function selectPatternForContent(content: string, title: string): string {
  const lc = content.toLowerCase();
  const lt = title.toLowerCase();

  if (lt.includes('research') || lt.includes('paper')) return 'analyze_paper';
  if (lc.includes('function ') || lc.includes('class ') || lc.includes('```')) return 'explain_code';
  if (lt.includes('news') || lc.includes('reported today')) return 'summarize';
  if (lt.includes('blog') || lt.includes('article')) return 'extract_article_wisdom';
  if (lc.includes('security') || lc.includes('vulnerability')) return 'analyze_threat_report';
  return 'extract_wisdom';
}

export async function handleFabric(
  message: DiscordMessage,
  args: string,
  discord: DiscordClient,
  claude: ClaudeClient | null,
  state: ConversationState
): Promise<void> {
  const channelId = message.channel_id;

  if (!args.trim() || args.toLowerCase() === 'list') {
    const popular = patternLoader.getPopularPatterns();
    const allPatterns = await patternLoader.listPatterns();
    let msg = `**Fabric Patterns**\n\n**Popular:** ${popular.map(p => `\`${p}\``).join(', ')}\n\n**Total:** ${allPatterns.length} patterns\n\n**Usage:**\n- \`!fabric <url>\` - Auto-select pattern\n- \`!fabric <pattern> <url>\` - Specific pattern\n- \`!fabric <pattern> <text>\` - Apply to text\n- \`!fabric search <query>\` - Search patterns`;
    await discord.send(channelId, msg);
    return;
  }

  if (args.toLowerCase().startsWith('search ')) {
    const query = args.substring(7).trim();
    const matches = await patternLoader.searchPatterns(query);
    if (matches.length === 0) {
      await discord.send(channelId, `No patterns found matching "${query}".`);
    } else {
      let msg = `**Patterns matching "${query}":**\n\n${matches.slice(0, 15).map(p => `\`${p}\``).join('\n')}`;
      if (matches.length > 15) msg += `\n\n*...and ${matches.length - 15} more*`;
      await discord.send(channelId, msg);
    }
    return;
  }

  const firstArg = args.split(' ')[0];
  const isFirstArgUrl = extractUrl(firstArg) !== null;

  let patternName: string;
  let content: string;
  let pageTitle = '';

  if (isFirstArgUrl) {
    const url = extractUrl(args)!;
    if (isYouTubeUrl(url)) {
      await discord.send(channelId, 'YouTube URLs not supported via Discord. Use `fabric -y <url>` from command line.');
      return;
    }

    await discord.send(channelId, 'Fetching website content...');
    await discord.sendTyping(channelId);

    const result = await fetchWebsiteContent(url);
    if (!result.success || !result.content) {
      await discord.send(channelId, `Failed to fetch: ${result.error}`);
      return;
    }

    content = result.content;
    pageTitle = result.title || '';
    patternName = selectPatternForContent(content, pageTitle);

    await discord.send(channelId, `Fetched: *${pageTitle}*\nAuto-selected pattern: \`${patternName}\``);
  } else {
    const spaceIndex = args.indexOf(' ');
    patternName = spaceIndex > 0 ? args.substring(0, spaceIndex) : args;
    content = spaceIndex > 0 ? args.substring(spaceIndex + 1).trim() : '';

    // Check for last response if no content
    if (!content) {
      const lastResponse = state.getLastResponse(channelId);
      if (lastResponse) content = lastResponse.content;
    }

    if (!content) {
      await discord.send(channelId, 'No content to process.\n\n**Usage:**\n- `!fabric <url>` - Auto-select pattern\n- `!fabric <pattern> <text>` - Apply to text\n- `!fabric list` - Show patterns');
      return;
    }

    const url = extractUrl(content);
    if (url) {
      if (isYouTubeUrl(url)) {
        await discord.send(channelId, 'YouTube URLs not supported via Discord.');
        return;
      }

      await discord.send(channelId, 'Fetching website content...');
      const result = await fetchWebsiteContent(url);
      if (!result.success || !result.content) {
        await discord.send(channelId, `Failed to fetch: ${result.error}`);
        return;
      }
      content = result.content;
      pageTitle = result.title || '';
    }
  }

  if (!patternLoader.patternExists(patternName)) {
    const suggestions = await patternLoader.searchPatterns(patternName);
    if (suggestions.length > 0) {
      await discord.send(channelId, `Pattern "${patternName}" not found.\n\nDid you mean:\n${suggestions.slice(0, 5).map(s => `- \`${s}\``).join('\n')}`);
    } else {
      await discord.send(channelId, `Pattern "${patternName}" not found. Use \`!fabric list\` to see available patterns.`);
    }
    return;
  }

  if (!claude) {
    await discord.send(channelId, 'OpenAI API not configured.');
    return;
  }

  try {
    await discord.sendTyping(channelId);
    await discord.send(channelId, `Applying pattern: *${patternName}*...`);

    const patternPrompt = await patternLoader.loadPattern(patternName);
    if (!patternPrompt) {
      await discord.send(channelId, `Failed to load pattern "${patternName}".`);
      return;
    }

    log(`Applying pattern ${patternName} to ${content.length} chars`);
    const response = await claude.applyPattern(patternPrompt, content);

    state.saveResponse(channelId, response, 'fabric', content, { pattern: patternName });

    await discord.send(channelId, response);
    await discord.send(channelId, `*Pattern: ${patternName} | Use !save to save this output*`);

    log('Fabric pattern applied successfully');
  } catch (error) {
    log(`Fabric error: ${error}`);
    await discord.send(channelId, `Failed to apply pattern: ${error}`);
  }
}

export default handleFabric;
