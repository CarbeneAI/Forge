/**
 * SemanticMemory - Shared Type Definitions
 *
 * All interfaces and types used across the SemanticMemory skill.
 */

// ─── Source Types ────────────────────────────────────────────────────────────

export type SourceType =
  | "session"
  | "learning"
  | "research"
  | "obsidian"
  | "memory"
  | "raw-output";

export interface SourceConfig {
  type: SourceType;
  path: string;
  glob: string;
}

// ─── Chunking ────────────────────────────────────────────────────────────────

export interface ChunkOptions {
  maxTokens?: number;
  overlapTokens?: number;
  minTokens?: number;
}

export interface Chunk {
  text: string;
  startLine: number;
  endLine: number;
  tokens: number;
}

// ─── Embedding ───────────────────────────────────────────────────────────────

export type EmbeddingProviderType = "gemini" | "openai";

export interface EmbeddingProvider {
  id: EmbeddingProviderType;
  model: string;
  dims: number;
  embedSingle(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}

export interface EmbeddingProviderConfig {
  primary: EmbeddingProviderType;
  fallback: EmbeddingProviderType | "none";
}

// ─── Database / Files ────────────────────────────────────────────────────────

export interface FileEntry {
  path: string;
  source: SourceType;
  size: number;
  mtime: number;
}

export interface FileRecord {
  path: string;
  source: SourceType;
  hash: string;
  mtime: number;
  size: number;
  chunk_count: number;
  indexed_at: number;
}

export interface ChunkRecord {
  id: string;
  path: string;
  source: SourceType;
  start_line: number;
  end_line: number;
  hash: string;
  text: string;
  model: string;
  provider: EmbeddingProviderType;
  tokens: number;
  updated_at: number;
}

export interface EmbeddingCacheRecord {
  provider: EmbeddingProviderType;
  model: string;
  text_hash: string;
  embedding: Uint8Array;
  dims: number;
  created_at: number;
}

// ─── Search ──────────────────────────────────────────────────────────────────

export interface SearchOptions {
  query: string;
  limit?: number;
  minScore?: number;
  sources?: SourceType[];
  vectorWeight?: number;
  textWeight?: number;
}

export interface SearchResult {
  chunkId: string;
  text: string;
  path: string;
  source: SourceType;
  startLine: number;
  endLine: number;
  vectorScore: number;
  textScore: number;
  combinedScore: number;
  snippet: string;
}

// ─── Index Manager ───────────────────────────────────────────────────────────

export interface IndexStats {
  filesScanned: number;
  filesChanged: number;
  filesDeleted: number;
  chunksCreated: number;
  chunksDeleted: number;
  embeddingsGenerated: number;
  embeddingsCached: number;
  durationMs: number;
}

export interface IndexStatus {
  totalFiles: number;
  totalChunks: number;
  totalEmbeddings: number;
  lastSync: number;
  dbSizeBytes: number;
  sources: Record<string, { files: number; chunks: number }>;
}

export interface SyncOptions {
  force?: boolean;
  sources?: SourceConfig[];
}

// ─── Token Usage Tracking ────────────────────────────────────────────────────

export interface TokenUsageEntry {
  timestamp: number;
  provider: EmbeddingProviderType;
  model: string;
  tokens: number;
  chunks: number;
  operation: "index" | "search";
}

export interface TokenUsageStats {
  totalTokens: number;
  totalCost: number; // USD
  byDay: Record<string, { tokens: number; cost: number; searches: number; indexOps: number }>;
  byProvider: Record<string, { tokens: number; cost: number }>;
  lastUpdated: number;
}

// ─── Configuration ───────────────────────────────────────────────────────────

export interface SemanticMemoryConfig {
  // Database
  dbPath: string;

  // Embedding
  primaryProvider: EmbeddingProviderType;
  fallbackProvider: EmbeddingProviderType | "none";
  embeddingModel: string;
  embeddingDims: number;

  // Chunking
  chunkMaxTokens: number;
  chunkOverlapTokens: number;
  chunkMinTokens: number;

  // Search
  defaultVectorWeight: number;
  defaultTextWeight: number;
  defaultLimit: number;
  defaultMinScore: number;

  // Indexing
  batchSize: number;
  concurrency: number;
  watcherEnabled: boolean;
  watcherDebounceMs: number;

  // Sources
  sources: SourceConfig[];

  // Cache
  embeddingCacheMaxDays: number;

  // API Keys (loaded from .env)
  googleApiKey: string;
  openaiApiKey: string;
}
