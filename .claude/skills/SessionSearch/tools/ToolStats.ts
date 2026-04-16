#!/usr/bin/env bun
/**
 * ToolStats.ts - Tool usage analytics for PAI sessions
 *
 * Analyze which tools are used most frequently and how usage patterns change over time.
 */

import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";

const PAI_DIR = process.env.PAI_DIR || `${process.env.HOME}/.claude`;
const HISTORY_DIR = join(PAI_DIR, "history", "raw-outputs");

interface StatsOptions {
  dateFrom?: string;
  dateTo?: string;
  tool?: string;
  groupBy: "total" | "day" | "week";
  output: "text" | "json";
  verbose: boolean;
}

interface ToolCount {
  tool: string;
  count: number;
  percentage: number;
}

interface DailyStats {
  date: string;
  total: number;
  tools: Map<string, number>;
}

function parseArgs(): StatsOptions {
  const args = process.argv.slice(2);
  const options: StatsOptions = {
    groupBy: "total",
    output: "text",
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case "--date-from":
        options.dateFrom = next;
        i++;
        break;
      case "--date-to":
        options.dateTo = next;
        i++;
        break;
      case "--tool":
      case "-t":
        options.tool = next;
        i++;
        break;
      case "--group-by":
      case "-g":
        options.groupBy = next as "total" | "day" | "week";
        i++;
        break;
      case "--output":
      case "-o":
        options.output = next as "text" | "json";
        i++;
        break;
      case "--verbose":
      case "-v":
        options.verbose = true;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
ToolStats - PAI tool usage analytics

USAGE:
  bun ToolStats.ts [options]

OPTIONS:
  --date-from <YYYY-MM-DD>  Start date for analysis
  --date-to <YYYY-MM-DD>    End date for analysis
  -t, --tool <name>         Deep-dive on specific tool
  -g, --group-by <type>     Grouping: total, day, week (default: total)
  -o, --output <format>     Output: text or json (default: text)
  -v, --verbose             Show detailed output
  -h, --help                Show this help

EXAMPLES:
  # All-time tool statistics
  bun ToolStats.ts

  # This month's stats
  bun ToolStats.ts --date-from $(date +%Y-%m-01)

  # Daily breakdown
  bun ToolStats.ts --group-by day --date-from 2026-01-15

  # Deep-dive on Bash usage
  bun ToolStats.ts --tool Bash --verbose
`);
}

function getEventFiles(options: StatsOptions): string[] {
  if (!existsSync(HISTORY_DIR)) {
    return [];
  }

  const monthDirs = readdirSync(HISTORY_DIR)
    .filter((dir) => /^\d{4}-\d{2}$/.test(dir))
    .sort();

  const files: string[] = [];

  for (const monthDir of monthDirs) {
    if (options.dateFrom && monthDir < options.dateFrom.substring(0, 7)) continue;
    if (options.dateTo && monthDir > options.dateTo.substring(0, 7)) continue;

    const monthPath = join(HISTORY_DIR, monthDir);
    const eventFiles = readdirSync(monthPath)
      .filter((f) => f.endsWith("_all-events.jsonl"))
      .sort();

    for (const file of eventFiles) {
      const date = file.split("_")[0];
      if (options.dateFrom && date < options.dateFrom) continue;
      if (options.dateTo && date > options.dateTo) continue;
      files.push(join(monthPath, file));
    }
  }

  return files;
}

function collectStats(options: StatsOptions): {
  totalTools: Map<string, number>;
  dailyStats: Map<string, DailyStats>;
  totalSessions: Set<string>;
} {
  const files = getEventFiles(options);
  const totalTools = new Map<string, number>();
  const dailyStats = new Map<string, DailyStats>();
  const totalSessions = new Set<string>();

  for (const file of files) {
    const date = file.split("/").pop()!.split("_")[0];
    const content = readFileSync(file, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);

    if (!dailyStats.has(date)) {
      dailyStats.set(date, { date, total: 0, tools: new Map() });
    }
    const dayStats = dailyStats.get(date)!;

    for (const line of lines) {
      try {
        const event = JSON.parse(line);

        // Track sessions
        if (event.hook_event_type === "SessionStart") {
          totalSessions.add(event.session_id);
        }

        // Only count PostToolUse events
        if (event.hook_event_type !== "PostToolUse") continue;

        const toolName = event.payload?.tool_name;
        if (!toolName) continue;

        // Filter by specific tool if requested
        if (options.tool && !toolName.toLowerCase().includes(options.tool.toLowerCase())) {
          continue;
        }

        // Update totals
        totalTools.set(toolName, (totalTools.get(toolName) || 0) + 1);

        // Update daily
        dayStats.total++;
        dayStats.tools.set(toolName, (dayStats.tools.get(toolName) || 0) + 1);
      } catch {
        // Skip malformed lines
      }
    }
  }

  return { totalTools, dailyStats, totalSessions };
}

function formatToolCounts(
  tools: Map<string, number>,
  total: number
): ToolCount[] {
  return Array.from(tools.entries())
    .map(([tool, count]) => ({
      tool,
      count,
      percentage: (count / total) * 100,
    }))
    .sort((a, b) => b.count - a.count);
}

function makeBar(percentage: number, maxWidth: number = 20): string {
  const filled = Math.round((percentage / 100) * maxWidth);
  return "█".repeat(filled);
}

function formatTextOutput(
  options: StatsOptions,
  totalTools: Map<string, number>,
  dailyStats: Map<string, DailyStats>,
  totalSessions: Set<string>
): void {
  const total = Array.from(totalTools.values()).reduce((a, b) => a + b, 0);
  const toolCounts = formatToolCounts(totalTools, total);

  // Header
  console.log("\nPAI Tool Usage Statistics");
  console.log("=".repeat(50));

  const dateRange = options.dateFrom || options.dateTo
    ? `${options.dateFrom || "start"} to ${options.dateTo || "now"}`
    : "All time";
  console.log(`Period: ${dateRange}`);
  console.log(`Total Tool Uses: ${total.toLocaleString()}`);
  console.log(`Total Sessions: ${totalSessions.size}`);
  console.log(`Average per Session: ${(total / totalSessions.size).toFixed(1)}`);
  console.log("");

  // Top tools
  console.log("Top 10 Tools:");
  const top10 = toolCounts.slice(0, 10);
  const maxNameLen = Math.max(...top10.map((t) => t.tool.length));

  for (let i = 0; i < top10.length; i++) {
    const t = top10[i];
    const num = `${i + 1}.`.padStart(3);
    const name = t.tool.padEnd(maxNameLen + 2);
    const count = t.count.toString().padStart(6);
    const pct = `(${t.percentage.toFixed(1)}%)`.padStart(8);
    const bar = makeBar(t.percentage);
    console.log(`${num} ${name} ${count} ${pct} ${bar}`);
  }

  // Daily trend if grouped by day
  if (options.groupBy === "day") {
    console.log("\nDaily Activity (last 7 days):");
    const dates = Array.from(dailyStats.keys()).sort().reverse().slice(0, 7);
    for (const date of dates) {
      const stats = dailyStats.get(date)!;
      console.log(`  ${date}: ${stats.total} tools`);
    }
  }

  // Verbose output
  if (options.verbose && options.tool) {
    console.log(`\n${options.tool} Usage Details:`);
    const toolData = toolCounts.find(
      (t) => t.tool.toLowerCase() === options.tool!.toLowerCase()
    );
    if (toolData) {
      console.log(`  Total uses: ${toolData.count}`);
      console.log(`  % of all tools: ${toolData.percentage.toFixed(2)}%`);

      // Daily breakdown for this tool
      console.log("\n  Daily breakdown:");
      const dates = Array.from(dailyStats.keys()).sort().reverse().slice(0, 14);
      for (const date of dates) {
        const dayTools = dailyStats.get(date)!.tools;
        const count = dayTools.get(options.tool) || 0;
        if (count > 0) {
          console.log(`    ${date}: ${count}`);
        }
      }
    }
  }
}

function formatJsonOutput(
  options: StatsOptions,
  totalTools: Map<string, number>,
  dailyStats: Map<string, DailyStats>,
  totalSessions: Set<string>
): void {
  const total = Array.from(totalTools.values()).reduce((a, b) => a + b, 0);
  const toolCounts = formatToolCounts(totalTools, total);

  const output = {
    period: {
      from: options.dateFrom || null,
      to: options.dateTo || null,
    },
    summary: {
      total_tool_uses: total,
      total_sessions: totalSessions.size,
      average_per_session: total / totalSessions.size,
    },
    tools: toolCounts,
    daily:
      options.groupBy === "day"
        ? Array.from(dailyStats.entries())
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([date, stats]) => ({
              date,
              total: stats.total,
              tools: Object.fromEntries(stats.tools),
            }))
        : undefined,
  };

  console.log(JSON.stringify(output, null, 2));
}

// Main
const options = parseArgs();
const { totalTools, dailyStats, totalSessions } = collectStats(options);

if (totalTools.size === 0) {
  console.log("No tool usage data found for the specified period.");
  process.exit(0);
}

if (options.output === "json") {
  formatJsonOutput(options, totalTools, dailyStats, totalSessions);
} else {
  formatTextOutput(options, totalTools, dailyStats, totalSessions);
}
