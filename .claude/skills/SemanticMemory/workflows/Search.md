# Search Workflow

Search PAI's semantic memory for past work, sessions, learnings, and notes.

## Quick Search

```bash
bun ${PAI_DIR}/skills/SemanticMemory/tools/SemanticSearch.ts "your query here"
```

## Workflow Steps

1. **Formulate the query** - Use natural language describing what you want to find
2. **Run the search** - Execute SemanticSearch.ts with appropriate options
3. **Review results** - Check scores, sources, and snippets
4. **Read full context** - Open the source file at the indicated line range for full details
5. **Synthesize** - Combine findings from multiple results into a coherent answer

## Search Tips

### Effective Queries
- Use descriptive phrases: "How did we configure Traefik wildcard SSL certificates"
- Include key concepts: "Docker backup strategy with Synology NAS"
- Ask questions naturally: "What authentication approach did we use for Authentik SSO"

### Adjusting Results
- **More results**: `--limit 20`
- **Higher quality only**: `--min-score 0.3`
- **Keyword-heavy search**: `--vector-weight 0.3 --text-weight 0.7`
- **Semantic-heavy search**: `--vector-weight 0.9 --text-weight 0.1`
- **Specific source**: `--source session,learning`

### JSON Output for Scripting
```bash
# Pipe results to jq for processing
bun SemanticSearch.ts "query" --json | jq '.results[0].path'
```

### Ensure Fresh Results
```bash
# Sync before searching
bun SemanticSearch.ts "recent changes" --sync
```

## Common Search Patterns

### Find past solutions
```bash
bun SemanticSearch.ts "how did we fix the Traefik routing issue"
```

### Find related learnings
```bash
bun SemanticSearch.ts "SSL certificate management" --source learning
```

### Search Obsidian notes
```bash
bun SemanticSearch.ts "project ideas for consulting" --source obsidian
```

### Search session history
```bash
bun SemanticSearch.ts "what did we work on last week" --source session --limit 20
```
