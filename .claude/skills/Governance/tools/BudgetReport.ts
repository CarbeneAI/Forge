#!/usr/bin/env bun
/**
 * BudgetReport.ts — PAI Agent Cost Tracking & Budget Comparison
 * Aggregates token/cost data from session history.
 * Usage: bun BudgetReport.ts [options]
 */

import { readdirSync, readFileSync, existsSync } from "fs";
import { join } from "path";

const HISTORY_DIR = join(import.meta.dir, "../../../history/raw-outputs");
const BUDGET_PATH = join(import.meta.dir, "../config/budgets.yml");

// --- Cost model (per million tokens) ---
const COST_TABLE: Record<string, { input: number; output: number }> = {
  opus: { input: 15.0, output: 75.0 },
  sonnet: { input: 3.0, output: 15.0 },
  haiku: { input: 0.25, output: 1.25 },
};

// --- Types ---
interface AgentUsage {
  agent: string;
  model: string;
  invocations: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
}

interface BudgetEntry {
  monthly_limit: number;
  description: string;
}

interface BudgetConfig {
  defaults: { monthly_limit: number; alert_threshold: number };
  agents: Record<string, BudgetEntry>;
}

// --- YAML parser for budget config ---
function parseBudgetConfig(content: string): BudgetConfig {
  const result: BudgetConfig = {
    defaults: { monthly_limit: 50, alert_threshold: 0.8 },
    agents: {},
  };
  const lines = content.split("\n");
  let section: "defaults" | "agents" | null = null;
  let currentAgent: string | null = null;

  for (const line of lines) {
    if (line.startsWith("#") || line.trim() === "") continue;
    if (line === "defaults:") { section = "defaults"; continue; }
    if (line === "agents:") { section = "agents"; continue; }

    if (section === "defaults") {
      const m = line.match(/^\s+(\w+):\s*([\d.]+)/);
      if (m) (result.defaults as Record<string, number>)[m[1]] = parseFloat(m[2]);
    }

    if (section === "agents") {
      const agentMatch = line.match(/^  (\w+):$/);
      if (agentMatch) { currentAgent = agentMatch[1]; result.agents[currentAgent] = { monthly_limit: result.defaults.monthly_limit, description: "" }; continue; }
      if (currentAgent) {
        const limMatch = line.match(/^\s+monthly_limit:\s*([\d.]+)/);
        if (limMatch) result.agents[currentAgent].monthly_limit = parseFloat(limMatch[1]);
        const descMatch = line.match(/^\s+description:\s*"([^"]*)"/);
        if (descMatch) result.agents[currentAgent].description = descMatch[1];
      }
    }
  }
  return result;
}

// --- Scan session history ---
function getDateDirs(period: string): string[] {
  const now = new Date();
  const dirs: string[] = [];

  if (period === "month") {
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    dirs.push(month);
  } else if (period === "week") {
    for (let i = 0; i < 7; i++) {
      const d = new Date(now.getTime() - i * 86400000);
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!dirs.includes(month)) dirs.push(month);
    }
  } else if (period === "day") {
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    dirs.push(month);
  }
  return dirs;
}

function scanHistory(period: string, filterAgent?: string): Map<string, AgentUsage> {
  const usage = new Map<string, AgentUsage>();
  const dateDirs = getDateDirs(period);

  for (const dirName of dateDirs) {
    const dirPath = join(HISTORY_DIR, dirName);
    if (!existsSync(dirPath)) continue;

    const files = readdirSync(dirPath).filter((f) => f.endsWith(".jsonl"));
    for (const file of files) {
      const filePath = join(dirPath, file);
      try {
        const content = readFileSync(filePath, "utf-8");
        for (const line of content.split("\n")) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);
            // Look for agent/subagent invocations
            const agent = event.subagent_type || event.agent || event.agentName || null;
            if (!agent) continue;
            if (filterAgent && agent.toLowerCase() !== filterAgent.toLowerCase()) continue;

            const model = event.model || event.modelId || "sonnet";
            const key = `${agent}|${model}`;

            if (!usage.has(key)) {
              usage.set(key, {
                agent,
                model: model.includes("opus") ? "opus" : model.includes("haiku") ? "haiku" : "sonnet",
                invocations: 0,
                inputTokens: 0,
                outputTokens: 0,
                estimatedCost: 0,
              });
            }

            const u = usage.get(key)!;
            u.invocations++;
            u.inputTokens += event.inputTokens || event.input_tokens || 0;
            u.outputTokens += event.outputTokens || event.output_tokens || 0;
          } catch { /* skip malformed lines */ }
        }
      } catch { /* skip unreadable files */ }
    }
  }

  // Calculate costs
  for (const u of usage.values()) {
    const rates = COST_TABLE[u.model] || COST_TABLE.sonnet;
    u.estimatedCost = (u.inputTokens / 1_000_000) * rates.input + (u.outputTokens / 1_000_000) * rates.output;
  }

  return usage;
}

// --- Display ---
function formatCurrency(n: number): string {
  return `$${n.toFixed(2)}`;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function printTable(usage: Map<string, AgentUsage>): void {
  const sorted = [...usage.values()].sort((a, b) => b.estimatedCost - a.estimatedCost);
  if (sorted.length === 0) {
    console.log("\nNo agent usage data found for this period.");
    console.log("Note: Raw JSONL event logs in history/raw-outputs/ are scanned for agent invocations.");
    return;
  }

  console.log("\nPAI Agent Usage Report\n" + "=".repeat(80));
  console.log(
    "  Agent".padEnd(20) +
    "Model".padEnd(10) +
    "Invocations".padEnd(14) +
    "Input Tok".padEnd(12) +
    "Output Tok".padEnd(12) +
    "Est. Cost"
  );
  console.log("-".repeat(80));

  let totalCost = 0;
  for (const u of sorted) {
    console.log(
      `  ${u.agent}`.padEnd(20) +
      u.model.padEnd(10) +
      String(u.invocations).padEnd(14) +
      formatTokens(u.inputTokens).padEnd(12) +
      formatTokens(u.outputTokens).padEnd(12) +
      formatCurrency(u.estimatedCost)
    );
    totalCost += u.estimatedCost;
  }

  console.log("-".repeat(80));
  console.log("  TOTAL".padEnd(58) + formatCurrency(totalCost));
  console.log();
}

function printBudgetComparison(usage: Map<string, AgentUsage>, config: BudgetConfig): void {
  // Aggregate by agent name (across models)
  const byAgent = new Map<string, number>();
  for (const u of usage.values()) {
    byAgent.set(u.agent, (byAgent.get(u.agent) || 0) + u.estimatedCost);
  }

  console.log("\nPAI Budget vs Actual\n" + "=".repeat(90));
  console.log(
    "  Agent".padEnd(18) +
    "Limit".padEnd(10) +
    "Actual".padEnd(10) +
    "Remaining".padEnd(12) +
    "Used".padEnd(8) +
    "Status"
  );
  console.log("-".repeat(90));

  // Show all budgeted agents, even if no usage
  const allAgents = new Set([...Object.keys(config.agents), ...byAgent.keys()]);
  const sorted = [...allAgents].sort();

  for (const agent of sorted) {
    const limit = config.agents[agent]?.monthly_limit ?? config.defaults.monthly_limit;
    const actual = byAgent.get(agent) || 0;
    const remaining = limit - actual;
    const pct = limit > 0 ? actual / limit : 0;
    const status = pct >= 1.0 ? "EXCEEDED" : pct >= config.defaults.alert_threshold ? "WARNING" : "OK";

    console.log(
      `  ${agent}`.padEnd(18) +
      formatCurrency(limit).padEnd(10) +
      formatCurrency(actual).padEnd(10) +
      formatCurrency(remaining).padEnd(12) +
      `${(pct * 100).toFixed(0)}%`.padEnd(8) +
      status
    );
  }
  console.log();
}

function printJson(usage: Map<string, AgentUsage>): void {
  console.log(JSON.stringify([...usage.values()], null, 2));
}

function printHelp(): void {
  console.log(`
PAI Budget Report — Agent cost tracking and budget comparison

USAGE:
  bun BudgetReport.ts [options]

OPTIONS:
  --period <month|week|day>    Time period to report on (default: month)
  --agent <name>               Filter to specific agent
  --budget                     Show budget vs actual comparison
  --format <table|json>        Output format (default: table)
  --help                       Show this help

COST MODEL:
  Opus:   $15.00/MTok input, $75.00/MTok output
  Sonnet: $3.00/MTok input,  $15.00/MTok output
  Haiku:  $0.25/MTok input,  $1.25/MTok output

DATA SOURCE:
  ${HISTORY_DIR}

BUDGET CONFIG:
  ${BUDGET_PATH}

EXAMPLES:
  bun BudgetReport.ts
  bun BudgetReport.ts --budget
  bun BudgetReport.ts --agent hiram --period week
  bun BudgetReport.ts --format json
`);
}

// --- Arg parsing ---
function parseArgs(): Record<string, string | boolean> {
  const result: Record<string, string | boolean> = {};
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--help" || args[i] === "-h") { result["help"] = true; continue; }
    if (args[i] === "--budget") { result["budget"] = true; continue; }
    if (args[i].startsWith("--") && args[i + 1]) {
      result[args[i].slice(2)] = args[++i];
    }
  }
  return result;
}

// --- Entry point ---
const opts = parseArgs();

if (opts["help"]) {
  printHelp();
  process.exit(0);
}

const period = (opts["period"] as string) || "month";
const filterAgent = opts["agent"] as string | undefined;
const format = (opts["format"] as string) || "table";

const usage = scanHistory(period, filterAgent);

if (format === "json") {
  printJson(usage);
} else {
  printTable(usage);
  if (opts["budget"]) {
    if (!existsSync(BUDGET_PATH)) {
      console.error(`Budget config not found: ${BUDGET_PATH}`);
      process.exit(1);
    }
    const budgetConfig = parseBudgetConfig(readFileSync(BUDGET_PATH, "utf-8"));
    printBudgetComparison(usage, budgetConfig);
  }
}
