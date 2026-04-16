#!/usr/bin/env bun
/**
 * ConfigImport.ts — Import a PAI config archive
 * Usage: bun ConfigImport.ts <archive.tar.gz> [options]
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, cpSync, rmSync, statSync } from "fs";
import { join, relative } from "path";
import { homedir } from "os";

const PAI_DIR = process.env.PAI_DIR || join(homedir(), ".claude");
const HISTORY_DIR = join(PAI_DIR, "history");

function parseArgs(): { archive: string; opts: Record<string, string | boolean> } {
  const opts: Record<string, string | boolean> = {};
  let archive = "";
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--help" || args[i] === "-h") { opts["help"] = true; }
    else if (args[i] === "--dry-run") { opts["dry-run"] = true; }
    else if (args[i] === "--merge") { opts["merge"] = true; }
    else if (args[i].startsWith("--") && args[i + 1]) { opts[args[i].slice(2)] = args[++i]; }
    else if (!archive) { archive = args[i]; }
  }
  return { archive, opts };
}

function walkDir(dir: string): string[] {
  const files: string[] = [];
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDir(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function printHelp(): void {
  console.log(`
PAI Config Import — Import a PAI configuration archive

USAGE:
  bun ConfigImport.ts <archive.tar.gz> [options]

OPTIONS:
  --dry-run           Show what would be imported without making changes
  --merge             Only add new files (don't overwrite existing)
  --select <types>    Comma-separated: agents,skills,hooks,settings,goals
  --help              Show this help

IMPORT PROCESS:
  1. Extract archive to temp dir
  2. Read manifest.json, validate
  3. Show diff summary (new, modified, unchanged)
  4. Backup existing files to history/backups/
  5. Copy files to PAI_DIR

EXAMPLES:
  bun ConfigImport.ts ~/pai-export-2026-03-27.tar.gz --dry-run
  bun ConfigImport.ts ~/pai-export-2026-03-27.tar.gz --merge
  bun ConfigImport.ts ~/pai-export-2026-03-27.tar.gz --select agents
`);
}

// --- Main ---
const { archive, opts } = parseArgs();

if (opts["help"] || !archive) { printHelp(); process.exit(opts["help"] ? 0 : 1); }

if (!existsSync(archive)) {
  console.error(`Archive not found: ${archive}`);
  process.exit(1);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const tmpDir = join("/tmp", `pai-import-${timestamp}`);
mkdirSync(tmpDir, { recursive: true });

// Extract
console.log(`\nExtracting: ${archive}`);
const tarResult = Bun.spawnSync(["tar", "-xzf", archive, "-C", tmpDir]);
if (tarResult.exitCode !== 0) {
  console.error(`Failed to extract: ${tarResult.stderr.toString()}`);
  process.exit(1);
}

// Find the extracted directory
const extracted = readdirSync(tmpDir);
const extractedDir = extracted.length === 1 ? join(tmpDir, extracted[0]) : tmpDir;

// Read manifest
const manifestPath = join(extractedDir, "manifest.json");
if (existsSync(manifestPath)) {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  console.log(`\nManifest:`);
  console.log(`  Export date: ${manifest.export_date}`);
  console.log(`  Components: ${manifest.components?.join(", ")}`);
  console.log(`  Files:      ${manifest.file_count}`);
  console.log(`  Sanitized:  ${manifest.sanitized}`);
  if (manifest.sanitized) {
    console.log(`\n  WARNING: This archive was sanitized. API keys show as <REPLACE_ME>.`);
    console.log(`  You'll need to fill in real values after import.`);
  }
} else {
  console.log("  No manifest.json found (older export format)");
}

// Filter by --select
const selectStr = opts["select"] as string | undefined;
const selectFilter = selectStr ? selectStr.split(",").map((s) => s.trim()) : null;

// Analyze files
const allFiles = walkDir(extractedDir).filter((f) => !f.endsWith("manifest.json"));
const dryRun = opts["dry-run"] === true;
const merge = opts["merge"] === true;

let newCount = 0;
let modifiedCount = 0;
let unchangedCount = 0;
let skippedCount = 0;

const filesToProcess: Array<{ src: string; dest: string; status: string }> = [];

for (const srcFile of allFiles) {
  const relPath = relative(extractedDir, srcFile);

  // Apply select filter
  if (selectFilter) {
    const component = relPath.split("/")[0];
    if (!selectFilter.some((s) => relPath.startsWith(s) || component === s)) {
      skippedCount++;
      continue;
    }
  }

  const destFile = join(PAI_DIR, relPath);
  let status: string;

  if (!existsSync(destFile)) {
    status = "NEW";
    newCount++;
  } else {
    const srcContent = readFileSync(srcFile, "utf-8");
    const destContent = readFileSync(destFile, "utf-8");
    if (srcContent === destContent) {
      status = "UNCHANGED";
      unchangedCount++;
    } else {
      status = "MODIFIED";
      modifiedCount++;
    }
  }

  filesToProcess.push({ src: srcFile, dest: destFile, status });
}

// Print summary
console.log(`\nDiff Summary:`);
console.log(`  New:       ${newCount}`);
console.log(`  Modified:  ${modifiedCount}`);
console.log(`  Unchanged: ${unchangedCount}`);
if (skippedCount > 0) console.log(`  Skipped:   ${skippedCount} (filtered by --select)`);

if (newCount > 0 || modifiedCount > 0) {
  console.log(`\nChanges:`);
  for (const f of filesToProcess) {
    if (f.status === "UNCHANGED") continue;
    const relPath = relative(extractedDir, f.src);
    console.log(`  [${f.status}] ${relPath}`);
  }
}

if (dryRun) {
  console.log(`\n  DRY RUN — no changes made.`);
  rmSync(tmpDir, { recursive: true, force: true });
  process.exit(0);
}

if (newCount === 0 && modifiedCount === 0) {
  console.log(`\n  Nothing to import — all files are identical.`);
  rmSync(tmpDir, { recursive: true, force: true });
  process.exit(0);
}

// Backup existing modified files
if (modifiedCount > 0 && !merge) {
  const backupDir = join(HISTORY_DIR, "backups", `config-backup-${timestamp}`);
  mkdirSync(backupDir, { recursive: true });
  for (const f of filesToProcess) {
    if (f.status !== "MODIFIED") continue;
    if (existsSync(f.dest)) {
      const relPath = relative(PAI_DIR, f.dest);
      const backupPath = join(backupDir, relPath);
      mkdirSync(join(backupPath, ".."), { recursive: true });
      cpSync(f.dest, backupPath);
    }
  }
  console.log(`\n  Backup: ${backupDir}`);
}

// Copy files
let imported = 0;
for (const f of filesToProcess) {
  if (f.status === "UNCHANGED") continue;
  if (merge && f.status === "MODIFIED") {
    continue; // Skip existing in merge mode
  }
  mkdirSync(join(f.dest, ".."), { recursive: true });
  cpSync(f.src, f.dest);
  imported++;
}

// Cleanup
rmSync(tmpDir, { recursive: true, force: true });

console.log(`\n  Imported: ${imported} file(s)`);
if (merge && modifiedCount > 0) {
  console.log(`  Skipped:  ${modifiedCount} existing file(s) (--merge mode)`);
}
console.log(`  Done.`);
