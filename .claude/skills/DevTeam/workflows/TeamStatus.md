# TeamStatus Workflow

## Trigger

"How's the team doing?", "DevTeam status", "Check agent progress"

## Steps

### Step 1: Run Dashboard

```bash
${PAI_DIR}/tools/skill-workflow-notification TeamStatus DevTeam
bun ${PAI_DIR}/skills/DevTeam/tools/TeamStatus.ts
```

This shows:
- Task progress summary (done/in_progress/blocked/pending counts)
- Agent session table (active/idle status, current task)
- Recent messages (last 5)

### Step 2: Detailed Agent Check (Optional)

If user wants more detail on a specific agent:

```bash
# Capture recent output from an agent's tmux session
bun ${PAI_DIR}/skills/CodingAgent/tools/SessionManager.ts capture {agent_name} 100
```

### Step 3: Task Board View (Optional)

If user wants to see the full task board:

```bash
# Full task list
bun ${PAI_DIR}/skills/DevTeam/tools/TaskBoard.ts list

# Dependency graph
bun ${PAI_DIR}/skills/DevTeam/tools/TaskBoard.ts deps

# Specific task detail
bun ${PAI_DIR}/skills/DevTeam/tools/TaskBoard.ts show {id}
```

### Step 4: Message History (Optional)

If user wants to see communication:

```bash
# All messages for an agent
bun ${PAI_DIR}/skills/DevTeam/tools/MessageBus.ts list --agent joshua

# Unread only
bun ${PAI_DIR}/skills/DevTeam/tools/MessageBus.ts list --agent joshua --unread
```

### Step 5: Watch Mode (Optional)

For continuous monitoring:

```bash
bun ${PAI_DIR}/skills/DevTeam/tools/TeamStatus.ts --watch
```

Updates every 30 seconds. Ctrl+C to stop.