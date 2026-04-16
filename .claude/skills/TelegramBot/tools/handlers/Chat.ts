/**
 * Chat.ts - Default chat handler for PAI Telegram Bot
 *
 * Handles all non-command messages as Claude conversations.
 */

import { TelegramClient, TelegramMessage } from '../lib/TelegramClient';
import { ClaudeClient } from '../lib/ClaudeClient';
import { ConversationState } from '../lib/ConversationState';

// ============================================================================
// Handler
// ============================================================================

export async function handleChat(
  message: TelegramMessage,
  args: string,
  telegram: TelegramClient,
  claude: ClaudeClient,
  state: ConversationState
): Promise<void> {
  const chatId = message.chat.id;
  const userMessage = args || message.text || '';

  if (!userMessage.trim()) {
    await telegram.send(chatId, 'Please send a message to chat with me.');
    return;
  }

  try {
    // Send typing indicator
    await telegram.sendTyping(chatId);

    // Get response from Claude
    const response = await claude.chat(String(chatId), userMessage, 'chat');

    // Save for potential /save command
    state.saveResponse(String(chatId), response, 'chat', userMessage);

    // Send response
    await telegram.send(chatId, response);
  } catch (error) {
    console.error('Chat error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('API key')) {
      await telegram.send(
        chatId,
        'Claude API key not configured. Please add ANTHROPIC_API_KEY to ~/.claude/.env'
      );
    } else if (errorMessage.includes('rate')) {
      await telegram.send(
        chatId,
        'Rate limit reached. Please wait a moment and try again.'
      );
    } else {
      await telegram.send(
        chatId,
        `Sorry, I encountered an error. Please try again.\n\n_Error: ${errorMessage.substring(0, 100)}_`
      );
    }
  }
}

export default handleChat;
