/**
 * SemanticMemory - OpenAI Embedding Provider
 *
 * Uses fetch() to call OpenAI REST API directly (no SDK dependency).
 * Model: text-embedding-3-small with configurable dimensions.
 * Retry with exponential backoff (3 retries).
 */

import type { EmbeddingProvider, EmbeddingProviderType } from "./types.js";
import { normalizeEmbedding } from "./embeddings.js";
import { logTokenUsage } from "./usage-tracker.js";

const BASE_URL = "https://api.openai.com/v1/embeddings";
const MODEL = "text-embedding-3-small";
const MAX_RETRIES = 3;
const RETRY_DELAYS = [500, 1000, 2000]; // ms

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  readonly id: EmbeddingProviderType = "openai";
  readonly model: string = MODEL;
  readonly dims: number;
  private apiKey: string;

  constructor(apiKey: string, dims: number = 768) {
    this.apiKey = apiKey;
    this.dims = dims;
  }

  /**
   * Execute a fetch with retry and exponential backoff.
   */
  private async fetchWithRetry(body: unknown): Promise<Response> {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(BASE_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        // If rate limited or server error, retry
        if (response.status === 429 || response.status >= 500) {
          if (attempt < MAX_RETRIES) {
            const delay = RETRY_DELAYS[attempt] || 2000;
            console.error(
              `[openai] HTTP ${response.status}. Retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})...`
            );
            await new Promise(r => setTimeout(r, delay));
            continue;
          }
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `OpenAI API error (${response.status}): ${errorText}`
          );
        }

        return response;
      } catch (err) {
        if (
          attempt < MAX_RETRIES &&
          err instanceof Error &&
          !err.message.includes("API error")
        ) {
          const delay = RETRY_DELAYS[attempt] || 2000;
          console.error(
            `[openai] Network error: ${err.message}. Retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})...`
          );
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        throw err;
      }
    }

    throw new Error("OpenAI: max retries exceeded");
  }

  /**
   * Embed a single text.
   */
  async embedSingle(text: string): Promise<number[]> {
    const results = await this.embedBatch([text]);
    return results[0];
  }

  /**
   * Embed a batch of texts.
   * OpenAI supports multiple inputs in a single request.
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const body = {
      model: this.model,
      input: texts,
      dimensions: this.dims,
    };

    const response = await this.fetchWithRetry(body);
    const data = (await response.json()) as {
      data: { embedding: number[]; index: number }[];
      usage?: { prompt_tokens: number; total_tokens: number };
    };

    if (!data.data || !Array.isArray(data.data)) {
      throw new Error(
        `OpenAI: unexpected response format: ${JSON.stringify(data).slice(0, 200)}`
      );
    }

    if (data.data.length !== texts.length) {
      throw new Error(
        `OpenAI: expected ${texts.length} embeddings, got ${data.data.length}`
      );
    }

    // Log token usage
    if (data.usage?.total_tokens) {
      logTokenUsage(
        this.id,
        this.model,
        data.usage.total_tokens,
        texts.length,
        texts.length === 1 ? "search" : "index"
      );
    }

    // Sort by index to ensure correct ordering
    const sorted = data.data.sort((a, b) => a.index - b.index);
    return sorted.map((item) => normalizeEmbedding(item.embedding));
  }
}
