---
name: CodingAgent
description: Parallel agent orchestration for multi-issue development via tmux. USE WHEN user mentions parallel coding, parallel issues, spawn agents, tmux agents, git worktrees, multi-agent coding, fix multiple issues simultaneously, OR wants to run multiple Hiram agents in parallel.
---

# CodingAgent

Orchestrate multiple parallel coding agents using tmux sessions for PTY support and git worktrees for isolated development environments.

## Workflow Routing

**When executing a workflow, call the notification script via Bash:**

```bash
${PAI_DIR}/tools/skill-workflow-notification WorkflowName CodingAgent
```

| Workflow | Trigger | File |
|----------|---------|------|
| **SpawnAgents** | "spawn agents", "fix these issues", "parallel coding" | `workflows/SpawnAgents.md` |
| **MonitorSessions** | "check agents", "monitor progress", "session status" | `workflows/MonitorSessions.md` |
| **CollectResults** | "gather results", "agents done", "merge work" | `workflows/CollectResults.md` |

## Examples

**Example 1: Fix multiple GitHub issues in parallel**
```
User: "Fix issues #123, #124, and #125 in parallel"
→ Invokes SpawnAgents workflow
→ Creates git worktrees for each issue
→ Spawns tmux sessions with Claude Code agents
→ Each agent works on one issue independently
→ Notifies via Telegram when complete
```

**Example 2: Check progress on parallel agents**
```
User: "How are my coding agents doing?"
→ Invokes MonitorSessions workflow
→ Lists active pai-agent-* tmux sessions
→ Captures recent output from each
→ Reports status and progress
```

**Example 3: Collect finished work**
```
User: "Gather the results from all agents"
→ Invokes CollectResults workflow
→ Checks which agents have completed
→ Summarizes changes per worktree
→ Provides merge instructions
```

## Key Concepts

### Why tmux?

Claude Code requires a pseudo-terminal (PTY) for interactive features. tmux provides:
- **PTY allocation** - Full terminal emulation for Claude Code
- **Session persistence** - Agents continue running if connection drops
- **Output capture** - Retrieve agent output without interrupting
- **Parallel execution** - Multiple independent sessions

### Socket Isolation

All PAI agent sessions use a dedicated socket:
```bash
SOCKET="${TMPDIR:-/tmp}/pai-agents.sock"
```

This keeps PAI agents separate from user's personal tmux sessions.

### Git Worktrees

Each agent gets an isolated worktree:
```
repo/
├── .git/                    # Main git directory
├── src/                     # Main working copy
└── .worktrees/              # Worktree directory
    ├── issue-123/           # Agent 1's isolated copy
    ├── issue-124/           # Agent 2's isolated copy
    └── issue-125/           # Agent 3's isolated copy
```

Benefits:
- No branch conflicts between agents
- Each agent has full file access
- Easy to review changes per issue
- Clean merge process

### Completion Notifications

Agents send Telegram notifications when done:
```
bun ${PAI_DIR}/skills/TelegramStatus/tools/send-status.ts "Agent done: Issue #123 fixed"
```

## CLI Tools

### SessionManager.ts

Manage tmux sessions for coding agents.

```bash
# Create a new agent session
bun ${PAI_DIR}/skills/CodingAgent/tools/SessionManager.ts create issue-123 /path/to/worktree

# List all agent sessions
bun ${PAI_DIR}/skills/CodingAgent/tools/SessionManager.ts list

# Capture session output
bun ${PAI_DIR}/skills/CodingAgent/tools/SessionManager.ts capture issue-123

# Send keys to session
bun ${PAI_DIR}/skills/CodingAgent/tools/SessionManager.ts send issue-123 "your command"

# Kill a session
bun ${PAI_DIR}/skills/CodingAgent/tools/SessionManager.ts kill issue-123

# Attach to session (interactive)
bun ${PAI_DIR}/skills/CodingAgent/tools/SessionManager.ts attach issue-123
```

### WorktreeManager.ts

Manage git worktrees for isolated development.

```bash
# Create worktree for an issue
bun ${PAI_DIR}/skills/CodingAgent/tools/WorktreeManager.ts create fix/issue-123 main

# List all worktrees
bun ${PAI_DIR}/skills/CodingAgent/tools/WorktreeManager.ts list

# Remove worktree after merge
bun ${PAI_DIR}/skills/CodingAgent/tools/WorktreeManager.ts remove fix/issue-123
```

### AgentLauncher.ts

High-level tool to spawn complete agent environments.

```bash
# Launch agent for a specific issue
bun ${PAI_DIR}/skills/CodingAgent/tools/AgentLauncher.ts \
  --issue 123 \
  --repo /path/to/repo \
  --prompt "Fix the authentication bug in login.ts"
```

## tmux Patterns Reference

See `TmuxPatterns.md` for detailed tmux command patterns.

## Git Worktree Reference

See `WorktreeGuide.md` for git worktree best practices.

## Requirements

- **tmux** - Terminal multiplexer (apt install tmux)
- **git** - With worktree support (2.5+)
- **Claude Code** - Installed and configured
- **Telegram** (optional) - For completion notifications
