#!/usr/bin/env bun
/**
 * GoalManager.ts — PAI Goal Hierarchy Manager
 * Every task traces back to a company goal through a project.
 * Usage: bun GoalManager.ts <command> [options]
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const GOALS_PATH = join(import.meta.dir, "../../../goals/goals.yml");

// --- Types ---

interface Project {
  id: string;
  name: string;
}

interface Goal {
  name: string;
  owner: string;
  status: string;
  projects: Project[];
}

interface GoalData {
  goals: Record<string, Goal>;
}

// --- Simple YAML parser for our specific format ---

function parseGoals(content: string): GoalData {
  const result: GoalData = { goals: {} };
  const lines = content.split("\n");
  let currentGoal: string | null = null;
  let currentObj: Partial<Goal> = {};
  let inProjects = false;

  for (const line of lines) {
    if (line.startsWith("#") || line.trim() === "") continue;
    if (line === "goals:") continue;

    // Goal ID (2-space indent)
    const goalMatch = line.match(/^  (G\d+):$/);
    if (goalMatch) {
      if (currentGoal) {
        if (!currentObj.projects) currentObj.projects = [];
        result.goals[currentGoal] = currentObj as Goal;
      }
      currentGoal = goalMatch[1];
      currentObj = { projects: [] };
      inProjects = false;
      continue;
    }

    // Goal fields (4-space indent)
    const fieldMatch = line.match(/^    (\w+):\s*"?([^"]*)"?\s*$/);
    if (fieldMatch && currentGoal && !inProjects) {
      const [, key, val] = fieldMatch;
      if (key === "projects") {
        inProjects = true;
        continue;
      }
      (currentObj as Record<string, unknown>)[key] = val;
      continue;
    }

    if (line.trim() === "projects:") {
      inProjects = true;
      continue;
    }

    // Project entry (6-space indent, - id: ...)
    const idLine = line.match(/^\s+- id:\s*(\S+)/);
    if (idLine && inProjects) {
      currentObj.projects!.push({ id: idLine[1], name: "" });
      continue;
    }

    const nameMatch = line.match(/^\s+name:\s*"?([^"]*)"?\s*$/);
    if (nameMatch && inProjects && currentObj.projects) {
      const lastProj = currentObj.projects[currentObj.projects.length - 1];
      if (lastProj && !lastProj.name) {
        lastProj.name = nameMatch[1];
      }
      continue;
    }
  }

  if (currentGoal) {
    if (!currentObj.projects) currentObj.projects = [];
    result.goals[currentGoal] = currentObj as Goal;
  }

  return result;
}

function loadGoals(): { data: GoalData; raw: string } {
  const raw = readFileSync(GOALS_PATH, "utf-8");
  return { data: parseGoals(raw), raw };
}

// --- Commands ---

function cmdList(data: GoalData): void {
  console.log("\nPAI Goal Hierarchy\n" + "=".repeat(60));
  for (const [id, goal] of Object.entries(data.goals)) {
    const statusIcon = goal.status === "active" ? "+" : "-";
    console.log(`\n  [${statusIcon}] ${id}: ${goal.name}`);
    console.log(`      Owner: ${goal.owner} | Status: ${goal.status}`);
    if (goal.projects.length > 0) {
      console.log("      Projects:");
      for (const proj of goal.projects) {
        console.log(`        ${proj.id}: ${proj.name}`);
      }
    }
  }
  console.log();
}

function cmdTrace(data: GoalData, projectId: string): void {
  for (const [goalId, goal] of Object.entries(data.goals)) {
    const project = goal.projects.find((p) => p.id === projectId);
    if (project) {
      console.log(`\nGoal Ancestry for ${projectId}:`);
      console.log(`  ${projectId} (${project.name})`);
      console.log(`    -> ${goalId}: ${goal.name}`);
      console.log(`    -> Owner: ${goal.owner}`);
      console.log(`    -> Status: ${goal.status}`);
      return;
    }
  }
  console.error(`Project '${projectId}' not found in any goal.`);
  process.exit(1);
}

function cmdContext(data: GoalData, projectId: string): void {
  for (const [goalId, goal] of Object.entries(data.goals)) {
    const project = goal.projects.find((p) => p.id === projectId);
    if (project) {
      console.log("GOAL CONTEXT:");
      console.log(`Goal: ${goal.name} (${goalId})`);
      console.log(`Project: ${project.name} (${projectId})`);
      console.log(`Owner: ${goal.owner}`);
      console.log(`Why this matters: ${goal.name}`);
      return;
    }
  }
  console.error(`Project '${projectId}' not found.`);
  process.exit(1);
}

function cmdAddGoal(raw: string, name: string): void {
  const data = parseGoals(raw);
  const existingIds = Object.keys(data.goals)
    .map((k) => parseInt(k.replace("G", "")))
    .sort((a, b) => a - b);
  const nextId = `G${(existingIds[existingIds.length - 1] || 0) + 1}`;

  const newEntry = `
  ${nextId}:
    name: "${name}"
    owner: clint
    status: active
    projects: []
`;

  // Append before end of file
  const updated = raw.trimEnd() + "\n" + newEntry;
  writeFileSync(GOALS_PATH, updated, "utf-8");
  console.log(`Added: ${nextId} — ${name}`);
}

function cmdAddProject(raw: string, goalId: string, name: string): void {
  const data = parseGoals(raw);
  if (!data.goals[goalId]) {
    console.error(`Goal '${goalId}' not found.`);
    process.exit(1);
  }

  // Find next project ID globally
  const allProjIds: number[] = [];
  for (const goal of Object.values(data.goals)) {
    for (const proj of goal.projects) {
      const num = parseInt(proj.id.replace("P", ""));
      if (!isNaN(num)) allProjIds.push(num);
    }
  }
  allProjIds.sort((a, b) => a - b);
  const nextId = `P${(allProjIds[allProjIds.length - 1] || 0) + 1}`;

  const projEntry = `      - id: ${nextId}\n        name: "${name}"`;

  // Find the goal block and append project
  const goalPattern = new RegExp(`(  ${goalId}:[\\s\\S]*?projects:)`, "m");
  const match = raw.match(goalPattern);
  if (match) {
    const insertPos = raw.indexOf(match[0]) + match[0].length;
    const updated = raw.slice(0, insertPos) + "\n" + projEntry + raw.slice(insertPos);
    writeFileSync(GOALS_PATH, updated, "utf-8");
    console.log(`Added: ${nextId} (${name}) to ${goalId}`);
  } else {
    console.error(`Could not find projects section for ${goalId}`);
    process.exit(1);
  }
}

function printHelp(): void {
  console.log(`
PAI Goal Manager — Goal ancestry for agent task context

USAGE:
  bun GoalManager.ts <command> [arguments]

COMMANDS:
  list                              Show all goals and their projects
  trace <project-id>                Show goal ancestry (e.g., P4 -> G2)
  context <project-id>              Output injectable context block for agent prompts
  add-goal <name>                   Add a new goal
  add-project <goal-id> <name>      Add a project to an existing goal
  help                              Show this help

EXAMPLES:
  bun GoalManager.ts list
  bun GoalManager.ts trace P7
  bun GoalManager.ts context P1
  bun GoalManager.ts add-goal "Launch training platform"
  bun GoalManager.ts add-project G1 "Enterprise Sales Pipeline"

CONFIG:
  ${GOALS_PATH}
`);
}

// --- Entry point ---

const [, , cmd, ...args] = process.argv;

switch (cmd) {
  case "list":
    cmdList(loadGoals().data);
    break;
  case "trace":
    if (!args[0]) { console.error("Error: provide a project ID (e.g., P4)"); process.exit(1); }
    cmdTrace(loadGoals().data, args[0]);
    break;
  case "context":
    if (!args[0]) { console.error("Error: provide a project ID"); process.exit(1); }
    cmdContext(loadGoals().data, args[0]);
    break;
  case "add-goal":
    if (!args[0]) { console.error("Error: provide goal name"); process.exit(1); }
    cmdAddGoal(loadGoals().raw, args.join(" "));
    break;
  case "add-project":
    if (!args[0] || !args[1]) { console.error("Error: provide goal ID and project name"); process.exit(1); }
    cmdAddProject(loadGoals().raw, args[0], args.slice(1).join(" "));
    break;
  case "help":
  case "--help":
  case "-h":
  case undefined:
    printHelp();
    break;
  default:
    console.error(`Unknown command: ${cmd}\nRun 'bun GoalManager.ts help' for usage.`);
    process.exit(1);
}
