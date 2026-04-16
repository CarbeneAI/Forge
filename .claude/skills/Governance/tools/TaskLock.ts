#!/usr/bin/env bun
/**
 * TaskLock.ts — Atomic task checkout for PAI agents
 * File-based locking prevents two agents from claiming the same task.
 * Usage: bun TaskLock.ts <command> [options]
 */

import { readFileSync, writeFileSync, unlinkSync, readdirSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const LOCK_DIR = join(import.meta.dir, "../.locks");

interface LockFile {
  task_id: string;
  agent: string;
  acquired_at: string;
  description?: string;
}

function ensureLockDir(): void {
  if (!existsSync(LOCK_DIR)) mkdirSync(LOCK_DIR, { recursive: true });
}

function lockPath(taskId: string): string {
  return join(LOCK_DIR, `${taskId}.lock`);
}

function readLock(taskId: string): LockFile | null {
  const p = lockPath(taskId);
  if (!existsSync(p)) return null;
  try { return JSON.parse(readFileSync(p, "utf-8")); } catch { return null; }
}

function parseArgs(args: string[]): Record<string, string | boolean> {
  const result: Record<string, string | boolean> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith("--")) { result[key] = next; i++; }
      else { result[key] = true; }
    } else if (!result["_pos"]) {
      result["_pos"] = args[i];
    }
  }
  return result;
}

function formatAge(ms: number): string {
  const sec = Math.floor(ms / 1000);
  if (sec >= 3600) return `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}m`;
  if (sec >= 60) return `${Math.floor(sec / 60)}m ${sec % 60}s`;
  return `${sec}s`;
}

// --- Commands ---

function cmdAcquire(taskId: string, agent: string, description?: string): void {
  ensureLockDir();
  const existing = readLock(taskId);
  if (existing) {
    const age = Date.now() - new Date(existing.acquired_at).getTime();
    console.error(`LOCKED: task '${taskId}' held by '${existing.agent}' (${formatAge(age)} ago)`);
    process.exit(1);
  }
  const lock: LockFile = {
    task_id: taskId,
    agent,
    acquired_at: new Date().toISOString(),
    ...(description ? { description } : {}),
  };
  writeFileSync(lockPath(taskId), JSON.stringify(lock, null, 2), "utf-8");
  console.log(`ACQUIRED: ${taskId} locked by ${agent}`);
}

function cmdRelease(taskId: string, agent: string): void {
  const existing = readLock(taskId);
  if (!existing) { console.error(`NOT LOCKED: '${taskId}'`); process.exit(1); }
  if (existing.agent !== agent) {
    console.error(`FORBIDDEN: '${taskId}' owned by '${existing.agent}', not '${agent}'`);
    process.exit(1);
  }
  unlinkSync(lockPath(taskId));
  console.log(`RELEASED: ${taskId} (was held by ${agent})`);
}

function cmdStatus(taskId: string): void {
  const lock = readLock(taskId);
  if (!lock) { console.log(`UNLOCKED: ${taskId}`); return; }
  const age = Date.now() - new Date(lock.acquired_at).getTime();
  console.log(`LOCKED: ${taskId}`);
  console.log(`  Owner:    ${lock.agent}`);
  console.log(`  Acquired: ${lock.acquired_at} (${formatAge(age)} ago)`);
  if (lock.description) console.log(`  Desc:     ${lock.description}`);
}

function cmdList(): void {
  ensureLockDir();
  const files = readdirSync(LOCK_DIR).filter((f) => f.endsWith(".lock"));
  if (files.length === 0) { console.log("No active locks."); return; }
  console.log(`\nActive locks (${files.length}):\n` + "=".repeat(50));
  for (const file of files) {
    const taskId = file.replace(/\.lock$/, "");
    const lock = readLock(taskId);
    if (!lock) continue;
    const age = Date.now() - new Date(lock.acquired_at).getTime();
    console.log(`  ${taskId}`);
    console.log(`    Agent: ${lock.agent}  |  Age: ${formatAge(age)}`);
    if (lock.description) console.log(`    Desc:  ${lock.description}`);
  }
  console.log();
}

function cmdCleanup(staleMinutes: number): void {
  ensureLockDir();
  const files = readdirSync(LOCK_DIR).filter((f) => f.endsWith(".lock"));
  const cutoffMs = staleMinutes * 60 * 1000;
  let removed = 0;
  for (const file of files) {
    const taskId = file.replace(/\.lock$/, "");
    const lock = readLock(taskId);
    if (!lock) continue;
    const age = Date.now() - new Date(lock.acquired_at).getTime();
    if (age > cutoffMs) {
      unlinkSync(lockPath(taskId));
      console.log(`REMOVED: ${taskId} (held by ${lock.agent}, ${formatAge(age)} old)`);
      removed++;
    }
  }
  console.log(removed === 0 ? `No stale locks (threshold: ${staleMinutes}min).` : `\nRemoved ${removed} stale lock(s).`);
}

function printHelp(): void {
  console.log(`
PAI TaskLock — Atomic task checkout for agents

USAGE:
  bun TaskLock.ts <command> [options]

COMMANDS:
  acquire <task-id> --agent <name> [--description <text>]
      Acquire lock. Exits 1 if already locked.

  release <task-id> --agent <name>
      Release lock. Only owning agent can release.

  status <task-id>
      Show lock status.

  list
      Show all active locks.

  cleanup [--stale <minutes>]
      Remove locks older than N minutes (default: 30).

  help
      Show this help.

LOCK STORAGE:
  ${LOCK_DIR}/

EXAMPLES:
  bun TaskLock.ts acquire TASK-042 --agent hiram --description "Auth middleware"
  bun TaskLock.ts status TASK-042
  bun TaskLock.ts list
  bun TaskLock.ts release TASK-042 --agent hiram
  bun TaskLock.ts cleanup --stale 30
`);
}

// --- Entry point ---

const [, , cmd, ...rest] = process.argv;
const opts = parseArgs(rest);
const pos = opts["_pos"] as string | undefined;

switch (cmd) {
  case "acquire":
    if (!pos) { console.error("Error: provide task-id"); process.exit(1); }
    if (!opts["agent"]) { console.error("Error: --agent required"); process.exit(1); }
    cmdAcquire(pos, opts["agent"] as string, opts["description"] as string | undefined);
    break;
  case "release":
    if (!pos) { console.error("Error: provide task-id"); process.exit(1); }
    if (!opts["agent"]) { console.error("Error: --agent required"); process.exit(1); }
    cmdRelease(pos, opts["agent"] as string);
    break;
  case "status":
    if (!pos) { console.error("Error: provide task-id"); process.exit(1); }
    cmdStatus(pos);
    break;
  case "list": cmdList(); break;
  case "cleanup": {
    const stale = opts["stale"] ? parseInt(opts["stale"] as string, 10) : 30;
    cmdCleanup(stale);
    break;
  }
  case "help": case "--help": case "-h": case undefined: printHelp(); break;
  default:
    console.error(`Unknown command: ${cmd}`);
    process.exit(1);
}
