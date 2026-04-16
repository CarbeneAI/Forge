# Search Workflow

Search PAI session history by keyword, tool, date, or session ID.

## Trigger

User asks about:
- "Search history for [keyword]"
- "Find sessions about [topic]"
- "What did I work on [date/timeframe]"
- "Show me sessions using [tool]"

## Steps

### 1. Determine Search Parameters

Extract from user request:
- **Keyword**: Text to search for in payloads
- **Tool**: Specific tool name (Bash, Read, Edit, etc.)
- **Date Range**: Start and end dates (default: last 7 days)
- **Session ID**: Specific session to inspect

### 2. Execute Search

Use the SessionSearch CLI tool:

```bash
bun ${PAI_DIR}/skills/SessionSearch/tools/SessionSearch.ts \
  --keyword "search term" \
  --tool "Bash" \
  --date-from "2026-01-15" \
  --date-to "2026-01-20" \
  --limit 20 \
  --output text
```

### 3. Present Results

Format results for user:
- Group by session if multiple sessions match
- Show timestamp, context, and relevant snippets
- Highlight matching terms
- Offer to drill into specific sessions

## Quick Search Examples

### Keyword Search
```bash
# Find all mentions of "discord"
bun ${PAI_DIR}/skills/SessionSearch/tools/SessionSearch.ts --keyword "discord"
```

### Tool Filter
```bash
# Find all Bash commands
bun ${PAI_DIR}/skills/SessionSearch/tools/SessionSearch.ts --tool "Bash" --limit 50
```

### Date Range
```bash
# Last week's activity
bun ${PAI_DIR}/skills/SessionSearch/tools/SessionSearch.ts --date-from "$(date -d '7 days ago' +%Y-%m-%d)"
```

### Combined Search
```bash
# Bash commands about git in January
bun ${PAI_DIR}/skills/SessionSearch/tools/SessionSearch.ts \
  --keyword "git" \
  --tool "Bash" \
  --date-from "2026-01-01" \
  --date-to "2026-01-31"
```

## Output Formats

### Text (default)
Human-readable format with timestamps and context.

### JSON
```bash
--output json
```
Machine-readable for further processing.

## Notes

- Large date ranges may take longer to process
- Use ripgrep (`rg`) for faster simple text searches
- Session IDs are UUIDs - partial matching not supported
