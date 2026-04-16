/**
 * Research.ts - Deep research handler for PAI Telegram Bot
 *
 * Multi-source research using:
 * - Perplexity API (web search + synthesis)
 * - OpenAI/ChatGPT (additional analysis)
 * - Combines results and auto-saves to Obsidian
 *
 * Supports:
 * - /research <topic>
 * - /research <url>
 * - /research <topic> <additional instructions>
 * - /research <url> <additional instructions>
 */

import { TelegramClient, TelegramMessage } from '../lib/TelegramClient';
import { ClaudeClient } from '../lib/ClaudeClient';
import { PerplexityClient } from '../lib/PerplexityClient';
import { ConversationState } from '../lib/ConversationState';
import { ObsidianWriter } from '../lib/ObsidianWriter';

const writer = new ObsidianWriter();

// Logging helper
function log(message: string): void {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [Research] ${message}`);
}

// Telegram message limit
const TELEGRAM_MAX_LENGTH = 4000;

// ============================================================================
// URL Detection and Content Fetching
// ============================================================================

/**
 * Extract URL from content
 */
function extractUrl(content: string): string | null {
  const urlPattern = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/i;
  const match = content.match(urlPattern);
  return match ? match[0] : null;
}

/**
 * Parse research input into topic, URL, and additional instructions
 */
function parseResearchInput(input: string): {
  topic: string;
  url: string | null;
  instructions: string | null;
} {
  const url = extractUrl(input);

  if (url) {
    // Remove URL from input to get remaining text
    const remaining = input.replace(url, '').trim();

    // Check if remaining text looks like instructions (contains ? or action words)
    const looksLikeInstructions = remaining.length > 10 && (
      remaining.includes('?') ||
      /\b(can you|please|provide|find|what|how|why|list|summarize|analyze|identify|suggest|recommend|compare|explain)\b/i.test(remaining)
    );

    if (looksLikeInstructions) {
      return {
        topic: url,
        url: url,
        instructions: remaining,
      };
    } else if (remaining) {
      // Remaining text is likely part of the topic description
      return {
        topic: `${remaining} ${url}`,
        url: url,
        instructions: null,
      };
    } else {
      return {
        topic: url,
        url: url,
        instructions: null,
      };
    }
  }

  // No URL - check for instructions in the topic
  // Look for patterns like "topic - can you also..." or "topic. Please also..."
  const instructionSeparators = [
    /[.?!]\s*(can you|please|also|and|what|how|provide|find)/i,
    /\s+-\s+(can you|please|also|what|how|provide|find)/i,
  ];

  for (const pattern of instructionSeparators) {
    const match = input.match(pattern);
    if (match && match.index !== undefined) {
      const topic = input.substring(0, match.index + 1).trim();
      const instructions = input.substring(match.index + 1).trim();
      if (topic.length > 5 && instructions.length > 10) {
        return { topic, url: null, instructions };
      }
    }
  }

  return { topic: input, url: null, instructions: null };
}

/**
 * Fetch website content
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

  // Limit content length
  if (text.length > 50000) {
    text = text.substring(0, 50000) + '\n\n[Content truncated...]';
  }

  return { text, title };
}

/**
 * Truncate content for Telegram, preserving structure
 */
function truncateForTelegram(content: string): { truncated: string; wasTruncated: boolean } {
  if (content.length <= TELEGRAM_MAX_LENGTH) {
    return { truncated: content, wasTruncated: false };
  }

  // Find a good break point (end of paragraph or sentence)
  let breakPoint = TELEGRAM_MAX_LENGTH - 100;

  // Try to find paragraph break
  const paragraphBreak = content.lastIndexOf('\n\n', breakPoint);
  if (paragraphBreak > TELEGRAM_MAX_LENGTH * 0.5) {
    breakPoint = paragraphBreak;
  } else {
    // Try sentence break
    const sentenceBreak = content.lastIndexOf('. ', breakPoint);
    if (sentenceBreak > TELEGRAM_MAX_LENGTH * 0.5) {
      breakPoint = sentenceBreak + 1;
    }
  }

  const truncated = content.substring(0, breakPoint) +
    '\n\n---\n_Content truncated. Full version saved to Obsidian._';

  return { truncated, wasTruncated: true };
}

/**
 * Format citations as markdown links
 */
function formatCitations(citations: string[]): string {
  if (!citations || citations.length === 0) return '';

  let formatted = '\n\n## Sources\n\n';
  citations.forEach((url, i) => {
    // Extract domain for display
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      formatted += `${i + 1}. [${domain}](${url})\n`;
    } catch {
      formatted += `${i + 1}. ${url}\n`;
    }
  });
  return formatted;
}

// ============================================================================
// Handler
// ============================================================================

export async function handleResearch(
  message: TelegramMessage,
  args: string,
  telegram: TelegramClient,
  openai: ClaudeClient | null,
  state: ConversationState
): Promise<void> {
  const chatId = message.chat.id;
  const input = args.trim();

  if (!input) {
    await telegram.send(
      chatId,
      `*Deep Research*\n\nUsage:\n• \`/research <topic>\`\n• \`/research <url>\`\n• \`/research <url> <instructions>\`\n\nExamples:\n• \`/research AI agents 2025 trends\`\n• \`/research https://example.com\`\n• \`/research https://example.com what business ideas can you extract?\`\n\n_Uses Perplexity + ChatGPT, auto-saves to Obsidian._`
    );
    return;
  }

  // Parse input to extract topic, URL, and additional instructions
  const parsed = parseResearchInput(input);
  log(`Parsed input - topic: ${parsed.topic}, url: ${parsed.url}, instructions: ${parsed.instructions}`);

  let perplexity: PerplexityClient;
  try {
    perplexity = new PerplexityClient();
  } catch (error) {
    await telegram.send(
      chatId,
      'Perplexity API not configured. Add PERPLEXITY_API_KEY to ~/.claude/.env'
    );
    return;
  }

  if (!openai) {
    await telegram.send(
      chatId,
      'OpenAI API not configured. Add OPENAI_API_KEY to ~/.claude/.env'
    );
    return;
  }

  try {
    await telegram.sendTyping(chatId);

    let websiteContent: string | null = null;
    let websiteTitle: string | null = null;
    let displayTopic = parsed.topic;

    // If URL provided, fetch the website content first
    if (parsed.url) {
      await telegram.send(chatId, `Fetching website content...`);
      const fetchResult = await fetchWebsiteContent(parsed.url);

      if (!fetchResult.success || !fetchResult.content) {
        await telegram.send(chatId, `Failed to fetch website: ${fetchResult.error}`);
        return;
      }

      websiteContent = fetchResult.content;
      websiteTitle = fetchResult.title || 'Website';
      displayTopic = websiteTitle;

      await telegram.send(chatId, `Fetched: _${websiteTitle}_ (${websiteContent.length} chars)`);
    }

    // Build status message
    let statusMsg = `Starting deep research on: _${displayTopic}_`;
    if (parsed.instructions) {
      statusMsg += `\n\nAdditional focus: _${parsed.instructions}_`;
    }
    statusMsg += `\n\n1/3 Searching with Perplexity...`;
    await telegram.send(chatId, statusMsg);

    // Step 1: Perplexity research
    log('Calling Perplexity API...');

    // Build Perplexity query - include website content and/or instructions
    let perplexityQuery = parsed.topic;
    if (websiteContent) {
      // For URLs, ask Perplexity to analyze the content
      perplexityQuery = `Analyze this website content and provide comprehensive research:\n\nTitle: ${websiteTitle}\n\nContent:\n${websiteContent.substring(0, 15000)}`;
      if (parsed.instructions) {
        perplexityQuery += `\n\nSpecific focus requested: ${parsed.instructions}`;
      }
    } else if (parsed.instructions) {
      perplexityQuery = `${parsed.topic}\n\nSpecific focus: ${parsed.instructions}`;
    }

    const perplexityResult = await perplexity.research(perplexityQuery, 'deep');
    log(`Perplexity returned ${perplexityResult.content.length} chars, ${perplexityResult.citations.length} citations`);

    await telegram.sendTyping(chatId);
    await telegram.send(chatId, `2/3 Analyzing with ChatGPT...`);

    // Step 2: ChatGPT additional analysis
    log('Calling OpenAI API...');

    // Build GPT prompt with context and instructions
    let gptPrompt = `Based on this research about "${displayTopic}", provide additional insights, analysis, and any perspectives that might be missing:\n\n`;

    if (websiteContent) {
      gptPrompt += `**Original Website Content:**\n${websiteContent.substring(0, 5000)}\n\n`;
    }

    gptPrompt += `**Perplexity Research:**\n${perplexityResult.content.substring(0, 8000)}\n\n`;

    if (parsed.instructions) {
      gptPrompt += `**User's Specific Request:** ${parsed.instructions}\n\nPlease specifically address this request in your analysis.\n\n`;
    }

    gptPrompt += `Focus on:
1. Key takeaways and implications
2. Potential gaps or biases in the research
3. Practical applications or next steps
4. Related topics worth exploring`;

    if (parsed.instructions) {
      gptPrompt += `\n5. Specifically address: ${parsed.instructions}`;
    }

    const gptResult = await openai.chat(String(chatId), gptPrompt, 'research');
    log(`OpenAI returned ${gptResult.length} chars`);

    await telegram.sendTyping(chatId);
    await telegram.send(chatId, `3/3 Compiling and saving...`);

    // Step 3: Combine results
    let fullContent = `# Research: ${displayTopic}\n\n`;
    fullContent += `*Generated: ${new Date().toISOString().split('T')[0]}*\n\n`;

    if (parsed.url) {
      fullContent += `*Source URL:* ${parsed.url}\n\n`;
    }

    if (parsed.instructions) {
      fullContent += `*Additional Focus:* ${parsed.instructions}\n\n`;
    }

    fullContent += `---\n\n`;

    if (websiteContent) {
      fullContent += `## Website Content Summary\n\n`;
      fullContent += `**Title:** ${websiteTitle}\n\n`;
      fullContent += `${websiteContent.substring(0, 3000)}${websiteContent.length > 3000 ? '...\n\n[Content truncated for summary]' : ''}\n\n`;
      fullContent += `---\n\n`;
    }

    fullContent += `## Perplexity Research\n\n`;
    fullContent += perplexityResult.content;
    fullContent += formatCitations(perplexityResult.citations);
    fullContent += `\n\n---\n\n`;
    fullContent += `## ChatGPT Analysis\n\n`;
    fullContent += gptResult;

    log(`Combined content: ${fullContent.length} chars`);

    // Step 4: Auto-save to Obsidian
    const saveTopic = websiteTitle || parsed.topic.substring(0, 50);
    const saveResult = await writer.save(fullContent, {
      type: 'research',
      userQuery: input,
      topic: saveTopic,
      tags: ['deep-research', 'perplexity', 'chatgpt', ...(parsed.url ? ['url-research'] : [])],
    });

    if (!saveResult.success) {
      log(`Failed to save: ${saveResult.error}`);
    } else {
      log(`Saved to: ${saveResult.filePath}`);
    }

    // Step 5: Save to state for potential manual /save
    state.saveResponse(String(chatId), fullContent, 'research', input, {
      topic: saveTopic,
    });

    // Step 6: Truncate and send to Telegram
    const { truncated, wasTruncated } = truncateForTelegram(fullContent);

    // Split if still too long
    if (truncated.length > 4000) {
      const chunks = [];
      for (let i = 0; i < truncated.length; i += 4000) {
        chunks.push(truncated.substring(i, i + 4000));
      }
      for (const chunk of chunks) {
        await telegram.send(chatId, chunk);
      }
    } else {
      await telegram.send(chatId, truncated);
    }

    // Send save confirmation
    const filename = saveResult.filePath?.split('/').pop() || 'unknown';
    let finalStatus = `\n*Research complete!*`;
    if (saveResult.success) {
      finalStatus += `\n\nSaved to: \`${filename}\``;
    }
    if (wasTruncated) {
      finalStatus += `\n_Full content (${fullContent.length} chars) saved to Obsidian._`;
    }
    await telegram.send(chatId, finalStatus);

    log('Research complete');
  } catch (error) {
    log(`Research error: ${error}`);
    console.error('Research error:', error);
    await telegram.send(chatId, `Research failed: ${error}`);
  }
}

export default handleResearch;
