/**
 * Save.ts - Save handler for PAI Telegram Bot
 *
 * Saves the last response to Obsidian-compatible Markdown
 */

import { TelegramClient, TelegramMessage } from '../lib/TelegramClient';
import { ConversationState, SavedResponse } from '../lib/ConversationState';
import { ObsidianWriter } from '../lib/ObsidianWriter';

const writer = new ObsidianWriter();

// ============================================================================
// Handler
// ============================================================================

export async function handleSave(
  message: TelegramMessage,
  args: string,
  telegram: TelegramClient,
  state: ConversationState
): Promise<void> {
  const chatId = message.chat.id;
  const lastResponse = state.getLastResponse(String(chatId));

  if (!lastResponse) {
    await telegram.send(
      chatId,
      'Nothing to save.\n\nChat with me first, then use `/save` to save my response.'
    );
    return;
  }

  // Parse optional tags from args
  const tags = args
    .trim()
    .split(/[\s,]+/)
    .filter((t) => t.length > 0);

  try {
    await telegram.sendTyping(chatId);

    const result = await writer.save(lastResponse.content, {
      type: lastResponse.type,
      userQuery: lastResponse.userQuery,
      topic: lastResponse.topic,
      pattern: lastResponse.pattern,
      tags: tags.length > 0 ? tags : undefined,
    });

    if (result.success) {
      // Extract just the filename for display
      const filename = result.filePath!.split('/').pop();

      await telegram.send(
        chatId,
        `Saved to Obsidian folder.\n\n*File:* \`${filename}\`\n*Type:* ${lastResponse.type}\n*Tags:* ${tags.length > 0 ? tags.join(', ') : 'default'}`
      );

      // Clear the saved response so it can't be saved again
      state.clearLastResponse(String(chatId));
    } else {
      await telegram.send(
        chatId,
        `Failed to save: ${result.error}`
      );
    }
  } catch (error) {
    console.error('Save error:', error);
    await telegram.send(chatId, 'Failed to save. Please try again.');
  }
}

/**
 * Handle /saves - list recent saves
 */
export async function handleListSaves(
  message: TelegramMessage,
  _args: string,
  telegram: TelegramClient
): Promise<void> {
  const chatId = message.chat.id;

  try {
    const recentFiles = await writer.listRecent(10);

    if (recentFiles.length === 0) {
      await telegram.send(chatId, 'No saved files yet.');
      return;
    }

    let msg = '*Recent Saves:*\n\n';
    msg += recentFiles.map((f) => `• \`${f}\``).join('\n');
    msg += `\n\n*Location:* \`${writer.getSavesPath()}\``;

    await telegram.send(chatId, msg);
  } catch (error) {
    await telegram.send(chatId, 'Failed to list saves.');
  }
}

export default handleSave;
