/**
 * SemanticMemory - Configuration Loader
 *
 * Loads configuration from defaults -> config.json overrides -> env var overrides.
 * Reads API keys from PAI's .env file.
 */

import type { SemanticMemoryConfig, SourceConfig } from "./types.js";
import { readFileSync, existsSync } from "fs";

const PAI_DIR = process.env.PAI_DIR || `${process.env.HOME || "/home/youruser"}/.claude`;
const HOME = process.env.HOME || "/home/youruser";

const DEFAULT_SOURCES: SourceConfig[] = [
  { type: "session", path: `${PAI_DIR}/history/sessions`, glob: "**/*.md" },
  { type: "learning", path: `${PAI_DIR}/history/learnings`, glob: "**/*.md" },
  { type: "research", path: `${PAI_DIR}/history/research`, glob: "**/*.md" },
  {
    type: "obsidian",
    path: process.env.OBSIDIAN_VAULT_PATH || `${HOME}/Nextcloud/PAI/Obsidian`,
    glob: "**/*.md",
  },
  { type: "memory", path: `${PAI_DIR}/memory`, glob: "**/*.md" },
  {
    type: "raw-output",
    path: `${PAI_DIR}/history/raw-outputs`,
    glob: "**/*.jsonl",
  },
];

const DEFAULTS: SemanticMemoryConfig = {
  dbPath: `${PAI_DIR}/data/semantic-memory/memory.db`,
  primaryProvider: "gemini",
  fallbackProvider: "openai",
  embeddingModel: "gemini-embedding-001",
  embeddingDims: 768,
  chunkMaxTokens: 512,
  chunkOverlapTokens: 102,
  chunkMinTokens: 20,
  defaultVectorWeight: 0.7,
  defaultTextWeight: 0.3,
  defaultLimit: 10,
  defaultMinScore: 0.1,
  batchSize: 100,
  concurrency: 4,
  watcherEnabled: false,
  watcherDebounceMs: 60000,
  sources: DEFAULT_SOURCES,
  embeddingCacheMaxDays: 90,
  googleApiKey: "",
  openaiApiKey: "",
};

/**
 * Parse a dotenv-style file into key-value pairs.
 * Handles comments, empty lines, and quoted values.
 */
function parseDotEnv(content: string): Record<string, string> {
  const env: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    // Remove surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

/**
 * Load API keys from PAI's .env file.
 */
async function loadApiKeys(): Promise<{
  googleApiKey: string;
  openaiApiKey: string;
}> {
  const envPath = `${PAI_DIR}/.env`;
  try {
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, "utf-8");
      const env = parseDotEnv(content);
      return {
        googleApiKey: env["GOOGLE_API_KEY"] || "",
        openaiApiKey: env["OPENAI_API_KEY"] || "",
      };
    }
  } catch (err) {
    console.error(`[config] Failed to read .env at ${envPath}:`, err);
  }
  return { googleApiKey: "", openaiApiKey: "" };
}

/**
 * Load optional config.json overrides.
 */
async function loadConfigFile(): Promise<Partial<SemanticMemoryConfig>> {
  const configPath = `${PAI_DIR}/data/semantic-memory/config.json`;
  try {
    if (existsSync(configPath)) {
      const content = JSON.parse(readFileSync(configPath, "utf-8"));
      return content as Partial<SemanticMemoryConfig>;
    }
  } catch (err) {
    console.error(`[config] Failed to read config.json:`, err);
  }
  return {};
}

/**
 * Load environment variable overrides.
 * Convention: SM_ prefix (e.g., SM_PRIMARY_PROVIDER, SM_EMBEDDING_DIMS).
 */
function loadEnvOverrides(): Partial<SemanticMemoryConfig> {
  const overrides: Partial<SemanticMemoryConfig> = {};
  const env = process.env;

  if (env.SM_PRIMARY_PROVIDER) {
    const val = env.SM_PRIMARY_PROVIDER;
    if (val === "gemini" || val === "openai") overrides.primaryProvider = val;
  }
  if (env.SM_FALLBACK_PROVIDER) {
    const val = env.SM_FALLBACK_PROVIDER;
    if (val === "gemini" || val === "openai" || val === "none")
      overrides.fallbackProvider = val;
  }
  if (env.SM_EMBEDDING_MODEL) overrides.embeddingModel = env.SM_EMBEDDING_MODEL;
  if (env.SM_EMBEDDING_DIMS)
    overrides.embeddingDims = parseInt(env.SM_EMBEDDING_DIMS, 10);
  if (env.SM_CHUNK_MAX_TOKENS)
    overrides.chunkMaxTokens = parseInt(env.SM_CHUNK_MAX_TOKENS, 10);
  if (env.SM_CHUNK_OVERLAP_TOKENS)
    overrides.chunkOverlapTokens = parseInt(env.SM_CHUNK_OVERLAP_TOKENS, 10);
  if (env.SM_CHUNK_MIN_TOKENS)
    overrides.chunkMinTokens = parseInt(env.SM_CHUNK_MIN_TOKENS, 10);
  if (env.SM_VECTOR_WEIGHT)
    overrides.defaultVectorWeight = parseFloat(env.SM_VECTOR_WEIGHT);
  if (env.SM_TEXT_WEIGHT)
    overrides.defaultTextWeight = parseFloat(env.SM_TEXT_WEIGHT);
  if (env.SM_LIMIT) overrides.defaultLimit = parseInt(env.SM_LIMIT, 10);
  if (env.SM_MIN_SCORE)
    overrides.defaultMinScore = parseFloat(env.SM_MIN_SCORE);
  if (env.SM_BATCH_SIZE)
    overrides.batchSize = parseInt(env.SM_BATCH_SIZE, 10);
  if (env.SM_CONCURRENCY)
    overrides.concurrency = parseInt(env.SM_CONCURRENCY, 10);
  if (env.SM_DB_PATH) overrides.dbPath = env.SM_DB_PATH;

  // Also check direct API key env vars (higher priority than .env file)
  if (env.GOOGLE_API_KEY) overrides.googleApiKey = env.GOOGLE_API_KEY;
  if (env.OPENAI_API_KEY) overrides.openaiApiKey = env.OPENAI_API_KEY;

  return overrides;
}

/**
 * Validate configuration values.
 */
function validateConfig(config: SemanticMemoryConfig): void {
  if (config.embeddingDims <= 0) {
    throw new Error(`Invalid embeddingDims: ${config.embeddingDims}. Must be positive.`);
  }
  if (config.chunkMaxTokens <= 0) {
    throw new Error(`Invalid chunkMaxTokens: ${config.chunkMaxTokens}. Must be positive.`);
  }
  if (config.chunkOverlapTokens < 0) {
    throw new Error(`Invalid chunkOverlapTokens: ${config.chunkOverlapTokens}. Must be >= 0.`);
  }
  if (config.chunkOverlapTokens >= config.chunkMaxTokens) {
    throw new Error(
      `chunkOverlapTokens (${config.chunkOverlapTokens}) must be less than chunkMaxTokens (${config.chunkMaxTokens}).`
    );
  }
  if (config.defaultVectorWeight < 0 || config.defaultVectorWeight > 1) {
    throw new Error(`Invalid defaultVectorWeight: ${config.defaultVectorWeight}. Must be [0, 1].`);
  }
  if (config.defaultTextWeight < 0 || config.defaultTextWeight > 1) {
    throw new Error(`Invalid defaultTextWeight: ${config.defaultTextWeight}. Must be [0, 1].`);
  }
  if (config.batchSize <= 0 || config.batchSize > 100) {
    throw new Error(`Invalid batchSize: ${config.batchSize}. Must be [1, 100].`);
  }
  if (config.concurrency <= 0 || config.concurrency > 16) {
    throw new Error(`Invalid concurrency: ${config.concurrency}. Must be [1, 16].`);
  }
}

// Cached config singleton
let _config: SemanticMemoryConfig | null = null;

/**
 * Load the full configuration, merging defaults -> config.json -> env vars -> .env API keys.
 * Results are cached after first load.
 */
export async function loadConfig(): Promise<SemanticMemoryConfig> {
  if (_config) return _config;

  // Start with defaults
  const config = { ...DEFAULTS };

  // Layer 1: config.json overrides
  const fileOverrides = await loadConfigFile();
  Object.assign(config, fileOverrides);

  // Layer 2: environment variable overrides
  const envOverrides = loadEnvOverrides();
  Object.assign(config, envOverrides);

  // Layer 3: API keys from .env (only if not already set by env vars)
  if (!config.googleApiKey || !config.openaiApiKey) {
    const apiKeys = await loadApiKeys();
    if (!config.googleApiKey) config.googleApiKey = apiKeys.googleApiKey;
    if (!config.openaiApiKey) config.openaiApiKey = apiKeys.openaiApiKey;
  }

  // Validate
  validateConfig(config);

  _config = config;
  return config;
}

/**
 * Get the cached config. Throws if loadConfig() has not been called.
 */
export function getConfig(): SemanticMemoryConfig {
  if (!_config) {
    throw new Error(
      "Config not loaded. Call loadConfig() first."
    );
  }
  return _config;
}

/**
 * Reset the config cache (useful for testing).
 */
export function resetConfig(): void {
  _config = null;
}

export { PAI_DIR, HOME };
