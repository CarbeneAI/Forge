#!/usr/bin/env bun
/**
 * DevTeamInit.ts - Initialize .devteam/ directory structure for a project
 *
 * Creates task management directory with agent inboxes, config, and templates.
 */

import { $ } from "bun";
import { existsSync, mkdirSync, appendFileSync } from "fs";
import { join } from "path";

interface InitOptions {
  project: string;
  repo: string;
  agents: number;
}

function parseArgs(): InitOptions | null {
  const args = process.argv.slice(2);
  const options: Partial<InitOptions> = {
    repo: process.cwd(),
    agents: 2,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case "--project":
      case "-p":
        options.project = next;
        i++;
        break;
      case "--repo":
      case "-r":
        options.repo = next;
        i++;
        break;
      case "--agents":
      case "-a":
        const count = parseInt(next, 10);
        if (isNaN(count) || count < 1) {
          console.error("Error: --agents must be a positive integer");
          return null;
        }
        options.agents = count;
        i++;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
    }
  }

  if (!options.project) {
    console.error("Error: --project is required");
    printHelp();
    return null;
  }

  return options as InitOptions;
}

function printHelp(): void {
  console.log(`
DevTeamInit - Initialize .devteam/ directory structure for a project

USAGE:
  bun DevTeamInit.ts --project "Project Name" [options]

OPTIONS:
  -p, --project <name>      Project name (required)
  -r, --repo <path>         Repository path (default: current directory)
  -a, --agents <count>      Number of Hiram agents (default: 2)
  -h, --help                Show this help

EXAMPLES:
  # Initialize with default 2 Hiram agents
  bun DevTeamInit.ts --project "User Auth Feature"

  # Initialize with 3 Hiram agents
  bun DevTeamInit.ts --project "Payment System" --agents 3

  # Initialize in specific repo
  bun DevTeamInit.ts --project "API Refactor" --repo /path/to/repo

DIRECTORY STRUCTURE CREATED:
  <repo>/.devteam/
  ├── TODO.md
  ├── ARCHITECTURE.md
  ├── PROGRESS.md
  ├── config.json
  ├── agents/
  │   ├── joshua/
  │   │   └── inbox/
  │   ├── hiram-1/
  │   │   └── inbox/
  │   ├── hiram-N/
  │   │   └── inbox/
  │   ├── ezra/
  │   │   └── inbox/
  │   ├── nehemiah/
  │   │   └── inbox/
  │   └── solomon/
  │       └── inbox/
  └── tasks/
`);
}

function ensureDirectory(path: string): void {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

function createConfigJson(devteamPath: string, project: string, repo: string, agentCount: number): void {
  const config = {
    project,
    repo,
    created: new Date().toISOString().split("T")[0],
    agents: {
      joshua: "Project Manager - Task orchestration and workflow coordination",
      hiram: Array.from({ length: agentCount }, (_, i) => `hiram-${i + 1}`).join(", ") + " - Software engineering implementation",
      ezra: "Quality Assurance - Testing, validation, and quality control",
      nehemiah: "Security Audit - OWASP compliance, auth review, vulnerability scan",
      solomon: "Code Review - Architecture guidance and code review",
    },
    agentCount: 3 + agentCount, // joshua, ezra, nehemiah, solomon + N hirams
  };

  const configPath = join(devteamPath, "config.json");
  Bun.write(configPath, JSON.stringify(config, null, 2));
}

function createTodoMd(devteamPath: string, project: string, agentCount: number): void {
  const date = new Date().toISOString().split("T")[0];
  const totalAgents = 3 + agentCount; // joshua, ezra, nehemiah, solomon + N hirams

  const content = `# DevTeam: ${project}

**Created:** ${date}
**Status:** Planning
**Agents Active:** 0/${totalAgents}

## Tasks

| ID | Title | Status | Assignee | Depends On | Branch | Priority |
|----|-------|--------|----------|------------|--------|----------|

## Legend
- **done** - Task completed and verified
- **in_progress** - Agent actively working
- **blocked** - Dependencies not yet met
- **pending** - Ready to assign when agent available
- **failed** - Agent encountered unrecoverable error
- **review** - In QA or code review
`;

  const todoPath = join(devteamPath, "TODO.md");
  Bun.write(todoPath, content);
}

function createArchitectureMd(devteamPath: string, project: string): void {
  const content = `# Architecture: ${project}

**Status:** Draft

## Overview

[High-level description of the system architecture]

## Components

[Key components and their responsibilities]

## Data Flow

[How data moves through the system]

## Technology Stack

[Languages, frameworks, databases, etc.]

## Security Considerations

[Authentication, authorization, data protection]

## Performance Requirements

[Scalability, response time, throughput]

## Testing Strategy

[Unit, integration, end-to-end testing approach]
`;

  const archPath = join(devteamPath, "ARCHITECTURE.md");
  Bun.write(archPath, content);
}

function createProgressMd(devteamPath: string, project: string): void {
  const date = new Date().toISOString().split("T")[0];

  const content = `# Progress Log: ${project}

**Started:** ${date}

## Log

[Reverse chronological log of major milestones, decisions, and blockers]

---

### ${date}

- Initialized DevTeam structure
- Project setup complete
`;

  const progressPath = join(devteamPath, "PROGRESS.md");
  Bun.write(progressPath, content);
}

async function updateGitignore(repo: string): Promise<boolean> {
  const gitignorePath = join(repo, ".gitignore");
  const devteamEntry = ".devteam/";

  // Check if .gitignore exists
  if (existsSync(gitignorePath)) {
    const contentText = await Bun.file(gitignorePath).text();

    // Check if .devteam/ is already in .gitignore
    if (contentText.includes(devteamEntry)) {
      return false; // Already present
    }

    // Append .devteam/ to .gitignore
    appendFileSync(gitignorePath, `\n# DevTeam working directory\n${devteamEntry}\n`);
    return true;
  } else {
    // Create new .gitignore with .devteam/ entry
    await Bun.write(gitignorePath, `# DevTeam working directory\n${devteamEntry}\n`);
    return true;
  }
}

// Main execution
async function main() {
  const options = parseArgs();

  if (!options) {
    process.exit(1);
  }

  console.log("\nInitializing DevTeam Structure");
  console.log("=".repeat(50));
  console.log(`Project: ${options.project}`);
  console.log(`Repository: ${options.repo}`);
  console.log(`Hiram Agents: ${options.agents}`);
  console.log("");

  // Verify repo exists
  if (!existsSync(options.repo)) {
    console.error(`Error: Repository path does not exist: ${options.repo}`);
    process.exit(1);
  }

  // Create .devteam directory
  const devteamPath = join(options.repo, ".devteam");
  if (existsSync(devteamPath)) {
    console.error(`Error: .devteam/ directory already exists at ${devteamPath}`);
    console.error("Delete it first or choose a different repository");
    process.exit(1);
  }

  ensureDirectory(devteamPath);
  console.log("✓ Created .devteam/");

  // Create agents directory structure
  const agentsPath = join(devteamPath, "agents");
  ensureDirectory(agentsPath);

  // Create joshua inbox
  const joshuaPath = join(agentsPath, "joshua", "inbox");
  ensureDirectory(joshuaPath);
  console.log("✓ Created agents/joshua/inbox/");

  // Create hiram-N inboxes
  for (let i = 1; i <= options.agents; i++) {
    const hiramPath = join(agentsPath, `hiram-${i}`, "inbox");
    ensureDirectory(hiramPath);
    console.log(`✓ Created agents/hiram-${i}/inbox/`);
  }

  // Create ezra inbox
  const ezraPath = join(agentsPath, "ezra", "inbox");
  ensureDirectory(ezraPath);
  console.log("✓ Created agents/ezra/inbox/");

  // Create nehemiah inbox
  const nehemiahPath = join(agentsPath, "nehemiah", "inbox");
  ensureDirectory(nehemiahPath);
  console.log("✓ Created agents/nehemiah/inbox/");

  // Create solomon inbox
  const solomonPath = join(agentsPath, "solomon", "inbox");
  ensureDirectory(solomonPath);
  console.log("✓ Created agents/solomon/inbox/");

  // Create tasks directory
  const tasksPath = join(devteamPath, "tasks");
  ensureDirectory(tasksPath);
  console.log("✓ Created tasks/");

  // Create config.json
  createConfigJson(devteamPath, options.project, options.repo, options.agents);
  console.log("✓ Created config.json");

  // Create TODO.md
  createTodoMd(devteamPath, options.project, options.agents);
  console.log("✓ Created TODO.md");

  // Create ARCHITECTURE.md
  createArchitectureMd(devteamPath, options.project);
  console.log("✓ Created ARCHITECTURE.md");

  // Create PROGRESS.md
  createProgressMd(devteamPath, options.project);
  console.log("✓ Created PROGRESS.md");

  // Update .gitignore
  const gitignoreUpdated = await updateGitignore(options.repo);
  if (gitignoreUpdated) {
    console.log("✓ Updated .gitignore");
  } else {
    console.log("✓ .gitignore already contains .devteam/");
  }

  console.log("\n" + "=".repeat(50));
  console.log("DevTeam initialization complete!");
  console.log("");
  console.log("Next steps:");
  console.log(`  1. Edit ${join(devteamPath, "ARCHITECTURE.md")} with system design`);
  console.log(`  2. Add tasks to ${join(devteamPath, "TODO.md")}`);
  console.log(`  3. Use DevTeam skill to orchestrate agent work`);
  console.log("");
}

main().catch((error) => {
  console.error("Fatal error:", error.message);
  process.exit(1);
});
