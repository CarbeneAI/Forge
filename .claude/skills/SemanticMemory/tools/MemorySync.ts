#!/usr/bin/env bun
/**
 * MemorySync.ts - Sync utility for SemanticMemory
 *
 * Usage: bun MemorySync.ts [options]
 *
 * Options:
 *   --source type    Sync only a specific source type
 *   --force          Force re-embed all (ignore cache)
 *   --dry-run        Show what would be indexed without doing it
 *   --help           Show this help message
 */

import { loadConfig, PAI_DIR } from "../src/config.js";
import { initDb } from "../src/db.js";
import {
  syncIndex,
  discoverFiles,
  computeFileHash,
} from "../src/index-manager.js";
import type { SourceConfig, SourceType } from "../src/types.js";

const VALID_SOURCES: SourceType[] = [
  "session",
  "learning",
  "research",
  "obsidian",
  "memory",
  "raw-output",
];

function printHelp(): void {
  console.log(`
SemanticMemory Sync
====================

Synchronize the SemanticMemory index with source files.

Usage:
  bun MemorySync.ts [options]

Options:
  --source type    Sync only a specific source type
                   Valid: session, learning, research, obsidian, memory, raw-output
  --force          Force re-embed all chunks (ignore hash cache)
  --dry-run        Show what would be indexed without actually doing it
  --help           Show this help message

Examples:
  # Sync all sources
  bun MemorySync.ts

  # Sync only memory files
  bun MemorySync.ts --source memory

  # Dry run to see what would change
  bun MemorySync.ts --dry-run

  # Force re-embed everything
  bun MemorySync.ts --force

  # Dry run for a specific source
  bun MemorySync.ts --source obsidian --dry-run
`.trim());
}

function parseArgs(): {
  source?: SourceType;
  force: boolean;
  dryRun: boolean;
} {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  let source: SourceType | undefined;
  let force = false;
  let dryRun = false;

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg === "--source" && i + 1 < args.length) {
      const val = args[++i] as SourceType;
      if (!VALID_SOURCES.includes(val)) {
        console.error(
          `Error: Invalid source type "${val}". Valid: ${VALID_SOURCES.join(", ")}`
        );
        process.exit(1);
      }
      source = val;
    } else if (arg === "--force") {
      force = true;
    } else if (arg === "--dry-run") {
      dryRun = true;
    } else {
      console.error(`Error: Unknown option "${arg}". Use --help for usage.`);
      process.exit(1);
    }

    i++;
  }

  return { source, force, dryRun };
}

/**
 * Shorten path for display.
 */
function shortenPath(path: string): string {
  const home = process.env.HOME || "/home/youruser";
  if (path.startsWith(home)) {
    return "~" + path.slice(home.length);
  }
  return path;
}

/**
 * Format bytes into human-readable size.
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function main(): Promise<void> {
  const opts = parseArgs();

  try {
    const config = await loadConfig();

    // Filter sources if specified
    let sources: SourceConfig[] = config.sources;
    if (opts.source) {
      sources = sources.filter((s) => s.type === opts.source);
      if (sources.length === 0) {
        console.error(`Error: No configured source matches "${opts.source}".`);
        process.exit(1);
      }
    }

    if (opts.dryRun) {
      // Dry run mode: show what would be indexed
      console.log("DRY RUN - No changes will be made\n");
      console.log(
        `Scanning ${sources.length} source${sources.length !== 1 ? "s" : ""}...`
      );

      const { db } = await initDb(config);

      // Discover files
      const discoveredFiles = await discoverFiles(sources);

      // Get existing records
      const existingFiles = new Map<string, { hash: string }>();
      const rows = db
        .prepare("SELECT path, hash FROM files")
        .all() as { path: string; hash: string }[];
      for (const row of rows) {
        existingFiles.set(row.path, { hash: row.hash });
      }

      const discoveredPaths = new Set(discoveredFiles.map((f) => f.path));

      // Categorize files
      const newFiles: string[] = [];
      const changedFiles: string[] = [];
      const unchangedFiles: string[] = [];
      const deletedFiles: string[] = [];

      for (const file of discoveredFiles) {
        const existing = existingFiles.get(file.path);
        if (!existing) {
          newFiles.push(file.path);
        } else {
          const hash = await computeFileHash(file.path);
          if (hash !== existing.hash || opts.force) {
            changedFiles.push(file.path);
          } else {
            unchangedFiles.push(file.path);
          }
        }
      }

      for (const [path] of existingFiles) {
        if (!discoveredPaths.has(path)) {
          // Only count deletions for filtered sources
          if (opts.source) {
            const fileSource = db
              .prepare("SELECT source FROM files WHERE path = ?")
              .get(path) as { source: string } | null;
            if (fileSource && fileSource.source === opts.source) {
              deletedFiles.push(path);
            }
          } else {
            deletedFiles.push(path);
          }
        }
      }

      console.log(`\nDiscovered ${discoveredFiles.length} files total\n`);

      if (newFiles.length > 0) {
        console.log(`NEW (${newFiles.length}):`);
        for (const f of newFiles.slice(0, 20)) {
          console.log(`  + ${shortenPath(f)}`);
        }
        if (newFiles.length > 20) {
          console.log(`  ... and ${newFiles.length - 20} more`);
        }
        console.log("");
      }

      if (changedFiles.length > 0) {
        console.log(`CHANGED (${changedFiles.length}):`);
        for (const f of changedFiles.slice(0, 20)) {
          console.log(`  ~ ${shortenPath(f)}`);
        }
        if (changedFiles.length > 20) {
          console.log(`  ... and ${changedFiles.length - 20} more`);
        }
        console.log("");
      }

      if (deletedFiles.length > 0) {
        console.log(`DELETED (${deletedFiles.length}):`);
        for (const f of deletedFiles.slice(0, 20)) {
          console.log(`  - ${shortenPath(f)}`);
        }
        if (deletedFiles.length > 20) {
          console.log(`  ... and ${deletedFiles.length - 20} more`);
        }
        console.log("");
      }

      console.log(`UNCHANGED: ${unchangedFiles.length}`);
      console.log(
        `\nWould process: ${newFiles.length} new + ${changedFiles.length} changed = ${newFiles.length + changedFiles.length} files`
      );
      if (deletedFiles.length > 0) {
        console.log(
          `Would remove: ${deletedFiles.length} deleted file${deletedFiles.length !== 1 ? "s" : ""}`
        );
      }

      process.exit(0);
    }

    // Actual sync
    const sourceLabel = opts.source
      ? `source: ${opts.source}`
      : "all sources";
    console.log(
      `Syncing ${sourceLabel}${opts.force ? " (force mode)" : ""}...\n`
    );

    const stats = await syncIndex({
      force: opts.force,
      sources,
    });

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

    process.exit(0);
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

main();
