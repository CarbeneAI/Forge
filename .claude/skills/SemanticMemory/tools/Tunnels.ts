#!/usr/bin/env bun
/**
 * Tunnels.ts - Cross-Project Tunnel Explorer for SemanticMemory
 *
 * Discovers connections between different knowledge source types that share
 * common topics. A tunnel links the same concept across sessions, learnings,
 * obsidian notes, research, etc.
 *
 * Usage:
 *   bun tools/Tunnels.ts discover <topic> [--min-sources N] [--limit N] [--json]
 *   bun tools/Tunnels.ts auto [--limit N] [--json]
 *   bun tools/Tunnels.ts bridges <sourceA> <sourceB> [--limit N] [--json]
 *   bun tools/Tunnels.ts stats [--json]
 *   bun tools/Tunnels.ts help
 */

import {
  discoverTunnels,
  autoDiscoverTunnels,
  findBridges,
  getTunnelStats,
} from "../src/tunnels.js";
import type { Tunnel, TunnelEndpoint, TunnelStats } from "../src/tunnels.js";
import type { SourceType } from "../src/types.js";

// ─── ANSI Color Codes ─────────────────────────────────────────────────────────

const C = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  dim:    "\x1b[2m",
  cyan:   "\x1b[36m",
  yellow: "\x1b[33m",
  green:  "\x1b[32m",
  blue:   "\x1b[34m",
  magenta:"\x1b[35m",
  red:    "\x1b[31m",
  white:  "\x1b[37m",
  gray:   "\x1b[90m",
};

// ─── Constants ────────────────────────────────────────────────────────────────

const VALID_SOURCES: SourceType[] = [
  "session", "learning", "research", "obsidian", "memory", "raw-output",
];

/** Icon per source type for human-readable display */
const SOURCE_ICON: Record<string, string> = {
  session:    "session",
  learning:   "learning",
  research:   "research",
  obsidian:   "obsidian",
  memory:     "memory",
  "raw-output": "raw-output",
};

/** Color per source type */
const SOURCE_COLOR: Record<string, string> = {
  session:    C.cyan,
  learning:   C.green,
  research:   C.blue,
  obsidian:   C.magenta,
  memory:     C.yellow,
  "raw-output": C.gray,
};

// ─── Help Text ────────────────────────────────────────────────────────────────

function printHelp(): void {
  console.log(`
${C.bold}${C.cyan}SemanticMemory Tunnels${C.reset}
${C.dim}Cross-source knowledge connection explorer${C.reset}

${C.bold}Usage:${C.reset}
  bun tools/Tunnels.ts ${C.yellow}discover${C.reset} <topic> [--min-sources N] [--limit N] [--json]
  bun tools/Tunnels.ts ${C.yellow}auto${C.reset} [--limit N] [--json]
  bun tools/Tunnels.ts ${C.yellow}bridges${C.reset} <sourceA> <sourceB> [--limit N] [--json]
  bun tools/Tunnels.ts ${C.yellow}stats${C.reset} [--json]
  bun tools/Tunnels.ts ${C.yellow}help${C.reset}

${C.bold}Commands:${C.reset}

  ${C.yellow}discover${C.reset} <topic>
    Find all sources that mention a specific topic using semantic search.
    Requires embedding access (uses OpenAI/Gemini).
    Options:
      --min-sources N   Minimum distinct sources to qualify as a tunnel (default: 2)
      --limit N         Max chunks per source in results (default: 3)
      --json            Output as JSON

  ${C.yellow}auto${C.reset}
    Auto-discover tunnels across all sources using lightweight SQL + text analysis.
    No embeddings needed. Finds the most connected terms in your knowledge base.
    Options:
      --limit N         Max tunnels to return (default: 10)
      --json            Output as JSON

  ${C.yellow}bridges${C.reset} <sourceA> <sourceB>
    Find topics that connect two specific source types.
    Options:
      --limit N         Max tunnels to return (default: 10)
      --json            Output as JSON

  ${C.yellow}stats${C.reset}
    Show interconnectedness statistics across all knowledge sources.
    Options:
      --json            Output as JSON

${C.bold}Source Types:${C.reset}
  ${VALID_SOURCES.join(", ")}

${C.bold}Examples:${C.reset}
  # Semantic topic discovery
  bun tools/Tunnels.ts discover "traefik ssl"

  # Auto-discover top 5 connected topics
  bun tools/Tunnels.ts auto --limit 5

  # Find topics linking sessions and obsidian notes
  bun tools/Tunnels.ts bridges session obsidian

  # See how connected your knowledge base is
  bun tools/Tunnels.ts stats

  # JSON output for scripting
  bun tools/Tunnels.ts auto --json | jq '.[0]'
`.trim());
}

// ─── Path Shortener ───────────────────────────────────────────────────────────

function shortenPath(path: string): string {
  const home = process.env.HOME || "/home/youruser";
  return path.startsWith(home) ? "~" + path.slice(home.length) : path;
}

// ─── Strength Bar ─────────────────────────────────────────────────────────────

function strengthBar(strength: number, width = 12): string {
  const filled = Math.round(strength * width);
  const bar = "█".repeat(filled) + "░".repeat(width - filled);
  const pct = Math.round(strength * 100);
  const color = strength >= 0.6 ? C.green : strength >= 0.35 ? C.yellow : C.red;
  return `${color}${bar}${C.reset} ${C.bold}${pct}%${C.reset}`;
}

// ─── Format: Single Tunnel (discover / bridge entry) ─────────────────────────

function formatTunnel(tunnel: Tunnel, index?: number): string {
  const lines: string[] = [];

  const distinctSources = [...new Set(tunnel.sources.map((e) => e.source))];
  const header = index !== undefined
    ? `${C.bold}${C.cyan}${index + 1}. "${tunnel.topic}"${C.reset}`
    : `${C.bold}${C.cyan}Tunnel: "${tunnel.topic}"${C.reset}`;

  lines.push(`\n${C.dim}${"═".repeat(60)}${C.reset}`);
  lines.push(`${header}`);
  lines.push(
    `Strength: ${strengthBar(tunnel.strength)} ${C.dim}(${distinctSources.length} source${distinctSources.length !== 1 ? "s" : ""} connected)${C.reset}`
  );
  lines.push("");

  if (tunnel.sources.length === 0) {
    lines.push(`  ${C.dim}No matching chunks found.${C.reset}`);
    return lines.join("\n");
  }

  // Group endpoints by source for clean display
  const bySource = new Map<SourceType, TunnelEndpoint[]>();
  for (const ep of tunnel.sources) {
    const bucket = bySource.get(ep.source) ?? [];
    bucket.push(ep);
    bySource.set(ep.source, bucket);
  }

  for (const [src, eps] of bySource) {
    const color = SOURCE_COLOR[src] ?? C.white;
    const icon = SOURCE_ICON[src] ?? src;
    for (const ep of eps) {
      const displayPath = shortenPath(ep.path);
      const scoreStr = `${C.dim}score: ${ep.score.toFixed(2)}${C.reset}`;
      lines.push(
        `  ${color}${C.bold}${icon}${C.reset}  ${C.dim}${displayPath}:${ep.startLine}-${ep.endLine}${C.reset}  ${scoreStr}`
      );
      // Wrap snippet at 72 chars with indentation
      const snippet = ep.snippet.replace(/\s+/g, " ").trim();
      for (const wrapped of wordWrap(snippet, 68)) {
        lines.push(`     ${C.dim}"${wrapped}"${C.reset}`);
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}

// ─── Format: discover command output ─────────────────────────────────────────

function formatDiscoverOutput(tunnel: Tunnel): string {
  const lines: string[] = [];
  lines.push(formatTunnel(tunnel));

  const distinctSources = [...new Set(tunnel.sources.map((e) => e.source))];
  if (distinctSources.length < 2) {
    lines.push(
      `\n${C.yellow}No tunnel found.${C.reset} This topic only appears in ${distinctSources.length} source type.\n` +
      `Try lowering ${C.dim}--min-sources${C.reset} or broadening the topic.`
    );
  }

  return lines.join("\n");
}

// ─── Format: auto command output ─────────────────────────────────────────────

function formatAutoOutput(tunnels: Tunnel[]): string {
  const lines: string[] = [];

  lines.push(`\n${C.bold}${C.cyan}Auto-Discovered Tunnels${C.reset}`);
  lines.push(`${C.dim}Found ${tunnels.length} cross-source connection${tunnels.length !== 1 ? "s" : ""}${C.reset}`);

  if (tunnels.length === 0) {
    lines.push(
      `\n${C.yellow}No tunnels found.${C.reset} Your index may be empty or have too few shared terms.\n` +
      `Run: ${C.dim}bun tools/IndexManager.ts sync${C.reset}`
    );
    return lines.join("\n");
  }

  for (let i = 0; i < tunnels.length; i++) {
    const t = tunnels[i];
    const distinctSources = [...new Set(t.sources.map((e) => e.source))];
    const srcList = distinctSources
      .map((s) => `${SOURCE_COLOR[s] ?? C.white}${s}${C.reset}`)
      .join(` ${C.dim}↔${C.reset} `);

    lines.push(`\n${C.bold}${i + 1}.${C.reset} ${C.cyan}"${t.topic}"${C.reset}`);
    lines.push(`   Strength: ${strengthBar(t.strength, 8)}`);
    lines.push(`   Sources:  ${srcList}`);

    // Show first snippet from each source
    const seen = new Set<string>();
    for (const ep of t.sources) {
      if (seen.has(ep.source)) continue;
      seen.add(ep.source);
      const color = SOURCE_COLOR[ep.source] ?? C.white;
      const snippet = ep.snippet.replace(/\s+/g, " ").trim().slice(0, 100);
      lines.push(`   ${color}${C.dim}${ep.source}:${C.reset} ${C.dim}"${snippet}..."${C.reset}`);
    }
  }

  lines.push(`\n${C.dim}Use ${C.reset}${C.bold}discover <topic>${C.dim} for detailed endpoints on any tunnel above.${C.reset}`);
  return lines.join("\n");
}

// ─── Format: bridges command output ──────────────────────────────────────────

function formatBridgesOutput(
  sourceA: SourceType,
  sourceB: SourceType,
  tunnels: Tunnel[]
): string {
  const lines: string[] = [];
  const colorA = SOURCE_COLOR[sourceA] ?? C.white;
  const colorB = SOURCE_COLOR[sourceB] ?? C.white;

  lines.push(
    `\n${C.bold}${C.cyan}Bridges: ${colorA}${sourceA}${C.reset}${C.cyan} ↔ ${colorB}${sourceB}${C.reset}`
  );
  lines.push(
    `${C.dim}${tunnels.length} shared topic${tunnels.length !== 1 ? "s" : ""} found${C.reset}`
  );

  if (tunnels.length === 0) {
    lines.push(
      `\n${C.yellow}No bridges found.${C.reset} These source types share no common terms (freq >= 3).`
    );
    return lines.join("\n");
  }

  for (let i = 0; i < tunnels.length; i++) {
    lines.push(formatTunnel(tunnels[i], i));
  }

  return lines.join("\n");
}

// ─── Format: stats command output ────────────────────────────────────────────

function formatStatsOutput(stats: TunnelStats): string {
  const lines: string[] = [];

  lines.push(`\n${C.bold}${C.cyan}Tunnel Statistics${C.reset}`);
  lines.push(`${C.dim}Knowledge source interconnectedness report${C.reset}`);
  lines.push("");

  lines.push(`${C.bold}Sources with indexed content:${C.reset} ${stats.totalSources}`);
  if (stats.sourcesWithChunks.length > 0) {
    for (const src of stats.sourcesWithChunks) {
      const color = SOURCE_COLOR[src] ?? C.white;
      lines.push(`  ${color}${src}${C.reset}`);
    }
  } else {
    lines.push(`  ${C.dim}(none — index may be empty)${C.reset}`);
  }

  lines.push("");
  lines.push(`${C.bold}Top shared terms across sources:${C.reset}`);

  if (stats.topSharedTerms.length === 0) {
    lines.push(`  ${C.dim}No shared terms found. Index may be too sparse.${C.reset}`);
  } else {
    const maxCount = stats.topSharedTerms[0]?.count ?? 1;
    for (let i = 0; i < stats.topSharedTerms.length; i++) {
      const { term, sources, count } = stats.topSharedTerms[i];
      const barLen = Math.round((count / maxCount) * 20);
      const bar = `${C.green}${"▪".repeat(barLen)}${C.reset}${C.dim}${"·".repeat(20 - barLen)}${C.reset}`;
      const srcLabels = sources
        .map((s) => `${SOURCE_COLOR[s] ?? C.white}${s}${C.reset}`)
        .join(", ");
      lines.push(
        `  ${String(i + 1).padStart(2)}. ${C.bold}${term.padEnd(20)}${C.reset} ${bar} ${C.dim}${count} occurrences — ${C.reset}${srcLabels}`
      );
    }
  }

  lines.push("");
  lines.push(
    `${C.dim}Tip: Run ${C.reset}${C.bold}auto${C.dim} to explore these terms as full tunnels, or${C.reset}`
  );
  lines.push(
    `${C.dim}     ${C.reset}${C.bold}bridges session learning${C.dim} to focus on a specific pair.${C.reset}`
  );

  return lines.join("\n");
}

// ─── Word Wrap ────────────────────────────────────────────────────────────────

function wordWrap(text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (current.length + word.length + 1 > maxWidth && current.length > 0) {
      lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// ─── Argument Parser ──────────────────────────────────────────────────────────

type Command = "discover" | "auto" | "bridges" | "stats" | "help";

interface ParsedArgs {
  command: Command;
  topic?: string;
  sourceA?: SourceType;
  sourceB?: SourceType;
  minSources: number;
  limit: number;
  json: boolean;
}

function parseArgs(): ParsedArgs {
  const args = process.argv.slice(2);

  if (
    args.length === 0 ||
    args[0] === "help" ||
    args[0] === "--help" ||
    args[0] === "-h"
  ) {
    return { command: "help", minSources: 2, limit: 10, json: false };
  }

  const cmd = args[0] as Command;
  if (!["discover", "auto", "bridges", "stats", "help"].includes(cmd)) {
    console.error(
      `Error: Unknown command "${cmd}". Valid commands: discover, auto, bridges, stats, help`
    );
    process.exit(1);
  }

  let topic: string | undefined;
  let sourceA: SourceType | undefined;
  let sourceB: SourceType | undefined;
  let minSources = 2;
  let limit = cmd === "auto" || cmd === "bridges" ? 10 : 3;
  let json = false;

  let i = 1; // skip command token

  // Positional args come before flags
  if (cmd === "discover") {
    if (args[i] && !args[i].startsWith("--")) {
      topic = args[i++];
    }
    if (!topic) {
      console.error("Error: discover requires a <topic> argument.");
      process.exit(1);
    }
  } else if (cmd === "bridges") {
    if (args[i] && !args[i].startsWith("--")) sourceA = args[i++] as SourceType;
    if (args[i] && !args[i].startsWith("--")) sourceB = args[i++] as SourceType;
    if (!sourceA || !sourceB) {
      console.error("Error: bridges requires <sourceA> and <sourceB> arguments.");
      console.error(`  Valid sources: ${VALID_SOURCES.join(", ")}`);
      process.exit(1);
    }
    if (!VALID_SOURCES.includes(sourceA)) {
      console.error(`Error: Unknown source type "${sourceA}". Valid: ${VALID_SOURCES.join(", ")}`);
      process.exit(1);
    }
    if (!VALID_SOURCES.includes(sourceB)) {
      console.error(`Error: Unknown source type "${sourceB}". Valid: ${VALID_SOURCES.join(", ")}`);
      process.exit(1);
    }
    if (sourceA === sourceB) {
      console.error("Error: sourceA and sourceB must be different.");
      process.exit(1);
    }
  }

  // Parse flags
  while (i < args.length) {
    const arg = args[i];

    if (arg === "--min-sources" && i + 1 < args.length) {
      minSources = parseInt(args[++i], 10);
      if (isNaN(minSources) || minSources < 2) {
        console.error("Error: --min-sources must be an integer >= 2");
        process.exit(1);
      }
    } else if (arg === "--limit" && i + 1 < args.length) {
      limit = parseInt(args[++i], 10);
      if (isNaN(limit) || limit < 1) {
        console.error("Error: --limit must be a positive integer");
        process.exit(1);
      }
    } else if (arg === "--json") {
      json = true;
    } else {
      console.error(`Error: Unknown option "${arg}". Use help for usage.`);
      process.exit(1);
    }

    i++;
  }

  return { command: cmd, topic, sourceA, sourceB, minSources, limit, json };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const opts = parseArgs();

  if (opts.command === "help") {
    printHelp();
    process.exit(0);
  }

  try {
    switch (opts.command) {
      case "discover": {
        if (!opts.topic) {
          console.error("Error: discover requires a topic.");
          process.exit(1);
        }
        const tunnel = await discoverTunnels(opts.topic, opts.minSources, opts.limit);
        if (opts.json) {
          console.log(JSON.stringify(tunnelToJson(tunnel), null, 2));
        } else {
          console.log(formatDiscoverOutput(tunnel));
        }
        break;
      }

      case "auto": {
        const tunnels = await autoDiscoverTunnels(opts.limit);
        if (opts.json) {
          console.log(JSON.stringify(tunnels.map(tunnelToJson), null, 2));
        } else {
          console.log(formatAutoOutput(tunnels));
        }
        break;
      }

      case "bridges": {
        if (!opts.sourceA || !opts.sourceB) {
          console.error("Error: bridges requires sourceA and sourceB.");
          process.exit(1);
        }
        const tunnels = await findBridges(opts.sourceA, opts.sourceB, opts.limit);
        if (opts.json) {
          console.log(JSON.stringify(tunnels.map(tunnelToJson), null, 2));
        } else {
          console.log(formatBridgesOutput(opts.sourceA, opts.sourceB, tunnels));
        }
        break;
      }

      case "stats": {
        const stats = await getTunnelStats();
        if (opts.json) {
          console.log(JSON.stringify(statsToJson(stats), null, 2));
        } else {
          console.log(formatStatsOutput(stats));
        }
        break;
      }
    }

    process.exit(0);
  } catch (err) {
    console.error(
      `${C.red}Error:${C.reset} ${err instanceof Error ? err.message : String(err)}`
    );
    process.exit(1);
  }
}

// ─── JSON Serialization ───────────────────────────────────────────────────────

function tunnelToJson(t: Tunnel) {
  return {
    topic: t.topic,
    strength: Number(t.strength.toFixed(4)),
    distinctSources: [...new Set(t.sources.map((e) => e.source))],
    sourceCount: new Set(t.sources.map((e) => e.source)).size,
    endpoints: t.sources.map((ep) => ({
      source: ep.source,
      chunkId: ep.chunkId,
      path: shortenPath(ep.path),
      startLine: ep.startLine,
      endLine: ep.endLine,
      snippet: ep.snippet,
      score: Number(ep.score.toFixed(4)),
    })),
  };
}

function statsToJson(s: TunnelStats) {
  return {
    totalSources: s.totalSources,
    sourcesWithChunks: s.sourcesWithChunks,
    topSharedTerms: s.topSharedTerms,
  };
}

// ─── Entry Point ──────────────────────────────────────────────────────────────

main();
