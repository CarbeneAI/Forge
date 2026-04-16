# MonitorSessions Workflow

Monitor progress of active coding agent sessions.

## Trigger

User asks:
- "Check on the agents"
- "How are my coding agents doing?"
- "Session status"
- "Monitor agent progress"

## Steps

### 1. List Active Sessions

```bash
bun ${PAI_DIR}/skills/CodingAgent/tools/SessionManager.ts list
```

Output:
```
Active PAI Agent Sessions:
  pai-agent-issue-123  (running, 15m)
  pai-agent-issue-124  (running, 12m)
  pai-agent-issue-125  (completed, 8m)
```

### 2. Capture Recent Output

For each session:
```bash
bun ${PAI_DIR}/skills/CodingAgent/tools/SessionManager.ts capture issue-123
```

Look for:
- Current task being worked on
- Any errors or stuck states
- Completion indicators

### 3. Check Worktree Status

For each worktree:
```bash
cd .worktrees/issue-123
git status --porcelain
git log main..HEAD --oneline
```

### 4. Report Status

Summarize for user:
- Active sessions and duration
- Current activity (from output capture)
- Git changes (commits, modified files)
- Any issues detected

## Status Indicators

| Indicator | Meaning |
|-----------|---------|
| Running | Claude Code actively processing |
| Idle | Waiting for input or thinking |
| Completed | Agent finished and exited |
| Error | Something went wrong |

## Quick Commands

### View all sessions at once
```bash
bun ${PAI_DIR}/skills/CodingAgent/tools/SessionManager.ts list --verbose
```

### Check specific session output
```bash
bun ${PAI_DIR}/skills/CodingAgent/tools/SessionManager.ts capture issue-123 | tail -100
```

### Interactive attach (for debugging)
```bash
bun ${PAI_DIR}/skills/CodingAgent/tools/SessionManager.ts attach issue-123
# Detach with Ctrl+B then D
```

## Troubleshooting

### Agent appears stuck
1. Capture output to see current state
2. Check if waiting for user input
3. May need to send additional instructions

### Agent has errors
1. Capture full output
2. Check error messages
3. May need to kill and restart

### Session disappeared
1. Check if completed normally
2. Look for crash indicators
3. Review any Telegram notifications
