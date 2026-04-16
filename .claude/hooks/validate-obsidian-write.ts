#!/usr/bin/env bun
/**
 * validate-obsidian-write.ts — PostToolUse hook
 * Validates Obsidian vault writes enforce frontmatter and wikilink conventions.
 * Inspired by obsidian-mind's validate-write.py, ported to TypeScript.
 *
 * Only fires on Write/Edit to .md files in the Obsidian vault.
 * Always exits 0 — warnings are advisory, never blocking.
 */

const VAULT_PATH = process.env.OBSIDIAN_VAULT_PATH || `${process.env.HOME || "/home/youruser"}/Nextcloud/PAI/Obsidian`;

const SKIP_DIRS = ["_Archive/", ".obsidian/", "templates/"];
const SKIP_FILES = ["README.md", "CHANGELOG.md"];

try {
  const input = await Bun.stdin.text();
  const data = JSON.parse(input);

  const toolName: string = data.tool_name || "";
  const filePath: string = data.tool_input?.file_path || "";

  // Only run on Write or Edit tools
  if (toolName !== "Write" && toolName !== "Edit") process.exit(0);

  // Only run on .md files
  if (!filePath.endsWith(".md")) process.exit(0);

  // Only run on files in the Obsidian vault
  if (!filePath.startsWith(VAULT_PATH)) process.exit(0);

  // Get relative path within vault
  const relativePath = filePath.slice(VAULT_PATH.length + 1);
  const basename = relativePath.split("/").pop() || "";

  // Skip specific files
  if (SKIP_FILES.includes(basename)) process.exit(0);

  // Skip specific directories
  if (SKIP_DIRS.some((dir) => relativePath.includes(dir))) process.exit(0);

  // Read the file content
  const file = Bun.file(filePath);
  if (!(await file.exists())) process.exit(0);

  const content = await file.text();
  const warnings: string[] = [];

  // Check YAML frontmatter
  if (!content.startsWith("---")) {
    warnings.push("Missing YAML frontmatter (file should start with ---)");
  } else {
    const fmEnd = content.indexOf("---", 3);
    if (fmEnd === -1) {
      warnings.push("Unclosed YAML frontmatter (missing closing ---)");
    } else {
      const frontmatter = content.slice(3, fmEnd);
      if (!frontmatter.includes("tags:")) {
        warnings.push("Missing `tags` field in frontmatter");
      }
      if (!frontmatter.includes("description:")) {
        warnings.push("Missing `description` field in frontmatter");
      }
      if (!frontmatter.includes("date:")) {
        warnings.push("Missing `date` field in frontmatter");
      }
    }
  }

  // Check for wikilinks in longer notes
  if (content.length > 300 && !content.includes("[[")) {
    warnings.push(
      "No [[wikilinks]] found — every substantial note should link to at least one other note"
    );
  }

  if (warnings.length > 0) {
    const output = {
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: `Obsidian vault hygiene warnings for ${basename}:\n${warnings.map((w) => `- ${w}`).join("\n")}\nFix these to maintain vault consistency.`,
      },
    };
    process.stdout.write(JSON.stringify(output));
  }

  process.exit(0);
} catch {
  process.exit(0);
}
