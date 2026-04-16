/**
 * SemanticMemory - Index Manager
 *
 * Orchestrates file discovery, change detection, chunking, embedding, and database storage.
 * Hash-based change detection, embedding cache, batch embedding, concurrent file processing.
 */

import { existsSync, statSync, readdirSync } from "fs";
import { join, resolve } from "path";
import { getDb, initDb, runInTransaction, setMetaValue } from "./db.js";
import { loadConfig } from "./config.js";
import { createEmbeddingProvider, normalizeEmbedding } from "./embeddings.js";
import { chunkMarkdown, chunkJsonl, estimateTokens } from "./chunker.js";
import type {
  SourceConfig,
  FileEntry,
  IndexStats,
  IndexStatus,
  SyncOptions,
  EmbeddingProvider,
  SemanticMemoryConfig,
  Chunk,
} from "./types.js";

// Sensitive file patterns to skip
const SENSITIVE_PATTERNS = [/\.env$/, /\.key$/, /\.pem$/, /credentials/i];
const SENSITIVE_CONTENT_MARKERS = [
  "API_KEY=",
  "SECRET=",
  "PASSWORD=",
  "TOKEN=",
  "PRIVATE_KEY",
];

/**
 * Check if a file should be skipped due to sensitive content.
 */
function isSensitiveFile(path: string): boolean {
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(path)) return true;
  }
  return false;
}

/**
 * Check first 5 lines for sensitive content markers.
 */
async function hasSensitiveContent(content: string): Promise<boolean> {
  const firstLines = content.split("\n").slice(0, 5).join("\n");
  return SENSITIVE_CONTENT_MARKERS.some((marker) =>
    firstLines.includes(marker)
  );
}

/**
 * Discover all indexable files from configured source directories.
 */
export async function discoverFiles(
  sources: SourceConfig[]
): Promise<FileEntry[]> {
  const files: FileEntry[] = [];

  for (const source of sources) {
    if (!existsSync(source.path)) {
      console.error(
        `[index-manager] Source directory does not exist: ${source.path}`
      );
      continue;
    }

    try {
      const glob = new Bun.Glob(source.glob);
      const matches = glob.scanSync({
        cwd: source.path,
        absolute: false,
        onlyFiles: true,
      });

      for (const match of matches) {
        const fullPath = resolve(join(source.path, match));

        // Skip sensitive files
        if (isSensitiveFile(fullPath)) continue;

        try {
          const stat = statSync(fullPath);
          // Skip files > 10MB
          if (stat.size > 10 * 1024 * 1024) {
            console.error(
              `[index-manager] Skipping large file (${(stat.size / 1024 / 1024).toFixed(1)}MB): ${fullPath}`
            );
            continue;
          }

          files.push({
            path: fullPath,
            source: source.type,
            size: stat.size,
            mtime: stat.mtimeMs,
          });
        } catch (err) {
          console.error(
            `[index-manager] Cannot stat file ${fullPath}: ${err}`
          );
        }
      }
    } catch (err) {
      console.error(
        `[index-manager] Error scanning ${source.path}: ${err}`
      );
    }
  }

  return files;
}

/**
 * Compute SHA-256 hash of file content.
 */
export async function computeFileHash(path: string): Promise<string> {
  const content = await Bun.file(path).arrayBuffer();
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(new Uint8Array(content));
  return hasher.digest("hex");
}

/**
 * Compute SHA-256 hash of a text string.
 */
function computeTextHash(text: string): string {
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(text);
  return hasher.digest("hex");
}

/**
 * Generate a deterministic chunk ID.
 * SHA-256(path + start_line + end_line + contentHash)
 */
function generateChunkId(
  path: string,
  startLine: number,
  endLine: number,
  contentHash: string
): string {
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(`${path}:${startLine}:${endLine}:${contentHash}`);
  return hasher.digest("hex");
}

/**
 * Convert a Float32Array to a Uint8Array (raw bytes) for blob storage.
 */
function float32ToBlob(arr: number[]): Uint8Array {
  const f32 = new Float32Array(arr);
  return new Uint8Array(f32.buffer);
}

/**
 * Convert a blob (Uint8Array) back to a number array.
 */
function blobToFloat32(blob: Uint8Array | Buffer): number[] {
  const buffer = blob instanceof Buffer ? new Uint8Array(blob) : blob;
  const f32 = new Float32Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / 4);
  return Array.from(f32);
}

/**
 * Check the embedding cache for a cached embedding.
 */
function getCachedEmbedding(
  db: ReturnType<typeof getDb>,
  provider: string,
  model: string,
  textHash: string
): number[] | null {
  const row = db
    .prepare(
      "SELECT embedding, dims FROM embedding_cache WHERE provider = ? AND model = ? AND text_hash = ?"
    )
    .get(provider, model, textHash) as
    | { embedding: Uint8Array; dims: number }
    | null;

  if (!row) return null;
  return blobToFloat32(row.embedding);
}

/**
 * Store an embedding in the cache.
 */
function cacheEmbedding(
  db: ReturnType<typeof getDb>,
  provider: string,
  model: string,
  textHash: string,
  embedding: number[],
  dims: number
): void {
  db.prepare(
    "INSERT OR REPLACE INTO embedding_cache (provider, model, text_hash, embedding, dims, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(provider, model, textHash, float32ToBlob(embedding), dims, Date.now());
}

/**
 * Process a single file: read, chunk, and return chunks with metadata.
 */
async function processFile(
  file: FileEntry,
  config: SemanticMemoryConfig
): Promise<{ chunks: Chunk[]; hash: string } | null> {
  try {
    const content = await Bun.file(file.path).text();

    // Check for sensitive content
    if (await hasSensitiveContent(content)) {
      console.error(
        `[index-manager] Skipping file with sensitive content: ${file.path}`
      );
      return null;
    }

    const hash = computeTextHash(content);

    // Choose chunker based on file type
    const chunkOptions = {
      maxTokens: config.chunkMaxTokens,
      overlapTokens: config.chunkOverlapTokens,
      minTokens: config.chunkMinTokens,
    };

    const chunks = file.path.endsWith(".jsonl")
      ? chunkJsonl(content, chunkOptions)
      : chunkMarkdown(content, chunkOptions);

    return { chunks, hash };
  } catch (err) {
    console.error(
      `[index-manager] Error processing file ${file.path}: ${err}`
    );
    return null;
  }
}

/**
 * Main sync function - discovers, hashes, chunks, embeds, stores.
 */
export async function syncIndex(options?: SyncOptions): Promise<IndexStats> {
  const startTime = Date.now();
  const config = await loadConfig();
  const { db } = await initDb(config);
  const provider = createEmbeddingProvider(config);

  const stats: IndexStats = {
    filesScanned: 0,
    filesChanged: 0,
    filesDeleted: 0,
    chunksCreated: 0,
    chunksDeleted: 0,
    embeddingsGenerated: 0,
    embeddingsCached: 0,
    durationMs: 0,
  };

  // Determine which sources to scan
  const sources = options?.sources || config.sources;

  // Discover all files
  const discoveredFiles = await discoverFiles(sources);
  stats.filesScanned = discoveredFiles.length;

  // Get existing file records from DB
  const existingFiles = new Map<
    string,
    { hash: string; source: string }
  >();
  const rows = db
    .prepare("SELECT path, hash, source FROM files")
    .all() as { path: string; hash: string; source: string }[];
  for (const row of rows) {
    existingFiles.set(row.path, { hash: row.hash, source: row.source });
  }

  // Identify new, changed, and deleted files
  const discoveredPaths = new Set(discoveredFiles.map((f) => f.path));

  // Find deleted files (in DB but not on disk)
  const deletedPaths: string[] = [];
  for (const [path] of existingFiles) {
    if (!discoveredPaths.has(path)) {
      deletedPaths.push(path);
    }
  }

  // Remove deleted files
  if (deletedPaths.length > 0) {
    runInTransaction(() => {
      for (const path of deletedPaths) {
        // Get chunk IDs for this file
        const chunkIds = db
          .prepare("SELECT id FROM chunks WHERE path = ?")
          .all(path) as { id: string }[];

        // Delete from vec and fts tables
        for (const { id } of chunkIds) {
          db.prepare("DELETE FROM chunks_vec WHERE chunk_id = ?").run(id);
          db.prepare("DELETE FROM chunks_fts WHERE chunk_id = ?").run(id);
        }

        // Delete chunks and file record
        const deleted = db.prepare("DELETE FROM chunks WHERE path = ?").run(path);
        stats.chunksDeleted += deleted.changes;
        db.prepare("DELETE FROM files WHERE path = ?").run(path);
        stats.filesDeleted++;
      }
    });
  }

  // Filter to new/changed files
  const filesToProcess: FileEntry[] = [];
  for (const file of discoveredFiles) {
    if (options?.force) {
      filesToProcess.push(file);
      continue;
    }

    const existing = existingFiles.get(file.path);
    if (!existing) {
      // New file
      filesToProcess.push(file);
    } else {
      // Check hash
      const hash = await computeFileHash(file.path);
      if (hash !== existing.hash) {
        filesToProcess.push(file);
      }
    }
  }

  stats.filesChanged = filesToProcess.length;

  if (filesToProcess.length === 0) {
    stats.durationMs = Date.now() - startTime;
    setMetaValue("last_full_sync", String(Date.now()));
    return stats;
  }

  // Process files with concurrency limit
  const concurrency = config.concurrency;
  const allChunksToEmbed: {
    chunkId: string;
    text: string;
    textHash: string;
    path: string;
    source: string;
    startLine: number;
    endLine: number;
    tokens: number;
    fileHash: string;
  }[] = [];

  // Process files in batches of `concurrency`
  for (let i = 0; i < filesToProcess.length; i += concurrency) {
    const batch = filesToProcess.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map((file) => processFile(file, config))
    );

    for (let j = 0; j < batch.length; j++) {
      const file = batch[j];
      const result = results[j];
      if (!result) continue;

      const { chunks, hash } = result;

      // Remove old chunks for this file
      runInTransaction(() => {
        const oldChunks = db
          .prepare("SELECT id FROM chunks WHERE path = ?")
          .all(file.path) as { id: string }[];
        for (const { id } of oldChunks) {
          db.prepare("DELETE FROM chunks_vec WHERE chunk_id = ?").run(id);
          db.prepare("DELETE FROM chunks_fts WHERE chunk_id = ?").run(id);
        }
        const deleted = db
          .prepare("DELETE FROM chunks WHERE path = ?")
          .run(file.path);
        stats.chunksDeleted += deleted.changes;
      });

      // Prepare chunks for embedding
      for (const chunk of chunks) {
        const textHash = computeTextHash(chunk.text);
        const chunkId = generateChunkId(
          file.path,
          chunk.startLine,
          chunk.endLine,
          textHash
        );

        allChunksToEmbed.push({
          chunkId,
          text: chunk.text,
          textHash,
          path: file.path,
          source: file.source,
          startLine: chunk.startLine,
          endLine: chunk.endLine,
          tokens: chunk.tokens,
          fileHash: hash,
        });
      }

      // Update/insert file record
      db.prepare(
        `INSERT OR REPLACE INTO files (path, source, hash, mtime, size, chunk_count, indexed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(
        file.path,
        file.source,
        hash,
        Math.floor(file.mtime),
        file.size,
        chunks.length,
        Date.now()
      );
    }

    console.error(
      `[index-manager] Processed ${Math.min(i + concurrency, filesToProcess.length)}/${filesToProcess.length} files...`
    );
  }

  // Embed chunks in batches
  if (allChunksToEmbed.length > 0) {
    console.error(
      `[index-manager] Embedding ${allChunksToEmbed.length} chunks...`
    );

    // First, check cache for all chunks
    const uncachedIndices: number[] = [];
    const embeddings: (number[] | null)[] = new Array(
      allChunksToEmbed.length
    ).fill(null);

    for (let i = 0; i < allChunksToEmbed.length; i++) {
      const chunk = allChunksToEmbed[i];
      const cached = getCachedEmbedding(
        db,
        provider.id,
        provider.model,
        chunk.textHash
      );
      if (cached) {
        embeddings[i] = cached;
        stats.embeddingsCached++;
      } else {
        uncachedIndices.push(i);
      }
    }

    // Embed uncached chunks in batches
    if (uncachedIndices.length > 0) {
      console.error(
        `[index-manager] ${stats.embeddingsCached} cached, ${uncachedIndices.length} need embedding...`
      );

      for (let i = 0; i < uncachedIndices.length; i += config.batchSize) {
        const batchIndices = uncachedIndices.slice(i, i + config.batchSize);
        const batchTexts = batchIndices.map(
          (idx) => allChunksToEmbed[idx].text
        );

        try {
          const batchEmbeddings = await provider.embedBatch(batchTexts);

          for (let j = 0; j < batchIndices.length; j++) {
            const idx = batchIndices[j];
            embeddings[idx] = batchEmbeddings[j];
            stats.embeddingsGenerated++;

            // Cache the embedding
            cacheEmbedding(
              db,
              provider.id,
              provider.model,
              allChunksToEmbed[idx].textHash,
              batchEmbeddings[j],
              provider.dims
            );
          }
        } catch (err) {
          console.error(
            `[index-manager] Embedding batch failed: ${err}. Skipping ${batchIndices.length} chunks.`
          );
        }

        console.error(
          `[index-manager] Embedded ${Math.min(i + config.batchSize, uncachedIndices.length)}/${uncachedIndices.length} chunks...`
        );
      }
    }

    // Store all chunks with embeddings in the database
    runInTransaction(() => {
      const insertChunk = db.prepare(
        `INSERT OR REPLACE INTO chunks (id, path, source, start_line, end_line, hash, text, model, provider, tokens, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      const insertVec = db.prepare(
        `INSERT INTO chunks_vec (chunk_id, embedding) VALUES (?, ?)`
      );
      const insertFts = db.prepare(
        `INSERT INTO chunks_fts (text, chunk_id, path, source, start_line, end_line)
         VALUES (?, ?, ?, ?, ?, ?)`
      );

      for (let i = 0; i < allChunksToEmbed.length; i++) {
        const chunk = allChunksToEmbed[i];
        const embedding = embeddings[i];

        if (!embedding) continue; // Skip if embedding failed

        // Insert into chunks table
        insertChunk.run(
          chunk.chunkId,
          chunk.path,
          chunk.source,
          chunk.startLine,
          chunk.endLine,
          chunk.textHash,
          chunk.text,
          provider.model,
          provider.id,
          chunk.tokens,
          Date.now()
        );

        // Insert into vec0 table
        const embeddingBlob = new Float32Array(embedding);
        insertVec.run(chunk.chunkId, embeddingBlob);

        // Insert into FTS5 table
        insertFts.run(
          chunk.text,
          chunk.chunkId,
          chunk.path,
          chunk.source,
          chunk.startLine,
          chunk.endLine
        );

        stats.chunksCreated++;
      }
    });
  }

  stats.durationMs = Date.now() - startTime;
  setMetaValue("last_full_sync", String(Date.now()));

  console.error(
    `[index-manager] Sync complete: ${stats.filesChanged} files, ${stats.chunksCreated} chunks, ` +
      `${stats.embeddingsGenerated} embeddings generated, ${stats.embeddingsCached} cached ` +
      `(${(stats.durationMs / 1000).toFixed(1)}s)`
  );

  return stats;
}

/**
 * Full reindex: drop all data and rebuild from scratch.
 */
export async function fullReindex(): Promise<IndexStats> {
  const { db } = await initDb();

  console.error("[index-manager] Starting full reindex...");

  // Clear all data
  runInTransaction(() => {
    db.exec("DELETE FROM chunks_fts");
    db.exec("DELETE FROM chunks_vec");
    db.exec("DELETE FROM chunks");
    db.exec("DELETE FROM files");
    db.exec("DELETE FROM embedding_cache");
  });

  // Rebuild
  return syncIndex({ force: true });
}

/**
 * Get index status: counts from all tables.
 */
export async function getIndexStatus(): Promise<IndexStatus> {
  const config = await loadConfig();
  const { db } = await initDb(config);

  const totalFiles =
    (db.prepare("SELECT COUNT(*) as count FROM files").get() as { count: number })
      .count;
  const totalChunks =
    (
      db.prepare("SELECT COUNT(*) as count FROM chunks").get() as {
        count: number;
      }
    ).count;

  // vec0 tables may not support COUNT(*) directly in all versions
  let totalEmbeddings = 0;
  try {
    totalEmbeddings = (
      db.prepare("SELECT COUNT(*) as count FROM chunks_vec").get() as {
        count: number;
      }
    ).count;
  } catch {
    totalEmbeddings = totalChunks; // Approximate
  }

  const lastSyncStr =
    (
      db
        .prepare("SELECT value FROM meta WHERE key = 'last_full_sync'")
        .get() as { value: string } | null
    )?.value || "0";
  const lastSync = parseInt(lastSyncStr, 10);

  // DB file size
  let dbSizeBytes = 0;
  try {
    const stat = statSync(config.dbPath);
    dbSizeBytes = stat.size;
  } catch {
    // ignore
  }

  // Source breakdown
  const sourceRows = db
    .prepare(
      "SELECT source, COUNT(*) as file_count FROM files GROUP BY source"
    )
    .all() as { source: string; file_count: number }[];
  const chunkRows = db
    .prepare(
      "SELECT source, COUNT(*) as chunk_count FROM chunks GROUP BY source"
    )
    .all() as { source: string; chunk_count: number }[];

  const sources: Record<string, { files: number; chunks: number }> = {};
  for (const row of sourceRows) {
    sources[row.source] = { files: row.file_count, chunks: 0 };
  }
  for (const row of chunkRows) {
    if (!sources[row.source]) {
      sources[row.source] = { files: 0, chunks: row.chunk_count };
    } else {
      sources[row.source].chunks = row.chunk_count;
    }
  }

  return {
    totalFiles,
    totalChunks,
    totalEmbeddings,
    lastSync,
    dbSizeBytes,
    sources,
  };
}

/**
 * Prune orphaned chunks: chunks whose file path no longer exists in files table.
 */
export async function pruneOrphans(): Promise<number> {
  const { db } = await initDb();

  const orphans = db
    .prepare(
      "SELECT c.id FROM chunks c LEFT JOIN files f ON c.path = f.path WHERE f.path IS NULL"
    )
    .all() as { id: string }[];

  if (orphans.length === 0) return 0;

  runInTransaction(() => {
    for (const { id } of orphans) {
      db.prepare("DELETE FROM chunks_vec WHERE chunk_id = ?").run(id);
      db.prepare("DELETE FROM chunks_fts WHERE chunk_id = ?").run(id);
      db.prepare("DELETE FROM chunks WHERE id = ?").run(id);
    }
  });

  console.error(`[index-manager] Pruned ${orphans.length} orphaned chunks`);
  return orphans.length;
}

/**
 * Prune old embedding cache entries.
 */
export async function pruneEmbeddingCache(
  maxAgeDays: number = 90
): Promise<number> {
  const { db } = await initDb();
  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;

  const result = db
    .prepare("DELETE FROM embedding_cache WHERE created_at < ?")
    .run(cutoff);

  console.error(
    `[index-manager] Pruned ${result.changes} embedding cache entries older than ${maxAgeDays} days`
  );
  return result.changes;
}
