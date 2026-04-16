/**
 * Save.ts - Save handler for PAI Discord Bot
 *
 * Saves the last response to Obsidian-compatible Markdown.
 */

import { DiscordClient, DiscordMessage } from '../lib/DiscordClient';
import { ConversationState } from '../../../TelegramBot/tools/lib/ConversationState';
import { ObsidianWriter } from '../../../TelegramBot/tools/lib/ObsidianWriter';

const writer = new ObsidianWriter();

export async function handleSave(
  message: DiscordMessage,
  args: string,
  discord: DiscordClient,
  state: ConversationState
): Promise<void> {
  const channelId = message.channel_id;
  const lastResponse = state.getLastResponse(channelId);

  if (!lastResponse) {
    await discord.send(channelId, 'Nothing to save.\n\nChat with me first, then use `!save` to save my response.');
    return;
  }

  const tags = args.trim().split(/[\s,]+/).filter((t) => t.length > 0);

  try {
    await discord.sendTyping(channelId);

    const result = await writer.save(lastResponse.content, {
      type: lastResponse.type,
      userQuery: lastResponse.userQuery,
      topic: lastResponse.topic,
      pattern: lastResponse.pattern,
      tags: tags.length > 0 ? tags : undefined,
    });

    if (result.success) {
      const filename = result.filePath!.split('/').pop();
      await discord.send(
        channelId,
        `Saved to Obsidian folder.\n\n**File:** \`${filename}\`\n**Type:** ${lastResponse.type}\n**Tags:** ${tags.length > 0 ? tags.join(', ') : 'default'}`
      );
      state.clearLastResponse(channelId);
    } else {
      await discord.send(channelId, `Failed to save: ${result.error}`);
    }
  } catch (error) {
    console.error('Save error:', error);
    await discord.send(channelId, 'Failed to save. Please try again.');
  }
}

export async function handleListSaves(
  message: DiscordMessage,
  _args: string,
  discord: DiscordClient
): Promise<void> {
  const channelId = message.channel_id;

  try {
    const recentFiles = await writer.listRecent(10);

    if (recentFiles.length === 0) {
      await discord.send(channelId, 'No saved files yet.');
      return;
    }

    let msg = '**Recent Saves:**\n\n';
    msg += recentFiles.map((f) => `- \`${f}\``).join('\n');
    msg += `\n\n**Location:** \`${writer.getSavesPath()}\``;

    await discord.send(channelId, msg);
  } catch {
    await discord.send(channelId, 'Failed to list saves.');
  }
}

export default handleSave;
