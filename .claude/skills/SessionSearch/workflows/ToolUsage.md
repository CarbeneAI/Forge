# ToolUsage Workflow

Analyze tool usage patterns across PAI sessions.

## Trigger

User asks about:
- "Which tools do I use most"
- "Tool usage statistics"
- "How often do I use [tool]"
- "Tool frequency"

## Steps

### 1. Determine Scope

Extract from request:
- Date range (default: all time or current month)
- Specific tool to analyze (optional)
- Grouping (by day, week, session)

### 2. Run Tool Stats

```bash
bun ${PAI_DIR}/skills/SessionSearch/tools/ToolStats.ts \
  --date-from "2026-01-01" \
  --group-by day \
  --output text
```

### 3. Present Analysis

Show:
- Tool frequency ranking
- Usage percentages
- Trend over time
- Per-session averages

## Quick Commands

### All-time stats
```bash
bun ${PAI_DIR}/skills/SessionSearch/tools/ToolStats.ts
```

### This month
```bash
bun ${PAI_DIR}/skills/SessionSearch/tools/ToolStats.ts --date-from "$(date +%Y-%m-01)"
```

### Specific tool deep-dive
```bash
bun ${PAI_DIR}/skills/SessionSearch/tools/ToolStats.ts --tool "Bash" --verbose
```

## Example Output

```
PAI Tool Usage Statistics
=========================

Period: 2026-01-01 to 2026-01-26
Total Tool Uses: 2,456

Top 10 Tools:
 1. Bash           892 (36.3%)  ████████████████████
 2. Read           534 (21.7%)  ████████████
 3. Edit           298 (12.1%)  ███████
 4. Write          201 (8.2%)   █████
 5. Grep           178 (7.2%)   ████
 6. Glob           156 (6.4%)   ████
 7. Task           89 (3.6%)    ██
 8. WebFetch       45 (1.8%)    █
 9. WebSearch      34 (1.4%)    █
10. AskUser        29 (1.2%)    █

Daily Trend (last 7 days):
- 01-26: 124 tools
- 01-25: 87 tools
- 01-24: 156 tools
- 01-23: 98 tools
- 01-22: 201 tools
- 01-21: 145 tools
- 01-20: 112 tools

Average per session: 54.6 tools
```

## Insights

Tool usage patterns can reveal:
- **High Bash usage** - Lots of system commands, deployments
- **High Read usage** - Codebase exploration, research
- **High Edit usage** - Active development
- **High Task usage** - Multi-agent workflows
- **High WebSearch** - Research-heavy sessions
