# Query Patterns

Common jq patterns for searching PAI session history.

## Event Log Queries

### Find sessions by keyword in payload
```bash
cat ${PAI_DIR}/history/raw-outputs/2026-01/*.jsonl | \
  jq -c 'select(.payload | tostring | test("keyword"; "i"))'
```

### Get all events for a specific session
```bash
cat ${PAI_DIR}/history/raw-outputs/2026-01/*.jsonl | \
  jq -c 'select(.session_id == "your-session-id")'
```

### Filter by event type
```bash
cat ${PAI_DIR}/history/raw-outputs/2026-01/*.jsonl | \
  jq -c 'select(.hook_event_type == "PostToolUse")'
```

### Get all tool uses in date range
```bash
cat ${PAI_DIR}/history/raw-outputs/2026-01/2026-01-{15..20}_all-events.jsonl | \
  jq -c 'select(.hook_event_type == "PostToolUse") | {
    time: .timestamp_pst,
    tool: .payload.tool_name,
    session: .session_id
  }'
```

## Tool Stats Queries

### Count tools by frequency
```bash
cat ${PAI_DIR}/history/raw-outputs/2026-01/*_all-events.jsonl | \
  jq -r 'select(.hook_event_type == "PostToolUse") | .payload.tool_name' | \
  sort | uniq -c | sort -rn
```

### Top 10 most used tools
```bash
cat ${PAI_DIR}/history/raw-outputs/2026-01/*_all-events.jsonl | \
  jq -r 'select(.hook_event_type == "PostToolUse") | .payload.tool_name' | \
  sort | uniq -c | sort -rn | head -10
```

### Tool usage over time (daily)
```bash
for file in ${PAI_DIR}/history/raw-outputs/2026-01/*_all-events.jsonl; do
  date=$(basename "$file" | cut -d'_' -f1)
  count=$(cat "$file" | jq -c 'select(.hook_event_type == "PostToolUse")' | wc -l)
  echo "$date: $count tools"
done
```

## Session Queries

### List all sessions on a day
```bash
cat ${PAI_DIR}/history/raw-outputs/2026-01/2026-01-15_all-events.jsonl | \
  jq -r 'select(.hook_event_type == "SessionStart") |
    "\(.timestamp_pst) - \(.session_id)"'
```

### Find sessions with specific working directory
```bash
cat ${PAI_DIR}/history/raw-outputs/2026-01/*_all-events.jsonl | \
  jq -c 'select(.hook_event_type == "SessionStart" and
    (.payload.cwd | test("project-name")))'
```

### Get session duration (start to end)
```bash
cat ${PAI_DIR}/history/raw-outputs/2026-01/*_all-events.jsonl | \
  jq -s '
    group_by(.session_id) |
    map({
      session: .[0].session_id,
      start: (map(select(.hook_event_type == "SessionStart")) | .[0].timestamp),
      end: (map(select(.hook_event_type == "SessionEnd" or .hook_event_type == "Stop")) | .[0].timestamp)
    }) |
    select(.start and .end) |
    .duration = ((.end - .start) / 1000 / 60) |
    "\(.session): \(.duration | floor) minutes"
  '
```

## User Prompt Queries

### Find prompts containing text
```bash
cat ${PAI_DIR}/history/raw-outputs/2026-01/*_all-events.jsonl | \
  jq -c 'select(.hook_event_type == "UserPromptSubmit" and
    (.payload.prompt | test("search term"; "i")))' | \
  jq -r '"\(.timestamp_pst) - \(.payload.prompt | .[0:100])..."'
```

### Count prompts per day
```bash
for file in ${PAI_DIR}/history/raw-outputs/2026-01/*_all-events.jsonl; do
  date=$(basename "$file" | cut -d'_' -f1)
  count=$(cat "$file" | jq -c 'select(.hook_event_type == "UserPromptSubmit")' | wc -l)
  echo "$date: $count prompts"
done
```

## Subagent Queries

### List all subagent completions
```bash
cat ${PAI_DIR}/history/raw-outputs/2026-01/*_all-events.jsonl | \
  jq -c 'select(.hook_event_type == "SubagentStop")' | \
  jq -r '"\(.timestamp_pst) - Agent: \(.payload.agent_id)"'
```

### Count subagents per session
```bash
cat ${PAI_DIR}/history/raw-outputs/2026-01/*_all-events.jsonl | \
  jq -r 'select(.hook_event_type == "SubagentStop") | .session_id' | \
  sort | uniq -c | sort -rn
```

## Tool Output Queries

### Search tool outputs by command
```bash
cat ${PAI_DIR}/history/raw-outputs/2026-01/*_tool-outputs.jsonl | \
  jq -c 'select(.tool == "Bash" and (.input.command | test("git")))'
```

### Find errors in tool outputs
```bash
cat ${PAI_DIR}/history/raw-outputs/2026-01/*_tool-outputs.jsonl | \
  jq -c 'select(.output.stderr != "" and .output.stderr != null)'
```

## Combined Queries

### Full session reconstruction
```bash
SESSION_ID="your-session-id"
cat ${PAI_DIR}/history/raw-outputs/2026-01/*_all-events.jsonl | \
  jq -c "select(.session_id == \"$SESSION_ID\")" | \
  jq -s 'sort_by(.timestamp) | .[] | "\(.timestamp_pst) [\(.hook_event_type)]"'
```

### Activity heatmap (events per hour)
```bash
cat ${PAI_DIR}/history/raw-outputs/2026-01/*_all-events.jsonl | \
  jq -r '.timestamp_pst | split(" ")[1] | split(":")[0]' | \
  sort | uniq -c | sort -k2
```

## Grep Alternatives (Faster for Text Search)

For simple keyword searches, `rg` (ripgrep) is faster than jq:

```bash
# Fast keyword search
rg -i "keyword" ${PAI_DIR}/history/raw-outputs/2026-01/

# Search with context
rg -i -C 2 "error" ${PAI_DIR}/history/raw-outputs/2026-01/

# Count matches per file
rg -i -c "keyword" ${PAI_DIR}/history/raw-outputs/2026-01/
```

## Performance Tips

1. **Limit date range first** - Don't scan all history if you know the timeframe
2. **Use ripgrep for text search** - jq is slower for simple string matching
3. **Stream with -c flag** - `jq -c` for line-by-line processing
4. **Avoid -s (slurp) on large files** - Loads entire file into memory
5. **Filter early** - Put `select()` statements first in jq pipeline
