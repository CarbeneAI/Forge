#!/usr/bin/env bun
/**
 * SessionManager.ts - Manage tmux sessions for coding agents
 *
 * Commands:
 *   create <name> [workdir]  - Create a new agent session
 *   list                     - List all agent sessions
 *   capture <name>           - Capture session output
 *   send <name> <keys>       - Send keys to session
 *   kill <name>              - Kill a session
 *   attach <name>            - Attach to session (interactive)
 */

import { $ } from "bun";

const SOCKET = `${process.env.TMPDIR || "/tmp"}/pai-agents.sock`;
const SESSION_PREFIX = "pai-agent-";

interface SessionInfo {
  name: string;
  created: string;
  attached: boolean;
  activity: string;
}

async function tmux(...args: string[]): Promise<string> {
  try {
    const result = await $`tmux -S ${SOCKET} ${args}`.quiet();
    return result.stdout.toString().trim();
  } catch (error: unknown) {
    const e = error as { stderr?: { toString(): string } };
    throw new Error(e.stderr?.toString() || "tmux command failed");
  }
}

async function sessionExists(name: string): Promise<boolean> {
  try {
    await $`tmux -S ${SOCKET} has-session -t ${SESSION_PREFIX}${name}`.quiet();
    return true;
  } catch {
    return false;
  }
}

async function createSession(name: string, workdir?: string): Promise<void> {
  const sessionName = `${SESSION_PREFIX}${name}`;

  if (await sessionExists(name)) {
    console.error(`Session ${sessionName} already exists`);
    process.exit(1);
  }

  const args = ["new-session", "-d", "-s", sessionName];
  if (workdir) {
    args.push("-c", workdir);
  }

  await tmux(...args);
  console.log(`Created session: ${sessionName}`);
  if (workdir) {
    console.log(`Working directory: ${workdir}`);
  }
}

async function listSessions(verbose: boolean = false): Promise<void> {
  try {
    const format = "#{session_name}|#{session_created}|#{session_attached}|#{session_activity}";
    const output = await tmux("list-sessions", "-F", format);

    const sessions: SessionInfo[] = output
      .split("\n")
      .filter((line) => line.startsWith(SESSION_PREFIX))
      .map((line) => {
        const [name, created, attached, activity] = line.split("|");
        return {
          name: name.replace(SESSION_PREFIX, ""),
          created: new Date(parseInt(created) * 1000).toLocaleString(),
          attached: attached === "1",
          activity: new Date(parseInt(activity) * 1000).toLocaleString(),
        };
      });

    if (sessions.length === 0) {
      console.log("No active PAI agent sessions");
      return;
    }

    console.log("\nActive PAI Agent Sessions:");
    console.log("=".repeat(50));

    for (const sess of sessions) {
      const status = sess.attached ? "(attached)" : "(detached)";
      console.log(`  ${SESSION_PREFIX}${sess.name}  ${status}`);
      if (verbose) {
        console.log(`    Created: ${sess.created}`);
        console.log(`    Last activity: ${sess.activity}`);
      }
    }
    console.log("");
  } catch (error: unknown) {
    const e = error as { message?: string };
    if (e.message?.includes("no server running")) {
      console.log("No active PAI agent sessions");
    } else {
      throw error;
    }
  }
}

async function captureOutput(name: string, lines: number = 200): Promise<void> {
  if (!(await sessionExists(name))) {
    console.error(`Session ${SESSION_PREFIX}${name} not found`);
    process.exit(1);
  }

  const output = await tmux(
    "capture-pane",
    "-p",
    "-J",
    "-t",
    `${SESSION_PREFIX}${name}:0.0`,
    "-S",
    `-${lines}`
  );

  console.log(`\n=== Output from ${SESSION_PREFIX}${name} ===\n`);
  console.log(output);
}

async function sendKeys(name: string, keys: string): Promise<void> {
  if (!(await sessionExists(name))) {
    console.error(`Session ${SESSION_PREFIX}${name} not found`);
    process.exit(1);
  }

  await tmux("send-keys", "-t", `${SESSION_PREFIX}${name}:0.0`, "--", keys, "Enter");
  console.log(`Sent keys to ${SESSION_PREFIX}${name}`);
}

async function killSession(name: string): Promise<void> {
  if (!(await sessionExists(name))) {
    console.error(`Session ${SESSION_PREFIX}${name} not found`);
    process.exit(1);
  }

  await tmux("kill-session", "-t", `${SESSION_PREFIX}${name}`);
  console.log(`Killed session: ${SESSION_PREFIX}${name}`);
}

async function attachSession(name: string): Promise<void> {
  if (!(await sessionExists(name))) {
    console.error(`Session ${SESSION_PREFIX}${name} not found`);
    process.exit(1);
  }

  console.log(`Attaching to ${SESSION_PREFIX}${name}...`);
  console.log("(Detach with Ctrl+B then D)");

  // Use exec to replace this process with tmux attach
  const proc = Bun.spawn(["tmux", "-S", SOCKET, "attach-session", "-t", `${SESSION_PREFIX}${name}`], {
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });

  await proc.exited;
}

function printHelp(): void {
  console.log(`
SessionManager - Manage tmux sessions for coding agents

USAGE:
  bun SessionManager.ts <command> [args]

COMMANDS:
  create <name> [workdir]   Create a new agent session
  list [--verbose]          List all agent sessions
  capture <name> [lines]    Capture session output (default: 200 lines)
  send <name> <keys>        Send keys to session
  kill <name>               Kill a session
  attach <name>             Attach to session (interactive)

EXAMPLES:
  # Create session for issue #123
  bun SessionManager.ts create issue-123 /path/to/worktree

  # List all sessions
  bun SessionManager.ts list

  # View last 100 lines of output
  bun SessionManager.ts capture issue-123 100

  # Send command to agent
  bun SessionManager.ts send issue-123 "git status"

  # Kill session
  bun SessionManager.ts kill issue-123

  # Attach for debugging
  bun SessionManager.ts attach issue-123
`);
}

// Main
const command = process.argv[2];
const args = process.argv.slice(3);

switch (command) {
  case "create":
    if (!args[0]) {
      console.error("Usage: create <name> [workdir]");
      process.exit(1);
    }
    await createSession(args[0], args[1]);
    break;

  case "list":
    await listSessions(args.includes("--verbose") || args.includes("-v"));
    break;

  case "capture":
    if (!args[0]) {
      console.error("Usage: capture <name> [lines]");
      process.exit(1);
    }
    await captureOutput(args[0], args[1] ? parseInt(args[1]) : 200);
    break;

  case "send":
    if (!args[0] || !args[1]) {
      console.error("Usage: send <name> <keys>");
      process.exit(1);
    }
    await sendKeys(args[0], args.slice(1).join(" "));
    break;

  case "kill":
    if (!args[0]) {
      console.error("Usage: kill <name>");
      process.exit(1);
    }
    await killSession(args[0]);
    break;

  case "attach":
    if (!args[0]) {
      console.error("Usage: attach <name>");
      process.exit(1);
    }
    await attachSession(args[0]);
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
