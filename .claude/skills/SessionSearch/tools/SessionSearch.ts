#!/usr/bin/env bun
/**
 * SessionSearch.ts - Search PAI session history
 *
 * Search events and tool outputs from PAI history by keyword, tool, date, or session.
 */

import { existsSync, readdirSync, readFileSync } from "fs";
import { join, basename } from "path";

const PAI_DIR = process.env.PAI_DIR || `${process.env.HOME}/.claude`;
const HISTORY_DIR = join(PAI_DIR, "history", "raw-outputs");

interface SearchOptions {
  keyword?: string;
  tool?: string;
  dateFrom?: string;
  dateTo?: string;
  sessionId?: string;
  eventType?: string;
  limit: number;
  output: "text" | "json";
  timeline: boolean;
  cwd?: string;
}

interface PAIEvent {
  source_app: string;
  session_id: string;
  hook_event_type: string;
  payload: Record<string, unknown>;
  timestamp: number;
  timestamp_pst: string;
}

interface SearchResult {
  event: PAIEvent;
  file: string;
  matchContext?: string;
}

function parseArgs(): SearchOptions {
  const args = process.argv.slice(2);
  const options: SearchOptions = {
    limit: 50,
    output: "text",
    timeline: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case "--keyword":
      case "-k":
        options.keyword = next;
        i++;
        break;
      case "--tool":
      case "-t":
        options.tool = next;
        i++;
        break;
      case "--date-from":
        options.dateFrom = next;
        i++;
        break;
      case "--date-to":
        options.dateTo = next;
        i++;
        break;
      case "--session-id":
      case "-s":
        options.sessionId = next;
        i++;
        break;
      case "--event-type":
      case "-e":
        options.eventType = next;
        i++;
        break;
      case "--limit":
      case "-l":
        options.limit = parseInt(next, 10);
        i++;
        break;
      case "--output":
      case "-o":
        options.output = next as "text" | "json";
        i++;
        break;
      case "--timeline":
        options.timeline = true;
        break;
      case "--cwd":
        options.cwd = next;
        i++;
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
SessionSearch - Search PAI session history

USAGE:
  bun SessionSearch.ts [options]

OPTIONS:
  -k, --keyword <term>     Search for keyword in event payloads
  -t, --tool <name>        Filter by tool name (Bash, Read, Edit, etc.)
  --date-from <YYYY-MM-DD> Start date for search range
  --date-to <YYYY-MM-DD>   End date for search range
  -s, --session-id <id>    Get all events for specific session
  -e, --event-type <type>  Filter by event type (SessionStart, PostToolUse, etc.)
  --cwd <path>             Filter by working directory (partial match)
  -l, --limit <n>          Maximum results (default: 50)
  -o, --output <format>    Output format: text or json (default: text)
  --timeline               Show results as timeline
  -h, --help               Show this help

EXAMPLES:
  # Search for "discord" mentions
  bun SessionSearch.ts --keyword discord

  # Find all Bash tool uses
  bun SessionSearch.ts --tool Bash --limit 20

  # Sessions in date range
  bun SessionSearch.ts --date-from 2026-01-15 --date-to 2026-01-20

  # Specific session details
  bun SessionSearch.ts --session-id abc123-def456

  # Timeline view
  bun SessionSearch.ts --timeline --date-from 2026-01-01
`);
}

function getMonthDirs(): string[] {
  if (!existsSync(HISTORY_DIR)) {
    return [];
  }
  return readdirSync(HISTORY_DIR)
    .filter((dir) => /^\d{4}-\d{2}$/.test(dir))
    .sort();
}

function getEventFiles(options: SearchOptions): string[] {
  const monthDirs = getMonthDirs();
  const files: string[] = [];

  for (const monthDir of monthDirs) {
    // Check if month is in date range
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

function matchesFilters(event: PAIEvent, options: SearchOptions): boolean {
  // Session ID filter
  if (options.sessionId && !event.session_id.includes(options.sessionId)) {
    return false;
  }

  // Event type filter
  if (options.eventType && event.hook_event_type !== options.eventType) {
    return false;
  }

  // Tool filter
  if (options.tool) {
    const toolName = event.payload?.tool_name as string | undefined;
    if (!toolName || !toolName.toLowerCase().includes(options.tool.toLowerCase())) {
      return false;
    }
  }

  // Working directory filter
  if (options.cwd) {
    const cwd = event.payload?.cwd as string | undefined;
    if (!cwd || !cwd.toLowerCase().includes(options.cwd.toLowerCase())) {
      return false;
    }
  }

  // Keyword filter (search in payload JSON)
  if (options.keyword) {
    const payloadStr = JSON.stringify(event.payload).toLowerCase();
    if (!payloadStr.includes(options.keyword.toLowerCase())) {
      return false;
    }
  }

  return true;
}

function searchHistory(options: SearchOptions): SearchResult[] {
  const files = getEventFiles(options);
  const results: SearchResult[] = [];

  for (const file of files) {
    if (results.length >= options.limit) break;

    const content = readFileSync(file, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);

    for (const line of lines) {
      if (results.length >= options.limit) break;

      try {
        const event = JSON.parse(line) as PAIEvent;
        if (matchesFilters(event, options)) {
          results.push({
            event,
            file: basename(file),
            matchContext: options.keyword
              ? extractMatchContext(event.payload, options.keyword)
              : undefined,
          });
        }
      } catch {
        // Skip malformed lines
      }
    }
  }

  return results;
}

function extractMatchContext(
  payload: Record<string, unknown>,
  keyword: string
): string | undefined {
  const payloadStr = JSON.stringify(payload);
  const lowerPayload = payloadStr.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();
  const idx = lowerPayload.indexOf(lowerKeyword);

  if (idx === -1) return undefined;

  const start = Math.max(0, idx - 50);
  const end = Math.min(payloadStr.length, idx + keyword.length + 50);
  let context = payloadStr.substring(start, end);

  if (start > 0) context = "..." + context;
  if (end < payloadStr.length) context = context + "...";

  return context;
}

function formatResultsText(results: SearchResult[], options: SearchOptions): void {
  if (results.length === 0) {
    console.log("No results found.");
    return;
  }

  console.log(`\nFound ${results.length} results:\n`);

  if (options.timeline) {
    formatTimeline(results);
  } else {
    formatList(results);
  }
}

function formatList(results: SearchResult[]): void {
  for (const result of results) {
    const { event, matchContext } = result;
    console.log(`${event.timestamp_pst} [${event.hook_event_type}]`);
    console.log(`  Session: ${event.session_id.substring(0, 8)}...`);

    if (event.payload?.tool_name) {
      console.log(`  Tool: ${event.payload.tool_name}`);
    }
    if (event.payload?.cwd) {
      console.log(`  CWD: ${event.payload.cwd}`);
    }
    if (matchContext) {
      console.log(`  Match: ${matchContext}`);
    }
    console.log("");
  }
}

function formatTimeline(results: SearchResult[]): void {
  // Group by date
  const byDate = new Map<string, SearchResult[]>();

  for (const result of results) {
    const date = result.event.timestamp_pst.split(" ")[0];
    if (!byDate.has(date)) {
      byDate.set(date, []);
    }
    byDate.get(date)!.push(result);
  }

  // Sort dates descending
  const dates = Array.from(byDate.keys()).sort().reverse();

  for (const date of dates) {
    console.log(`\n${date}`);
    console.log("─".repeat(40));

    const dayResults = byDate.get(date)!;
    // Group by session
    const bySess = new Map<string, SearchResult[]>();
    for (const r of dayResults) {
      const sid = r.event.session_id;
      if (!bySess.has(sid)) bySess.set(sid, []);
      bySess.get(sid)!.push(r);
    }

    for (const [sessionId, sessResults] of bySess) {
      const first = sessResults[0].event;
      const time = first.timestamp_pst.split(" ")[1];
      const cwd = first.payload?.cwd as string | undefined;

      console.log(`├─ ${time} Session ${sessionId.substring(0, 8)}...`);
      if (cwd) console.log(`│  CWD: ${cwd}`);
      console.log(`│  Events: ${sessResults.length}`);

      // Show tool breakdown
      const tools = new Map<string, number>();
      for (const r of sessResults) {
        const tool = r.event.payload?.tool_name as string | undefined;
        if (tool) {
          tools.set(tool, (tools.get(tool) || 0) + 1);
        }
      }
      if (tools.size > 0) {
        const toolStr = Array.from(tools.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([t, c]) => `${t}(${c})`)
          .join(", ");
        console.log(`│  Tools: ${toolStr}`);
      }
    }
  }
}

function formatResultsJson(results: SearchResult[]): void {
  const output = results.map((r) => ({
    timestamp: r.event.timestamp_pst,
    timestamp_unix: r.event.timestamp,
    session_id: r.event.session_id,
    event_type: r.event.hook_event_type,
    tool: r.event.payload?.tool_name,
    cwd: r.event.payload?.cwd,
    match_context: r.matchContext,
    file: r.file,
  }));

  console.log(JSON.stringify(output, null, 2));
}

// Main
const options = parseArgs();

// Validate at least one filter
if (
  !options.keyword &&
  !options.tool &&
  !options.sessionId &&
  !options.eventType &&
  !options.dateFrom
) {
  console.error("Error: Please specify at least one search filter.");
  console.error("Use --help for usage information.");
  process.exit(1);
}

const results = searchHistory(options);

if (options.output === "json") {
  formatResultsJson(results);
} else {
  formatResultsText(results, options);
}
