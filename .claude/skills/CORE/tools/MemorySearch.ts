#!/usr/bin/env bun
/**
 * MemorySearch.ts - Quick CLI wrapper around SemanticSearch
 *
 * Usage: bun MemorySearch.ts "query" [options]
 *
 * Examples:
 *   bun MemorySearch.ts "what did we do about trading"
 *   bun MemorySearch.ts "query" --source session
 *   bun MemorySearch.ts "query" --source learning,research
 *   bun MemorySearch.ts "query" --limit 10
 *   bun MemorySearch.ts "query" --json
 *   bun MemorySearch.ts --sync
 */

import { resolve } from "path";

// Resolve PAI_DIR from script location: tools/ -> CORE/ -> skills/ -> .claude/
const PAI_DIR = resolve(import.meta.dir, "../../../");
const SEMANTIC_SEARCH_PATH = resolve(
  PAI_DIR,
  "skills/SemanticMemory/tools/SemanticSearch.ts"
);

// ANSI color codes
const COLORS = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

interface SearchResult {
  rank: number;
  chunkId: string;
  combinedScore: number;
  vectorScore: number;
  textScore: number;
  source: string;
  path: string;
  startLine: number;
  endLine: number;
  snippet: string;
}

interface SearchResponse {
  query: string;
  totalChunks: number;
  durationMs: number;
  results: SearchResult[];
}

function printHelp(): void {
  console.log(`
PAI Memory Search - Quick semantic search wrapper
==================================================

Usage:
  bun MemorySearch.ts "query" [options]

Options:
  --source type[,type]   Filter by source type (session,learning,research,obsidian,memory,raw-output)
  --limit N              Maximum results (default: 5)
  --json                 Output raw JSON
  --sync                 Sync index before searching
  --help, -h             Show this help

Examples:
  # Basic search
  bun MemorySearch.ts "what did we do about trading"

  # Filter by source
  bun MemorySearch.ts "homelab setup" --source session

  # Multiple sources
  bun MemorySearch.ts "authentication flow" --source session,learning

  # More results
  bun MemorySearch.ts "Docker configuration" --limit 10

  # Raw JSON output
  bun MemorySearch.ts "Traefik routes" --json

  # Sync index first
  bun MemorySearch.ts --sync
  `.trim());
}

function parseArgs(): {
  query: string;
  sources?: string;
  limit: number;
  json: boolean;
  sync: boolean;
} {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  let query = "";
  let sources: string | undefined;
  let limit = 5;
  let json = false;
  let sync = false;

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg === "--source" && i + 1 < args.length) {
      sources = args[++i];
    } else if (arg === "--limit" && i + 1 < args.length) {
      limit = parseInt(args[++i], 10);
      if (isNaN(limit) || limit < 1) {
        console.error("Error: --limit must be a positive integer");
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

  // If only --sync is provided, that's valid (no query required)
  if (!query && !sync) {
    console.error("Error: Query string is required. Use --help for usage.");
    process.exit(1);
  }

  return { query, sources, limit, json, sync };
}

function shortenPath(path: string): string {
  const home = process.env.HOME || "/home/youruser";
  if (path.startsWith(home)) {
    return "~" + path.slice(home.length);
  }
  return path;
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

function formatNiceOutput(data: SearchResponse): void {
  console.log(`\nPAI Memory Search: "${data.query}"`);
  console.log("==================\n");

  if (data.results.length === 0) {
    console.log("No results found.\n");
    console.log("Try:");
    console.log("  - Different search terms");
    console.log("  - Running with --sync to update index");
    console.log("  - Using --limit to see more results");
    return;
  }

  for (const result of data.results) {
    // Color-code score
    let scoreColor = COLORS.dim;
    if (result.combinedScore > 0.7) scoreColor = COLORS.green;
    else if (result.combinedScore >= 0.4) scoreColor = COLORS.yellow;

    console.log(
      `  ${COLORS.bold}#${result.rank}${COLORS.reset}  ${COLORS.cyan}[${result.source}]${COLORS.reset} ${scoreColor}Score: ${result.combinedScore.toFixed(2)}${COLORS.reset}`
    );
    console.log(`      ${COLORS.dim}${shortenPath(result.path)}${COLORS.reset}`);

    // Snippet preview (first 150 chars)
    const snippet = result.snippet.replace(/\s+/g, " ").trim();
    console.log(`      ${truncate(snippet, 150)}`);
    console.log("");
  }

  console.log("==================");
  console.log(
    `${data.results.length} result${data.results.length !== 1 ? "s" : ""} found\n`
  );
}

async function main(): Promise<void> {
  const opts = parseArgs();

  // Build command
  const cmd = ["bun", SEMANTIC_SEARCH_PATH];

  if (opts.query) {
    cmd.push(opts.query);
  }

  if (opts.sources) {
    cmd.push("--source", opts.sources);
  }

  cmd.push("--limit", opts.limit.toString());
  cmd.push("--json"); // Always get JSON from SemanticSearch

  if (opts.sync) {
    cmd.push("--sync");
  }

  // Execute via Bun.spawn
  const proc = Bun.spawn(cmd, {
    stdout: "pipe",
    stderr: "inherit",
  });

  const output = await new Response(proc.stdout).text();
  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    console.error("SemanticSearch failed");
    process.exit(exitCode);
  }

  // If user wants raw JSON, pass through
  if (opts.json) {
    console.log(output);
    return;
  }

  // Parse and format nicely
  try {
    const data: SearchResponse = JSON.parse(output);
    formatNiceOutput(data);
  } catch (err) {
    console.error("Error parsing JSON output from SemanticSearch");
    console.error(output);
    process.exit(1);
  }
}

main();
