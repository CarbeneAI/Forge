# InitProject Workflow

## Trigger

"Set up dev team for [feature]", "Initialize DevTeam", "Start dev team"

## Prerequisites

- User provides: Feature description and target repo path
- Repo must be a git repository
- CodingAgent tools must be available

## Steps

### Step 1: Initialize Project Structure

Run DevTeamInit to create the `.devteam/` directory:

```bash
${PAI_DIR}/tools/skill-workflow-notification InitProject DevTeam
bun ${PAI_DIR}/skills/DevTeam/tools/DevTeamInit.ts --project "{project_name}" --repo {repo_path} [--agents {count}]
```

Verify the structure was created:
```bash
ls -la {repo_path}/.devteam/
```

### Step 2: Architecture Design (Bezalel)

Dispatch Bezalel as a subagent (via Task tool) to create ARCHITECTURE.md:

**Bezalel's prompt:**
```
You are designing the architecture for: {feature_description}

Repository: {repo_path}

1. Explore the existing codebase to understand:
   - Project structure and tech stack
   - Existing patterns and conventions
   - Database schema (if applicable)
   - API patterns (if applicable)

2. Create a comprehensive architecture document at:
   {repo_path}/.devteam/ARCHITECTURE.md

   Include:
   - System overview and goals
   - Component breakdown with responsibilities
   - Data model / schema changes
   - API endpoints (if applicable)
   - File structure for new code
   - Technology decisions and rationale
   - Security considerations
   - Testing strategy

3. The architecture must be granular enough for Joshua (PM) to break into 2-5 minute tasks.
```

### Step 3: HUMAN CHECKPOINT - Architecture Review

**Present to user:**
- Read and display ARCHITECTURE.md
- Ask user to approve, request changes, or reject

If changes requested: Re-run Bezalel with feedback.
If rejected: Stop workflow.
If approved: Continue to Step 4.

### Step 4: Task Breakdown (Joshua)

Dispatch Joshua as a subagent (via Task tool) to create TODO.md:

**Joshua's prompt:**
```
Read the architecture document at {repo_path}/.devteam/ARCHITECTURE.md

Break it down into granular tasks following these rules:
1. Each task should take 2-5 minutes for an agent
2. Follow TDD: create test tasks BEFORE implementation tasks
3. Model dependencies explicitly (which tasks block which)
4. Assign priorities: P0 (critical path), P1 (important), P2 (nice-to-have)

Create:
1. Update {repo_path}/.devteam/TODO.md with the full task table
2. Create individual task specs in {repo_path}/.devteam/tasks/task-{ID}.md for each task

Use the TaskBoard tool:
bun ${PAI_DIR}/skills/DevTeam/tools/TaskBoard.ts add --title "Task title" --depends 001,002 --priority P0 --description "Full description with acceptance criteria"
```

### Step 5: HUMAN CHECKPOINT - Task Review

**Present to user:**
- Display TODO.md task table
- Show dependency graph: `bun TaskBoard.ts deps`
- Show total task count, estimated agent count
- Ask user to approve, request changes, or reject

If changes requested: Re-run Joshua with feedback.
If rejected: Stop workflow.
If approved: Team is ready.

### Step 6: Report

Output:
```
DevTeam initialized for: {project_name}

Architecture: {repo_path}/.devteam/ARCHITECTURE.md
Task Board:   {repo_path}/.devteam/TODO.md
Tasks:        {count} total ({P0_count} P0, {P1_count} P1, {P2_count} P2)
Agents:       {agent_count} developer slots configured

Ready to run: "Run the dev team" or use RunTeam workflow
Monitor with: bun ${PAI_DIR}/skills/DevTeam/tools/TeamStatus.ts
```