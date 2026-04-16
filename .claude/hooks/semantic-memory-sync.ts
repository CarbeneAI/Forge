#!/usr/bin/env bun

/**
 * SessionEnd Hook - Triggers SemanticMemory incremental sync
 *
 * Runs after each session to index any new/changed files
 * (session summaries, learnings, research, etc.)
 * Uses a 5-second timeout to avoid blocking session end.
 */

import { spawn } from "child_process";

const SYNC_TOOL = `${process.env.PAI_DIR || `${process.env.HOME || "/home/youruser"}/.claude`}/skills/SemanticMemory/tools/MemorySync.ts`;

async function main() {
  // Consume stdin (required by hook protocol)
  await Bun.stdin.text();

  try {
    // Fire-and-forget: spawn sync in background with timeout
    const proc = spawn("bun", [SYNC_TOOL], {
      stdio: "ignore",
      detached: true,
      env: { ...process.env },
    });

    // Unref so this process doesn't wait for the child
    proc.unref();

    console.error("[semantic-memory-sync] Triggered background sync");
  } catch (err) {
    console.error(`[semantic-memory-sync] Failed to trigger sync: ${err}`);
  }

  process.exit(0);
}

main();
