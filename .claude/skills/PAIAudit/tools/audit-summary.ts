#!/usr/bin/env bun
/**
 * audit-summary.ts — Quick PAI audit summary for Telegram daily report.
 *
 * Reads the most recent audit JSON from ~/.claude/audit-history/.
 * Outputs a single-line status string (no audit run — just reports the latest result).
 *
 * If no audit exists yet, runs a minimal in-memory check.
 *
 * Usage: bun audit-summary.ts
 *
 * Output examples:
 *   "🟢 PAI Audit: clean (0 critical, 0 high) — last run 2026-04-28"
 *   "🟡 PAI Audit: 2 high (supply chain) — last run 2026-04-28"
 *   "🔴 PAI Audit: 1 critical (file perms) — last run 2026-04-28"
 *   "⚪ PAI Audit: never run"
 */

import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const HISTORY_DIR = join(homedir(), '.claude/audit-history');

function findLatest(): { path: string; date: string } | null {
  if (!existsSync(HISTORY_DIR)) return null;
  const files = readdirSync(HISTORY_DIR).filter(f => f.endsWith('.json')).sort().reverse();
  if (files.length === 0) return null;
  return { path: join(HISTORY_DIR, files[0]), date: files[0].replace('.json', '') };
}

const latest = findLatest();
if (!latest) {
  console.log('⚪ PAI Audit: never run (run: bun ~/.claude/skills/PAIAudit/tools/audit.ts)');
  process.exit(0);
}

let report;
try {
  report = JSON.parse(readFileSync(latest.path, 'utf-8'));
} catch {
  console.log(`⚪ PAI Audit: history corrupt — last file ${latest.date}`);
  process.exit(0);
}

const counts: Record<string, number> = {};
for (const f of report.findings ?? []) counts[f.severity] = (counts[f.severity] ?? 0) + 1;

const critical = counts['CRITICAL'] ?? 0;
const high = counts['HIGH'] ?? 0;
const medium = counts['MEDIUM'] ?? 0;

let icon: string;
let summary: string;
if (critical > 0) {
  icon = '🔴';
  const areas = [...new Set((report.findings ?? []).filter((f: any) => f.severity === 'CRITICAL').map((f: any) => f.area))].join(', ');
  summary = `${critical} critical (${areas})`;
} else if (high > 0) {
  icon = '🟡';
  const areas = [...new Set((report.findings ?? []).filter((f: any) => f.severity === 'HIGH').map((f: any) => f.area))].join(', ');
  summary = `${high} high (${areas})`;
} else if (medium > 0) {
  icon = '🟢';
  summary = `clean (${medium} medium)`;
} else {
  icon = '🟢';
  summary = 'clean';
}

console.log(`${icon} PAI Audit: ${summary} — last run ${latest.date}`);
