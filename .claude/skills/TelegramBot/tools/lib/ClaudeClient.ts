/**
 * AIClient.ts - OpenAI GPT API wrapper for PAI Telegram Bot
 *
 * Handles:
 * - Direct OpenAI API calls with PAI system context
 * - Conversation history management per chat
 * - Token usage tracking
 * - Research and Fabric pattern modes
 */

import { existsSync } from 'fs';
import { join } from 'path';

// ============================================================================
// Types
// ============================================================================

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export type ConversationMode = 'chat' | 'research' | 'fabric';

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
// System Prompts
// ============================================================================

const CHAT_SYSTEM_PROMPT = `You are PAI (Personal AI Infrastructure), a helpful AI assistant accessed via Telegram.

## Guidelines
- Be concise and direct - Telegram messages should be easy to read on mobile
- Use Markdown formatting sparingly (bold for emphasis, code blocks for code)
- Keep responses under 2000 characters when possible
- If a response would be long, summarize key points and offer to provide details

## Capabilities
- General conversation and questions
- Code help and explanations
- Writing assistance
- Analysis and research
- Creative tasks

## Saving Content
When users ask to "save this", "save to Obsidian", "save to scratchpad", or similar:
- Tell them to use the \`/save\` command to save the last response
- Example: "Use \`/save\` to save this response to your Obsidian vault!"
- They can add tags: \`/save tag1 tag2\`
- Files are saved to ~/Nextcloud/PAI/telegram-saves/ and sync to Obsidian

## Available Commands
- \`/save [tags]\` - Save last response to Obsidian
- \`/saves\` - List recent saved files
- \`/research <topic>\` - Deep research on a topic
- \`/fabric <pattern> <content>\` - Apply Fabric AI patterns
- \`/clear\` - Clear conversation history
- \`/help\` - Show all commands

## Context
You're running as part of PAI, a personal AI infrastructure system. The user can access you anytime via their phone through Telegram. Responses are automatically tracked and can be saved with /save.

Be helpful, accurate, and personable.`;

const RESEARCH_SYSTEM_PROMPT = `You are PAI Research Agent, a specialized research assistant accessed via Telegram.

## Your Task
Conduct thorough research on the given topic and provide:
1. **Summary** - Key findings in 2-3 sentences
2. **Key Points** - 5-7 bullet points of important information
3. **Sources** - Mention where this information typically comes from
4. **Confidence** - Your confidence level (high/medium/low) and any caveats

## Guidelines
- Be comprehensive but concise
- Distinguish between facts and opinions
- Note when information may be outdated
- Suggest follow-up questions if relevant

## Format for Telegram
- Use clear headers and bullet points
- Keep total response under 3000 characters
- Focus on actionable insights`;

// ============================================================================
// ClaudeClient Class (now using OpenAI)
// ============================================================================

export class ClaudeClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.openai.com/v1';
  private model: string = 'gpt-4o'; // Using GPT-4o (latest available)
  private conversationHistory: Map<string, Message[]> = new Map();
  private maxHistoryLength: number = 20; // Keep last 20 messages

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';

    if (!this.apiKey) {
      throw new Error(
        'OPENAI_API_KEY not found in environment. Add it to ~/.claude/.env'
      );
    }
  }

  /**
   * Send a chat message and get a response
   */
  async chat(
    chatId: string,
    userMessage: string,
    mode: ConversationMode = 'chat',
    customSystemPrompt?: string
  ): Promise<string> {
    // Get or create conversation history
    const history = this.getHistory(chatId);

    // Add user message to history
    history.push({ role: 'user', content: userMessage });

    // Select system prompt based on mode (custom overrides all)
    const systemPrompt = customSystemPrompt || (mode === 'research' ? RESEARCH_SYSTEM_PROMPT : CHAT_SYSTEM_PROMPT);

    try {
      const response = await this.callApi(systemPrompt, history);

      // Extract text from response
      const assistantMessage =
        response.choices[0]?.message?.content || 'No response generated.';

      // Add assistant response to history
      history.push({ role: 'assistant', content: assistantMessage });

      // Trim history if too long
      this.trimHistory(chatId);

      return assistantMessage;
    } catch (error) {
      // Remove the failed user message from history
      history.pop();
      throw error;
    }
  }

  /**
   * Apply a Fabric pattern to content
   */
  async applyPattern(patternPrompt: string, content: string): Promise<string> {
    // Fabric patterns don't use conversation history
    const messages: Message[] = [{ role: 'user', content }];

    const response = await this.callApi(patternPrompt, messages);

    return response.choices[0]?.message?.content || 'No response generated.';
  }

  /**
   * Clear conversation history for a chat
   */
  clearHistory(chatId: string): void {
    this.conversationHistory.delete(chatId);
  }

  /**
   * Get conversation history
   */
  private getHistory(chatId: string): Message[] {
    if (!this.conversationHistory.has(chatId)) {
      this.conversationHistory.set(chatId, []);
    }
    return this.conversationHistory.get(chatId)!;
  }

  /**
   * Trim history to max length
   */
  private trimHistory(chatId: string): void {
    const history = this.conversationHistory.get(chatId);
    if (history && history.length > this.maxHistoryLength) {
      // Keep the most recent messages
      const trimmed = history.slice(-this.maxHistoryLength);
      this.conversationHistory.set(chatId, trimmed);
    }
  }

  /**
   * Call the OpenAI API
   */
  private async callApi(systemPrompt: string, messages: Message[]): Promise<OpenAIResponse> {
    // Build messages array with system prompt first
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 4096,
        messages: apiMessages,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${error}`);
    }

    return response.json();
  }

  /**
   * Get the last assistant response for a chat
   */
  getLastResponse(chatId: string): string | null {
    const history = this.conversationHistory.get(chatId);
    if (!history) return null;

    // Find the last assistant message
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].role === 'assistant') {
        return history[i].content;
      }
    }
    return null;
  }

  /**
   * Get usage stats (for monitoring)
   */
  getStats(): { activeConversations: number; totalMessages: number } {
    let totalMessages = 0;
    for (const history of this.conversationHistory.values()) {
      totalMessages += history.length;
    }
    return {
      activeConversations: this.conversationHistory.size,
      totalMessages,
    };
  }
}

export default ClaudeClient;
