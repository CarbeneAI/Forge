/**
 * PerplexityClient.ts - Perplexity API wrapper for PAI Telegram Bot
 *
 * Handles:
 * - Perplexity Sonar API calls for research
 * - Both quick and deep research modes
 */

import { existsSync } from 'fs';
import { join } from 'path';

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
// Types
// ============================================================================

export interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface PerplexityResponse {
  id: string;
  model: string;
  object: string;
  created: number;
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  citations?: string[];
}

export type ResearchMode = 'quick' | 'deep';

// ============================================================================
// PerplexityClient Class
// ============================================================================

export class PerplexityClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.perplexity.ai';
  private quickModel: string = 'sonar';
  private deepModel: string = 'sonar-pro';

  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY || '';

    if (!this.apiKey) {
      throw new Error(
        'PERPLEXITY_API_KEY not found in environment. Add it to ~/.claude/.env'
      );
    }
  }

  /**
   * Research a topic using Perplexity
   */
  async research(
    topic: string,
    mode: ResearchMode = 'quick'
  ): Promise<{ content: string; citations: string[] }> {
    const systemPrompt = mode === 'deep'
      ? `You are a thorough research assistant. Provide comprehensive, well-organized research on the given topic. Include:
1. **Overview** - Brief introduction
2. **Key Findings** - Main points and facts
3. **Details** - In-depth information
4. **Sources** - Reference the sources you used
5. **Conclusions** - Summary and insights

Be thorough but organized. Use markdown formatting.`
      : `You are a quick research assistant. Provide a concise but informative summary on the given topic. Include key facts, main points, and relevant context. Be direct and informative.`;

    const messages: PerplexityMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: topic },
    ];

    const model = mode === 'deep' ? this.deepModel : this.quickModel;

    const response = await this.callApi(messages, model);

    return {
      content: response.choices[0]?.message?.content || 'No response generated.',
      citations: response.citations || [],
    };
  }

  /**
   * Generate blog post ideas based on research
   */
  async generateIdeas(topic: string): Promise<{ content: string; citations: string[] }> {
    const systemPrompt = `You are a creative blog strategist. Based on research about the given topic, generate blog post ideas.

For each idea, provide:
1. **Title** - Catchy, SEO-friendly title
2. **Hook** - One sentence that captures the reader's attention
3. **Key Points** - 3-4 bullet points of what the post would cover
4. **Target Audience** - Who would find this valuable
5. **Unique Angle** - What makes this perspective different

Generate 5-7 diverse blog post ideas. Focus on practical, actionable content that provides value.`;

    const messages: PerplexityMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Research this topic and generate blog post ideas: ${topic}` },
    ];

    const response = await this.callApi(messages, this.quickModel);

    return {
      content: response.choices[0]?.message?.content || 'No response generated.',
      citations: response.citations || [],
    };
  }

  /**
   * Call the Perplexity API
   */
  private async callApi(
    messages: PerplexityMessage[],
    model: string
  ): Promise<PerplexityResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 4096,
        return_citations: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Perplexity API error (${response.status}): ${error}`);
    }

    return response.json();
  }
}

export default PerplexityClient;
