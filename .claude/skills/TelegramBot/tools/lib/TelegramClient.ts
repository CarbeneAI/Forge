/**
 * TelegramClient.ts - Telegram Bot API wrapper for PAI
 *
 * Handles:
 * - Long polling for incoming messages
 * - Sending text messages with Markdown
 * - Message chunking for long responses (4096 char limit)
 */

import { existsSync } from 'fs';
import { join } from 'path';

// ============================================================================
// Types
// ============================================================================

export interface TelegramMessage {
  message_id: number;
  from: {
    id: number;
    first_name: string;
    username?: string;
  };
  chat: {
    id: number;
    type: 'private' | 'group' | 'supergroup' | 'channel';
  };
  date: number;
  text?: string;
  reply_to_message?: TelegramMessage;
}

export interface TelegramCallbackQuery {
  id: string;
  from: {
    id: number;
    first_name: string;
    username?: string;
  };
  message?: TelegramMessage;
  data?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

export interface TelegramResponse<T> {
  ok: boolean;
  result?: T;
  description?: string;
  error_code?: number;
}

// ============================================================================
// Environment Loading
// ============================================================================

const PAI_DIR = process.env.PAI_DIR || join(process.env.HOME!, '.claude');

// Load .env file
const envPath = join(PAI_DIR, '.env');
if (existsSync(envPath)) {
  const envContent = await Bun.file(envPath).text();
  const lines = envContent.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

// ============================================================================
// TelegramClient Class
// ============================================================================

export class TelegramClient {
  private token: string;
  private chatId: string;
  private baseUrl: string;
  private lastUpdateId: number = 0;

  constructor() {
    this.token = process.env.TELEGRAM_BOT_TOKEN || '';
    this.chatId = process.env.TELEGRAM_CHAT_ID || '';

    if (!this.token) {
      throw new Error('TELEGRAM_BOT_TOKEN not found in environment');
    }
    if (!this.chatId) {
      throw new Error('TELEGRAM_CHAT_ID not found in environment');
    }

    this.baseUrl = `https://api.telegram.org/bot${this.token}`;
  }

  /**
   * Get updates using long polling
   * @param timeout - Long polling timeout in seconds (default 30)
   */
  async getUpdates(timeout: number = 30): Promise<TelegramUpdate[]> {
    const url = `${this.baseUrl}/getUpdates`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        offset: this.lastUpdateId + 1,
        timeout,
        allowed_updates: ['message', 'callback_query'],
      }),
    });

    const data: TelegramResponse<TelegramUpdate[]> = await response.json();

    if (!data.ok) {
      throw new Error(`Telegram API error: ${data.description || 'Unknown error'}`);
    }

    const updates = data.result || [];

    // Update offset for next poll
    if (updates.length > 0) {
      this.lastUpdateId = updates[updates.length - 1].update_id;
    }

    // Filter to only messages/callbacks from authorized chat
    return updates.filter((update) => {
      if (update.message) {
        return String(update.message.chat.id) === this.chatId;
      }
      if (update.callback_query) {
        // Callback queries have the chat info in the message they were attached to
        return String(update.callback_query.from.id) === this.chatId ||
          (update.callback_query.message && String(update.callback_query.message.chat.id) === this.chatId);
      }
      return false;
    });
  }

  /**
   * Answer a callback query (acknowledge button press)
   */
  async answerCallbackQuery(callbackQueryId: string, text: string, showAlert: boolean = true): Promise<void> {
    const url = `${this.baseUrl}/answerCallbackQuery`;

    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
        show_alert: showAlert,
      }),
    });
  }

  /**
   * Send a text message
   * Automatically chunks messages over 4096 characters
   */
  async send(chatId: number | string, text: string, replyToMessageId?: number): Promise<void> {
    const MAX_LENGTH = 4000; // Leave buffer for Markdown formatting

    // Split into chunks if needed
    const chunks = this.chunkMessage(text, MAX_LENGTH);

    for (const chunk of chunks) {
      await this.sendSingle(chatId, chunk, replyToMessageId);
      // Small delay between chunks to avoid rate limiting
      if (chunks.length > 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  }

  /**
   * Send a single message (internal)
   */
  private async sendSingle(
    chatId: number | string,
    text: string,
    replyToMessageId?: number
  ): Promise<TelegramMessage> {
    const url = `${this.baseUrl}/sendMessage`;

    const body: Record<string, unknown> = {
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
    };

    if (replyToMessageId) {
      body.reply_to_message_id = replyToMessageId;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data: TelegramResponse<TelegramMessage> = await response.json();

    if (!data.ok) {
      // If Markdown parsing fails, try without it
      if (data.description?.includes('parse')) {
        return this.sendPlainText(chatId, text, replyToMessageId);
      }
      throw new Error(`Telegram API error: ${data.description || 'Unknown error'}`);
    }

    return data.result!;
  }

  /**
   * Send plain text (fallback when Markdown fails)
   */
  private async sendPlainText(
    chatId: number | string,
    text: string,
    replyToMessageId?: number
  ): Promise<TelegramMessage> {
    const url = `${this.baseUrl}/sendMessage`;

    const body: Record<string, unknown> = {
      chat_id: chatId,
      text,
    };

    if (replyToMessageId) {
      body.reply_to_message_id = replyToMessageId;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data: TelegramResponse<TelegramMessage> = await response.json();

    if (!data.ok) {
      throw new Error(`Telegram API error: ${data.description || 'Unknown error'}`);
    }

    return data.result!;
  }

  /**
   * Send a "typing" action indicator
   */
  async sendTyping(chatId: number | string): Promise<void> {
    const url = `${this.baseUrl}/sendChatAction`;

    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        action: 'typing',
      }),
    });
  }

  /**
   * Get bot info (useful for health checks)
   */
  async getMe(): Promise<{ id: number; first_name: string; username: string }> {
    const url = `${this.baseUrl}/getMe`;

    const response = await fetch(url);
    const data: TelegramResponse<{ id: number; first_name: string; username: string }> =
      await response.json();

    if (!data.ok) {
      throw new Error(`Telegram API error: ${data.description || 'Unknown error'}`);
    }

    return data.result!;
  }

  /**
   * Delete any existing webhook (required for long polling)
   */
  async deleteWebhook(): Promise<boolean> {
    const url = `${this.baseUrl}/deleteWebhook`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drop_pending_updates: false }),
    });

    const data: TelegramResponse<boolean> = await response.json();

    if (!data.ok) {
      throw new Error(`Telegram API error: ${data.description || 'Unknown error'}`);
    }

    return data.result!;
  }

  /**
   * Chunk a long message into smaller pieces
   */
  private chunkMessage(text: string, maxLength: number): string[] {
    if (text.length <= maxLength) {
      return [text];
    }

    const chunks: string[] = [];
    let remaining = text;

    while (remaining.length > 0) {
      if (remaining.length <= maxLength) {
        chunks.push(remaining);
        break;
      }

      // Try to split at a natural boundary
      let splitIndex = maxLength;

      // Look for paragraph break
      const paragraphBreak = remaining.lastIndexOf('\n\n', maxLength);
      if (paragraphBreak > maxLength * 0.5) {
        splitIndex = paragraphBreak + 2;
      } else {
        // Look for line break
        const lineBreak = remaining.lastIndexOf('\n', maxLength);
        if (lineBreak > maxLength * 0.5) {
          splitIndex = lineBreak + 1;
        } else {
          // Look for sentence end
          const sentenceEnd = remaining.lastIndexOf('. ', maxLength);
          if (sentenceEnd > maxLength * 0.5) {
            splitIndex = sentenceEnd + 2;
          }
        }
      }

      chunks.push(remaining.substring(0, splitIndex).trim());
      remaining = remaining.substring(splitIndex).trim();
    }

    return chunks;
  }

  /**
   * Get the authorized chat ID
   */
  getChatId(): string {
    return this.chatId;
  }
}

export default TelegramClient;
