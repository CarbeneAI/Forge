#!/usr/bin/env bun
/**
 * SemanticSearch.ts - Primary search interface for SemanticMemory
 *
 * Usage: bun SemanticSearch.ts "query" [options]
 *
 * Options:
 *   --source type[,type]   Filter by source type (session,learning,research,obsidian,memory,raw-output)
 *   --limit N              Maximum results (default: 10, max: 50)
 *   --min-score N          Minimum combined score threshold (default: 0.1)
 *   --vector-weight N      Weight for vector (semantic) score (default: 0.7)
 *   --text-weight N        Weight for text (BM25) score (default: 0.3)
 *   --json                 Output results as JSON
 *   --sync                 Sync index before searching
 *   --help                 Show this help message
 */

import { search } from "../src/search.js";
import { syncIndex } from "../src/index-manager.js";
import { initDb } from "../src/db.js";
import { loadConfig, PAI_DIR } from "../src/config.js";
import type { SourceType, SearchResult } from "../src/types.js";

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
SemanticMemory Search
=====================

Usage:
  bun SemanticSearch.ts "query" [options]

Options:
  --source type[,type]   Filter by source type
                         Valid: session, learning, research, obsidian, memory, raw-output
  --limit N              Maximum results (default: 10, max: 50)
  --min-score N          Minimum combined score (default: 0.1, range: 0-1)
  --vector-weight N      Semantic similarity weight (default: 0.7)
  --text-weight N        Keyword match weight (default: 0.3)
  --json                 Output as JSON (for piping to other tools)
  --sync                 Sync index before searching (ensures latest files)
  --help                 Show this help message

Examples:
  # Basic search
  bun SemanticSearch.ts "How did we set up Traefik SSL certificates?"

  # Filter to sessions and learnings only
  bun SemanticSearch.ts "authentication flow" --source session,learning

  # More results with lower threshold
  bun SemanticSearch.ts "Docker backup strategy" --limit 20 --min-score 0.05

  # Keyword-heavy search (less semantic, more exact match)
  bun SemanticSearch.ts "CLAUDE.md" --vector-weight 0.3 --text-weight 0.7

  # JSON output for scripting
  bun SemanticSearch.ts "homelab architecture" --json

  # Auto-sync then search
  bun SemanticSearch.ts "recent session about n8n" --sync
`.trim());
}

function parseArgs(): {
  query: string;
  sources?: SourceType[];
  limit: number;
  minScore: number;
  vectorWeight: number;
  textWeight: number;
  json: boolean;
  sync: boolean;
} {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  let query = "";
  let sources: SourceType[] | undefined;
  let limit = 10;
  let minScore = 0.1;
  let vectorWeight = 0.7;
  let textWeight = 0.3;
  let json = false;
  let sync = false;

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg === "--source" && i + 1 < args.length) {
      const sourceStr = args[++i];
      sources = sourceStr.split(",").map((s) => s.trim()) as SourceType[];
      for (const s of sources) {
        if (!VALID_SOURCES.includes(s)) {
          console.error(`Error: Invalid source type "${s}". Valid: ${VALID_SOURCES.join(", ")}`);
          process.exit(1);
        }
      }
    } else if (arg === "--limit" && i + 1 < args.length) {
      limit = parseInt(args[++i], 10);
      if (isNaN(limit) || limit < 1) {
        console.error("Error: --limit must be a positive integer");
        process.exit(1);
      }
    } else if (arg === "--min-score" && i + 1 < args.length) {
      minScore = parseFloat(args[++i]);
      if (isNaN(minScore) || minScore < 0 || minScore > 1) {
        console.error("Error: --min-score must be between 0 and 1");
        process.exit(1);
      }
    } else if (arg === "--vector-weight" && i + 1 < args.length) {
      vectorWeight = parseFloat(args[++i]);
      if (isNaN(vectorWeight) || vectorWeight < 0 || vectorWeight > 1) {
        console.error("Error: --vector-weight must be between 0 and 1");
        process.exit(1);
      }
    } else if (arg === "--text-weight" && i + 1 < args.length) {
      textWeight = parseFloat(args[++i]);
      if (isNaN(textWeight) || textWeight < 0 || textWeight > 1) {
        console.error("Error: --text-weight must be between 0 and 1");
        process.exit(1);
      }
    } else if (arg === "--json") {
      json = true;
    } else if (arg === "--sync") {
      sync = true;
    } else if (!arg.startsWith("--")) {
      query = arg;
    } else {
      console.error(`Error: Unknown option "${arg}". Use --help for usage.`);
      process.exit(1);
    }

    i++;
  }

  if (!query) {
    console.error("Error: Query string is required. Use --help for usage.");
    process.exit(1);
  }

  return { query, sources, limit, minScore, vectorWeight, textWeight, json, sync };
}

/**
 * Shorten a path for display by replacing home dir with ~.
 */
function shortenPath(path: string): string {
  const home = process.env.HOME || "/home/youruser";
  if (path.startsWith(home)) {
    return "~" + path.slice(home.length);
  }
  return path;
}

/**
 * Format results as human-readable output.
 */
function formatHumanReadable(
  query: string,
  results: SearchResult[],
  totalChunks: number,
  durationMs: number
): string {
  const lines: string[] = [];

  lines.push(`SemanticMemory Search: "${query}"`);
  lines.push(
    `Found ${results.length} result${results.length !== 1 ? "s" : ""} (searched ${totalChunks.toLocaleString()} chunks in ${(durationMs / 1000).toFixed(1)}s)`
  );
  lines.push("");

  if (results.length === 0) {
    lines.push("No results found. Try:");
    lines.push("  - Using different keywords or phrasing");
    lines.push("  - Lowering --min-score threshold");
    lines.push("  - Running --sync to ensure index is up to date");
    return lines.join("\n");
  }

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const rank = i + 1;

    lines.push(
      `[${rank}] Score: ${r.combinedScore.toFixed(2)} (vec: ${r.vectorScore.toFixed(2)}, text: ${r.textScore.toFixed(2)}) | ${r.source}`
    );
    lines.push(`    File: ${shortenPath(r.path)}`);
    lines.push(`    Lines: ${r.startLine}-${r.endLine}`);

    // Format snippet with indentation
    const snippet = r.snippet.replace(/\s+/g, " ").trim();
    const wrappedSnippet = wordWrap(snippet, 72);
    for (const line of wrappedSnippet) {
      lines.push(`    ${line}`);
    }

    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Word wrap text to maxWidth characters.
 */
function wordWrap(text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if (currentLine.length + word.length + 1 > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = currentLine ? `${currentLine} ${word}` : word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Format results as JSON output.
 */
function formatJson(
  query: string,
  results: SearchResult[],
  totalChunks: number,
  durationMs: number
): string {
  return JSON.stringify(
    {
      query,
      totalChunks,
      durationMs,
      results: results.map((r, i) => ({
        rank: i + 1,
        chunkId: r.chunkId,
        combinedScore: Number(r.combinedScore.toFixed(4)),
        vectorScore: Number(r.vectorScore.toFixed(4)),
        textScore: Number(r.textScore.toFixed(4)),
        source: r.source,
        path: shortenPath(r.path),
        startLine: r.startLine,
        endLine: r.endLine,
        snippet: r.snippet,
      })),
    },
    null,
    2
  );
}

async function main(): Promise<void> {
  const opts = parseArgs();

  try {
    // Sync if requested
    if (opts.sync) {
      console.error("Syncing index before search...");
      const syncStats = await syncIndex();
      console.error(
        `Sync complete: ${syncStats.filesChanged} files changed, ${syncStats.chunksCreated} chunks created (${(syncStats.durationMs / 1000).toFixed(1)}s)`
      );
    }

    const startTime = Date.now();

    // Get total chunk count for display
    const config = await loadConfig();
    const { db } = await initDb(config);
    const totalChunks = (
      db.prepare("SELECT COUNT(*) as count FROM chunks").get() as { count: number }
    ).count;

    // Execute search
    const results = await search({
      query: opts.query,
      limit: opts.limit,
      minScore: opts.minScore,
      sources: opts.sources,
      vectorWeight: opts.vectorWeight,
      textWeight: opts.textWeight,
    });

    const durationMs = Date.now() - startTime;

    // Output results
    if (opts.json) {
      console.log(formatJson(opts.query, results, totalChunks, durationMs));
    } else {
      console.log(formatHumanReadable(opts.query, results, totalChunks, durationMs));
    }

    process.exit(0);
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

main();
