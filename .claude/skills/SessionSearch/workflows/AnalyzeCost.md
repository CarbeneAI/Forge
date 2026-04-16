# AnalyzeCost Workflow

Analyze token usage and estimated costs from PAI sessions.

## Trigger

User asks about:
- "How much have I spent"
- "Token usage this month"
- "Cost analysis"
- "API usage"

## Steps

### 1. Determine Period

Extract time period from request:
- `day` - Today's usage
- `week` - Last 7 days
- `month` - Current month
- `custom` - Specific date range

### 2. Run Cost Analyzer

```bash
bun ${PAI_DIR}/skills/SessionSearch/tools/CostAnalyzer.ts \
  --period month \
  --date-from "2026-01-01" \
  --output text
```

### 3. Present Analysis

Show:
- Total sessions
- Total tool invocations
- Estimated token counts (based on events)
- Cost breakdown by day/week
- Most expensive sessions

## Cost Estimation Notes

**Important:** PAI history does not directly capture token counts or costs. This tool provides estimates based on:

1. **Session count** - More sessions = more API calls
2. **Tool invocations** - Each tool use typically involves model calls
3. **Subagent spawns** - Parallel agents multiply costs
4. **Event volume** - More events = more activity

For accurate cost tracking, use Anthropic's usage dashboard directly.

## Example Output

```
PAI Cost Analysis - January 2026
================================

Period: 2026-01-01 to 2026-01-26

Sessions: 45
Tool Invocations: 1,234
Subagent Spawns: 89

Daily Activity:
- 2026-01-26: 5 sessions, 124 tools
- 2026-01-25: 3 sessions, 87 tools
- 2026-01-24: 4 sessions, 156 tools
...

Most Active Sessions:
1. 2ea0bc38-fcea... (312 tool uses)
2. 969df305-dc26... (201 tool uses)
3. fc482e7b-5e5e... (156 tool uses)

Estimated Activity Level: HIGH
```

## Limitations

- Token counts not directly available in history
- Costs are estimates based on activity volume
- For billing, use Anthropic Console
