#!/usr/bin/env bun
/**
 * Load Project Memory Hook
 *
 * Detects the current working directory and loads relevant project memory
 * at the start of each session.
 */

import * as fs from "fs";
import * as path from "path";

const PAI_DIR = process.env.PAI_DIR || `${process.env.HOME}/.claude`;
const MEMORY_DIR = `${PAI_DIR}/memory`;

// Map directory patterns to memory files
const PROJECT_MAPPINGS: Array<{ pattern: RegExp; memoryFile: string }> = [
  { pattern: /carbene-ai-website/i, memoryFile: "projects/carbene-website.md" },
  { pattern: /homelab-deploy/i, memoryFile: "projects/homelab.md" },
  { pattern: /homelab/i, memoryFile: "projects/homelab.md" },
  { pattern: /cyberdefense/i, memoryFile: "projects/cyberdefense-tactics.md" },
  { pattern: /PAI/i, memoryFile: "projects/pai.md" },
  { pattern: /\.claude/i, memoryFile: "projects/pai.md" },
];

async function main() {
  const cwd = process.cwd();
  const memories: string[] = [];

  // Always load user preferences
  const userPrefsPath = path.join(MEMORY_DIR, "user/preferences.md");
  if (fs.existsSync(userPrefsPath)) {
    memories.push(`[User Preferences]\n${fs.readFileSync(userPrefsPath, "utf-8")}`);
  }

  // Find matching project memory
  for (const mapping of PROJECT_MAPPINGS) {
    if (mapping.pattern.test(cwd)) {
      const memoryPath = path.join(MEMORY_DIR, mapping.memoryFile);
      if (fs.existsSync(memoryPath)) {
        memories.push(`[Project Memory: ${mapping.memoryFile}]\n${fs.readFileSync(memoryPath, "utf-8")}`);
        break; // Only load first matching project
      }
    }
  }

  // Output memories if any found
  if (memories.length > 0) {
    console.log("<system-reminder>");
    console.log("Memory System - Loaded Context for This Session:");
    console.log("");
    console.log(memories.join("\n\n---\n\n"));
    console.log("</system-reminder>");
  }
}

main().catch(console.error);
