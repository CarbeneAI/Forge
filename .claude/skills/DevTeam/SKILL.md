---
name: DevTeam
description: Security-first multi-agent development team with PM, developers, QA, security audit, and code review. USE WHEN user mentions dev team, development team, multi-agent development, orchestrate coding agents, parallel development, coordinate developers, build feature, implement code, carbeneai, cyberdefensetactics, purpleteamops, OR wants autonomous software development with security gates.
---

# DevTeam

Security-first autonomous multi-agent software development team with hierarchical coordination through a Project Manager (Joshua), parallel developer agents (Hiram instances), QA engineer (Ezra), security auditor (Nehemiah), and code reviewer (Solomon).

**Security Policy:** CarbeneAI is a "Security Built In, Not Bolted On" organization. All code produced by DevTeam undergoes mandatory security review by Nehemiah before merge. OWASP Top 10 compliance is required for all web-facing code.

**Key Projects:**
- **carbeneai** (carbene.ai) - Business consulting website
- **cyberdefensetactics** (cyberdefensetactics.com) - Fractional CTO/CISO consulting site
- **purpleteamops** - Security operations platform

## Workflow Routing

```bash
${PAI_DIR}/tools/skill-workflow-notification WorkflowName DevTeam
```

| Workflow | Trigger | File |
|----------|---------|------|
| **InitProject** | "set up dev team", "initialize devteam", "start dev team for [feature]" | `workflows/InitProject.md` |
| **RunTeam** | "run the dev team", "start devteam", "execute TODO.md" | `workflows/RunTeam.md` |
| **TeamStatus** | "how's the team", "devteam status", "check agent progress" | `workflows/TeamStatus.md` |
| **CollectResults** | "collect results", "merge team work", "devteam done" | `workflows/CollectResults.md` |

## Architecture

```
User (Orchestrator)
  └── Joshua (PM) — manages tasks, dispatches agents, monitors progress
       ├── Hiram-1 (Dev) — implements tasks in git worktrees
       ├── Hiram-2 (Dev) — implements tasks in parallel
       ├── Ezra (QA) — writes tests, validates acceptance criteria
       ├── Nehemiah (Security) — OWASP audit, auth review, vulnerability scan
       └── Solomon (Review) — code quality review
```

**Coordination model:** Hierarchical through Joshua. No peer-to-peer messaging.
**Communication:** File-based inbox/outbox in `.devteam/agents/` directory.
**Task tracking:** TODO.md as single source of truth.
**Parallelism:** Tmux sessions via CodingAgent tools. Git worktrees for isolation.
**Security gate:** Nehemiah reviews ALL code before merge (mandatory, never skipped).

## Agents

| Agent | Role | Model | Agent File |
|-------|------|-------|------------|
| **Bezalel** | Architecture design (existing) | sonnet | `agents/Bezalel.md` |
| **Joshua** | Project Manager (new) | sonnet | `agents/Joshua.md` |
| **Hiram** | Developer (existing, multi-instance) | sonnet | `agents/Hiram.md` |
| **Ezra** | QA Engineer (new) | sonnet | `agents/Ezra.md` |
| **Nehemiah** | Security Auditor (existing) | opus | `agents/Nehemiah.md` |
| **Solomon** | Code Reviewer (existing) | sonnet | `agents/Solomon.md` |

## Tools

| Tool | Purpose | CLI |
|------|---------|-----|
| **DevTeamInit.ts** | Initialize `.devteam/` structure | `bun tools/DevTeamInit.ts --project "Name" --repo /path` |
| **TaskBoard.ts** | View/manage TODO.md tasks | `bun tools/TaskBoard.ts list\|show\|update\|add\|next\|deps` |
| **MessageBus.ts** | Send/read agent messages | `bun tools/MessageBus.ts send\|read\|list\|ack` |
| **TeamStatus.ts** | Dashboard of progress | `bun tools/TeamStatus.ts [--watch]` |

## Project Directory (.devteam/)

Created per-project by `DevTeamInit.ts`:

```
<project-root>/.devteam/
├── TODO.md            # Master task list
├── ARCHITECTURE.md    # From Bezalel
├── PROGRESS.md        # Auto-updated by Joshua
├── config.json        # Team configuration
├── agents/            # Agent inbox directories
│   ├── joshua/inbox/
│   ├── hiram-1/inbox/
│   ├── hiram-2/inbox/
│   ├── ezra/inbox/
│   ├── nehemiah/inbox/
│   └── solomon/inbox/
└── tasks/             # Individual task specs
    ├── task-001.md
    └── ...
```

## Integration Points

| Existing Tool | How DevTeam Uses It |
|---------------|-------------------|
| `CodingAgent/AgentLauncher.ts` | Spawns tmux-based agents |
| `CodingAgent/SessionManager.ts` | Monitors agent sessions |
| `CodingAgent/WorktreeManager.ts` | Creates git worktrees per task |
| `TelegramStatus/send-status.ts` | Completion notifications |

## Examples

**Example 1: Start a development team**
```
User: "Set up a dev team to build user authentication for my Express app"
→ Runs InitProject workflow
→ Creates .devteam/ in the repo
→ Bezalel designs architecture → ARCHITECTURE.md
→ User approves architecture
→ Joshua breaks into tasks → TODO.md
→ User approves task breakdown
→ Team ready to run
```

**Example 2: Execute the development**
```
User: "Run the dev team"
→ Runs RunTeam workflow
→ Joshua spawns Hiram agents for unblocked tasks
→ Agents work in parallel via tmux + worktrees
→ Joshua coordinates via inbox messages
→ Ezra validates, Solomon reviews
→ All tasks complete → user notified
```

**Example 3: Check progress**
```
User: "How's the team doing?"
→ Runs TeamStatus workflow
→ Shows task progress, agent status, recent messages
→ Dashboard output with box-drawing characters
```

**Example 4: Collect and merge**
```
User: "Collect results and merge"
→ Runs CollectResults workflow
→ Shows git log and diff stats per branch
→ User reviews and approves
→ Merges branches, cleans up worktrees
```

## Quick Start

```bash
# 1. Initialize project
bun ${PAI_DIR}/skills/DevTeam/tools/DevTeamInit.ts --project "Auth Feature" --repo /path/to/repo

# 2. Architecture phase (run Bezalel, then Joshua for tasks)
# Handled by InitProject workflow

# 3. Run the team
# Handled by RunTeam workflow

# 4. Monitor
bun ${PAI_DIR}/skills/DevTeam/tools/TeamStatus.ts --watch

# 5. Collect results
# Handled by CollectResults workflow
```