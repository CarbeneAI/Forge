# Task Format

## Overview

DevTeam uses two complementary task representations:
1. **TODO.md** — Master task table (overview, dependencies, status)
2. **Task files** — Individual task specs in `.devteam/tasks/task-{ID}.md`

## TODO.md Format

```markdown
# DevTeam: [Project Name]

**Created:** YYYY-MM-DD
**Status:** Planning | In Progress | Review | Complete
**Agents Active:** N/M

## Tasks

| ID | Title | Status | Assignee | Depends On | Branch | Priority |
|----|-------|--------|----------|------------|--------|----------|
| 001 | Design auth architecture | done | bezalel | - | - | P0 |
| 002 | Write user model tests | in_progress | hiram-1 | 001 | task/002 | P0 |
| 003 | Implement user model | blocked | - | 002 | - | P0 |

## Legend
- **done** - Task completed and verified
- **in_progress** - Agent actively working
- **blocked** - Dependencies not yet met
- **pending** - Ready to assign when agent available
- **failed** - Agent encountered unrecoverable error
- **review** - In QA or code review
```

## Task Statuses

| Status | Meaning | Transitions To |
|--------|---------|----------------|
| `pending` | Ready to assign (deps met or no deps) | `in_progress` |
| `in_progress` | Agent actively working | `done`, `failed`, `review` |
| `blocked` | Dependencies not yet met | `pending` (auto when deps complete) |
| `done` | Completed and verified | - (terminal) |
| `failed` | Agent encountered unrecoverable error | `pending` (for reassignment) |
| `review` | In QA or code review | `done`, `failed` |

## Task ID Format

- 3-digit zero-padded: `001`, `002`, `003`
- Auto-incrementing
- Never reused within a project

## Individual Task File Format

Located at `.devteam/tasks/task-{ID}.md`:

```markdown
# Task {ID}: {Title}

**Priority:** P0 | P1 | P2
**Status:** pending | in_progress | blocked | done | failed | review
**Assignee:** {agent-name} | unassigned
**Depends On:** {comma-separated IDs} | none
**Branch:** {branch-name} | not created

## Description

{Detailed description of what needs to be done. Include context about why this task exists, what problem it solves, and how it fits into the larger architecture.}

## Acceptance Criteria

- [ ] {Specific, testable criterion 1}
- [ ] {Specific, testable criterion 2}
- [ ] {Specific, testable criterion 3}

## Files

**Create:**
- {path/to/new/file.ts} — {description}

**Modify:**
- {path/to/existing/file.ts} — {what to change}

**Reference:**
- {path/to/file.ts} — {why it's relevant}

## Notes

{Any additional context, gotchas, or implementation hints}
```

## Priority Levels

| Priority | Meaning | Assignment Order |
|----------|---------|-----------------|
| P0 | Critical path — blocks other work | Assign immediately |
| P1 | Important — needed for feature completeness | Assign when P0 tasks are covered |
| P2 | Nice-to-have — quality improvements | Assign when P0/P1 done |

## Dependency Rules

1. A task is **blocked** if any of its dependencies are NOT `done`
2. A task becomes **pending** when ALL its dependencies are `done`
3. Circular dependencies are never allowed — Joshua detects and rejects them
4. The dependency graph must be a DAG (directed acyclic graph)
5. Dependencies are specified as comma-separated task IDs: `001,002,003`
6. A `-` in the Depends On column means no dependencies

## Task Decomposition Guidelines

### Granularity

Each task should be:
- **2-5 minutes** of agent work
- **Independently testable** — can verify without other tasks
- **Single responsibility** — does one thing well

### TDD Ordering Pattern

For each feature component:
1. Task N: Write tests for [component]
2. Task N+1: Implement [component] (depends on N)
3. Task N+2: Integration test [component] (depends on N+1)

### Common Task Types

| Type | Description | Example |
|------|-------------|---------|
| Design | Architecture or API design | "Design user authentication flow" |
| Test | Write test suite | "Write unit tests for user model" |
| Implement | Write production code | "Implement user model with validation" |
| Integration | Wire components together | "Connect auth endpoint to user model" |
| Review | QA or code review | "Review and test auth implementation" |
| Documentation | Write docs or comments | "Document auth API endpoints" |

## CLI Operations

```bash
# Add a new task
bun TaskBoard.ts add --title "Write login tests" --depends 001 --priority P0 --description "Unit tests for POST /login"

# Update task status
bun TaskBoard.ts update 003 --status in_progress --assignee hiram-1 --branch task/003

# View tasks filtered by status
bun TaskBoard.ts list --status pending

# Get next available task
bun TaskBoard.ts next

# Show dependency graph
bun TaskBoard.ts deps
```