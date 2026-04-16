#!/usr/bin/env bun
/**
 * CostAnalyzer.ts - Analyze PAI session activity and estimate costs
 *
 * Note: Actual token counts are not stored in PAI history.
 * This provides activity-based estimates. For accurate billing, use Anthropic Console.
 */

import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";

const PAI_DIR = process.env.PAI_DIR || `${process.env.HOME}/.claude`;
const HISTORY_DIR = join(PAI_DIR, "history", "raw-outputs");

interface AnalyzerOptions {
  period: "day" | "week" | "month" | "custom";
  dateFrom?: string;
  dateTo?: string;
  output: "text" | "json";
}

interface SessionStats {
  sessionId: string;
  startTime: string;
  endTime?: string;
  toolCount: number;
  subagentCount: number;
  promptCount: number;
  duration?: number; // minutes
}

interface DailyActivity {
  date: string;
  sessions: number;
  tools: number;
  subagents: number;
  prompts: number;
}

function parseArgs(): AnalyzerOptions {
  const args = process.argv.slice(2);
  const options: AnalyzerOptions = {
    period: "month",
    output: "text",
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case "--period":
      case "-p":
        options.period = next as "day" | "week" | "month" | "custom";
        i++;
        break;
      case "--date-from":
        options.dateFrom = next;
        options.period = "custom";
        i++;
        break;
      case "--date-to":
        options.dateTo = next;
        options.period = "custom";
        i++;
        break;
      case "--output":
      case "-o":
        options.output = next as "text" | "json";
        i++;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
    }
  }

  // Set date range based on period
  const today = new Date();
  if (!options.dateFrom) {
    switch (options.period) {
      case "day":
        options.dateFrom = today.toISOString().split("T")[0];
        break;
      case "week":
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        options.dateFrom = weekAgo.toISOString().split("T")[0];
        break;
      case "month":
        options.dateFrom = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
        break;
    }
  }
  if (!options.dateTo) {
    options.dateTo = today.toISOString().split("T")[0];
  }

  return options;
}

function printHelp(): void {
  console.log(`
CostAnalyzer - Analyze PAI session activity

USAGE:
  bun CostAnalyzer.ts [options]

OPTIONS:
  -p, --period <type>       Period: day, week, month (default: month)
  --date-from <YYYY-MM-DD>  Start date (sets period to custom)
  --date-to <YYYY-MM-DD>    End date
  -o, --output <format>     Output: text or json (default: text)
  -h, --help                Show this help

EXAMPLES:
  # This month's activity
  bun CostAnalyzer.ts

  # Today only
  bun CostAnalyzer.ts --period day

  # Last 7 days
  bun CostAnalyzer.ts --period week

  # Custom range
  bun CostAnalyzer.ts --date-from 2026-01-01 --date-to 2026-01-15

NOTE:
  PAI history does not capture actual token counts. This tool provides
  activity metrics. For accurate billing, use Anthropic Console.
`);
}

function getEventFiles(options: AnalyzerOptions): string[] {
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

function analyzeActivity(options: AnalyzerOptions): {
  sessions: Map<string, SessionStats>;
  daily: Map<string, DailyActivity>;
  totals: { sessions: number; tools: number; subagents: number; prompts: number };
} {
  const files = getEventFiles(options);
  const sessions = new Map<string, SessionStats>();
  const daily = new Map<string, DailyActivity>();
  const totals = { sessions: 0, tools: 0, subagents: 0, prompts: 0 };

  for (const file of files) {
    const date = file.split("/").pop()!.split("_")[0];
    const content = readFileSync(file, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);

    if (!daily.has(date)) {
      daily.set(date, { date, sessions: 0, tools: 0, subagents: 0, prompts: 0 });
    }
    const dayStats = daily.get(date)!;

    for (const line of lines) {
      try {
        const event = JSON.parse(line);
        const sessionId = event.session_id;

        // Initialize session if needed
        if (!sessions.has(sessionId)) {
          sessions.set(sessionId, {
            sessionId,
            startTime: event.timestamp_pst,
            toolCount: 0,
            subagentCount: 0,
            promptCount: 0,
          });
        }
        const sess = sessions.get(sessionId)!;

        switch (event.hook_event_type) {
          case "SessionStart":
            sess.startTime = event.timestamp_pst;
            dayStats.sessions++;
            totals.sessions++;
            break;

          case "SessionEnd":
          case "Stop":
            sess.endTime = event.timestamp_pst;
            // Calculate duration
            if (sess.startTime && sess.endTime) {
              const start = new Date(sess.startTime.replace(" PST", ""));
              const end = new Date(sess.endTime.replace(" PST", ""));
              sess.duration = (end.getTime() - start.getTime()) / 1000 / 60;
            }
            break;

          case "PostToolUse":
            sess.toolCount++;
            dayStats.tools++;
            totals.tools++;
            break;

          case "SubagentStop":
            sess.subagentCount++;
            dayStats.subagents++;
            totals.subagents++;
            break;

          case "UserPromptSubmit":
            sess.promptCount++;
            dayStats.prompts++;
            totals.prompts++;
            break;
        }
      } catch {
        // Skip malformed lines
      }
    }
  }

  return { sessions, daily, totals };
}

function formatTextOutput(
  options: AnalyzerOptions,
  sessions: Map<string, SessionStats>,
  daily: Map<string, DailyActivity>,
  totals: { sessions: number; tools: number; subagents: number; prompts: number }
): void {
  console.log("\nPAI Activity Analysis");
  console.log("=".repeat(50));
  console.log(`Period: ${options.dateFrom} to ${options.dateTo}`);
  console.log("");

  // Summary
  console.log("Summary:");
  console.log(`  Sessions: ${totals.sessions}`);
  console.log(`  Tool Invocations: ${totals.tools.toLocaleString()}`);
  console.log(`  Subagent Spawns: ${totals.subagents}`);
  console.log(`  User Prompts: ${totals.prompts}`);
  console.log("");

  // Activity level indicator
  const avgToolsPerSession = totals.tools / Math.max(totals.sessions, 1);
  let activityLevel = "LOW";
  if (avgToolsPerSession > 100) activityLevel = "HIGH";
  else if (avgToolsPerSession > 50) activityLevel = "MODERATE";

  console.log(`Activity Level: ${activityLevel} (${avgToolsPerSession.toFixed(1)} tools/session avg)`);
  console.log("");

  // Daily breakdown (last 7 days)
  console.log("Daily Activity (recent):");
  const dates = Array.from(daily.keys()).sort().reverse().slice(0, 7);
  for (const date of dates) {
    const d = daily.get(date)!;
    console.log(`  ${date}: ${d.sessions} sessions, ${d.tools} tools, ${d.subagents} subagents`);
  }
  console.log("");

  // Most active sessions
  console.log("Most Active Sessions (by tool count):");
  const sortedSessions = Array.from(sessions.values())
    .sort((a, b) => b.toolCount - a.toolCount)
    .slice(0, 5);

  for (let i = 0; i < sortedSessions.length; i++) {
    const s = sortedSessions[i];
    const duration = s.duration ? `(${Math.round(s.duration)}m)` : "";
    console.log(
      `  ${i + 1}. ${s.sessionId.substring(0, 8)}... - ${s.toolCount} tools, ${s.subagentCount} subagents ${duration}`
    );
  }
  console.log("");

  // Cost disclaimer
  console.log("Note: Actual token usage not tracked in PAI history.");
  console.log("For billing details, visit: https://console.anthropic.com/settings/usage");
}

function formatJsonOutput(
  options: AnalyzerOptions,
  sessions: Map<string, SessionStats>,
  daily: Map<string, DailyActivity>,
  totals: { sessions: number; tools: number; subagents: number; prompts: number }
): void {
  const output = {
    period: {
      from: options.dateFrom,
      to: options.dateTo,
    },
    totals,
    daily: Array.from(daily.values()).sort((a, b) => b.date.localeCompare(a.date)),
    top_sessions: Array.from(sessions.values())
      .sort((a, b) => b.toolCount - a.toolCount)
      .slice(0, 10)
      .map((s) => ({
        session_id: s.sessionId,
        start_time: s.startTime,
        duration_minutes: s.duration ? Math.round(s.duration) : null,
        tools: s.toolCount,
        subagents: s.subagentCount,
        prompts: s.promptCount,
      })),
  };

  console.log(JSON.stringify(output, null, 2));
}

// Main
const options = parseArgs();
const { sessions, daily, totals } = analyzeActivity(options);

if (totals.sessions === 0) {
  console.log("No activity data found for the specified period.");
  process.exit(0);
}

if (options.output === "json") {
  formatJsonOutput(options, sessions, daily, totals);
} else {
  formatTextOutput(options, sessions, daily, totals);
}
