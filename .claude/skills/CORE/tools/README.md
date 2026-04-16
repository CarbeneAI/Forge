# CORE Tools

Quick access CLI utilities for PAI system management and search.

## MemorySearch.ts

Quick semantic search wrapper around SemanticMemory for command-line access.

### Features

- **Fast semantic search** across all PAI history (sessions, learnings, research, Obsidian notes)
- **Color-coded results** based on relevance scores
- **Source filtering** (session, learning, research, obsidian, memory, raw-output)
- **JSON output** for scripting and automation
- **Automatic index sync** option for latest data

### Usage

```bash
# Basic search
bun MemorySearch.ts "query text"
pai-search "query text"  # Shell alias

# Filter by source type
pai-search "trading strategies" --source session
pai-search "security audit" --source learning,research

# More results
pai-search "docker configuration" --limit 10

# JSON output for scripting
pai-search "homelab setup" --json | jq '.results[0].snippet'

# Sync index before searching
pai-search --sync
pai-search "recent work" --sync --limit 5
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--source` | Filter by source type(s) | All sources |
| `--limit N` | Maximum results to return | 5 |
| `--json` | Output raw JSON instead of formatted | false |
| `--sync` | Sync index before searching | false |
| `--help, -h` | Show help message | - |

### Valid Source Types

- `session` - Session summaries and work logs
- `learning` - Captured learnings and problem-solving narratives
- `research` - Research outputs and analysis
- `obsidian` - Obsidian vault notes (if configured)
- `memory` - Project memory and persistent knowledge
- `raw-output` - Raw event logs (JSONL)

### Output Format

**Default (formatted):**
```
PAI Memory Search: "trading dashboard"
==================

  #1  [session] Score: 0.87
      ~/PAI/.claude/history/sessions/2026-01/...
      ...relevant snippet preview...

  #2  [learning] Score: 0.82
      ~/PAI/.claude/history/learnings/2026-01/...
      ...relevant snippet preview...

==================
2 results found
```

**JSON output (`--json`):**
```json
{
  "query": "trading dashboard",
  "totalChunks": 576,
  "durationMs": 963,
  "results": [
    {
      "rank": 1,
      "chunkId": "...",
      "combinedScore": 0.87,
      "vectorScore": 0.91,
      "textScore": 0.75,
      "source": "session",
      "path": "~/PAI/.claude/history/sessions/...",
      "startLine": 1,
      "endLine": 50,
      "snippet": "..."
    }
  ]
}
```

### Score Colors

Results are color-coded based on relevance:
- **Green** - High relevance (score > 0.7)
- **Yellow** - Medium relevance (score 0.4-0.7)
- **Dim** - Lower relevance (score < 0.4)

### Examples

**Find previous work on a topic:**
```bash
pai-search "what did we do about the homelab"
```

**Search only sessions:**
```bash
pai-search "trading implementation" --source session --limit 10
```

**Get JSON for scripting:**
```bash
# Extract file paths from results
pai-search "docker compose" --json | jq -r '.results[].path'

# Get top result snippet
pai-search "traefik config" --json | jq -r '.results[0].snippet'
```

**Ensure latest results:**
```bash
pai-search "today's work" --sync --limit 3
```

### Implementation

MemorySearch.ts is a thin wrapper around SemanticSearch.ts that:
1. Parses command-line arguments
2. Builds the SemanticSearch command
3. Executes via `Bun.spawn`
4. Formats output (nice display or raw JSON)

All actual search logic lives in `SemanticMemory/tools/SemanticSearch.ts`.

### Shell Alias

Add to your shell profile for quick access:

```bash
# Added automatically via pai-aliases.sh
pai-search() {
    bun ~/PAI/.claude/skills/CORE/tools/MemorySearch.ts "$@"
}
```

### Related Tools

- **SemanticSearch.ts** - Full-featured semantic search with advanced options
- **SessionSearch** - Specialized session history search with cost tracking
- **Memory skill** - Project-specific knowledge management

