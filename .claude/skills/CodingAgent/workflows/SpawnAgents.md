# SpawnAgents Workflow

Spawn multiple parallel coding agents to work on issues simultaneously.

## Trigger

User requests:
- "Fix issues #123, #124, #125 in parallel"
- "Spawn agents for these bugs"
- "Run multiple Hiram agents"
- "Parallel coding on [issues]"

## Prerequisites

- tmux installed (`apt install tmux` or `brew install tmux`)
- Git repository with worktree support
- Claude Code installed and configured

## Steps

### 1. Parse Issues/Tasks

Extract from user request:
- Issue numbers or task descriptions
- Repository path (current directory if not specified)
- Base branch (default: main)

### 2. Verify Repository

```bash
# Ensure we're in a git repository
git rev-parse --show-toplevel || echo "Not a git repo"

# Check for uncommitted changes in main
git status --porcelain
```

### 3. Create Worktrees

For each issue/task:

```bash
bun ${PAI_DIR}/skills/CodingAgent/tools/WorktreeManager.ts create fix/issue-123 main
```

This creates:
- Branch: `fix/issue-123`
- Directory: `.worktrees/issue-123`

### 4. Spawn Agent Sessions

For each worktree:

```bash
bun ${PAI_DIR}/skills/CodingAgent/tools/AgentLauncher.ts \
  --issue 123 \
  --repo /path/to/repo \
  --prompt "Fix the authentication bug. When done, run tests and commit."
```

### 5. Confirm Launch

Report to user:
- Number of agents spawned
- Session names
- How to check progress

## Example Prompts for Agents

**Bug Fix:**
```
Fix issue #123: [description]

1. Read the issue details
2. Locate the problematic code
3. Implement the fix
4. Write or update tests
5. Run the test suite
6. Commit with message "Fix #123: [summary]"
7. When done, send: bun ${PAI_DIR}/skills/TelegramStatus/tools/send-status.ts "Issue #123 fixed"
```

**Feature Implementation:**
```
Implement feature: [description]

1. Review the requirements
2. Design the implementation
3. Write the code
4. Add tests
5. Update documentation if needed
6. Commit with descriptive message
7. When done, send: bun ${PAI_DIR}/skills/TelegramStatus/tools/send-status.ts "Feature complete: [name]"
```

## Auto-Notification Template

Always include notification at the end of agent prompts:

```
When you have completely finished the task, send a notification:
bun ${PAI_DIR}/skills/TelegramStatus/tools/send-status.ts "Done: [brief summary of what was accomplished]"
```

## Verification

After spawning:
```bash
# List all agent sessions
bun ${PAI_DIR}/skills/CodingAgent/tools/SessionManager.ts list

# Check specific session
bun ${PAI_DIR}/skills/CodingAgent/tools/SessionManager.ts capture issue-123 | tail -50
```

## Notes

- Each agent works independently in isolated worktree
- Agents have full PAI capabilities (tools, skills, research)
- Telegram notifications alert you when agents complete
- Monitor sessions periodically for issues
