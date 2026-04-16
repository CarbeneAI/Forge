/**
 * Fabric.ts - Fabric pattern handler for PAI Telegram Bot
 *
 * Applies Fabric patterns to content from:
 * - Direct text input
 * - Replied-to messages
 * - Website URLs (fetches and extracts content)
 * - Auto pattern selection when no pattern specified
 */

import { TelegramClient, TelegramMessage } from '../lib/TelegramClient';
import { ClaudeClient } from '../lib/ClaudeClient';
import { ConversationState } from '../lib/ConversationState';
import { PatternLoader } from '../lib/PatternLoader';

const patternLoader = new PatternLoader();

// Logging helper
function log(message: string): void {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [Fabric] ${message}`);
}

// ============================================================================
// URL Detection and Content Fetching
// ============================================================================

/**
 * Detect if content contains any URL
 */
function extractUrl(content: string): string | null {
  const urlPattern = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/i;
  const match = content.match(urlPattern);
  return match ? match[0] : null;
}

/**
 * Check if URL is a YouTube URL
 */
function isYouTubeUrl(url: string): boolean {
  return /youtube\.com|youtu\.be/i.test(url);
}

/**
 * Fetch website content using fetch API
 */
async function fetchWebsiteContent(url: string): Promise<{ success: boolean; content?: string; title?: string; error?: string }> {
  log(`Fetching website: ${url}`);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PAI/1.0; +https://pai.dev)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const html = await response.text();
    log(`Fetched ${html.length} chars of HTML`);

    // Extract text content from HTML
    const { text, title } = extractTextFromHtml(html);
    log(`Extracted ${text.length} chars of text, title: ${title}`);

    if (!text || text.length < 100) {
      return { success: false, error: 'Could not extract meaningful content from page' };
    }

    return { success: true, content: text, title };
  } catch (error) {
    log(`Fetch error: ${error}`);
    return { success: false, error: `Failed to fetch: ${error}` };
  }
}

/**
 * Extract readable text from HTML
 */
function extractTextFromHtml(html: string): { text: string; title: string } {
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : 'Untitled';

  // Remove script and style elements
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');

  // Convert common elements to readable format
  text = text
    .replace(/<h[1-6][^>]*>/gi, '\n\n## ')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<\/li>/gi, '')
    .replace(/<[^>]+>/g, ' ') // Remove remaining tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ') // Collapse whitespace
    .replace(/\n\s*\n/g, '\n\n') // Collapse multiple newlines
    .trim();

  // Limit content length to avoid token limits
  if (text.length > 50000) {
    text = text.substring(0, 50000) + '\n\n[Content truncated...]';
  }

  return { text, title };
}

/**
 * Auto-select best pattern based on content characteristics
 */
function selectPatternForContent(content: string, title: string): string {
  const lowerContent = content.toLowerCase();
  const lowerTitle = title.toLowerCase();

  // Check for specific content types
  if (lowerTitle.includes('research') || lowerTitle.includes('paper') || lowerTitle.includes('study')) {
    return 'analyze_paper';
  }

  if (lowerContent.includes('function ') || lowerContent.includes('class ') ||
      lowerContent.includes('const ') || lowerContent.includes('def ') ||
      lowerContent.includes('```')) {
    return 'explain_code';
  }

  if (lowerTitle.includes('news') || lowerTitle.includes('breaking') ||
      lowerContent.includes('reported today') || lowerContent.includes('according to')) {
    return 'summarize';
  }

  if (lowerTitle.includes('blog') || lowerTitle.includes('article') ||
      lowerTitle.includes('opinion') || lowerTitle.includes('essay')) {
    return 'extract_article_wisdom';
  }

  if (lowerContent.includes('security') || lowerContent.includes('vulnerability') ||
      lowerContent.includes('threat') || lowerContent.includes('attack')) {
    return 'analyze_threat_report';
  }

  if (lowerContent.includes('product') || lowerContent.includes('feature') ||
      lowerContent.includes('pricing') || lowerContent.includes('buy')) {
    return 'extract_product_features';
  }

  // Default to extract_wisdom for general content
  return 'extract_wisdom';
}

// ============================================================================
// Handler
// ============================================================================

export async function handleFabric(
  message: TelegramMessage,
  args: string,
  telegram: TelegramClient,
  claude: ClaudeClient | null,
  state: ConversationState
): Promise<void> {
  const chatId = message.chat.id;

  // Handle /fabric list
  if (!args.trim() || args.toLowerCase() === 'list') {
    await handleList(message, telegram);
    return;
  }

  // Handle /fabric search <query>
  if (args.toLowerCase().startsWith('search ')) {
    const query = args.substring(7).trim();
    await handleSearch(message, query, telegram);
    return;
  }

  // Check if first arg is a URL (auto-select pattern mode)
  const firstArg = args.split(' ')[0];
  const isFirstArgUrl = extractUrl(firstArg) !== null;

  let patternName: string;
  let content: string;
  let autoSelectedPattern = false;
  let pageTitle = '';

  if (isFirstArgUrl) {
    // URL provided first - auto-select pattern
    const url = extractUrl(args)!;
    log(`URL detected, will auto-select pattern: ${url}`);

    // Check if it's YouTube - currently not supported
    if (isYouTubeUrl(url)) {
      await telegram.send(
        chatId,
        `YouTube URLs are currently not supported via Telegram.\n\nPlease use a regular website URL, or run \`fabric -y <url> | fabric -p extract_wisdom\` from the command line.`
      );
      return;
    }

    // Fetch website content
    await telegram.send(chatId, `Fetching website content...`);
    await telegram.sendTyping(chatId);

    const result = await fetchWebsiteContent(url);
    if (!result.success || !result.content) {
      await telegram.send(chatId, `Failed to fetch website: ${result.error}`);
      return;
    }

    content = result.content;
    pageTitle = result.title || '';

    // Auto-select pattern based on content
    patternName = selectPatternForContent(content, pageTitle);
    autoSelectedPattern = true;

    log(`Auto-selected pattern: ${patternName} for "${pageTitle}"`);
    await telegram.send(
      chatId,
      `Fetched: _${pageTitle}_\nContent: ${content.length} chars\nAuto-selected pattern: \`${patternName}\``
    );
  } else {
    // Traditional mode: pattern name first
    const spaceIndex = args.indexOf(' ');
    patternName = spaceIndex > 0 ? args.substring(0, spaceIndex) : args;
    content = spaceIndex > 0 ? args.substring(spaceIndex + 1).trim() : '';

    // If no content provided, check for replied message
    if (!content && message.reply_to_message?.text) {
      content = message.reply_to_message.text;
    }

    // If still no content, check for last response
    if (!content) {
      const lastResponse = state.getLastResponse(String(chatId));
      if (lastResponse) {
        content = lastResponse.content;
      }
    }

    if (!content) {
      await telegram.send(
        chatId,
        `No content to process.\n\n*Usage:*\n• \`/fabric <url>\` - Auto-select pattern for website\n• \`/fabric <pattern> <url>\` - Use specific pattern\n• \`/fabric <pattern> <text>\` - Apply to text\n• Reply to message with \`/fabric <pattern>\`\n• \`/fabric list\` - Show available patterns`
      );
      return;
    }

    // Check if content is a URL - fetch it
    const url = extractUrl(content);
    if (url) {
      // Check if it's YouTube
      if (isYouTubeUrl(url)) {
        await telegram.send(
          chatId,
          `YouTube URLs are currently not supported via Telegram.\n\nPlease use a regular website URL.`
        );
        return;
      }

      // Fetch website content
      await telegram.send(chatId, `Fetching website content...`);
      await telegram.sendTyping(chatId);

      const result = await fetchWebsiteContent(url);
      if (!result.success || !result.content) {
        await telegram.send(chatId, `Failed to fetch website: ${result.error}`);
        return;
      }

      content = result.content;
      pageTitle = result.title || '';
      log(`Fetched website: "${pageTitle}" (${content.length} chars)`);
      await telegram.send(chatId, `Fetched: _${pageTitle}_ (${content.length} chars)`);
    }
  }

  // Check if pattern exists
  if (!patternLoader.patternExists(patternName)) {
    const suggestions = await patternLoader.searchPatterns(patternName);
    if (suggestions.length > 0) {
      await telegram.send(
        chatId,
        `Pattern "${patternName}" not found.\n\nDid you mean:\n${suggestions.slice(0, 5).map((s) => `• \`${s}\``).join('\n')}`
      );
    } else {
      await telegram.send(
        chatId,
        `Pattern "${patternName}" not found.\n\nUse \`/fabric list\` to see available patterns.`
      );
    }
    return;
  }

  if (!claude) {
    await telegram.send(
      chatId,
      'Claude API not configured. Add ANTHROPIC_API_KEY to ~/.claude/.env'
    );
    return;
  }

  try {
    await telegram.sendTyping(chatId);
    await telegram.send(chatId, `Applying pattern: _${patternName}_...`);

    // Load pattern prompt
    log(`Loading pattern: ${patternName}`);
    const patternPrompt = await patternLoader.loadPattern(patternName);
    if (!patternPrompt) {
      log(`Failed to load pattern: ${patternName}`);
      await telegram.send(chatId, `Failed to load pattern "${patternName}".`);
      return;
    }
    log(`Pattern loaded, ${patternPrompt.length} chars. Content: ${content.length} chars`);

    // Apply pattern using Claude
    log(`Calling OpenAI API to apply pattern...`);
    const response = await claude.applyPattern(patternPrompt, content);
    log(`OpenAI response received: ${response.length} chars`);

    // Save for potential /save command
    state.saveResponse(String(chatId), response, 'fabric', content, {
      pattern: patternName,
    });

    // Split long responses for Telegram (4096 char limit)
    if (response.length > 4000) {
      log(`Response too long (${response.length}), splitting...`);
      const chunks = [];
      for (let i = 0; i < response.length; i += 4000) {
        chunks.push(response.substring(i, i + 4000));
      }
      for (const chunk of chunks) {
        await telegram.send(chatId, chunk);
      }
    } else {
      await telegram.send(chatId, response);
    }

    await telegram.send(
      chatId,
      `_Pattern: ${patternName} | Use /save to save this output_`
    );
    log(`Fabric pattern applied successfully`);
  } catch (error) {
    log(`Fabric error: ${error}`);
    console.error('Fabric error:', error);
    await telegram.send(chatId, `Failed to apply pattern: ${error}`);
  }
}

/**
 * Handle /fabric list
 */
async function handleList(
  message: TelegramMessage,
  telegram: TelegramClient
): Promise<void> {
  const chatId = message.chat.id;

  const popular = patternLoader.getPopularPatterns();
  const allPatterns = await patternLoader.listPatterns();

  let msg = '*Fabric Patterns*\n\n';
  msg += '*Popular:*\n';
  msg += popular.map((p) => `\`${p}\``).join(', ');
  msg += '\n\n';
  msg += `*Total:* ${allPatterns.length} patterns available\n\n`;
  msg += '*Usage:*\n';
  msg += '• `/fabric <pattern>` - Apply to last response\n';
  msg += '• `/fabric <pattern> <text>` - Apply to text\n';
  msg += '• Reply to message with `/fabric <pattern>`\n';
  msg += '• `/fabric search <query>` - Search patterns';

  await telegram.send(chatId, msg);
}

/**
 * Handle /fabric search <query>
 */
async function handleSearch(
  message: TelegramMessage,
  query: string,
  telegram: TelegramClient
): Promise<void> {
  const chatId = message.chat.id;

  if (!query) {
    await telegram.send(chatId, 'Usage: `/fabric search <query>`');
    return;
  }

  const matches = await patternLoader.searchPatterns(query);

  if (matches.length === 0) {
    await telegram.send(chatId, `No patterns found matching "${query}".`);
    return;
  }

  let msg = `*Patterns matching "${query}":*\n\n`;
  msg += matches.slice(0, 15).map((p) => `\`${p}\``).join('\n');

  if (matches.length > 15) {
    msg += `\n\n_...and ${matches.length - 15} more_`;
  }

  await telegram.send(chatId, msg);
}

export default handleFabric;
