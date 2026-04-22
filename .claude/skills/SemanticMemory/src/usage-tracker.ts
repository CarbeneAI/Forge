/**
 * SemanticMemory - Token Usage Tracker
 *
 * Logs every embedding API call with token counts to a JSONL file.
 * Provides aggregation for dashboards and cost monitoring.
 */

import { existsSync, mkdirSync, appendFileSync, readFileSync, writeFileSync } from "fs";
import { dirname } from "path";
import type {
  TokenUsageEntry,
  TokenUsageStats,
  EmbeddingProviderType,
} from "./types.js";

const PAI_DIR = process.env.PAI_DIR || `${process.env.HOME || "/home/youruser"}/.claude`;
const USAGE_LOG = `${PAI_DIR}/data/semantic-memory/usage.jsonl`;
const STATS_FILE = `${PAI_DIR}/data/semantic-memory/usage-stats.json`;

// Cost per 1M tokens by provider/model
const COST_PER_MILLION: Record<string, number> = {
  "openai/text-embedding-3-small": 0.02,
  "gemini/gemini-embedding-001": 0, // free tier
};

function getCostPerToken(provider: string, model: string): number {
  const key = `${provider}/${model}`;
  const perMillion = COST_PER_MILLION[key] ?? 0.02; // default to OpenAI rate
  return perMillion / 1_000_000;
}

/**
 * Log a token usage event to the JSONL file.
 */
export function logTokenUsage(
  provider: EmbeddingProviderType,
  model: string,
  tokens: number,
  chunks: number,
  operation: "index" | "search"
): void {
  try {
    const dir = dirname(USAGE_LOG);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    const entry: TokenUsageEntry = {
      timestamp: Date.now(),
      provider,
      model,
      tokens,
      chunks,
      operation,
    };

    appendFileSync(USAGE_LOG, JSON.stringify(entry) + "\n");
  } catch (err) {
    console.error(`[usage-tracker] Failed to log usage: ${err}`);
  }
}

/**
 * Compute aggregated stats from the usage log and write to stats file.
 */
export function computeUsageStats(): TokenUsageStats {
  const stats: TokenUsageStats = {
    totalTokens: 0,
    totalCost: 0,
    byDay: {},
    byProvider: {},
    lastUpdated: Date.now(),
  };

  if (!existsSync(USAGE_LOG)) return stats;

  try {
    const content = readFileSync(USAGE_LOG, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);

    for (const line of lines) {
      try {
        const entry: TokenUsageEntry = JSON.parse(line);
        const costPerToken = getCostPerToken(entry.provider, entry.model);
        const cost = entry.tokens * costPerToken;

        // Totals
        stats.totalTokens += entry.tokens;
        stats.totalCost += cost;

        // By day (YYYY-MM-DD)
        const day = new Date(entry.timestamp).toISOString().slice(0, 10);
        if (!stats.byDay[day]) {
          stats.byDay[day] = { tokens: 0, cost: 0, searches: 0, indexOps: 0 };
        }
        stats.byDay[day].tokens += entry.tokens;
        stats.byDay[day].cost += cost;
        if (entry.operation === "search") stats.byDay[day].searches++;
        if (entry.operation === "index") stats.byDay[day].indexOps++;

        // By provider
        const provKey = `${entry.provider}/${entry.model}`;
        if (!stats.byProvider[provKey]) {
          stats.byProvider[provKey] = { tokens: 0, cost: 0 };
        }
        stats.byProvider[provKey].tokens += entry.tokens;
        stats.byProvider[provKey].cost += cost;
      } catch {
        // Skip malformed lines
      }
    }

    // Round costs
    stats.totalCost = Math.round(stats.totalCost * 10000) / 10000;
    for (const day of Object.values(stats.byDay)) {
      day.cost = Math.round(day.cost * 10000) / 10000;
    }
    for (const prov of Object.values(stats.byProvider)) {
      prov.cost = Math.round(prov.cost * 10000) / 10000;
    }
  } catch (err) {
    console.error(`[usage-tracker] Failed to compute stats: ${err}`);
  }

  // Write stats file for dashboard consumption
  try {
    const dir = dirname(STATS_FILE);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
  } catch (err) {
    console.error(`[usage-tracker] Failed to write stats: ${err}`);
  }

  return stats;
}

/**
 * Read the cached stats file (fast, no recomputation).
 */
export function readUsageStats(): TokenUsageStats | null {
  if (!existsSync(STATS_FILE)) return null;
  try {
    return JSON.parse(readFileSync(STATS_FILE, "utf-8"));
  } catch {
    return null;
  }
}
