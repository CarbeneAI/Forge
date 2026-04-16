#!/usr/bin/env bun
/**
 * ConfigExport.ts — Export PAI config as a portable, sanitized archive
 * Usage: bun ConfigExport.ts [options]
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync, cpSync, rmSync } from "fs";
import { join, basename, relative } from "path";
import { homedir } from "os";

const PAI_DIR = process.env.PAI_DIR || join(homedir(), ".claude");

// --- What to export ---
const EXPORT_MAP: Record<string, { src: string; glob?: string }> = {
  agents: { src: "agents" },
  skills: { src: "skills" },
  hooks: { src: "hooks" },
  settings: { src: "." },
  goals: { src: "goals" },
  governance: { src: "skills/Governance/config" },
};

// --- Always exclude ---
const EXCLUDE_PATTERNS = [
  ".env",
  "node_modules",
  ".locks",
  "history",
  "scratchpad",
  "raw-outputs",
  ".bak",
  "__pycache__",
  "venv",
  ".git",
  "gstack",  // gstack is cloned separately
];

// --- Sensitive key patterns ---
const SENSITIVE_PATTERNS = /key|token|secret|password|api_key|apikey|credential/i;

function isSensitiveValue(key: string, value: string): boolean {
  if (!SENSITIVE_PATTERNS.test(key)) return false;
  // Don't flag env var names (e.g., "TELEGRAM_BOT_TOKEN") — only actual values
  if (value.length < 10) return false;
  if (value.startsWith("<") && value.endsWith(">")) return false; // already placeholder
  return true;
}

function sanitizeContent(content: string, filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase();

  if (ext === "json") {
    try {
      const obj = JSON.parse(content);
      sanitizeObject(obj);
      return JSON.stringify(obj, null, 2);
    } catch { return content; }
  }

  if (ext === "yml" || ext === "yaml") {
    return content.split("\n").map((line) => {
      const match = line.match(/^(\s*\w+):\s*(.+)/);
      if (match) {
        const key = match[1].trim();
        const val = match[2].trim().replace(/^"|"$/g, "");
        if (isSensitiveValue(key, val)) {
          return `${match[1]}: "<REPLACE_ME>"`;
        }
      }
      return line;
    }).join("\n");
  }

  return content;
}

function sanitizeObject(obj: Record<string, unknown>): void {
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === "string" && isSensitiveValue(key, val)) {
      obj[key] = "<REPLACE_ME>";
    } else if (typeof val === "object" && val !== null) {
      sanitizeObject(val as Record<string, unknown>);
    }
  }
}

function shouldExclude(path: string): boolean {
  return EXCLUDE_PATTERNS.some((p) => path.includes(p));
}

function copyDir(src: string, dest: string, sanitize: boolean): number {
  if (!existsSync(src)) return 0;
  let count = 0;

  const entries = readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (shouldExclude(srcPath)) continue;

    if (entry.isDirectory()) {
      mkdirSync(destPath, { recursive: true });
      count += copyDir(srcPath, destPath, sanitize);
    } else if (entry.isFile()) {
      mkdirSync(join(destPath, ".."), { recursive: true });
      if (sanitize && (srcPath.endsWith(".json") || srcPath.endsWith(".yml") || srcPath.endsWith(".yaml"))) {
        const content = readFileSync(srcPath, "utf-8");
        writeFileSync(destPath, sanitizeContent(content, srcPath));
      } else {
        cpSync(srcPath, destPath);
      }
      count++;
    }
  }
  return count;
}

function parseArgs(): Record<string, string | boolean> {
  const result: Record<string, string | boolean> = {};
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--help" || args[i] === "-h") { result["help"] = true; }
    else if (args[i] === "--no-sanitize") { result["sanitize"] = false; }
    else if (args[i].startsWith("--") && args[i + 1]) { result[args[i].slice(2)] = args[++i]; }
  }
  if (!("sanitize" in result)) result["sanitize"] = true;
  return result;
}

function printHelp(): void {
  console.log(`
PAI Config Export — Portable, sanitized PAI configuration archive

USAGE:
  bun ConfigExport.ts [options]

OPTIONS:
  --output <path>          Output tarball path (default: ~/pai-export-TIMESTAMP.tar.gz)
  --include <components>   Comma-separated: agents,skills,hooks,settings,goals,governance
  --no-sanitize            Don't sanitize API keys (DANGEROUS for sharing)
  --help                   Show this help

WHAT GETS EXPORTED:
  agents/*.md              Agent configurations
  skills/*/SKILL.md        Skill definitions (tools excluded for size)
  hooks/*.ts, hooks/lib/   Hook scripts
  settings.json            Claude Code settings (sanitized)
  goals/goals.yml          Goal hierarchy
  Governance/config/*.yml  Governance configs

WHAT GETS EXCLUDED (always):
  .env, history/, scratchpad/, node_modules/, gstack/

EXAMPLES:
  bun ConfigExport.ts
  bun ConfigExport.ts --output ~/exports/pai-backup.tar.gz
  bun ConfigExport.ts --include agents,skills
`);
}

// --- Main ---
const opts = parseArgs();

if (opts["help"]) { printHelp(); process.exit(0); }

const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outputPath = (opts["output"] as string) || join(homedir(), `pai-export-${timestamp}.tar.gz`);
const sanitize = opts["sanitize"] !== false;
const includeStr = (opts["include"] as string) || "agents,skills,hooks,settings,goals,governance";
const includes = includeStr.split(",").map((s) => s.trim());

const tmpDir = join("/tmp", `pai-export-${timestamp}`);
mkdirSync(tmpDir, { recursive: true });

let totalFiles = 0;

console.log(`\nPAI Config Export`);
console.log(`  Sanitize: ${sanitize}`);
console.log(`  Include:  ${includes.join(", ")}`);
console.log();

for (const component of includes) {
  const mapping = EXPORT_MAP[component];
  if (!mapping) { console.log(`  SKIP: unknown component '${component}'`); continue; }

  const srcPath = join(PAI_DIR, mapping.src);
  const destPath = join(tmpDir, mapping.src);
  mkdirSync(destPath, { recursive: true });

  if (component === "settings") {
    // Only copy settings.json
    const settingsPath = join(PAI_DIR, "settings.json");
    if (existsSync(settingsPath)) {
      const content = readFileSync(settingsPath, "utf-8");
      writeFileSync(
        join(destPath, "settings.json"),
        sanitize ? sanitizeContent(content, settingsPath) : content,
      );
      totalFiles++;
      console.log(`  settings.json exported`);
    }
  } else if (component === "skills") {
    // Export only SKILL.md files to keep size small
    if (existsSync(srcPath)) {
      const skillDirs = readdirSync(srcPath, { withFileTypes: true }).filter((d) => d.isDirectory());
      for (const dir of skillDirs) {
        if (shouldExclude(dir.name)) continue;
        const skillMd = join(srcPath, dir.name, "SKILL.md");
        if (existsSync(skillMd)) {
          const skillDestDir = join(destPath, dir.name);
          mkdirSync(skillDestDir, { recursive: true });
          cpSync(skillMd, join(skillDestDir, "SKILL.md"));
          totalFiles++;
        }
        // Also export config/ subdirs for Governance
        const configDir = join(srcPath, dir.name, "config");
        if (existsSync(configDir)) {
          const configDest = join(destPath, dir.name, "config");
          totalFiles += copyDir(configDir, configDest, sanitize);
        }
      }
      console.log(`  skills/ exported (SKILL.md files + configs)`);
    }
  } else {
    const count = copyDir(srcPath, destPath, sanitize);
    totalFiles += count;
    console.log(`  ${component}/ exported (${count} files)`);
  }
}

// Write manifest
const manifest = {
  export_date: new Date().toISOString(),
  pai_dir: PAI_DIR,
  components: includes,
  file_count: totalFiles,
  sanitized: sanitize,
  hostname: process.env.HOSTNAME || "unknown",
};
writeFileSync(join(tmpDir, "manifest.json"), JSON.stringify(manifest, null, 2));
totalFiles++;

// Create tarball
const tarResult = Bun.spawnSync(["tar", "-czf", outputPath, "-C", "/tmp", `pai-export-${timestamp}`]);
if (tarResult.exitCode !== 0) {
  console.error(`\nFailed to create tarball: ${tarResult.stderr.toString()}`);
  process.exit(1);
}

// Cleanup
rmSync(tmpDir, { recursive: true, force: true });

// Get size
const stat = statSync(outputPath);
const sizeKb = (stat.size / 1024).toFixed(1);

console.log(`\nExport complete:`);
console.log(`  Output:  ${outputPath}`);
console.log(`  Files:   ${totalFiles}`);
console.log(`  Size:    ${sizeKb} KB`);
console.log(`  Sanitized: ${sanitize}`);
