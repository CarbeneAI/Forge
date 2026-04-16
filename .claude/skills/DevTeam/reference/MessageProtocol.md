# Message Protocol

## Overview

DevTeam agents communicate via file-based inbox/outbox messaging. Each agent has an inbox directory at `.devteam/agents/{agent-name}/inbox/`. Messages are markdown files with structured metadata.

## Message File Format

```markdown
# Message

**From:** {sender agent name}
**To:** {recipient agent name}
**Type:** {message type}
**Re:** {task reference, e.g., task-003}
**Timestamp:** {ISO 8601 timestamp}

## Body

{Free-form message content}
```

## File Naming Convention

```
{timestamp}-{from}-{type}.md
```

Where timestamp uses filesystem-safe format: `YYYY-MM-DDTHHMMSSZ` (no colons).

**Example:** `2026-02-12T103000Z-hiram-1-task-complete.md`

## Message Types

| Type | Direction | Purpose |
|------|-----------|---------|
| `task_assignment` | Joshua -> Agent | Assigns a task with full spec |
| `task_complete` | Agent -> Joshua | Reports successful task completion |
| `task_failed` | Agent -> Joshua | Reports failure with details |
| `review_request` | Joshua -> Ezra/Solomon | Requests QA or code review |
| `review_result` | Ezra/Solomon -> Joshua | Reports review pass/fail |
| `status_request` | Joshua -> Agent | Asks agent for current status |
| `status_response` | Agent -> Joshua | Reports current activity |

## Message Lifecycle

1. Sender creates message file in recipient's `inbox/` directory
2. Recipient reads messages from their `inbox/`
3. After processing, recipient moves message to `inbox/.read/`
4. `.read/` subdirectory serves as archive

## Message Type Templates

### task_assignment

```markdown
# Message

**From:** joshua
**To:** hiram-1
**Type:** task_assignment
**Re:** task-003
**Timestamp:** 2026-02-12T10:30:00Z

## Body

**Task:** Implement user model
**Branch:** task/003
**Priority:** P0

### Task Spec
[Full task description and acceptance criteria]

### Relevant Files
- src/models/ (create new file)
- src/types/user.ts (reference for types)

### Context
User model must match the schema defined in ARCHITECTURE.md section 3.2.
```

### task_complete

```markdown
# Message

**From:** hiram-1
**To:** joshua
**Type:** task_complete
**Re:** task-003
**Timestamp:** 2026-02-12T11:15:00Z

## Body

Task 003 (Implement user model) is complete.

- Tests passing: 8/8
- Files changed: src/models/user.ts, src/models/user.test.ts
- Commit: abc1234
- Branch: task/003

Ready for dependent tasks to be unblocked.
```

### task_failed

```markdown
# Message

**From:** hiram-2
**To:** joshua
**Type:** task_failed
**Re:** task-005
**Timestamp:** 2026-02-12T11:45:00Z

## Body

Task 005 (Implement login endpoint) failed.

**Reason:** Missing database migration for sessions table.
**Attempted:** Created endpoint but tests fail on missing table.
**Blocker:** Need sessions table migration (not in current task specs).
**Suggestion:** Create new task for database migration, make task-005 depend on it.
```

### review_request

```markdown
# Message

**From:** joshua
**To:** ezra
**Type:** review_request
**Re:** task-003
**Timestamp:** 2026-02-12T11:20:00Z

## Body

Task 003 (Implement user model) is complete and ready for QA.

**Branch:** task/003
**Agent:** hiram-1
**Task Spec:** .devteam/tasks/task-003.md

Please verify all acceptance criteria and run full test suite.
```

### review_result

```markdown
# Message

**From:** ezra
**To:** joshua
**Type:** review_result
**Re:** task-003
**Timestamp:** 2026-02-12T11:35:00Z

## Body

**Verdict:** PASS

All acceptance criteria verified:
- [x] User model with required fields (name, email, password hash)
- [x] Validation for email format
- [x] Password hashing with bcrypt
- [x] Unit tests: 8/8 passing

**Notes:** Consider adding index on email field for performance (non-blocking).
```

## CLI Usage

```bash
# Send a message
bun MessageBus.ts send --from hiram-1 --to joshua --type task_complete --re task-003 --body "Done. Tests: 8/8."

# Read unread messages
bun MessageBus.ts read --agent joshua

# Filter by type
bun MessageBus.ts read --agent joshua --type task_complete

# List all messages (summary)
bun MessageBus.ts list --agent joshua [--unread]

# Acknowledge (move to .read/)
bun MessageBus.ts ack --agent joshua --message 2026-02-12T103000Z-hiram-1-task-complete.md
```

## Design Principles

1. **Human-readable:** Messages are markdown — viewable with any text editor
2. **Observable:** File system is the message bus — `ls`, `cat`, `find` all work
3. **Debuggable:** Full message history preserved in `.read/` subdirectory
4. **Simple:** No daemons, no databases, no message brokers — just files
5. **Git-trackable:** Messages can be committed for full audit trail