#!/usr/bin/env bun
/**
 * TeamStatus.ts - DevTeam agent session and task progress dashboard
 *
 * Shows real-time status of all DevTeam agents, task progress, and recent messages.
 *
 * Usage:
 *   bun TeamStatus.ts                # Full dashboard
 *   bun TeamStatus.ts --watch        # Watch mode (updates every 30s)
 *   bun TeamStatus.ts --json         # JSON output
 */

import { $ } from "bun";
import { existsSync } from "fs";
import { join } from "path";

const SOCKET = `${process.env.TMPDIR || "/tmp"}/pai-agents.sock`;
const SESSION_PREFIX = "pai-agent-";

interface DevTeamConfig {
  project: string;
  repo: string;
  created: string;
  agents: Record<string, string>;
  agentCount: number;
}

interface Task {
  id: string;
  title: string;
  status: string;
  assignee: string;
  dependsOn: string;
  branch: string;
  priority: string;
}

interface TaskStats {
  total: number;
  done: number;
  in_progress: number;
  blocked: number;
  pending: number;
  failed: number;
  review: number;
}

interface AgentStatus {
  name: string;
  session: "active" | "idle";
  currentTask: string;
  statusEmoji: string;
}

interface Message {
  timestamp: string;
  from: string;
  to: string;
  type: string;
}

interface DashboardData {
  project: string;
  taskStats: TaskStats;
  activeAgentCount: number;
  totalAgentCount: number;
  agents: AgentStatus[];
  recentMessages: Message[];
}

/**
 * Find .devteam/ directory by walking up from cwd
 */
function findDevTeamDir(): string | null {
  let currentDir = process.cwd();

  while (currentDir !== "/") {
    const devteamPath = join(currentDir, ".devteam");
    if (existsSync(devteamPath)) {
      return devteamPath;
    }

    const parentDir = join(currentDir, "..");
    if (parentDir === currentDir) break;
    currentDir = parentDir;
  }

  return null;
}

/**
 * Read and parse config.json
 */
async function readConfig(devteamPath: string): Promise<DevTeamConfig | null> {
  const configPath = join(devteamPath, "config.json");

  if (!existsSync(configPath)) {
    return null;
  }

  try {
    const file = Bun.file(configPath);
    return await file.json();
  } catch (error) {
    console.error(`Error reading config.json: ${error}`);
    return null;
  }
}

/**
 * Parse TODO.md to get task stats and assignments
 */
async function parseTodoMd(devteamPath: string): Promise<{ stats: TaskStats; tasks: Task[] }> {
  const todoPath = join(devteamPath, "TODO.md");

  const stats: TaskStats = {
    total: 0,
    done: 0,
    in_progress: 0,
    blocked: 0,
    pending: 0,
    failed: 0,
    review: 0,
  };

  const tasks: Task[] = [];

  if (!existsSync(todoPath)) {
    return { stats, tasks };
  }

  const content = await Bun.file(todoPath).text();
  const lines = content.split("\n");

  let inTable = false;

  for (const line of lines) {
    // Detect table start
    if (line.trim().startsWith("| ID |")) {
      inTable = true;
      continue;
    }

    // Skip separator line
    if (line.trim().startsWith("|---")) {
      continue;
    }

    // Process table rows
    if (inTable && line.trim().startsWith("|")) {
      const parts = line
        .split("|")
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      // Need at least ID, Title, Status, Assignee
      if (parts.length >= 4) {
        const [id, title, status, assignee, dependsOn = "", branch = "", priority = ""] = parts;

        // Skip if this is the header row (check if status is "Status")
        if (status.toLowerCase() === "status") {
          continue;
        }

        tasks.push({
          id,
          title,
          status: status.toLowerCase(),
          assignee,
          dependsOn,
          branch,
          priority,
        });

        stats.total++;

        // Count by status
        const statusKey = status.toLowerCase().replace(/-/g, "_") as keyof TaskStats;
        if (statusKey in stats && typeof stats[statusKey] === "number") {
          (stats[statusKey] as number)++;
        }
      }
    } else if (inTable) {
      // End of table
      break;
    }
  }

  return { stats, tasks };
}

/**
 * Get list of active tmux sessions
 */
async function getActiveSessions(): Promise<Set<string>> {
  try {
    const result = await $`tmux -S ${SOCKET} list-sessions -F #{session_name}`.quiet();
    const sessions = result.stdout
      .toString()
      .trim()
      .split("\n")
      .filter((s) => s.startsWith(SESSION_PREFIX))
      .map((s) => s.replace(SESSION_PREFIX, ""));

    return new Set(sessions);
  } catch {
    return new Set();
  }
}

/**
 * Get all agent names from config
 */
function getAgentNames(config: DevTeamConfig): string[] {
  const agents: string[] = [];

  for (const [key, value] of Object.entries(config.agents)) {
    if (key === "hiram" && typeof value === "string") {
      // Parse "hiram-1, hiram-2, ..." from the value
      const hirams = value
        .split("-")[0]
        .toLowerCase() === "hiram"
        ? value.match(/hiram-\d+/g) || []
        : [];
      agents.push(...hirams);
    } else if (typeof value === "string") {
      agents.push(key);
    }
  }

  return agents;
}

/**
 * Get current task for each agent
 */
function getCurrentTasks(tasks: Task[]): Map<string, Task> {
  const taskMap = new Map<string, Task>();

  for (const task of tasks) {
    if (task.status === "in_progress" && task.assignee) {
      taskMap.set(task.assignee.toLowerCase(), task);
    }
  }

  return taskMap;
}

/**
 * Parse recent messages from inbox directories
 */
async function getRecentMessages(devteamPath: string, limit: number = 5): Promise<Message[]> {
  const agentsPath = join(devteamPath, "agents");

  if (!existsSync(agentsPath)) {
    return [];
  }

  const messages: Message[] = [];

  try {
    const agentDirs = await Array.fromAsync(
      new Bun.Glob("*").scan({ cwd: agentsPath, onlyFiles: false })
    );

    for (const agentDir of agentDirs) {
      const inboxPath = join(agentsPath, agentDir, "inbox");

      if (!existsSync(inboxPath)) {
        continue;
      }

      const messageFiles = await Array.fromAsync(
        new Bun.Glob("*.md").scan({ cwd: inboxPath })
      );

      for (const msgFile of messageFiles) {
        // Parse filename: {timestamp}-{from}-{type}.md
        // e.g., 2026-02-12T164232Z-hiram-1-task_complete.md
        const match = msgFile.match(/^(\d{4}-\d{2}-\d{2}T\d{6}Z)-(.+)-([a-z_]+)\.md$/);

        if (match) {
          const [, timestamp, from, type] = match;
          // Convert timestamp to readable format
          const readable = timestamp.replace(/(\d{4}-\d{2}-\d{2}T)(\d{2})(\d{2})(\d{2})(Z)/, "$1$2:$3:$4$5");
          messages.push({
            timestamp: readable,
            from,
            to: agentDir,
            type,
          });
        }
      }
    }

    // Sort by timestamp descending
    messages.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    return messages.slice(0, limit);
  } catch (error) {
    console.error(`Error reading messages: ${error}`);
    return [];
  }
}

/**
 * Gather all dashboard data
 */
async function gatherDashboardData(devteamPath: string): Promise<DashboardData | null> {
  const config = await readConfig(devteamPath);

  if (!config) {
    return null;
  }

  const { stats, tasks } = await parseTodoMd(devteamPath);
  const activeSessions = await getActiveSessions();
  const agentNames = getAgentNames(config);
  const currentTasks = getCurrentTasks(tasks);

  const agents: AgentStatus[] = agentNames.map((agentName) => {
    const isActive = activeSessions.has(agentName);
    const task = currentTasks.get(agentName);

    let statusEmoji = "⏳";
    let currentTask = "Waiting for assignment";

    if (isActive) {
      if (task) {
        statusEmoji = "🔄";
        currentTask = `${task.id}: ${task.title.substring(0, 40)}${task.title.length > 40 ? "..." : ""}`;
      } else {
        statusEmoji = "✅";
        if (agentName === "joshua") {
          currentTask = "Monitoring team";
        } else if (agentName === "ezra") {
          currentTask = "Waiting for review request";
        } else if (agentName === "solomon") {
          currentTask = "Waiting for review request";
        } else {
          currentTask = "Ready for assignment";
        }
      }
    }

    return {
      name: agentName,
      session: isActive ? "active" : "idle",
      currentTask,
      statusEmoji,
    };
  });

  const recentMessages = await getRecentMessages(devteamPath, 5);

  return {
    project: config.project,
    taskStats: stats,
    activeAgentCount: activeSessions.size,
    totalAgentCount: agentNames.length,
    agents,
    recentMessages,
  };
}

/**
 * Format task stats line
 */
function formatTaskStats(stats: TaskStats): string {
  const parts: string[] = [];

  if (stats.done > 0) parts.push(`${stats.done} done`);
  if (stats.in_progress > 0) parts.push(`${stats.in_progress} in_progress`);
  if (stats.blocked > 0) parts.push(`${stats.blocked} blocked`);
  if (stats.pending > 0) parts.push(`${stats.pending} pending`);
  if (stats.failed > 0) parts.push(`${stats.failed} failed`);
  if (stats.review > 0) parts.push(`${stats.review} review`);

  return `${stats.total}/${stats.total} ${parts.join(" | ")}`;
}

/**
 * Render dashboard in text format
 */
function renderDashboard(data: DashboardData): void {
  console.log(`DevTeam Status: ${data.project}`);
  console.log("═".repeat(50));
  console.log();

  const taskStats = formatTaskStats(data.taskStats);
  console.log(`Tasks: ${taskStats}`);
  console.log(`Agents: ${data.activeAgentCount} active | ${data.totalAgentCount - data.activeAgentCount} idle`);
  console.log();

  // Agent table
  console.log("┌─────────────┬──────────┬───────────────────────────────┬────────┐");
  console.log("│ Agent       │ Session  │ Current Task                  │ Status │");
  console.log("├─────────────┼──────────┼───────────────────────────────┼────────┤");

  for (const agent of data.agents) {
    const name = agent.name.padEnd(11);
    const session = agent.session.padEnd(8);
    const task = agent.currentTask.padEnd(29).substring(0, 29);
    const status = agent.statusEmoji.padEnd(4);

    console.log(`│ ${name} │ ${session} │ ${task} │ ${status}   │`);
  }

  console.log("└─────────────┴──────────┴───────────────────────────────┴────────┘");
  console.log();

  // Recent messages
  if (data.recentMessages.length > 0) {
    console.log("Recent Messages (last 5):");
    for (const msg of data.recentMessages) {
      const time = msg.timestamp.substring(11, 16); // HH:MM
      console.log(`  ${time} ${msg.from} → ${msg.to}: ${msg.type}`);
    }
  } else {
    console.log("Recent Messages: None");
  }

  console.log();
}

/**
 * Output dashboard data as JSON
 */
function outputJson(data: DashboardData): void {
  console.log(JSON.stringify(data, null, 2));
}

/**
 * Clear screen for watch mode
 */
function clearScreen(): void {
  process.stdout.write("\x1b[2J\x1b[H");
}

/**
 * Print help
 */
function printHelp(): void {
  console.log(`
TeamStatus - DevTeam agent session and task progress dashboard

USAGE:
  bun TeamStatus.ts [options]

OPTIONS:
  --watch           Watch mode (updates every 30s)
  --json            JSON output
  --help, -h        Show this help

DESCRIPTION:
  Shows real-time status of all DevTeam agents, task progress, and recent
  messages. Automatically finds .devteam/ directory by walking up from cwd.

EXAMPLES:
  # Show dashboard once
  bun TeamStatus.ts

  # Watch mode with auto-refresh
  bun TeamStatus.ts --watch

  # JSON output for scripting
  bun TeamStatus.ts --json
`);
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);

  // Parse flags
  const watchMode = args.includes("--watch");
  const jsonMode = args.includes("--json");
  const helpMode = args.includes("--help") || args.includes("-h");

  if (helpMode) {
    printHelp();
    process.exit(0);
  }

  // Find .devteam directory
  const devteamPath = findDevTeamDir();

  if (!devteamPath) {
    console.error("Error: .devteam/ directory not found");
    console.error("Run this command from within a DevTeam project directory");
    process.exit(1);
  }

  // Watch mode
  if (watchMode) {
    let running = true;

    // Handle Ctrl+C gracefully
    process.on("SIGINT", () => {
      running = false;
      console.log("\n\nExiting watch mode...");
      process.exit(0);
    });

    while (running) {
      clearScreen();

      const data = await gatherDashboardData(devteamPath);

      if (!data) {
        console.error("Error: Unable to read DevTeam configuration");
        process.exit(1);
      }

      renderDashboard(data);
      console.log("(Press Ctrl+C to exit watch mode)");

      // Wait 30 seconds
      await Bun.sleep(30000);
    }

    return;
  }

  // Single run
  const data = await gatherDashboardData(devteamPath);

  if (!data) {
    console.error("Error: Unable to read DevTeam configuration");
    process.exit(1);
  }

  if (jsonMode) {
    outputJson(data);
  } else {
    renderDashboard(data);
  }
}

main();
