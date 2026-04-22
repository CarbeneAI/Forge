/**
 * SemanticMemory - Gemini Embedding Provider
 *
 * Uses fetch() to call Gemini REST API directly (no SDK dependency).
 * Rate limiting at 90 RPM with sliding window.
 * Retry with exponential backoff (3 retries).
 */

import type { EmbeddingProvider, EmbeddingProviderType } from "./types.js";
import { normalizeEmbedding } from "./embeddings.js";

const BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";
const MAX_RPM = 90; // Stay under 100 RPM free tier
const MAX_RETRIES = 3;
const RETRY_DELAYS = [500, 1000, 2000]; // ms

export class GeminiEmbeddingProvider implements EmbeddingProvider {
  readonly id: EmbeddingProviderType = "gemini";
  readonly model: string;
  readonly dims: number;
  private apiKey: string;

  // Sliding window rate limiter: timestamps of recent requests
  private requestTimestamps: number[] = [];

  constructor(apiKey: string, model: string = "gemini-embedding-001", dims: number = 768) {
    this.apiKey = apiKey;
    this.model = model;
    this.dims = dims;
  }

  /**
   * Wait if we're approaching the rate limit.
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const windowStart = now - 60_000; // 1 minute window

    // Remove timestamps older than the window
    this.requestTimestamps = this.requestTimestamps.filter(
      (t) => t > windowStart
    );

    // If at or above limit, wait until the oldest request exits the window
    if (this.requestTimestamps.length >= MAX_RPM) {
      const oldestInWindow = this.requestTimestamps[0];
      const waitMs = oldestInWindow + 60_000 - now + 100; // +100ms buffer
      if (waitMs > 0) {
        console.error(
          `[gemini] Rate limit approaching (${this.requestTimestamps.length}/${MAX_RPM} RPM). Waiting ${waitMs}ms...`
        );
        await new Promise(r => setTimeout(r, waitMs));
      }
    }

    this.requestTimestamps.push(Date.now());
  }

  /**
   * Execute a fetch with retry and exponential backoff.
   */
  private async fetchWithRetry(
    url: string,
    body: unknown,
    retries: number = MAX_RETRIES
  ): Promise<Response> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      await this.enforceRateLimit();

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        // If rate limited or server error, retry
        if (response.status === 429 || response.status >= 500) {
          if (attempt < retries) {
            const delay = RETRY_DELAYS[attempt] || 2000;
            console.error(
              `[gemini] HTTP ${response.status}. Retrying in ${delay}ms (attempt ${attempt + 1}/${retries})...`
            );
            await new Promise(r => setTimeout(r, delay));
            continue;
          }
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Gemini API error (${response.status}): ${errorText}`
          );
        }

        return response;
      } catch (err) {
        if (
          attempt < retries &&
          err instanceof Error &&
          !err.message.includes("API error")
        ) {
          const delay = RETRY_DELAYS[attempt] || 2000;
          console.error(
            `[gemini] Network error: ${err.message}. Retrying in ${delay}ms (attempt ${attempt + 1}/${retries})...`
          );
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        throw err;
      }
    }

    throw new Error("Gemini: max retries exceeded");
  }

  /**
   * Embed a single text.
   */
  async embedSingle(text: string): Promise<number[]> {
    const url = `${BASE_URL}/${this.model}:embedContent?key=${this.apiKey}`;
    const body = {
      model: `models/${this.model}`,
      content: { parts: [{ text }] },
      outputDimensionality: this.dims,
    };

    const response = await this.fetchWithRetry(url, body);
    const data = (await response.json()) as {
      embedding: { values: number[] };
    };

    if (!data.embedding?.values) {
      throw new Error(
        `Gemini: unexpected response format: ${JSON.stringify(data).slice(0, 200)}`
      );
    }

    const embedding = data.embedding.values;
    if (embedding.length !== this.dims) {
      console.error(
        `[gemini] Warning: expected ${this.dims} dims, got ${embedding.length}`
      );
    }

    return normalizeEmbedding(embedding);
  }

  /**
   * Embed a batch of texts (up to 100 per API call).
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    if (texts.length === 1) return [await this.embedSingle(texts[0])];

    // Gemini batch API supports up to 100 requests
    const batchSize = 100;
    const results: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const url = `${BASE_URL}/${this.model}:batchEmbedContents?key=${this.apiKey}`;
      const body = {
        requests: batch.map((text) => ({
          model: `models/${this.model}`,
          content: { parts: [{ text }] },
          outputDimensionality: this.dims,
        })),
      };

      const response = await this.fetchWithRetry(url, body);
      const data = (await response.json()) as {
        embeddings: { values: number[] }[];
      };

      if (!data.embeddings || !Array.isArray(data.embeddings)) {
        throw new Error(
          `Gemini batch: unexpected response format: ${JSON.stringify(data).slice(0, 200)}`
        );
      }

      if (data.embeddings.length !== batch.length) {
        throw new Error(
          `Gemini batch: expected ${batch.length} embeddings, got ${data.embeddings.length}`
        );
      }

      for (const emb of data.embeddings) {
        results.push(normalizeEmbedding(emb.values));
      }
    }

    return results;
  }
}
