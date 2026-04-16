/**
 * Ideas.ts - Blog post ideas generator for PAI Telegram Bot
 *
 * Uses Perplexity for preliminary research to generate blog post ideas.
 * Auto-saves to Obsidian, sends truncated version to Telegram.
 */

import { TelegramClient, TelegramMessage } from '../lib/TelegramClient';
import { PerplexityClient } from '../lib/PerplexityClient';
import { ConversationState } from '../lib/ConversationState';
import { ObsidianWriter } from '../lib/ObsidianWriter';

const writer = new ObsidianWriter();

// Logging helper
function log(message: string): void {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [Ideas] ${message}`);
}

// Telegram message limit
const TELEGRAM_MAX_LENGTH = 4000;

/**
 * Truncate content for Telegram, preserving structure
 */
function truncateForTelegram(content: string): { truncated: string; wasTruncated: boolean } {
  if (content.length <= TELEGRAM_MAX_LENGTH) {
    return { truncated: content, wasTruncated: false };
  }

  // Find a good break point
  let breakPoint = TELEGRAM_MAX_LENGTH - 100;

  // Try to find idea boundary (usually starts with ## or **1.)
  const ideaBreak = content.lastIndexOf('\n## ', breakPoint);
  const numberedBreak = content.lastIndexOf('\n**', breakPoint);

  if (ideaBreak > TELEGRAM_MAX_LENGTH * 0.5) {
    breakPoint = ideaBreak;
  } else if (numberedBreak > TELEGRAM_MAX_LENGTH * 0.5) {
    breakPoint = numberedBreak;
  } else {
    // Try paragraph break
    const paragraphBreak = content.lastIndexOf('\n\n', breakPoint);
    if (paragraphBreak > TELEGRAM_MAX_LENGTH * 0.5) {
      breakPoint = paragraphBreak;
    }
  }

  const truncated = content.substring(0, breakPoint) +
    '\n\n---\n_More ideas saved to Obsidian._';

  return { truncated, wasTruncated: true };
}

/**
 * Format citations as a simple list
 */
function formatCitations(citations: string[]): string {
  if (!citations || citations.length === 0) return '';

  let formatted = '\n\n## Research Sources\n\n';
  citations.slice(0, 10).forEach((url, i) => {
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

export async function handleIdeas(
  message: TelegramMessage,
  args: string,
  telegram: TelegramClient,
  state: ConversationState
): Promise<void> {
  const chatId = message.chat.id;
  const topic = args.trim();

  if (!topic) {
    await telegram.send(
      chatId,
      `*Blog Post Ideas Generator*\n\nUsage: \`/ideas <topic>\`\n\nExample: \`/ideas AI security trends\`\n\n_Uses Perplexity to research the topic and generate blog post ideas. Auto-saves to Obsidian._`
    );
    return;
  }

  log(`Generating ideas for: ${topic}`);

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

  try {
    await telegram.sendTyping(chatId);
    await telegram.send(chatId, `Researching topic and generating blog post ideas for: _${topic}_...`);

    // Generate ideas using Perplexity
    log('Calling Perplexity API for ideas...');
    const result = await perplexity.generateIdeas(topic);
    log(`Perplexity returned ${result.content.length} chars, ${result.citations.length} citations`);

    // Build full content
    let fullContent = `# Blog Post Ideas: ${topic}\n\n`;
    fullContent += `*Generated: ${new Date().toISOString().split('T')[0]}*\n\n`;
    fullContent += `---\n\n`;
    fullContent += result.content;
    fullContent += formatCitations(result.citations);

    log(`Full content: ${fullContent.length} chars`);

    // Auto-save to Obsidian
    const saveResult = await writer.save(fullContent, {
      type: 'research',
      userQuery: topic,
      topic: `ideas-${topic}`,
      tags: ['blog-ideas', 'content-planning', 'perplexity'],
    });

    if (!saveResult.success) {
      log(`Failed to save: ${saveResult.error}`);
    } else {
      log(`Saved to: ${saveResult.filePath}`);
    }

    // Save to state for potential manual /save
    state.saveResponse(String(chatId), fullContent, 'research', topic, {
      topic: `Blog ideas: ${topic}`,
    });

    // Truncate and send to Telegram
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
    let statusMsg = `*Ideas generated!*`;
    if (saveResult.success) {
      statusMsg += `\n\nSaved to: \`${filename}\``;
    }
    if (wasTruncated) {
      statusMsg += `\n_Full content saved to Obsidian._`;
    }
    await telegram.send(chatId, statusMsg);

    log('Ideas generation complete');
  } catch (error) {
    log(`Ideas error: ${error}`);
    console.error('Ideas error:', error);
    await telegram.send(chatId, `Failed to generate ideas: ${error}`);
  }
}

export default handleIdeas;
