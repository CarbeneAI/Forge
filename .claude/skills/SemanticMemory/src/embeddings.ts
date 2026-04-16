/**
 * SemanticMemory - Embedding Provider Interface and Factory
 *
 * Abstracts embedding generation behind a provider interface with automatic fallback.
 */

import type {
  EmbeddingProvider,
  EmbeddingProviderType,
  EmbeddingProviderConfig,
  SemanticMemoryConfig,
} from "./types.js";
import { GeminiEmbeddingProvider } from "./embeddings-gemini.js";
import { OpenAIEmbeddingProvider } from "./embeddings-openai.js";

/**
 * Normalize an embedding vector to unit length (L2 normalization).
 * Replaces non-finite values with 0.
 */
export function normalizeEmbedding(vec: number[]): number[] {
  // Replace non-finite values
  const cleaned = vec.map((v) => (Number.isFinite(v) ? v : 0));

  // Compute L2 norm
  let sumSq = 0;
  for (const v of cleaned) {
    sumSq += v * v;
  }
  const norm = Math.sqrt(sumSq);

  // Return unchanged if zero magnitude (avoid divide by zero)
  if (norm === 0) return cleaned;

  // Normalize
  return cleaned.map((v) => v / norm);
}

/**
 * Create an embedding provider instance by type.
 */
function createProviderInstance(
  type: EmbeddingProviderType,
  config: SemanticMemoryConfig
): EmbeddingProvider {
  switch (type) {
    case "gemini":
      if (!config.googleApiKey) {
        throw new Error(
          "GOOGLE_API_KEY is required for Gemini embedding provider. " +
            "Set it in ${PAI_DIR}/.env or GOOGLE_API_KEY environment variable."
        );
      }
      return new GeminiEmbeddingProvider(
        config.googleApiKey,
        config.embeddingModel,
        config.embeddingDims
      );
    case "openai":
      if (!config.openaiApiKey) {
        throw new Error(
          "OPENAI_API_KEY is required for OpenAI embedding provider. " +
            "Set it in ${PAI_DIR}/.env or OPENAI_API_KEY environment variable."
        );
      }
      return new OpenAIEmbeddingProvider(
        config.openaiApiKey,
        config.embeddingDims
      );
    default:
      throw new Error(`Unknown embedding provider: ${type}`);
  }
}

/**
 * Create an embedding provider with automatic fallback.
 *
 * If the primary provider fails 2 consecutive times, switches to the fallback.
 * Returns a wrapped provider that handles the fallback logic transparently.
 */
export function createEmbeddingProvider(
  config: SemanticMemoryConfig
): EmbeddingProvider {
  const providerConfig: EmbeddingProviderConfig = {
    primary: config.primaryProvider,
    fallback: config.fallbackProvider,
  };

  const primary = createProviderInstance(providerConfig.primary, config);

  // If no fallback, return primary directly
  if (providerConfig.fallback === "none") {
    return primary;
  }

  let fallback: EmbeddingProvider | null = null;
  try {
    fallback = createProviderInstance(
      providerConfig.fallback as EmbeddingProviderType,
      config
    );
  } catch (err) {
    console.error(
      `[embeddings] Fallback provider (${providerConfig.fallback}) not available: ${err}. Using primary only.`
    );
    return primary;
  }

  // Wrap with fallback logic
  let consecutiveFailures = 0;
  let usingFallback = false;
  const FAILURE_THRESHOLD = 2;

  const getActive = (): EmbeddingProvider => {
    return usingFallback && fallback ? fallback : primary;
  };

  const handleSuccess = (): void => {
    consecutiveFailures = 0;
  };

  const handleFailure = (err: unknown): void => {
    consecutiveFailures++;
    if (consecutiveFailures >= FAILURE_THRESHOLD && !usingFallback && fallback) {
      console.error(
        `[embeddings] Primary provider (${providerConfig.primary}) failed ${consecutiveFailures} consecutive times. ` +
          `Switching to fallback (${providerConfig.fallback}).`
      );
      usingFallback = true;
      consecutiveFailures = 0;
    }
  };

  const wrappedProvider: EmbeddingProvider = {
    get id() {
      return getActive().id;
    },
    get model() {
      return getActive().model;
    },
    get dims() {
      return getActive().dims;
    },

    async embedSingle(text: string): Promise<number[]> {
      try {
        const result = await getActive().embedSingle(text);
        handleSuccess();
        return result;
      } catch (err) {
        handleFailure(err);
        // If we just switched to fallback, retry with fallback
        if (usingFallback && fallback) {
          try {
            const result = await fallback.embedSingle(text);
            handleSuccess();
            return result;
          } catch (fallbackErr) {
            handleFailure(fallbackErr);
            throw fallbackErr;
          }
        }
        throw err;
      }
    },

    async embedBatch(texts: string[]): Promise<number[][]> {
      try {
        const result = await getActive().embedBatch(texts);
        handleSuccess();
        return result;
      } catch (err) {
        handleFailure(err);
        // If we just switched to fallback, retry with fallback
        if (usingFallback && fallback) {
          try {
            const result = await fallback.embedBatch(texts);
            handleSuccess();
            return result;
          } catch (fallbackErr) {
            handleFailure(fallbackErr);
            throw fallbackErr;
          }
        }
        throw err;
      }
    },
  };

  return wrappedProvider;
}
