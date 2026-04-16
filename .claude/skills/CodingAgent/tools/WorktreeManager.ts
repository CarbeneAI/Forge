#!/usr/bin/env bun
/**
 * WorktreeManager.ts - Manage git worktrees for coding agents
 *
 * Commands:
 *   create <branch> [base]   - Create worktree with new branch
 *   list                     - List all worktrees
 *   remove <branch>          - Remove worktree and optionally delete branch
 *   prune                    - Clean up stale worktree references
 */

import { $ } from "bun";
import { existsSync } from "fs";
import { join, basename } from "path";

const WORKTREE_DIR = ".worktrees";

async function getRepoRoot(): Promise<string> {
  try {
    const result = await $`git rev-parse --show-toplevel`.quiet();
    return result.stdout.toString().trim();
  } catch {
    console.error("Not in a git repository");
    process.exit(1);
  }
}

async function ensureWorktreeDir(repoRoot: string): Promise<void> {
  const worktreePath = join(repoRoot, WORKTREE_DIR);
  if (!existsSync(worktreePath)) {
    await $`mkdir -p ${worktreePath}`;
  }

  // Add to gitignore if not already
  const gitignorePath = join(repoRoot, ".gitignore");
  if (existsSync(gitignorePath)) {
    const content = await Bun.file(gitignorePath).text();
    if (!content.includes(`/${WORKTREE_DIR}/`)) {
      await Bun.write(gitignorePath, content + `\n/${WORKTREE_DIR}/\n`);
    }
  }
}

async function createWorktree(branch: string, base: string = "main"): Promise<void> {
  const repoRoot = await getRepoRoot();
  await ensureWorktreeDir(repoRoot);

  // Convert branch name to directory name (remove prefix like fix/)
  const dirName = branch.replace(/^(fix|feature|refactor|hotfix)\//, "").replace(/\//g, "-");
  const worktreePath = join(repoRoot, WORKTREE_DIR, dirName);

  if (existsSync(worktreePath)) {
    console.error(`Worktree directory already exists: ${worktreePath}`);
    process.exit(1);
  }

  try {
    // Create worktree with new branch
    await $`git worktree add -b ${branch} ${worktreePath} ${base}`;
    console.log(`Created worktree: ${worktreePath}`);
    console.log(`Branch: ${branch}`);
    console.log(`Based on: ${base}`);
  } catch (error: unknown) {
    const e = error as { stderr?: { toString(): string } };
    console.error("Failed to create worktree:", e.stderr?.toString() || "Unknown error");
    process.exit(1);
  }
}

async function listWorktrees(): Promise<void> {
  const repoRoot = await getRepoRoot();

  try {
    const result = await $`git worktree list`.quiet();
    const lines = result.stdout.toString().trim().split("\n");

    console.log("\nGit Worktrees:");
    console.log("=".repeat(60));

    for (const line of lines) {
      const parts = line.split(/\s+/);
      const path = parts[0];
      const hash = parts[1];
      const branch = parts[2]?.replace(/[\[\]]/g, "") || "(detached)";

      const isAgent = path.includes(WORKTREE_DIR);
      const marker = isAgent ? "[agent]" : "[main]";

      console.log(`  ${marker} ${path}`);
      console.log(`         Branch: ${branch}`);
      console.log(`         Commit: ${hash}`);
      console.log("");
    }
  } catch (error: unknown) {
    const e = error as { stderr?: { toString(): string } };
    console.error("Failed to list worktrees:", e.stderr?.toString() || "Unknown error");
    process.exit(1);
  }
}

async function removeWorktree(branch: string, deleteBranch: boolean = false): Promise<void> {
  const repoRoot = await getRepoRoot();

  // Find worktree by branch name
  const result = await $`git worktree list --porcelain`.quiet();
  const entries = result.stdout.toString().split("\n\n").filter(Boolean);

  let worktreePath: string | null = null;

  for (const entry of entries) {
    const lines = entry.split("\n");
    const pathLine = lines.find((l) => l.startsWith("worktree "));
    const branchLine = lines.find((l) => l.startsWith("branch "));

    if (branchLine?.includes(branch)) {
      worktreePath = pathLine?.replace("worktree ", "") || null;
      break;
    }
  }

  if (!worktreePath) {
    // Try finding by directory name
    const dirName = branch.replace(/^(fix|feature|refactor|hotfix)\//, "").replace(/\//g, "-");
    const possiblePath = join(repoRoot, WORKTREE_DIR, dirName);
    if (existsSync(possiblePath)) {
      worktreePath = possiblePath;
    }
  }

  if (!worktreePath) {
    console.error(`Worktree for branch '${branch}' not found`);
    process.exit(1);
  }

  try {
    // Remove worktree
    await $`git worktree remove ${worktreePath}`;
    console.log(`Removed worktree: ${worktreePath}`);

    // Optionally delete branch
    if (deleteBranch) {
      try {
        await $`git branch -d ${branch}`;
        console.log(`Deleted branch: ${branch}`);
      } catch {
        console.log(`Branch ${branch} not deleted (may have unmerged changes)`);
      }
    }
  } catch (error: unknown) {
    const e = error as { stderr?: { toString(): string } };
    const errMsg = e.stderr?.toString() || "";
    if (errMsg.includes("contains modified or untracked files")) {
      console.error("Worktree has uncommitted changes. Use --force to remove anyway.");
    } else {
      console.error("Failed to remove worktree:", errMsg || "Unknown error");
    }
    process.exit(1);
  }
}

async function pruneWorktrees(): Promise<void> {
  try {
    await $`git worktree prune -v`;
    console.log("Pruned stale worktree references");
  } catch (error: unknown) {
    const e = error as { stderr?: { toString(): string } };
    console.error("Failed to prune worktrees:", e.stderr?.toString() || "Unknown error");
    process.exit(1);
  }
}

function printHelp(): void {
  console.log(`
WorktreeManager - Manage git worktrees for coding agents

USAGE:
  bun WorktreeManager.ts <command> [args]

COMMANDS:
  create <branch> [base]    Create worktree with new branch (default base: main)
  list                      List all worktrees
  remove <branch> [--delete-branch]  Remove worktree (optionally delete branch)
  prune                     Clean up stale worktree references

EXAMPLES:
  # Create worktree for issue #123
  bun WorktreeManager.ts create fix/issue-123

  # Create from different base branch
  bun WorktreeManager.ts create feature/auth develop

  # List all worktrees
  bun WorktreeManager.ts list

  # Remove worktree after merge
  bun WorktreeManager.ts remove fix/issue-123

  # Remove worktree and delete branch
  bun WorktreeManager.ts remove fix/issue-123 --delete-branch

  # Clean up stale references
  bun WorktreeManager.ts prune

NOTES:
  - Worktrees are created in .worktrees/ directory
  - .worktrees/ is automatically added to .gitignore
  - Branch names like fix/issue-123 become directories like issue-123
`);
}

// Main
const command = process.argv[2];
const args = process.argv.slice(3);

switch (command) {
  case "create":
    if (!args[0]) {
      console.error("Usage: create <branch> [base]");
      process.exit(1);
    }
    await createWorktree(args[0], args[1]);
    break;

  case "list":
    await listWorktrees();
    break;

  case "remove":
    if (!args[0]) {
      console.error("Usage: remove <branch> [--delete-branch]");
      process.exit(1);
    }
    await removeWorktree(args[0], args.includes("--delete-branch"));
    break;

  case "prune":
    await pruneWorktrees();
    break;

  case "--help":
  case "-h":
  case "help":
    printHelp();
    break;

  default:
    if (command) {
      console.error(`Unknown command: ${command}`);
    }
    printHelp();
    process.exit(command ? 1 : 0);
}
