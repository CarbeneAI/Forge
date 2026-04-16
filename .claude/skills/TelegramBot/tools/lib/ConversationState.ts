/**
 * ConversationState.ts - Track conversation state for PAI Telegram Bot
 *
 * Manages:
 * - Last response per chat (for /save command)
 * - Response metadata (type, topic, pattern)
 * - Conversation context
 */

// ============================================================================
// Types
// ============================================================================

export interface SavedResponse {
  content: string;
  type: 'chat' | 'research' | 'fabric';
  topic?: string;
  pattern?: string;
  timestamp: Date;
  userQuery: string;
}

export interface ChatState {
  lastResponse: SavedResponse | null;
  messageCount: number;
  startedAt: Date;
  lastActivityAt: Date;
}

// ============================================================================
// ConversationState Class
// ============================================================================

export class ConversationState {
  private states: Map<string, ChatState> = new Map();

  /**
   * Get or create state for a chat
   */
  private getState(chatId: string): ChatState {
    if (!this.states.has(chatId)) {
      this.states.set(chatId, {
        lastResponse: null,
        messageCount: 0,
        startedAt: new Date(),
        lastActivityAt: new Date(),
      });
    }
    return this.states.get(chatId)!;
  }

  /**
   * Record a response for potential saving
   */
  saveResponse(
    chatId: string,
    content: string,
    type: 'chat' | 'research' | 'fabric',
    userQuery: string,
    options?: { topic?: string; pattern?: string }
  ): void {
    const state = this.getState(chatId);
    state.lastResponse = {
      content,
      type,
      topic: options?.topic,
      pattern: options?.pattern,
      timestamp: new Date(),
      userQuery,
    };
    state.messageCount++;
    state.lastActivityAt = new Date();
  }

  /**
   * Get the last response for saving
   */
  getLastResponse(chatId: string): SavedResponse | null {
    return this.states.get(chatId)?.lastResponse || null;
  }

  /**
   * Clear the last response after saving
   */
  clearLastResponse(chatId: string): void {
    const state = this.states.get(chatId);
    if (state) {
      state.lastResponse = null;
    }
  }

  /**
   * Get statistics for a chat
   */
  getStats(chatId: string): {
    messageCount: number;
    sessionDuration: number;
    hasUnsavedResponse: boolean;
  } | null {
    const state = this.states.get(chatId);
    if (!state) return null;

    const duration = Math.floor(
      (new Date().getTime() - state.startedAt.getTime()) / 1000 / 60
    );

    return {
      messageCount: state.messageCount,
      sessionDuration: duration,
      hasUnsavedResponse: state.lastResponse !== null,
    };
  }

  /**
   * Increment message count
   */
  incrementMessageCount(chatId: string): void {
    const state = this.getState(chatId);
    state.messageCount++;
    state.lastActivityAt = new Date();
  }

  /**
   * Clear all state for a chat
   */
  clearState(chatId: string): void {
    this.states.delete(chatId);
  }

  /**
   * Get global statistics
   */
  getGlobalStats(): {
    activeChats: number;
    totalMessages: number;
    unsavedResponses: number;
  } {
    let totalMessages = 0;
    let unsavedResponses = 0;

    for (const state of this.states.values()) {
      totalMessages += state.messageCount;
      if (state.lastResponse) unsavedResponses++;
    }

    return {
      activeChats: this.states.size,
      totalMessages,
      unsavedResponses,
    };
  }
}

export default ConversationState;
