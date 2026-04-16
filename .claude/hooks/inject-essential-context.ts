#!/usr/bin/env bun

/**
 * inject-essential-context.ts — SessionStart Hook
 *
 * Loads the SemanticMemory L0 (Identity) + L1 (Essential Story) layers
 * and injects them as a system-reminder. This gives Claude immediate
 * access to the most important recent context at ~850 tokens — far cheaper
 * than loading full MEMORY.md.
 *
 * Inspired by MemPalace's 4-layer memory loading model.
 */

import { existsSync } from "fs";
import { join } from "path";
import { PAI_DIR, SKILLS_DIR } from "./lib/pai-paths";

async function main() {
  try {
    // Skip for subagent sessions
    const claudeProjectDir = process.env.CLAUDE_PROJECT_DIR || "";
    const isSubagent =
      claudeProjectDir.includes("/.claude/agents/") ||
      process.env.CLAUDE_AGENT_TYPE !== undefined;

    if (isSubagent) {
      console.error("[essential-context] Subagent session — skipping");
      process.exit(0);
    }

    // Check if SemanticMemory DB exists (skip if not set up yet)
    const dbPath = join(PAI_DIR, "data/semantic-memory/memory.db");
    if (!existsSync(dbPath)) {
      console.error("[essential-context] SemanticMemory DB not found — skipping");
      process.exit(0);
    }

    // Dynamically import the layers module
    const layersPath = join(SKILLS_DIR, "SemanticMemory/src/layers.ts");
    if (!existsSync(layersPath)) {
      console.error("[essential-context] layers.ts not found — skipping");
      process.exit(0);
    }

    const { wakeUp } = await import(layersPath);
    const { identity, essential, totalTokens } = await wakeUp();

    // Only inject if we got meaningful content
    if (totalTokens < 20) {
      console.error("[essential-context] Not enough context to inject — skipping");
      process.exit(0);
    }

    // Build the system-reminder output
    const sections: string[] = [];

    if (identity.text) {
      sections.push(`**Identity:** ${identity.text.trim()}`);
    }

    if (essential.text) {
      sections.push(`\n**Essential Context (auto-ranked, ${essential.tokens} tokens):**\n${essential.text.trim()}`);
    }

    const message = `<system-reminder>
SemanticMemory Essential Context (L0+L1, ${totalTokens} tokens)

${sections.join("\n")}
</system-reminder>`;

    console.log(message);
    console.error(`[essential-context] Injected L0+L1: ${totalTokens} tokens`);
    process.exit(0);
  } catch (error) {
    // Non-fatal — don't break session startup if this fails
    console.error(`[essential-context] Error (non-fatal): ${error}`);
    process.exit(0);
  }
}

main();
