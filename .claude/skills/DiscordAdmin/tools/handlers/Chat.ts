/**
 * Chat.ts - Default chat handler for PAI Discord Bot
 *
 * Handles all non-command messages as GPT-4o conversations.
 */

import { DiscordClient, DiscordMessage } from '../lib/DiscordClient';
import { ClaudeClient } from '../../../TelegramBot/tools/lib/ClaudeClient';
import { ConversationState } from '../../../TelegramBot/tools/lib/ConversationState';

// ============================================================================
// Handler
// ============================================================================

export async function handleChat(
  message: DiscordMessage,
  args: string,
  discord: DiscordClient,
  claude: ClaudeClient,
  state: ConversationState
): Promise<void> {
  const channelId = message.channel_id;
  const userMessage = args || message.content || '';

  if (!userMessage.trim()) {
    await discord.send(channelId, 'Please send a message to chat with me.');
    return;
  }

  try {
    await discord.sendTyping(channelId);

    const response = await claude.chat(channelId, userMessage, 'chat');

    state.saveResponse(channelId, response, 'chat', userMessage);

    await discord.send(channelId, response);
  } catch (error) {
    console.error('Chat error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('API key')) {
      await discord.send(
        channelId,
        'OpenAI API key not configured. Please add OPENAI_API_KEY to ~/.claude/.env'
      );
    } else if (errorMessage.includes('rate')) {
      await discord.send(
        channelId,
        'Rate limit reached. Please wait a moment and try again.'
      );
    } else {
      await discord.send(
        channelId,
        `Sorry, I encountered an error. Please try again.\n\n*Error: ${errorMessage.substring(0, 100)}*`
      );
    }
  }
}

export default handleChat;
