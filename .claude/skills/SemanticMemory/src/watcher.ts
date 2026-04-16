/**
 * SemanticMemory - File Watcher
 *
 * Monitors source directories for file changes and triggers incremental re-indexing.
 * Debounced sync: accumulates changes for 60 seconds, then triggers syncIndex().
 * Optional daemon mode with PID file and graceful shutdown.
 */

import { watch, type FSWatcher } from "chokidar";
import { existsSync, writeFileSync, readFileSync, unlinkSync } from "fs";
import { resolve, join } from "path";
import { loadConfig, PAI_DIR } from "./config.js";
import { syncIndex } from "./index-manager.js";
import type { SourceConfig } from "./types.js";

const PID_FILE = `${PAI_DIR}/data/semantic-memory/watcher.pid`;

export class FileWatcher {
  private watchers: FSWatcher[] = [];
  private dirtySet: Set<string> = new Set();
  private deletedSet: Set<string> = new Set();
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private debounceMs: number;
  private sources: SourceConfig[];
  private running = false;
  private syncing = false;

  constructor(sources: SourceConfig[], debounceMs: number = 60000) {
    this.sources = sources;
    this.debounceMs = debounceMs;
  }

  /**
   * Start watching all source directories.
   */
  async start(): Promise<void> {
    if (this.running) {
      console.error("[watcher] Already running");
      return;
    }

    this.running = true;

    for (const source of this.sources) {
      if (!existsSync(source.path)) {
        console.error(
          `[watcher] Source directory does not exist, skipping: ${source.path}`
        );
        continue;
      }

      // Determine the file extensions to watch based on glob
      const extensions = source.glob.includes(".jsonl")
        ? ["jsonl"]
        : ["md"];

      const watcher = watch(source.path, {
        ignoreInitial: true,
        persistent: true,
        awaitWriteFinish: {
          stabilityThreshold: 500,
          pollInterval: 100,
        },
        ignored: [
          /(^|[\/\\])\../, // dotfiles
          /node_modules/,
        ],
      });

      watcher.on("add", (filePath: string) => {
        if (this.matchesGlob(filePath, extensions)) {
          const fullPath = resolve(filePath);
          console.error(`[watcher] File added: ${fullPath}`);
          this.dirtySet.add(fullPath);
          this.deletedSet.delete(fullPath);
          this.scheduleSync();
        }
      });

      watcher.on("change", (filePath: string) => {
        if (this.matchesGlob(filePath, extensions)) {
          const fullPath = resolve(filePath);
          console.error(`[watcher] File changed: ${fullPath}`);
          this.dirtySet.add(fullPath);
          this.scheduleSync();
        }
      });

      watcher.on("unlink", (filePath: string) => {
        if (this.matchesGlob(filePath, extensions)) {
          const fullPath = resolve(filePath);
          console.error(`[watcher] File deleted: ${fullPath}`);
          this.deletedSet.add(fullPath);
          this.dirtySet.delete(fullPath);
          this.scheduleSync();
        }
      });

      watcher.on("error", (error: Error) => {
        console.error(`[watcher] Error: ${error.message}`);
      });

      this.watchers.push(watcher);
      console.error(`[watcher] Watching: ${source.path} (${source.type})`);
    }

    console.error(
      `[watcher] Started watching ${this.watchers.length} directories (debounce: ${this.debounceMs}ms)`
    );
  }

  /**
   * Stop all watchers.
   */
  async stop(): Promise<void> {
    if (!this.running) return;

    this.running = false;

    // Cancel pending sync
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    // Close all watchers
    for (const watcher of this.watchers) {
      await watcher.close();
    }
    this.watchers = [];

    // Clear sets
    this.dirtySet.clear();
    this.deletedSet.clear();

    console.error("[watcher] Stopped");
  }

  /**
   * Check if a file path matches the expected extensions.
   */
  private matchesGlob(filePath: string, extensions: string[]): boolean {
    return extensions.some((ext) => filePath.endsWith(`.${ext}`));
  }

  /**
   * Schedule a debounced sync.
   * Accumulates changes for debounceMs, then triggers syncIndex().
   */
  private scheduleSync(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(async () => {
      this.debounceTimer = null;
      await this.runSync();
    }, this.debounceMs);
  }

  /**
   * Run the actual sync operation.
   */
  private async runSync(): Promise<void> {
    if (this.syncing) {
      console.error("[watcher] Sync already in progress, rescheduling...");
      this.scheduleSync();
      return;
    }

    const dirtyCount = this.dirtySet.size;
    const deletedCount = this.deletedSet.size;

    if (dirtyCount === 0 && deletedCount === 0) return;

    console.error(
      `[watcher] Triggering sync: ${dirtyCount} changed, ${deletedCount} deleted`
    );

    // Clear sets before sync (new changes during sync will be queued for next round)
    this.dirtySet.clear();
    this.deletedSet.clear();

    this.syncing = true;
    try {
      const stats = await syncIndex();
      console.error(
        `[watcher] Sync complete: ${stats.filesChanged} files, ${stats.chunksCreated} chunks created, ` +
          `${stats.chunksDeleted} chunks deleted (${(stats.durationMs / 1000).toFixed(1)}s)`
      );
    } catch (err) {
      console.error(`[watcher] Sync failed: ${err}`);
    } finally {
      this.syncing = false;
    }
  }

  /**
   * Get the current status of the watcher.
   */
  getStatus(): {
    running: boolean;
    syncing: boolean;
    pendingChanges: number;
    pendingDeletes: number;
    watchedDirs: number;
  } {
    return {
      running: this.running,
      syncing: this.syncing,
      pendingChanges: this.dirtySet.size,
      pendingDeletes: this.deletedSet.size,
      watchedDirs: this.watchers.length,
    };
  }
}

// ─── Daemon Functions ──────────────────────────────────────────────────────────

/**
 * Write the PID file for daemon mode.
 */
export function writePidFile(): void {
  writeFileSync(PID_FILE, String(process.pid), { mode: 0o600 });
}

/**
 * Remove the PID file.
 */
export function removePidFile(): void {
  try {
    if (existsSync(PID_FILE)) {
      unlinkSync(PID_FILE);
    }
  } catch {
    // Ignore errors on cleanup
  }
}

/**
 * Read the PID from the PID file.
 */
export function readPid(): number | null {
  try {
    if (!existsSync(PID_FILE)) return null;
    const content = readFileSync(PID_FILE, "utf-8").trim();
    const pid = parseInt(content, 10);
    return isNaN(pid) ? null : pid;
  } catch {
    return null;
  }
}

/**
 * Check if the daemon is currently running.
 */
export function isDaemonRunning(): boolean {
  const pid = readPid();
  if (!pid) return false;

  try {
    // Signal 0 checks if process exists without sending a signal
    process.kill(pid, 0);
    return true;
  } catch {
    // Process doesn't exist, clean up stale PID file
    removePidFile();
    return false;
  }
}

/**
 * Stop the running daemon.
 */
export function stopDaemon(): boolean {
  const pid = readPid();
  if (!pid) {
    console.error("[watcher] No PID file found. Daemon may not be running.");
    return false;
  }

  try {
    process.kill(pid, "SIGTERM");
    console.error(`[watcher] Sent SIGTERM to PID ${pid}`);
    removePidFile();
    return true;
  } catch (err) {
    console.error(`[watcher] Failed to stop daemon (PID ${pid}): ${err}`);
    removePidFile();
    return false;
  }
}

/**
 * Run the watcher in daemon mode.
 * Sets up signal handlers and PID file.
 */
export async function runDaemon(): Promise<void> {
  if (isDaemonRunning()) {
    console.error("[watcher] Daemon is already running.");
    process.exit(1);
  }

  const config = await loadConfig();
  const watcher = new FileWatcher(config.sources, config.watcherDebounceMs);

  // Write PID file
  writePidFile();
  console.error(`[watcher] Daemon started (PID: ${process.pid})`);

  // Start watching
  await watcher.start();

  // Graceful shutdown handlers
  const shutdown = async () => {
    console.error("[watcher] Shutting down...");
    await watcher.stop();
    removePidFile();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
  process.on("exit", () => {
    removePidFile();
  });

  // Keep the process alive
  // Bun will keep running because chokidar watchers are active
}
