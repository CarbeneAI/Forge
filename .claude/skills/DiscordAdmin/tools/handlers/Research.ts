/**
 * Research.ts - Deep research handler for PAI Discord Bot
 *
 * Multi-source research using Perplexity + OpenAI/ChatGPT.
 * Auto-saves to Obsidian.
 */

import { DiscordClient, DiscordMessage } from '../lib/DiscordClient';
import { ClaudeClient } from '../../../TelegramBot/tools/lib/ClaudeClient';
import { PerplexityClient } from '../../../TelegramBot/tools/lib/PerplexityClient';
import { ConversationState } from '../../../TelegramBot/tools/lib/ConversationState';
import { ObsidianWriter } from '../../../TelegramBot/tools/lib/ObsidianWriter';

const writer = new ObsidianWriter();

const DISCORD_MAX_LENGTH = 1800;

function log(message: string): void {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [Discord/Research] ${message}`);
}

function extractUrl(content: string): string | null {
  const urlPattern = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/i;
  const match = content.match(urlPattern);
  return match ? match[0] : null;
}

function parseResearchInput(input: string): {
  topic: string;
  url: string | null;
  instructions: string | null;
} {
  const url = extractUrl(input);

  if (url) {
    const remaining = input.replace(url, '').trim();
    const looksLikeInstructions = remaining.length > 10 && (
      remaining.includes('?') ||
      /\b(can you|please|provide|find|what|how|why|list|summarize|analyze|identify|suggest|recommend|compare|explain)\b/i.test(remaining)
    );

    if (looksLikeInstructions) {
      return { topic: url, url, instructions: remaining };
    } else if (remaining) {
      return { topic: `${remaining} ${url}`, url, instructions: null };
    } else {
      return { topic: url, url, instructions: null };
    }
  }

  return { topic: input, url: null, instructions: null };
}

async function fetchWebsiteContent(url: string): Promise<{ success: boolean; content?: string; title?: string; error?: string }> {
  log(`Fetching website: ${url}`);
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PAI/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    const html = await response.text();
    const { text, title } = extractTextFromHtml(html);

    if (!text || text.length < 100) {
      return { success: false, error: 'Could not extract content from page' };
    }

    return { success: true, content: text, title };
  } catch (error) {
    return { success: false, error: `Failed to fetch: ${error}` };
  }
}

function extractTextFromHtml(html: string): { text: string; title: string } {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : 'Untitled';

  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<h[1-6][^>]*>/gi, '\n\n## ')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n- ')
    .replace(/<\/li>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();

  if (text.length > 50000) {
    text = text.substring(0, 50000) + '\n\n[Content truncated...]';
  }

  return { text, title };
}

function truncateForDiscord(content: string): { truncated: string; wasTruncated: boolean } {
  if (content.length <= DISCORD_MAX_LENGTH) {
    return { truncated: content, wasTruncated: false };
  }

  let breakPoint = DISCORD_MAX_LENGTH - 100;
  const paragraphBreak = content.lastIndexOf('\n\n', breakPoint);
  if (paragraphBreak > DISCORD_MAX_LENGTH * 0.5) {
    breakPoint = paragraphBreak;
  } else {
    const sentenceBreak = content.lastIndexOf('. ', breakPoint);
    if (sentenceBreak > DISCORD_MAX_LENGTH * 0.5) {
      breakPoint = sentenceBreak + 1;
    }
  }

  const truncated = content.substring(0, breakPoint) +
    '\n\n---\n*Content truncated. Full version saved to Obsidian.*';

  return { truncated, wasTruncated: true };
}

function formatCitations(citations: string[]): string {
  if (!citations || citations.length === 0) return '';
  let formatted = '\n\n## Sources\n\n';
  citations.forEach((url, i) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      formatted += `${i + 1}. [${domain}](${url})\n`;
    } catch {
      formatted += `${i + 1}. ${url}\n`;
    }
  });
  return formatted;
}

export async function handleResearch(
  message: DiscordMessage,
  args: string,
  discord: DiscordClient,
  openai: ClaudeClient | null,
  state: ConversationState
): Promise<void> {
  const channelId = message.channel_id;
  const input = args.trim();

  if (!input) {
    await discord.send(
      channelId,
      `**Deep Research**\n\nUsage:\n- \`!research <topic>\`\n- \`!research <url>\`\n- \`!research <url> <instructions>\`\n\nExamples:\n- \`!research AI agents 2025 trends\`\n- \`!research https://example.com\`\n- \`!research https://example.com what business ideas can you extract?\`\n\n*Uses Perplexity + ChatGPT, auto-saves to Obsidian.*`
    );
    return;
  }

  const parsed = parseResearchInput(input);
  log(`Parsed input - topic: ${parsed.topic}, url: ${parsed.url}, instructions: ${parsed.instructions}`);

  let perplexity: PerplexityClient;
  try {
    perplexity = new PerplexityClient();
  } catch {
    await discord.send(channelId, 'Perplexity API not configured. Add PERPLEXITY_API_KEY to ~/.claude/.env');
    return;
  }

  if (!openai) {
    await discord.send(channelId, 'OpenAI API not configured. Add OPENAI_API_KEY to ~/.claude/.env');
    return;
  }

  try {
    await discord.sendTyping(channelId);

    let websiteContent: string | null = null;
    let websiteTitle: string | null = null;
    let displayTopic = parsed.topic;

    if (parsed.url) {
      await discord.send(channelId, 'Fetching website content...');
      const fetchResult = await fetchWebsiteContent(parsed.url);

      if (!fetchResult.success || !fetchResult.content) {
        await discord.send(channelId, `Failed to fetch website: ${fetchResult.error}`);
        return;
      }

      websiteContent = fetchResult.content;
      websiteTitle = fetchResult.title || 'Website';
      displayTopic = websiteTitle;

      await discord.send(channelId, `Fetched: *${websiteTitle}* (${websiteContent.length} chars)`);
    }

    let statusMsg = `Starting deep research on: *${displayTopic}*`;
    if (parsed.instructions) {
      statusMsg += `\n\nAdditional focus: *${parsed.instructions}*`;
    }
    statusMsg += `\n\n1/3 Searching with Perplexity...`;
    await discord.send(channelId, statusMsg);

    log('Calling Perplexity API...');
    let perplexityQuery = parsed.topic;
    if (websiteContent) {
      perplexityQuery = `Analyze this website content and provide comprehensive research:\n\nTitle: ${websiteTitle}\n\nContent:\n${websiteContent.substring(0, 15000)}`;
      if (parsed.instructions) {
        perplexityQuery += `\n\nSpecific focus requested: ${parsed.instructions}`;
      }
    } else if (parsed.instructions) {
      perplexityQuery = `${parsed.topic}\n\nSpecific focus: ${parsed.instructions}`;
    }

    const perplexityResult = await perplexity.research(perplexityQuery, 'deep');
    log(`Perplexity returned ${perplexityResult.content.length} chars`);

    await discord.sendTyping(channelId);
    await discord.send(channelId, '2/3 Analyzing with ChatGPT...');

    log('Calling OpenAI API...');
    let gptPrompt = `Based on this research about "${displayTopic}", provide additional insights:\n\n`;

    if (websiteContent) {
      gptPrompt += `**Original Website Content:**\n${websiteContent.substring(0, 5000)}\n\n`;
    }
    gptPrompt += `**Perplexity Research:**\n${perplexityResult.content.substring(0, 8000)}\n\n`;
    if (parsed.instructions) {
      gptPrompt += `**User's Specific Request:** ${parsed.instructions}\n\n`;
    }
    gptPrompt += `Focus on:\n1. Key takeaways and implications\n2. Potential gaps in the research\n3. Practical applications or next steps\n4. Related topics worth exploring`;

    const gptResult = await openai.chat(channelId, gptPrompt, 'research');
    log(`OpenAI returned ${gptResult.length} chars`);

    await discord.sendTyping(channelId);
    await discord.send(channelId, '3/3 Compiling and saving...');

    let fullContent = `# Research: ${displayTopic}\n\n`;
    fullContent += `*Generated: ${new Date().toISOString().split('T')[0]}*\n\n`;
    if (parsed.url) fullContent += `*Source URL:* ${parsed.url}\n\n`;
    if (parsed.instructions) fullContent += `*Additional Focus:* ${parsed.instructions}\n\n`;
    fullContent += `---\n\n`;
    fullContent += `## Perplexity Research\n\n${perplexityResult.content}`;
    fullContent += formatCitations(perplexityResult.citations);
    fullContent += `\n\n---\n\n## ChatGPT Analysis\n\n${gptResult}`;

    const saveTopic = websiteTitle || parsed.topic.substring(0, 50);
    const saveResult = await writer.save(fullContent, {
      type: 'research',
      userQuery: input,
      topic: saveTopic,
      tags: ['deep-research', 'discord', 'perplexity', 'chatgpt'],
    });

    state.saveResponse(channelId, fullContent, 'research', input, { topic: saveTopic });

    const { truncated, wasTruncated } = truncateForDiscord(fullContent);
    await discord.send(channelId, truncated);

    const filename = saveResult.filePath?.split('/').pop() || 'unknown';
    let finalStatus = '\n**Research complete!**';
    if (saveResult.success) finalStatus += `\n\nSaved to: \`${filename}\``;
    if (wasTruncated) finalStatus += `\n*Full content (${fullContent.length} chars) saved to Obsidian.*`;
    await discord.send(channelId, finalStatus);

    log('Research complete');
  } catch (error) {
    log(`Research error: ${error}`);
    await discord.send(channelId, `Research failed: ${error}`);
  }
}

export default handleResearch;
