#!/usr/bin/env bun

/**
 * TaskBoard - CLI tool for viewing and managing TODO.md tasks
 *
 * Usage:
 *   bun TaskBoard.ts list [--status pending|in_progress|blocked|done|review|failed]
 *   bun TaskBoard.ts show <id>
 *   bun TaskBoard.ts update <id> --status done [--assignee hiram-1] [--branch task/003]
 *   bun TaskBoard.ts add --title "Write login tests" [--depends 001,002] [--priority P0] [--description "Details..."]
 *   bun TaskBoard.ts next
 *   bun TaskBoard.ts deps
 */

import { existsSync } from "fs";
import { join, dirname } from "path";

interface Task {
  id: string;
  title: string;
  status: string;
  assignee: string;
  dependsOn: string;
  branch: string;
  priority: string;
}

interface TodoFile {
  header: string;
  tasks: Task[];
  footer: string;
}

interface Args {
  command: string;
  id?: string;
  status?: string;
  assignee?: string;
  branch?: string;
  title?: string;
  depends?: string;
  priority?: string;
  description?: string;
  dir?: string;
}

// Parse command line arguments
function parseArgs(): Args {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv[0] === "--help" || argv[0] === "-h" || argv[0] === "help") {
    printUsage();
    process.exit(0);
  }

  const args: Args = { command: argv[0] };

  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i];

    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const value = argv[i + 1];

      if (!value || value.startsWith("--")) {
        console.error(`Error: Missing value for ${arg}`);
        process.exit(1);
      }

      (args as any)[key] = value;
      i++; // Skip next arg since we consumed it
    } else if (!args.id && ["show", "update"].includes(args.command)) {
      args.id = arg;
    }
  }

  return args;
}

function printUsage() {
  console.log(`
TaskBoard - TODO.md Management Tool

Usage:
  bun TaskBoard.ts list [--status pending|in_progress|blocked|done|review|failed]
  bun TaskBoard.ts show <id>
  bun TaskBoard.ts update <id> --status done [--assignee hiram-1] [--branch task/003]
  bun TaskBoard.ts add --title "Write login tests" [--depends 001,002] [--priority P0] [--description "Details..."]
  bun TaskBoard.ts next
  bun TaskBoard.ts deps

Commands:
  list     Show all tasks (optionally filtered by status)
  show     Show detailed view of a single task
  update   Update task fields
  add      Add a new task
  next     Get next unblocked, unassigned task
  deps     Show dependency graph

Options:
  --dir          Path to .devteam directory (auto-detected if not specified)
  --status       Task status (pending, in_progress, blocked, done, review, failed)
  --assignee     Agent assignee (e.g., hiram-1, bezalel-2)
  --branch       Git branch name
  --title        Task title (required for add)
  --depends      Comma-separated task IDs (e.g., 001,002)
  --priority     Priority level (P0, P1, P2, P3)
  --description  Task description
`);
}

// Find .devteam directory by walking up from cwd
function findDevTeamDir(startDir?: string): string | null {
  let currentDir = startDir || process.cwd();

  while (currentDir !== "/") {
    const devTeamPath = join(currentDir, ".devteam");
    if (existsSync(devTeamPath)) {
      return devTeamPath;
    }
    currentDir = dirname(currentDir);
  }

  return null;
}

// Parse TODO.md file
async function parseTodoFile(todoPath: string): Promise<TodoFile> {
  const content = await Bun.file(todoPath).text();
  const lines = content.split("\n");

  let headerEnd = -1;
  let tableStart = -1;
  let tableEnd = -1;

  // Find table boundaries
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith("| ID |") || line.startsWith("|ID|")) {
      tableStart = i;
      headerEnd = i - 1;
    } else if (tableStart !== -1 && tableEnd === -1) {
      if (!line.startsWith("|") || line.startsWith("## ")) {
        tableEnd = i - 1;
        break;
      }
    }
  }

  if (tableStart === -1) {
    return {
      header: content,
      tasks: [],
      footer: ""
    };
  }

  if (tableEnd === -1) {
    tableEnd = lines.length - 1;
  }

  const header = lines.slice(0, headerEnd + 1).join("\n");
  const footer = lines.slice(tableEnd + 1).join("\n");

  // Parse table rows (skip header and separator)
  const tasks: Task[] = [];
  for (let i = tableStart + 2; i <= tableEnd; i++) {
    const line = lines[i].trim();
    if (!line.startsWith("|")) continue;

    const cells = line
      .split("|")
      .map(c => c.trim())
      .filter(c => c.length > 0);

    if (cells.length >= 7) {
      tasks.push({
        id: cells[0],
        title: cells[1],
        status: cells[2],
        assignee: cells[3],
        dependsOn: cells[4],
        branch: cells[5],
        priority: cells[6]
      });
    }
  }

  return { header, tasks, footer };
}

// Calculate stats for header
function calculateStats(tasks: Task[]): { total: number; pending: number; inProgress: number; done: number; blocked: number; agentsActive: Set<string> } {
  const stats = {
    total: tasks.length,
    pending: 0,
    inProgress: 0,
    done: 0,
    blocked: 0,
    agentsActive: new Set<string>()
  };

  for (const task of tasks) {
    const status = task.status.toLowerCase().replace(/\s+/g, "_");

    if (status === "pending") stats.pending++;
    else if (status === "in_progress") stats.inProgress++;
    else if (status === "done") stats.done++;
    else if (status === "blocked") stats.blocked++;

    if (task.assignee && task.assignee !== "-" && task.assignee !== "unassigned") {
      stats.agentsActive.add(task.assignee);
    }
  }

  return stats;
}

// Write TODO.md file
async function writeTodoFile(todoPath: string, data: TodoFile): Promise<void> {
  const stats = calculateStats(data.tasks);

  // Update header stats
  let header = data.header;
  header = header.replace(/Total Tasks: \d+/, `Total Tasks: ${stats.total}`);
  header = header.replace(/Pending: \d+/, `Pending: ${stats.pending}`);
  header = header.replace(/In Progress: \d+/, `In Progress: ${stats.inProgress}`);
  header = header.replace(/Done: \d+/, `Done: ${stats.done}`);
  header = header.replace(/Blocked: \d+/, `Blocked: ${stats.blocked}`);
  header = header.replace(/Agents Active: \d+/, `Agents Active: ${stats.agentsActive.size}`);

  // Generate table
  const tableLines = [
    "| ID | Title | Status | Assignee | Depends On | Branch | Priority |",
    "|-----|-------|--------|----------|------------|--------|----------|"
  ];

  for (const task of data.tasks) {
    tableLines.push(
      `| ${task.id} | ${task.title} | ${task.status} | ${task.assignee} | ${task.dependsOn} | ${task.branch} | ${task.priority} |`
    );
  }

  const content = `${header}\n\n${tableLines.join("\n")}\n\n${data.footer}`;
  await Bun.write(todoPath, content);
}

// Get next available task ID
function getNextTaskId(tasks: Task[]): string {
  if (tasks.length === 0) return "001";

  const maxId = Math.max(...tasks.map(t => parseInt(t.id, 10)));
  return String(maxId + 1).padStart(3, "0");
}

// Create individual task file
async function createTaskFile(devTeamDir: string, task: Task, description?: string): Promise<void> {
  const tasksDir = join(devTeamDir, "tasks");

  if (!existsSync(tasksDir)) {
    await Bun.write(join(tasksDir, ".gitkeep"), "");
  }

  const taskFilePath = join(tasksDir, `task-${task.id}.md`);

  const content = `# Task ${task.id}: ${task.title}

**Priority:** ${task.priority || "P2"}
**Status:** ${task.status}
**Assignee:** ${task.assignee || "unassigned"}
**Depends On:** ${task.dependsOn || "none"}
**Branch:** ${task.branch || "not created"}

## Description
${description || "No description provided."}

## Acceptance Criteria
- [ ] (to be filled by PM)

## Notes
`;

  await Bun.write(taskFilePath, content);
}

// Update individual task file
async function updateTaskFile(devTeamDir: string, task: Task): Promise<void> {
  const taskFilePath = join(devTeamDir, "tasks", `task-${task.id}.md`);

  if (!existsSync(taskFilePath)) {
    return; // File doesn't exist, skip update
  }

  const content = await Bun.file(taskFilePath).text();
  let updated = content;

  // Update fields
  updated = updated.replace(/\*\*Priority:\*\* .+/, `**Priority:** ${task.priority}`);
  updated = updated.replace(/\*\*Status:\*\* .+/, `**Status:** ${task.status}`);
  updated = updated.replace(/\*\*Assignee:\*\* .+/, `**Assignee:** ${task.assignee || "unassigned"}`);
  updated = updated.replace(/\*\*Depends On:\*\* .+/, `**Depends On:** ${task.dependsOn || "none"}`);
  updated = updated.replace(/\*\*Branch:\*\* .+/, `**Branch:** ${task.branch || "not created"}`);

  await Bun.write(taskFilePath, updated);
}

// List tasks
async function listTasks(devTeamDir: string, statusFilter?: string): Promise<void> {
  const todoPath = join(devTeamDir, "TODO.md");

  if (!existsSync(todoPath)) {
    console.error("Error: TODO.md not found in .devteam directory");
    process.exit(1);
  }

  const data = await parseTodoFile(todoPath);
  let tasks = data.tasks;

  if (statusFilter) {
    const normalized = statusFilter.toLowerCase().replace(/_/g, " ");
    tasks = tasks.filter(t => t.status.toLowerCase() === normalized);
  }

  if (tasks.length === 0) {
    console.log("No tasks found.");
    return;
  }

  // Print table
  console.log("\n┌─────┬─────────────────────────────────┬────────────┬────────────┬────────────┬──────────┐");
  console.log("│ ID  │ Title                           │ Status     │ Assignee   │ Depends On │ Priority │");
  console.log("├─────┼─────────────────────────────────┼────────────┼────────────┼────────────┼──────────┤");

  for (const task of tasks) {
    const id = task.id.padEnd(3);
    const title = task.title.length > 31 ? task.title.slice(0, 28) + "..." : task.title.padEnd(31);
    const status = task.status.padEnd(10);
    const assignee = (task.assignee || "-").padEnd(10);
    const depends = (task.dependsOn || "-").padEnd(10);
    const priority = task.priority.padEnd(8);

    console.log(`│ ${id} │ ${title} │ ${status} │ ${assignee} │ ${depends} │ ${priority} │`);
  }

  console.log("└─────┴─────────────────────────────────┴────────────┴────────────┴────────────┴──────────┘\n");
}

// Show single task
async function showTask(devTeamDir: string, id: string): Promise<void> {
  const taskFilePath = join(devTeamDir, "tasks", `task-${id}.md`);

  if (existsSync(taskFilePath)) {
    const content = await Bun.file(taskFilePath).text();
    console.log(content);
  } else {
    // Fallback to TODO.md table row
    const todoPath = join(devTeamDir, "TODO.md");
    const data = await parseTodoFile(todoPath);
    const task = data.tasks.find(t => t.id === id);

    if (!task) {
      console.error(`Error: Task ${id} not found`);
      process.exit(1);
    }

    console.log(`
Task ${task.id}: ${task.title}

Priority: ${task.priority}
Status: ${task.status}
Assignee: ${task.assignee || "unassigned"}
Depends On: ${task.dependsOn || "none"}
Branch: ${task.branch || "not created"}

(No detailed task file found - showing data from TODO.md)
`);
  }
}

// Update task
async function updateTask(devTeamDir: string, args: Args): Promise<void> {
  const todoPath = join(devTeamDir, "TODO.md");
  const data = await parseTodoFile(todoPath);

  const task = data.tasks.find(t => t.id === args.id);
  if (!task) {
    console.error(`Error: Task ${args.id} not found`);
    process.exit(1);
  }

  // Update fields
  if (args.status) task.status = args.status;
  if (args.assignee) task.assignee = args.assignee;
  if (args.branch) task.branch = args.branch;
  if (args.priority) task.priority = args.priority;
  if (args.depends) task.dependsOn = args.depends;

  // Check if status changed to done - unblock dependent tasks
  if (args.status === "done") {
    for (const otherTask of data.tasks) {
      if (otherTask.status === "blocked" && otherTask.dependsOn) {
        const deps = otherTask.dependsOn.split(",").map(d => d.trim());
        const allDone = deps.every(depId => {
          const depTask = data.tasks.find(t => t.id === depId);
          return depTask && depTask.status === "done";
        });

        if (allDone) {
          otherTask.status = "pending";
          console.log(`✓ Unblocked task ${otherTask.id}: ${otherTask.title}`);
        }
      }
    }
  }

  await writeTodoFile(todoPath, data);
  await updateTaskFile(devTeamDir, task);

  console.log(`✓ Updated task ${args.id}`);
}

// Add new task
async function addTask(devTeamDir: string, args: Args): Promise<void> {
  if (!args.title) {
    console.error("Error: --title is required");
    process.exit(1);
  }

  const todoPath = join(devTeamDir, "TODO.md");
  const data = await parseTodoFile(todoPath);

  const newTask: Task = {
    id: getNextTaskId(data.tasks),
    title: args.title,
    status: args.status || "pending",
    assignee: args.assignee || "-",
    dependsOn: args.depends || "-",
    branch: args.branch || "-",
    priority: args.priority || "P2"
  };

  // Check if task should be blocked
  if (newTask.dependsOn && newTask.dependsOn !== "-") {
    const deps = newTask.dependsOn.split(",").map(d => d.trim());
    const anyPending = deps.some(depId => {
      const depTask = data.tasks.find(t => t.id === depId);
      return depTask && depTask.status !== "done";
    });

    if (anyPending) {
      newTask.status = "blocked";
    }
  }

  data.tasks.push(newTask);

  await writeTodoFile(todoPath, data);
  await createTaskFile(devTeamDir, newTask, args.description);

  console.log(`✓ Created task ${newTask.id}: ${newTask.title}`);
}

// Get next task
async function getNextTask(devTeamDir: string): Promise<void> {
  const todoPath = join(devTeamDir, "TODO.md");
  const data = await parseTodoFile(todoPath);

  // Find first pending task with no dependencies or all dependencies done
  const nextTask = data.tasks.find(task => {
    if (task.status !== "pending") return false;
    if (task.assignee && task.assignee !== "-") return false; // Already assigned

    if (task.dependsOn && task.dependsOn !== "-") {
      const deps = task.dependsOn.split(",").map(d => d.trim());
      return deps.every(depId => {
        const depTask = data.tasks.find(t => t.id === depId);
        return depTask && depTask.status === "done";
      });
    }

    return true;
  });

  if (!nextTask) {
    console.log("No unblocked, unassigned tasks available.");
    return;
  }

  console.log(`
Next Available Task:

ID:          ${nextTask.id}
Title:       ${nextTask.title}
Priority:    ${nextTask.priority}
Depends On:  ${nextTask.dependsOn}

To assign this task:
  bun TaskBoard.ts update ${nextTask.id} --status in_progress --assignee <agent-name>
`);
}

// Show dependency graph
async function showDependencyGraph(devTeamDir: string): Promise<void> {
  const todoPath = join(devTeamDir, "TODO.md");
  const data = await parseTodoFile(todoPath);

  console.log("\nTask Dependency Graph:\n");

  // Build dependency map
  const dependents = new Map<string, string[]>();

  for (const task of data.tasks) {
    if (task.dependsOn && task.dependsOn !== "-") {
      const deps = task.dependsOn.split(",").map(d => d.trim());
      for (const depId of deps) {
        if (!dependents.has(depId)) {
          dependents.set(depId, []);
        }
        dependents.get(depId)!.push(task.id);
      }
    }
  }

  // Print tree
  for (const task of data.tasks) {
    const deps = task.dependsOn && task.dependsOn !== "-" ? task.dependsOn : "none";
    const blocking = dependents.get(task.id) || [];

    const statusIcon =
      task.status === "done" ? "✓" :
      task.status === "in_progress" ? "→" :
      task.status === "blocked" ? "⊗" :
      "○";

    console.log(`${statusIcon} ${task.id}: ${task.title} [${task.priority}]`);
    console.log(`   Depends on: ${deps}`);

    if (blocking.length > 0) {
      console.log(`   Blocks: ${blocking.join(", ")}`);
    }

    console.log();
  }
}

// Main
async function main() {
  const args = parseArgs();

  const devTeamDir = args.dir || findDevTeamDir();
  if (!devTeamDir) {
    console.error("Error: Could not find .devteam directory. Use --dir to specify location.");
    process.exit(1);
  }

  switch (args.command) {
    case "list":
      await listTasks(devTeamDir, args.status);
      break;
    case "show":
      if (!args.id) {
        console.error("Error: Task ID required");
        process.exit(1);
      }
      await showTask(devTeamDir, args.id);
      break;
    case "update":
      if (!args.id) {
        console.error("Error: Task ID required");
        process.exit(1);
      }
      await updateTask(devTeamDir, args);
      break;
    case "add":
      await addTask(devTeamDir, args);
      break;
    case "next":
      await getNextTask(devTeamDir);
      break;
    case "deps":
      await showDependencyGraph(devTeamDir);
      break;
    default:
      console.error(`Error: Unknown command '${args.command}'`);
      printUsage();
      process.exit(1);
  }
}

main().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
