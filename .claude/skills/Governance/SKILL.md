---
name: Governance
description: Organizational governance for PAI agent infrastructure — budget controls, approval gates, goal ancestry, org chart visualization, standing orders, config portability, workspaces, and task locking. USE WHEN user mentions budget, spending, approval, governance, org chart, goals, standing orders, heartbeat, export config, import config, workspace, task lock, OR organizational management.
---

# Governance

Organizational intelligence for PAI, cherry-picked from Paperclip's zero-human-company model and adapted for CLI-first personal AI infrastructure.

## Workflow Routing

| Action | Trigger | Tool/Config |
|--------|---------|-------------|
| **Budget Review** | "budget report", "agent spending", "cost tracking" | `tools/BudgetReport.ts` |
| **Org Chart** | "org chart", "show team", "agent hierarchy" | `tools/OrgChart.ts` |
| **Goal Management** | "goals", "goal context", "why are we doing this" | `tools/GoalManager.ts` |
| **Approval Check** | "approval needed", "can I deploy", "governance gate" | `tools/ApprovalGate.ts` |
| **Standing Orders** | "standing orders", "heartbeat", "scheduled agents" | `tools/StandingOrders.ts` |
| **Config Export** | "export config", "backup PAI", "portable config" | `tools/ConfigExport.ts` |
| **Config Import** | "import config", "restore PAI", "load config" | `tools/ConfigImport.ts` |
| **Task Locking** | "lock task", "task checkout", "atomic task" | `tools/TaskLock.ts` |

## Features

### 1. Budget Controls
Track and limit per-agent spending with cost estimates based on model pricing.

```bash
# Show spending report for current month
bun tools/BudgetReport.ts

# Compare against budget limits
bun tools/BudgetReport.ts --budget

# Filter by agent
bun tools/BudgetReport.ts --agent hiram --period week
```

Config: `config/budgets.yml` — per-agent monthly limits with alert thresholds.

### 2. Approval Gates
Human-in-the-loop governance for high-impact actions via Telegram.

```bash
# Check if action needs approval
bun tools/ApprovalGate.ts check deploy --agent hiram

# Request approval (sends Telegram, waits for response)
bun tools/ApprovalGate.ts request deploy --agent hiram --action "Push to carbene.ai production"

# List all gates
bun tools/ApprovalGate.ts list
```

Config: `config/approvals.yml` — gate definitions with Telegram integration.

### 3. Goal Ancestry
Every task traces back to a company goal. Provides "why" context for agent prompts.

```bash
# Show goal hierarchy
bun tools/GoalManager.ts list

# Trace project to goal
bun tools/GoalManager.ts trace P4

# Get injectable context block for agent prompts
bun tools/GoalManager.ts context P1
```

Config: `goals/goals.yml` — goal hierarchy with projects.

### 4. Org Chart Visualization
Auto-generated Mermaid diagram from agent configurations.

```bash
# Print Mermaid diagram
bun tools/OrgChart.ts

# Save as SVG (requires mmdc)
bun tools/OrgChart.ts --output svg --save org-chart.svg
```

### 5. Standing Orders (Heartbeat)
Recurring agent tasks executed on schedules — the PAI version of Paperclip's heartbeat engine.

```bash
# List all standing orders
bun tools/StandingOrders.ts list

# Enable/disable
bun tools/StandingOrders.ts enable daily-security-check

# Manually trigger
bun tools/StandingOrders.ts run friday-retro

# Sync to system cron
bun tools/StandingOrders.ts sync
```

Config: `config/standing-orders.yml` — agent schedules with goal links.

### 6. Config Export/Import
Portable, sanitized PAI configuration bundles for backup and sharing.

```bash
# Export (sanitized by default)
bun tools/ConfigExport.ts --output ~/exports/pai-config.tar.gz

# Import with dry run
bun tools/ConfigImport.ts pai-config.tar.gz --dry-run

# Import with merge (don't overwrite existing)
bun tools/ConfigImport.ts pai-config.tar.gz --merge
```

### 7. Multi-Workspace Isolation
Group agents, budgets, and goals by business domain.

Config: `config/workspaces.yml` — workspace definitions mapping agents to goals with budget pools.

### 8. Atomic Task Checkout
File-based locking prevents two agents from claiming the same task.

```bash
# Acquire lock
bun tools/TaskLock.ts acquire TASK-001 --agent hiram

# Release lock
bun tools/TaskLock.ts release TASK-001 --agent hiram

# Check status
bun tools/TaskLock.ts status TASK-001

# Clean stale locks (>30 min)
bun tools/TaskLock.ts cleanup --stale 30
```

## Architecture

```
Governance/
├── SKILL.md                    # This file
├── tools/
│   ├── OrgChart.ts             # Mermaid org chart generator
│   ├── BudgetReport.ts         # Cost tracking and budget comparison
│   ├── GoalManager.ts          # Goal hierarchy management
│   ├── ApprovalGate.ts         # Telegram-based approval gates
│   ├── StandingOrders.ts       # Heartbeat/recurring agent tasks
│   ├── ConfigExport.ts         # Portable config export
│   ├── ConfigImport.ts         # Config import with merge
│   └── TaskLock.ts             # Atomic task checkout
├── config/
│   ├── budgets.yml             # Per-agent spend limits
│   ├── approvals.yml           # Approval gate definitions
│   ├── standing-orders.yml     # Recurring agent schedules
│   └── workspaces.yml          # Workspace isolation
└── reference/
    └── PaperclipInspiration.md # Design decisions and Paperclip comparison
```

## Design Principles

1. **CLI-first** — Every feature is a TypeScript CLI tool (PAI Constitution Principle 8)
2. **File-based state** — No database required; YAML configs and file locks
3. **Telegram-native governance** — Approvals via existing Telegram bot infrastructure
4. **Goal-aware** — Every agent action can trace back to a company objective
5. **Sanitize by default** — Config exports strip secrets automatically
6. **Composable** — Each tool works independently; combine via shell pipelines

## Examples

**Example 1: Morning governance check**
```
User: "How are we doing on budgets this month?"
→ Runs BudgetReport.ts --budget
→ Shows per-agent spend vs limits
→ Flags any agents approaching thresholds
```

**Example 2: Pre-deploy approval**
```
User: "Deploy carbene.ai changes"
→ ApprovalGate.ts check deploy --agent hiram
→ Gate triggered → sends Telegram approval request
→ Waits for the user's "approve" reply
→ Proceeds with deployment
```

**Example 3: Why are we doing this?**
```
User: "What goal does the trading system serve?"
→ GoalManager.ts trace P7
→ "P7 (Joseph Trading System) → G3 (Generate investment returns via automated trading)"
→ Provides full context for decision-making
```
