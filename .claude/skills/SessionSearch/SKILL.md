---
name: SessionSearch
description: Search PAI session history using jq queries and text search. USE WHEN user mentions search history, find sessions, session logs, past conversations, cost tracking, tool usage statistics, what did I work on, OR wants to analyze previous PAI sessions.
---

# SessionSearch

Search and analyze PAI session history, including events, tool usage, and costs.

## Workflow Routing

**When executing a workflow, call the notification script via Bash:**

```bash
${PAI_DIR}/tools/skill-workflow-notification WorkflowName SessionSearch
```

| Workflow | Trigger | File |
|----------|---------|------|
| **Search** | "search history", "find sessions", "what did I work on" | `workflows/Search.md` |
| **AnalyzeCost** | "cost tracking", "token usage", "how much did I spend" | `workflows/AnalyzeCost.md` |
| **ToolUsage** | "tool stats", "which tools", "tool usage" | `workflows/ToolUsage.md` |
| **Timeline** | "session timeline", "activity over time", "when did I" | `workflows/Timeline.md` |

## Examples

**Example 1: Search for past work**
```
User: "What did I work on related to Discord?"
→ Invokes Search workflow
→ Searches all-events.jsonl files for "discord" keyword
→ Returns matching sessions with timestamps and context
```

**Example 2: Analyze tool usage**
```
User: "Which tools do I use most often?"
→ Invokes ToolUsage workflow
→ Aggregates tool_name from events
→ Returns ranked list: Bash (45%), Read (25%), Edit (15%)...
```

**Example 3: Check session costs**
```
User: "How much have I spent on PAI this month?"
→ Invokes AnalyzeCost workflow
→ Parses token counts from session data
→ Returns daily/weekly/monthly breakdown
```

## Data Sources

### Event Logs (JSONL)
**Location:** `${PAI_DIR}/history/raw-outputs/YYYY-MM/YYYY-MM-DD_all-events.jsonl`

**Event Types:**
- `SessionStart` - New session began
- `SessionEnd` - Session completed
- `UserPromptSubmit` - User input
- `PreToolUse` / `PostToolUse` - Tool execution
- `SubagentStop` - Subagent completed
- `Stop` - Session stopped

**Event Fields:**
```json
{
  "source_app": "pai",
  "session_id": "uuid",
  "hook_event_type": "PostToolUse",
  "payload": {
    "session_id": "uuid",
    "transcript_path": "/path/to/transcript.jsonl",
    "cwd": "/working/directory",
    "tool_name": "Bash",
    "tool_input": {...},
    "tool_response": {...}
  },
  "timestamp": 1767503279676,
  "timestamp_pst": "2026-01-03 21:07:59 PST"
}
```

### Tool Outputs (JSONL)
**Location:** `${PAI_DIR}/history/raw-outputs/YYYY-MM/YYYY-MM-DD_tool-outputs.jsonl`

**Fields:**
```json
{
  "timestamp": "ISO-8601",
  "tool": "Bash",
  "input": { "command": "...", "description": "..." },
  "output": { "stdout": "...", "stderr": "..." }
}
```

### Session Summaries (Markdown)
**Location:** `${PAI_DIR}/history/sessions/YYYY-MM/*.md`

Human-readable session summaries captured by hooks.

## CLI Tools

### SessionSearch.ts
Main search CLI for querying history.

```bash
# Search by keyword
bun ${PAI_DIR}/skills/SessionSearch/tools/SessionSearch.ts --keyword "auth"

# Search by tool
bun ${PAI_DIR}/skills/SessionSearch/tools/SessionSearch.ts --tool "Bash"

# Search by date range
bun ${PAI_DIR}/skills/SessionSearch/tools/SessionSearch.ts --date-from 2026-01-01 --date-to 2026-01-15

# Get specific session
bun ${PAI_DIR}/skills/SessionSearch/tools/SessionSearch.ts --session-id "abc123"
```

### CostAnalyzer.ts
Token and cost tracking.

```bash
# Daily cost summary
bun ${PAI_DIR}/skills/SessionSearch/tools/CostAnalyzer.ts --period day

# Monthly breakdown
bun ${PAI_DIR}/skills/SessionSearch/tools/CostAnalyzer.ts --period month
```

### ToolStats.ts
Tool usage analytics.

```bash
# All-time tool stats
bun ${PAI_DIR}/skills/SessionSearch/tools/ToolStats.ts

# Tool stats for date range
bun ${PAI_DIR}/skills/SessionSearch/tools/ToolStats.ts --date-from 2026-01-01
```

## Query Patterns

See `QueryPatterns.md` for common jq patterns and search strategies.
