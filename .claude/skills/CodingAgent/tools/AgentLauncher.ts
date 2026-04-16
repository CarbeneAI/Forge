#!/usr/bin/env bun
/**
 * AgentLauncher.ts - Launch a complete coding agent environment
 *
 * Creates worktree, spawns tmux session, and starts Claude Code with prompt.
 */

import { $ } from "bun";
import { existsSync } from "fs";
import { join } from "path";

const PAI_DIR = process.env.PAI_DIR || `${process.env.HOME}/.claude`;
const SOCKET = `${process.env.TMPDIR || "/tmp"}/pai-agents.sock`;
const SESSION_PREFIX = "pai-agent-";
const WORKTREE_DIR = ".worktrees";

interface LaunchOptions {
  issue?: string;
  name?: string;
  repo: string;
  prompt: string;
  branch?: string;
  base: string;
  skipWorktree: boolean;
  notify: boolean;
}

function parseArgs(): LaunchOptions {
  const args = process.argv.slice(2);
  const options: LaunchOptions = {
    repo: process.cwd(),
    prompt: "",
    base: "main",
    skipWorktree: false,
    notify: true,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case "--issue":
      case "-i":
        options.issue = next;
        i++;
        break;
      case "--name":
      case "-n":
        options.name = next;
        i++;
        break;
      case "--repo":
      case "-r":
        options.repo = next;
        i++;
        break;
      case "--prompt":
      case "-p":
        options.prompt = next;
        i++;
        break;
      case "--branch":
      case "-b":
        options.branch = next;
        i++;
        break;
      case "--base":
        options.base = next;
        i++;
        break;
      case "--skip-worktree":
        options.skipWorktree = true;
        break;
      case "--no-notify":
        options.notify = false;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
AgentLauncher - Launch a complete coding agent environment

USAGE:
  bun AgentLauncher.ts [options]

OPTIONS:
  -i, --issue <number>      Issue number (creates fix/issue-<number> branch)
  -n, --name <name>         Custom agent name (alternative to --issue)
  -r, --repo <path>         Repository path (default: current directory)
  -p, --prompt <text>       Prompt/instructions for the agent
  -b, --branch <name>       Custom branch name (default: fix/issue-<number>)
  --base <branch>           Base branch for worktree (default: main)
  --skip-worktree           Don't create worktree (use existing directory)
  --no-notify               Don't add Telegram notification to prompt
  -h, --help                Show this help

EXAMPLES:
  # Launch agent for issue #123
  bun AgentLauncher.ts --issue 123 --prompt "Fix the login bug"

  # Launch with custom name
  bun AgentLauncher.ts --name feature-auth --prompt "Implement OAuth"

  # Use specific repo and base branch
  bun AgentLauncher.ts --issue 456 --repo ~/projects/myapp --base develop --prompt "Add tests"

NOTES:
  - Creates git worktree at .worktrees/<name>/
  - Spawns tmux session named pai-agent-<name>
  - Starts Claude Code with the provided prompt
  - By default, adds Telegram notification when agent completes
`);
}

async function ensureRepoRoot(path: string): Promise<string> {
  try {
    const result = await $`git -C ${path} rev-parse --show-toplevel`.quiet();
    return result.stdout.toString().trim();
  } catch {
    console.error(`Not a git repository: ${path}`);
    process.exit(1);
  }
}

async function createWorktree(repoRoot: string, branch: string, base: string, dirName: string): Promise<string> {
  const worktreePath = join(repoRoot, WORKTREE_DIR, dirName);

  if (!existsSync(join(repoRoot, WORKTREE_DIR))) {
    await $`mkdir -p ${join(repoRoot, WORKTREE_DIR)}`;
  }

  if (existsSync(worktreePath)) {
    console.log(`Worktree already exists: ${worktreePath}`);
    return worktreePath;
  }

  try {
    await $`git -C ${repoRoot} worktree add -b ${branch} ${worktreePath} ${base}`;
    console.log(`Created worktree: ${worktreePath}`);
    return worktreePath;
  } catch (error: unknown) {
    const e = error as { stderr?: { toString(): string } };
    console.error("Failed to create worktree:", e.stderr?.toString());
    process.exit(1);
  }
}

async function createSession(name: string, workdir: string): Promise<void> {
  const sessionName = `${SESSION_PREFIX}${name}`;

  // Check if session exists
  try {
    await $`tmux -S ${SOCKET} has-session -t ${sessionName}`.quiet();
    console.log(`Session ${sessionName} already exists`);
    return;
  } catch {
    // Session doesn't exist, create it
  }

  await $`tmux -S ${SOCKET} new-session -d -s ${sessionName} -c ${workdir}`;
  console.log(`Created tmux session: ${sessionName}`);
}

async function launchClaude(name: string, prompt: string, notify: boolean): Promise<void> {
  const sessionName = `${SESSION_PREFIX}${name}`;

  // Build the full prompt with notification
  let fullPrompt = prompt;
  if (notify) {
    fullPrompt += `

When you have completely finished the task, send a notification:
bun ${PAI_DIR}/skills/TelegramStatus/tools/send-status.ts "Done: ${name} - [brief summary]"`;
  }

  // Escape single quotes in prompt
  const escapedPrompt = fullPrompt.replace(/'/g, "'\\''");

  // Send claude command to session
  await $`tmux -S ${SOCKET} send-keys -t ${sessionName}:0.0 -- ${"claude '" + escapedPrompt + "'"} Enter`;
  console.log(`Launched Claude Code in ${sessionName}`);
}

// Main
const options = parseArgs();

// Validate required options
if (!options.issue && !options.name) {
  console.error("Error: Either --issue or --name is required");
  printHelp();
  process.exit(1);
}

if (!options.prompt) {
  console.error("Error: --prompt is required");
  printHelp();
  process.exit(1);
}

// Derive names
const agentName = options.name || `issue-${options.issue}`;
const branchName = options.branch || (options.issue ? `fix/issue-${options.issue}` : `feature/${options.name}`);
const dirName = options.name || `issue-${options.issue}`;

console.log("\nLaunching Coding Agent");
console.log("=".repeat(50));
console.log(`Agent Name: ${agentName}`);
console.log(`Branch: ${branchName}`);
console.log(`Base: ${options.base}`);
console.log(`Repository: ${options.repo}`);
console.log("");

// Get repo root
const repoRoot = await ensureRepoRoot(options.repo);

// Create worktree (unless skipped)
let workdir = repoRoot;
if (!options.skipWorktree) {
  workdir = await createWorktree(repoRoot, branchName, options.base, dirName);
}

// Create tmux session
await createSession(agentName, workdir);

// Launch Claude Code
await launchClaude(agentName, options.prompt, options.notify);

console.log("\nAgent launched successfully!");
console.log("");
console.log("Monitor with:");
console.log(`  bun ${PAI_DIR}/skills/CodingAgent/tools/SessionManager.ts capture ${agentName}`);
console.log("");
console.log("Attach to session:");
console.log(`  bun ${PAI_DIR}/skills/CodingAgent/tools/SessionManager.ts attach ${agentName}`);
