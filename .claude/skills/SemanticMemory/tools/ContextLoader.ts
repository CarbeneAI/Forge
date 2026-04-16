#!/usr/bin/env bun
/**
 * ContextLoader.ts - Layered context loading CLI for SemanticMemory
 *
 * Loads memory context in tiers to control token budget:
 *
 *   L0 Identity   ~100 tokens  Static identity from identity.txt
 *   L1 Essential  ~800 tokens  Top-importance chunks, grouped by source
 *   L2 On-Demand  ~500 tokens  Source-filtered recency retrieval
 *   L3 Deep       Unlimited    Full hybrid BM25+vector search
 *
 * Usage:
 *   bun tools/ContextLoader.ts wake                              # L0 + L1 (session startup)
 *   bun tools/ContextLoader.ts identity                          # L0 only
 *   bun tools/ContextLoader.ts essential                         # L1 only
 *   bun tools/ContextLoader.ts on-demand <source>               # L2 for a source type
 *   bun tools/ContextLoader.ts search <query> [options]         # L3 deep search
 *   bun tools/ContextLoader.ts help
 *
 * Options:
 *   --json            Output as JSON (all commands)
 *   --tokens          Show token count only, no content
 *   --source TYPE     Filter by source type (for search command)
 *   --limit N         Max results (for on-demand and search commands)
 */

import {
  loadIdentity,
  loadEssentialStory,
  loadOnDemand,
  loadDeepSearch,
  wakeUp,
} from "../src/layers.js";
import type { LayerResult } from "../src/layers.js";
import type { SourceType } from "../src/types.js";

// ─── ANSI Colors ──────────────────────────────────────────────────────────────

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";
const MAGENTA = "\x1b[35m";
const BLUE = "\x1b[34m";
const RED = "\x1b[31m";

// ─── Layer Color Map ──────────────────────────────────────────────────────────

const LAYER_COLORS: Record<number, string> = {
  0: CYAN,
  1: GREEN,
  2: YELLOW,
  3: MAGENTA,
};

// ─── Valid source types ───────────────────────────────────────────────────────

const VALID_SOURCES: SourceType[] = [
  "session",
  "learning",
  "research",
  "obsidian",
  "memory",
  "raw-output",
];

// ─── Help ─────────────────────────────────────────────────────────────────────

function printHelp(): void {
  process.stdout.write(`
${BOLD}ContextLoader${RESET} — SemanticMemory Layered Context Loading

${BOLD}USAGE${RESET}
  bun tools/ContextLoader.ts <command> [arguments] [options]

${BOLD}COMMANDS${RESET}
  ${CYAN}wake${RESET}                          Load L0 Identity + L1 Essential (session startup)
  ${CYAN}identity${RESET}                      L0: Static identity text (~100 tokens)
  ${CYAN}essential${RESET}                     L1: Top-importance chunks across all sources (~800 tokens)
  ${CYAN}on-demand${RESET} <source>            L2: Top chunks from a specific source (~500 tokens)
  ${CYAN}search${RESET} <query>                L3: Full hybrid BM25+vector search (unlimited)
  ${CYAN}help${RESET}                          Show this help message

${BOLD}SOURCE TYPES${RESET} (for on-demand and --source filter)
  ${DIM}learning, session, research, obsidian, memory, raw-output${RESET}

${BOLD}OPTIONS${RESET}
  ${YELLOW}--json${RESET}                        Output as JSON instead of human-readable
  ${YELLOW}--tokens${RESET}                      Show token count only, no content
  ${YELLOW}--source${RESET} <type>               Filter search by source type (comma-separated)
  ${YELLOW}--limit${RESET} <N>                   Max chunks/results to return (default: 5 for L2, 10 for L3)

${BOLD}EXAMPLES${RESET}
  # Session startup — load identity + essential story
  bun tools/ContextLoader.ts wake

  # See your identity text
  bun tools/ContextLoader.ts identity

  # What learnings are indexed?
  bun tools/ContextLoader.ts on-demand learning

  # Recent sessions (more results)
  bun tools/ContextLoader.ts on-demand session --limit 8

  # Deep search across all sources
  bun tools/ContextLoader.ts search "Traefik SSL setup"

  # Search only within sessions and learnings
  bun tools/ContextLoader.ts search "Docker backup" --source session,learning

  # How many tokens does a wake load cost?
  bun tools/ContextLoader.ts wake --tokens

  # JSON output for scripting
  bun tools/ContextLoader.ts wake --json
`.trimStart());
}

// ─── Formatting ───────────────────────────────────────────────────────────────

/**
 * Format a single LayerResult as a bordered section.
 */
function formatLayerHuman(result: LayerResult): string {
  const color = LAYER_COLORS[result.layer] ?? BLUE;
  const border = "═".repeat(50);
  const header = `${color}${BOLD}${border}${RESET}`;
  const title = `${color}${BOLD}Layer ${result.layer}: ${result.name} (${result.tokens} tokens)${RESET}`;
  const footer = `${DIM}${border}${RESET}`;

  return [header, title, "", result.text, footer].join("\n");
}

/**
 * Format token-count-only output for a result.
 */
function formatLayerTokensOnly(result: LayerResult): string {
  return `Layer ${result.layer}: ${result.name} — ${result.tokens} tokens`;
}

/**
 * Format the wake output (L0 + L1 combined).
 */
function formatWakeHuman(
  identity: LayerResult,
  essential: LayerResult,
  totalTokens: number
): string {
  const lines: string[] = [];
  lines.push(formatLayerHuman(identity));
  lines.push("");
  lines.push(formatLayerHuman(essential));
  lines.push("");
  lines.push(`${BOLD}${GREEN}Total: ${totalTokens} tokens loaded${RESET}`);
  return lines.join("\n");
}

// ─── Argument Parsing ─────────────────────────────────────────────────────────

interface ParsedArgs {
  command: string;
  positional: string[];
  json: boolean;
  tokensOnly: boolean;
  sources?: SourceType[];
  limit?: number;
}

function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2); // strip bun + script path

  if (args.length === 0 || args[0] === "help" || args[0] === "--help" || args[0] === "-h") {
    return {
      command: "help",
      positional: [],
      json: false,
      tokensOnly: false,
    };
  }

  const command = args[0];
  const positional: string[] = [];
  let json = false;
  let tokensOnly = false;
  let sources: SourceType[] | undefined;
  let limit: number | undefined;

  let i = 1;
  while (i < args.length) {
    const arg = args[i];

    if (arg === "--json") {
      json = true;
    } else if (arg === "--tokens") {
      tokensOnly = true;
    } else if (arg === "--source" && i + 1 < args.length) {
      const raw = args[++i];
      sources = raw.split(",").map((s) => s.trim()) as SourceType[];
      for (const s of sources) {
        if (!VALID_SOURCES.includes(s)) {
          console.error(
            `${RED}Error: Invalid source "${s}". Valid: ${VALID_SOURCES.join(", ")}${RESET}`
          );
          process.exit(1);
        }
      }
    } else if (arg === "--limit" && i + 1 < args.length) {
      limit = parseInt(args[++i], 10);
      if (isNaN(limit) || limit < 1) {
        console.error(`${RED}Error: --limit must be a positive integer${RESET}`);
        process.exit(1);
      }
    } else if (!arg.startsWith("--")) {
      positional.push(arg);
    } else {
      console.error(`${RED}Error: Unknown option "${arg}". Use "help" for usage.${RESET}`);
      process.exit(1);
    }

    i++;
  }

  return { command, positional, json, tokensOnly, sources, limit };
}

// ─── Command Handlers ─────────────────────────────────────────────────────────

async function cmdWake(opts: ParsedArgs): Promise<void> {
  const { identity, essential, totalTokens } = await wakeUp();

  if (opts.json) {
    process.stdout.write(
      JSON.stringify({ identity, essential, totalTokens }, null, 2) + "\n"
    );
    return;
  }

  if (opts.tokensOnly) {
    process.stdout.write(
      [
        formatLayerTokensOnly(identity),
        formatLayerTokensOnly(essential),
        `Total: ${totalTokens} tokens`,
      ].join("\n") + "\n"
    );
    return;
  }

  process.stdout.write(formatWakeHuman(identity, essential, totalTokens) + "\n");
}

async function cmdIdentity(opts: ParsedArgs): Promise<void> {
  const result = await loadIdentity();
  outputResult(result, opts);
}

async function cmdEssential(opts: ParsedArgs): Promise<void> {
  const result = await loadEssentialStory();
  outputResult(result, opts);
}

async function cmdOnDemand(opts: ParsedArgs): Promise<void> {
  const source = opts.positional[0];

  if (!source) {
    console.error(
      `${RED}Error: on-demand requires a source type argument.${RESET}\n` +
        `  Valid: ${VALID_SOURCES.join(", ")}\n` +
        `  Example: bun tools/ContextLoader.ts on-demand learning`
    );
    process.exit(1);
  }

  if (!VALID_SOURCES.includes(source as SourceType)) {
    console.error(
      `${RED}Error: Invalid source "${source}". Valid: ${VALID_SOURCES.join(", ")}${RESET}`
    );
    process.exit(1);
  }

  const result = await loadOnDemand(source as SourceType, opts.limit);
  outputResult(result, opts);
}

async function cmdSearch(opts: ParsedArgs): Promise<void> {
  const query = opts.positional.join(" ").trim();

  if (!query) {
    console.error(
      `${RED}Error: search requires a query argument.${RESET}\n` +
        `  Example: bun tools/ContextLoader.ts search "Traefik SSL setup"`
    );
    process.exit(1);
  }

  const result = await loadDeepSearch(query, opts.sources, opts.limit);
  outputResult(result, opts);
}

// ─── Output Helper ────────────────────────────────────────────────────────────

function outputResult(result: LayerResult, opts: ParsedArgs): void {
  if (opts.json) {
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
    return;
  }

  if (opts.tokensOnly) {
    process.stdout.write(formatLayerTokensOnly(result) + "\n");
    return;
  }

  process.stdout.write(formatLayerHuman(result) + "\n");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const opts = parseArgs(process.argv);

  try {
    switch (opts.command) {
      case "help":
        printHelp();
        break;

      case "wake":
        await cmdWake(opts);
        break;

      case "identity":
        await cmdIdentity(opts);
        break;

      case "essential":
        await cmdEssential(opts);
        break;

      case "on-demand":
        await cmdOnDemand(opts);
        break;

      case "search":
        await cmdSearch(opts);
        break;

      default:
        console.error(
          `${RED}Error: Unknown command "${opts.command}". Use "help" for usage.${RESET}`
        );
        process.exit(1);
    }

    process.exit(0);
  } catch (err) {
    console.error(
      `${RED}Error: ${err instanceof Error ? err.message : String(err)}${RESET}`
    );
    process.exit(1);
  }
}

main();
