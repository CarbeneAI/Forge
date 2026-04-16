#!/usr/bin/env bun
/**
 * IndexManager.ts - Index management for SemanticMemory
 *
 * Subcommands: status, sync, reindex, prune, clear-cache, files, watch, dedup, quality
 */

import { initDb, getMetaValue } from "../src/db.js";
import { loadConfig, PAI_DIR } from "../src/config.js";
import {
  syncIndex,
  fullReindex,
  getIndexStatus,
  pruneOrphans,
  pruneEmbeddingCache,
} from "../src/index-manager.js";
import {
  isDaemonRunning,
  stopDaemon,
  runDaemon,
  readPid,
} from "../src/watcher.js";
import { statSync } from "fs";

function printHelp(): void {
  console.log(`
SemanticMemory Index Manager
=============================

Usage:
  bun IndexManager.ts <subcommand> [options]

Subcommands:
  status              Show index status (files, chunks, size, last sync)
  sync                Sync index (index new/changed files, remove deleted)
  reindex             Force full reindex (drop all data and rebuild)
  prune               Remove orphaned chunks (files deleted but chunks remain)
  clear-cache         Clear the embedding cache
  files [--source X]  List all indexed files, optionally filtered by source
  watch               Manage background file watcher
    --daemon          Start watcher as background daemon
    --status          Check if watcher daemon is running
    --stop            Stop watcher daemon
  dedup [--dry-run]   Find and remove near-duplicate chunks (cosine > 0.95)
  quality             Audit index quality (short chunks, generic sessions)

Examples:
  bun IndexManager.ts status
  bun IndexManager.ts sync
  bun IndexManager.ts reindex
  bun IndexManager.ts prune
  bun IndexManager.ts clear-cache
  bun IndexManager.ts files --source session
  bun IndexManager.ts watch --daemon
  bun IndexManager.ts watch --status
  bun IndexManager.ts watch --stop
  bun IndexManager.ts dedup [--dry-run]
  bun IndexManager.ts quality
`.trim());
}

/**
 * Format bytes into human-readable size.
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Format a timestamp as a human-readable date.
 */
function formatDate(timestamp: number): string {
  if (!timestamp || timestamp === 0) return "never";
  const date = new Date(timestamp);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });
}

/**
 * Shorten a path for display.
 */
function shortenPath(path: string): string {
  const home = process.env.HOME || "/home/youruser";
  if (path.startsWith(home)) {
    return "~" + path.slice(home.length);
  }
  return path;
}

// ─── Subcommand: status ──────────────────────────────────────────────────────

async function cmdStatus(): Promise<void> {
  const status = await getIndexStatus();
  const config = await loadConfig();

  const embeddingModel =
    getMetaValue("embedding_model") || config.embeddingModel;
  const embeddingDims =
    getMetaValue("embedding_dims") || String(config.embeddingDims);
  const schemaVersion = getMetaValue("schema_version") || "1";

  // Get embedding cache info
  const { db } = await initDb(config);
  const cacheCount = (
    db.prepare("SELECT COUNT(*) as count FROM embedding_cache").get() as {
      count: number;
    }
  ).count;

  let cacheSize = 0;
  try {
    // Approximate cache size from DB file and cache count
    const row = db
      .prepare(
        "SELECT SUM(LENGTH(embedding)) as total FROM embedding_cache"
      )
      .get() as { total: number | null };
    cacheSize = row?.total || 0;
  } catch {
    // ignore
  }

  console.log(`
SemanticMemory Index Status
===========================
Database: ${shortenPath(config.dbPath)} (${formatSize(status.dbSizeBytes)})
Schema version: ${schemaVersion}
Embedding: ${embeddingModel} (${embeddingDims} dims)
Last sync: ${formatDate(status.lastSync)}

Sources:`);

  const sourceTypes = [
    "session",
    "learning",
    "research",
    "obsidian",
    "memory",
    "raw-output",
  ];
  let totalFiles = 0;
  let totalChunks = 0;

  for (const st of sourceTypes) {
    const info = status.sources[st] || { files: 0, chunks: 0 };
    totalFiles += info.files;
    totalChunks += info.chunks;
    const label = (st + "      ").slice(0, 12);
    console.log(
      `  ${label}: ${String(info.files).padStart(4)} files, ${String(info.chunks).toLocaleString().padStart(6)} chunks`
    );
  }

  console.log(`  ${"─".repeat(41)}`);
  console.log(
    `  ${"Total".padEnd(12)}: ${String(totalFiles).padStart(4)} files, ${String(totalChunks).toLocaleString().padStart(6)} chunks`
  );

  console.log(
    `\nEmbedding cache: ${cacheCount.toLocaleString()} entries (${formatSize(cacheSize)})`
  );

  // Watcher status
  const watcherRunning = isDaemonRunning();
  const pid = readPid();
  console.log(
    `Watcher: ${watcherRunning ? `running (PID ${pid})` : "not running"}`
  );
  console.log("");
}

// ─── Subcommand: sync ────────────────────────────────────────────────────────

async function cmdSync(): Promise<void> {
  console.log("Syncing index...");
  const stats = await syncIndex();

  console.log(`
Sync Complete
=============
Files scanned:    ${stats.filesScanned}
Files changed:    ${stats.filesChanged}
Files deleted:    ${stats.filesDeleted}
Chunks created:   ${stats.chunksCreated}
Chunks deleted:   ${stats.chunksDeleted}
Embeddings (new): ${stats.embeddingsGenerated}
Embeddings (hit): ${stats.embeddingsCached}
Duration:         ${(stats.durationMs / 1000).toFixed(1)}s
`);
}

// ─── Subcommand: reindex ─────────────────────────────────────────────────────

async function cmdReindex(): Promise<void> {
  console.log("WARNING: This will delete ALL indexed data and rebuild from scratch.");
  console.log("Starting full reindex...\n");

  const stats = await fullReindex();

  console.log(`
Full Reindex Complete
=====================
Files scanned:    ${stats.filesScanned}
Files indexed:    ${stats.filesChanged}
Chunks created:   ${stats.chunksCreated}
Embeddings (new): ${stats.embeddingsGenerated}
Embeddings (hit): ${stats.embeddingsCached}
Duration:         ${(stats.durationMs / 1000).toFixed(1)}s
`);
}

// ─── Subcommand: prune ───────────────────────────────────────────────────────

async function cmdPrune(): Promise<void> {
  console.log("Pruning orphaned chunks...");
  const count = await pruneOrphans();
  console.log(`Pruned ${count} orphaned chunk${count !== 1 ? "s" : ""}.`);
}

// ─── Subcommand: clear-cache ─────────────────────────────────────────────────

async function cmdClearCache(): Promise<void> {
  console.log("Clearing embedding cache...");
  const config = await loadConfig();
  const { db } = await initDb(config);

  const result = db.prepare("DELETE FROM embedding_cache").run();
  console.log(
    `Cleared ${result.changes} embedding cache entr${result.changes !== 1 ? "ies" : "y"}.`
  );
}

// ─── Subcommand: files ───────────────────────────────────────────────────────

async function cmdFiles(sourceFilter?: string): Promise<void> {
  const config = await loadConfig();
  const { db } = await initDb(config);

  let sql = "SELECT path, source, hash, chunk_count, indexed_at FROM files";
  const params: string[] = [];

  if (sourceFilter) {
    sql += " WHERE source = ?";
    params.push(sourceFilter);
  }

  sql += " ORDER BY source, path";

  const files = db.prepare(sql).all(...params) as {
    path: string;
    source: string;
    hash: string;
    chunk_count: number;
    indexed_at: number;
  }[];

  if (files.length === 0) {
    console.log(
      sourceFilter
        ? `No files indexed for source "${sourceFilter}".`
        : "No files indexed."
    );
    return;
  }

  console.log(
    `Indexed Files${sourceFilter ? ` (source: ${sourceFilter})` : ""}`
  );
  console.log("=".repeat(60));

  let currentSource = "";
  for (const f of files) {
    if (f.source !== currentSource) {
      currentSource = f.source;
      console.log(`\n[${currentSource}]`);
    }
    console.log(
      `  ${shortenPath(f.path)} (${f.chunk_count} chunks, indexed ${formatDate(f.indexed_at)})`
    );
  }

  console.log(`\nTotal: ${files.length} files`);
}

// ─── Subcommand: watch ───────────────────────────────────────────────────────

async function cmdWatch(args: string[]): Promise<void> {
  if (args.includes("--status")) {
    const running = isDaemonRunning();
    const pid = readPid();
    if (running) {
      console.log(`Watcher daemon is running (PID: ${pid})`);
    } else {
      console.log("Watcher daemon is not running.");
    }
    return;
  }

  if (args.includes("--stop")) {
    const stopped = stopDaemon();
    if (stopped) {
      console.log("Watcher daemon stopped.");
    } else {
      console.log("No watcher daemon to stop.");
    }
    return;
  }

  if (args.includes("--daemon")) {
    console.log("Starting watcher daemon...");
    await runDaemon();
    // runDaemon keeps the process alive
    return;
  }

  // No flag - show help for watch subcommand
  console.log(`
Watch Subcommand
================
Manage the background file watcher daemon.

Usage:
  bun IndexManager.ts watch --daemon    Start watcher daemon
  bun IndexManager.ts watch --status    Check daemon status
  bun IndexManager.ts watch --stop      Stop daemon
`);
}

// ─── Subcommand: dedup ──────────────────────────────────────────────────────

/**
 * Compute cosine similarity between two Float32Arrays stored as Uint8Array blobs.
 */
function cosineSimilarity(a: Uint8Array | Buffer, b: Uint8Array | Buffer): number {
  const bufA = a instanceof Buffer ? new Uint8Array(a) : a;
  const bufB = b instanceof Buffer ? new Uint8Array(b) : b;
  const vecA = new Float32Array(bufA.buffer, bufA.byteOffset, bufA.byteLength / 4);
  const vecB = new Float32Array(bufB.buffer, bufB.byteOffset, bufB.byteLength / 4);

  if (vecA.length !== vecB.length) return 0;

  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

async function cmdDedup(dryRun: boolean): Promise<void> {
  const config = await loadConfig();
  const { db } = await initDb(config);

  console.log(`Scanning for near-duplicate chunks (cosine > 0.95)${dryRun ? " [DRY RUN]" : ""}...\n`);

  // Get all chunks grouped by source
  const chunks = db.prepare(
    "SELECT c.id, c.path, c.source, c.tokens, c.updated_at FROM chunks c ORDER BY c.source, c.path, c.updated_at DESC"
  ).all() as { id: string; path: string; source: string; tokens: number; updated_at: number }[];

  // Get embeddings for all chunks
  const embeddingMap = new Map<string, Uint8Array>();
  for (const chunk of chunks) {
    try {
      const row = db.prepare("SELECT embedding FROM chunks_vec WHERE chunk_id = ?").get(chunk.id) as { embedding: Uint8Array } | null;
      if (row?.embedding) {
        embeddingMap.set(chunk.id, row.embedding);
      }
    } catch {
      // vec0 access may fail for some entries
    }
  }

  // Compare chunks within same source for duplicates
  const duplicates: Array<{ keepId: string; removeId: string; similarity: number; path: string }> = [];
  const processed = new Set<string>();

  // Group by source for efficiency
  const bySource = new Map<string, typeof chunks>();
  for (const chunk of chunks) {
    const list = bySource.get(chunk.source) || [];
    list.push(chunk);
    bySource.set(chunk.source, list);
  }

  for (const [source, sourceChunks] of bySource) {
    console.log(`Checking ${sourceChunks.length} chunks in source "${source}"...`);

    for (let i = 0; i < sourceChunks.length; i++) {
      if (processed.has(sourceChunks[i].id)) continue;
      const embA = embeddingMap.get(sourceChunks[i].id);
      if (!embA) continue;

      for (let j = i + 1; j < sourceChunks.length; j++) {
        if (processed.has(sourceChunks[j].id)) continue;
        const embB = embeddingMap.get(sourceChunks[j].id);
        if (!embB) continue;

        const sim = cosineSimilarity(embA, embB);
        if (sim > 0.95) {
          // Keep the newer one (higher updated_at)
          const keep = sourceChunks[i].updated_at >= sourceChunks[j].updated_at ? sourceChunks[i] : sourceChunks[j];
          const remove = keep === sourceChunks[i] ? sourceChunks[j] : sourceChunks[i];

          duplicates.push({
            keepId: keep.id,
            removeId: remove.id,
            similarity: sim,
            path: remove.path,
          });
          processed.add(remove.id);
        }
      }
    }
  }

  console.log(`\nFound ${duplicates.length} near-duplicate chunk${duplicates.length !== 1 ? "s" : ""}.`);

  if (duplicates.length > 0) {
    // Show top 10 examples
    const examples = duplicates.slice(0, 10);
    for (const dup of examples) {
      console.log(`  ${shortenPath(dup.path)} (similarity: ${dup.similarity.toFixed(4)})`);
    }
    if (duplicates.length > 10) {
      console.log(`  ... and ${duplicates.length - 10} more`);
    }

    if (!dryRun) {
      console.log("\nRemoving duplicates...");
      let removed = 0;
      for (const dup of duplicates) {
        try {
          db.prepare("DELETE FROM chunks_vec WHERE chunk_id = ?").run(dup.removeId);
          db.prepare("DELETE FROM chunks_fts WHERE chunk_id = ?").run(dup.removeId);
          db.prepare("DELETE FROM chunks WHERE id = ?").run(dup.removeId);
          removed++;
        } catch {
          // Skip errors on individual deletions
        }
      }
      console.log(`Removed ${removed} duplicate chunks.`);
    } else {
      console.log("\n[DRY RUN] No chunks were removed. Run without --dry-run to remove them.");
    }
  }
}

// ─── Subcommand: quality ────────────────────────────────────────────────────

async function cmdQuality(): Promise<void> {
  const config = await loadConfig();
  const { db } = await initDb(config);

  console.log("Index Quality Audit\n===================\n");

  // 1. Short chunks (< 50 tokens)
  const shortChunks = db.prepare(
    "SELECT id, path, source, tokens FROM chunks WHERE tokens < 50 ORDER BY tokens ASC"
  ).all() as { id: string; path: string; source: string; tokens: number }[];

  console.log(`Short chunks (< 50 tokens): ${shortChunks.length}`);
  if (shortChunks.length > 0) {
    const examples = shortChunks.slice(0, 5);
    for (const c of examples) {
      console.log(`  ${shortenPath(c.path)} (${c.tokens} tokens, source: ${c.source})`);
    }
    if (shortChunks.length > 5) console.log(`  ... and ${shortChunks.length - 5} more`);
  }

  // 2. Files with "general-work" in the name (old-format sessions)
  const generalWorkFiles = db.prepare(
    "SELECT path, chunk_count, indexed_at FROM files WHERE path LIKE '%general-work%'"
  ).all() as { path: string; chunk_count: number; indexed_at: number }[];

  console.log(`\nOld-format "general-work" sessions: ${generalWorkFiles.length}`);
  if (generalWorkFiles.length > 0) {
    for (const f of generalWorkFiles.slice(0, 5)) {
      console.log(`  ${shortenPath(f.path)} (${f.chunk_count} chunks)`);
    }
    if (generalWorkFiles.length > 5) console.log(`  ... and ${generalWorkFiles.length - 5} more`);
  }

  // 3. Chunks with generic/low-value content
  const genericPatterns = [
    "general development work",
    "this session summary was automatically generated",
    "session outcome: completed",
    "none recorded",
  ];

  let genericCount = 0;
  for (const pattern of genericPatterns) {
    const count = (db.prepare(
      "SELECT COUNT(*) as count FROM chunks WHERE LOWER(text) LIKE ?"
    ).get(`%${pattern}%`) as { count: number }).count;
    genericCount += count;
  }

  console.log(`\nGeneric/boilerplate chunks: ${genericCount}`);

  // 4. Source distribution
  console.log("\nSource Distribution:");
  const sources = db.prepare(
    "SELECT source, COUNT(*) as files, SUM(chunk_count) as chunks FROM files GROUP BY source ORDER BY chunks DESC"
  ).all() as { source: string; files: number; chunks: number }[];

  for (const s of sources) {
    const avgChunks = (s.chunks / s.files).toFixed(1);
    console.log(`  ${(s.source + "      ").slice(0, 12)}: ${s.files} files, ${s.chunks} chunks (avg ${avgChunks}/file)`);
  }

  // 5. Recommendations
  console.log("\nRecommendations:");
  if (generalWorkFiles.length > 0) {
    console.log(`  - ${generalWorkFiles.length} old "general-work" sessions could be re-captured with the improved hook`);
    console.log("    Run 'bun IndexManager.ts reindex' after the new session capture hook generates better summaries");
  }
  if (shortChunks.length > 10) {
    console.log(`  - ${shortChunks.length} short chunks may degrade search quality`);
    console.log("    Consider increasing chunkMinTokens in config");
  }
  if (genericCount > 5) {
    console.log(`  - ${genericCount} generic/boilerplate chunks add noise`);
    console.log("    These will be replaced as new sessions generate richer summaries");
  }
  if (genericCount === 0 && shortChunks.length === 0 && generalWorkFiles.length === 0) {
    console.log("  Index quality looks good!");
  }
  console.log("");
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const subcommand = args[0];

  if (!subcommand || subcommand === "--help" || subcommand === "-h") {
    printHelp();
    process.exit(0);
  }

  try {
    switch (subcommand) {
      case "status":
        await cmdStatus();
        break;

      case "sync":
        await cmdSync();
        break;

      case "reindex":
        await cmdReindex();
        break;

      case "prune":
        await cmdPrune();
        break;

      case "clear-cache":
        await cmdClearCache();
        break;

      case "files": {
        let sourceFilter: string | undefined;
        const sourceIdx = args.indexOf("--source");
        if (sourceIdx !== -1 && args[sourceIdx + 1]) {
          sourceFilter = args[sourceIdx + 1];
        }
        await cmdFiles(sourceFilter);
        break;
      }

      case "watch":
        await cmdWatch(args.slice(1));
        break;

      case "dedup":
        await cmdDedup(args.includes("--dry-run"));
        break;

      case "quality":
        await cmdQuality();
        break;

      default:
        console.error(
          `Error: Unknown subcommand "${subcommand}". Use --help for usage.`
        );
        process.exit(1);
    }
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

main();
