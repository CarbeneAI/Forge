# RunTeam Workflow

## Trigger

"Run the dev team", "Start DevTeam", "Execute TODO.md"

## Prerequisites

- `.devteam/` directory exists with `TODO.md` and `ARCHITECTURE.md`
- Tasks have been created and approved by user
- CodingAgent tools available (AgentLauncher, SessionManager, WorktreeManager)

## Steps

### Step 1: Validate Setup

```bash
${PAI_DIR}/tools/skill-workflow-notification RunTeam DevTeam
```

Verify:
1. `.devteam/` exists in repo
2. `TODO.md` has tasks (not empty table)
3. `ARCHITECTURE.md` exists and is non-empty
4. `config.json` exists with valid configuration
5. Agent inbox directories exist

If any check fails, report error and suggest running InitProject first.

### Step 2: Spawn Joshua (PM)

Launch Joshua as an autonomous tmux session:

```bash
bun ${PAI_DIR}/skills/CodingAgent/tools/AgentLauncher.ts \
  --name joshua \
  --repo {repo_path} \
  --skip-worktree \
  --prompt "You are Joshua, the Project Manager. Run autonomously.

PROJECT: {project_name}
REPO: {repo_path}
ARCHITECTURE: {repo_path}/.devteam/ARCHITECTURE.md
TODO: {repo_path}/.devteam/TODO.md

YOUR TOOLS:
- bun {PAI_DIR}/skills/DevTeam/tools/TaskBoard.ts [command]
- bun {PAI_DIR}/skills/DevTeam/tools/MessageBus.ts [command]
- bun {PAI_DIR}/skills/CodingAgent/tools/AgentLauncher.ts [args]
- bun {PAI_DIR}/skills/CodingAgent/tools/SessionManager.ts [command]
- bun {PAI_DIR}/skills/CodingAgent/tools/WorktreeManager.ts [command]
- bun {PAI_DIR}/skills/DevTeam/tools/TeamStatus.ts

AUTONOMOUS LOOP:
1. Read TODO.md - find pending tasks with all deps done
2. For each unblocked task (max 4 parallel):
   a. Update task status to in_progress with assignee
   b. Create git worktree: WorktreeManager.ts create task/{id}
   c. Spawn Hiram agent: AgentLauncher.ts --name hiram-{N} --repo {repo_path} --prompt [task instructions]
   d. Send task_assignment message to agent inbox
3. Check your inbox for messages:
   - task_complete → update TODO.md, unblock dependent tasks
   - task_failed → reassign or escalate
4. When implementation done → dispatch Ezra for QA
5. When QA passes → dispatch Solomon for review
6. Update PROGRESS.md
7. Wait 60 seconds, repeat
8. When ALL tasks done → write summary, send Telegram, exit

AGENT PROMPT TEMPLATE (for Hiram instances):
'Read task spec at .devteam/tasks/task-{id}.md and ARCHITECTURE.md. Implement the task. Run tests. Commit changes. Then send completion:
bun {PAI_DIR}/skills/DevTeam/tools/MessageBus.ts send --from {agent_name} --to joshua --type task_complete --re task-{id} --body \"Done. [summary]\"
If blocked:
bun {PAI_DIR}/skills/DevTeam/tools/MessageBus.ts send --from {agent_name} --to joshua --type task_failed --re task-{id} --body \"Failed: [reason]\"'

RULES:
- Never assign a task whose dependencies aren't met
- Maximum 4 parallel developer agents
- Tasks follow TDD: test first, then implement
- Update TODO.md after every state change
- Check inbox every iteration
- After 50 iterations or all tasks done, exit gracefully
"
```

### Step 3: Monitor (User)

Inform user how to monitor progress:

```
DevTeam is running autonomously.

Monitor progress:
  bun ${PAI_DIR}/skills/DevTeam/tools/TeamStatus.ts --watch

Check specific agent:
  bun ${PAI_DIR}/skills/CodingAgent/tools/SessionManager.ts capture joshua

View task board:
  bun ${PAI_DIR}/skills/DevTeam/tools/TaskBoard.ts list

Read messages:
  bun ${PAI_DIR}/skills/DevTeam/tools/MessageBus.ts list --agent joshua

Joshua will send a Telegram notification when all tasks are complete.
```

### Step 4: HUMAN CHECKPOINT - Review Results

When Joshua completes (or user checks in):

1. Show final TODO.md status
2. Show PROGRESS.md summary
3. Run TeamStatus for overview
4. Ask user if ready to collect and merge results

If yes: Proceed to CollectResults workflow.
If no: User can continue monitoring or make adjustments.

## Error Recovery

| Scenario | Action |
|----------|--------|
| Joshua session crashes | Re-spawn: `AgentLauncher.ts --name joshua --skip-worktree ...` |
| Agent stuck | `SessionManager.ts kill {agent}`, Joshua will reassign |
| Need to pause | `SessionManager.ts kill joshua` (agents continue current task) |
| Need to resume | Re-launch Joshua, it reads TODO.md to pick up where it left off |
| Want to add tasks | Manually edit TODO.md or use TaskBoard.ts, Joshua picks up changes |