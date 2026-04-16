---
name: SemanticMemory
description: Semantic search, temporal knowledge graph, layered context loading, and cross-project tunnels across PAI history, learnings, research, and Obsidian notes. USE WHEN user asks about past work, previous sessions, what they've done before, OR user wants to recall, remember, find, or search history OR user mentions semantic search, memory search, knowledge recall, knowledge graph, entity relations, timeline, tunnels, or cross-project connections.
---

# SemanticMemory

Hybrid BM25 + vector search across all PAI knowledge sources. Combines keyword matching (FTS5) with semantic understanding (OpenAI embeddings) to find relevant past work, sessions, learnings, research, and notes.

## Workflow Routing

**When executing a workflow, call the notification script via Bash:**

```bash
${PAI_DIR}/tools/skill-workflow-notification WorkflowName SemanticMemory
```

| Action | Trigger | Behavior |
|--------|---------|----------|
| **Search** | "what did we do about X", "find past work on Y" | `workflows/Search.md` |
| **Setup** | "set up semantic memory", "first sync" | `workflows/Setup.md` |
| **Knowledge Graph** | "add fact", "who works on X", "timeline for Y" | `tools/KnowledgeGraph.ts` |
| **Context Load** | "wake up", "load context", "essential story" | `tools/ContextLoader.ts` |
| **Tunnels** | "find connections", "what topics bridge X and Y" | `tools/Tunnels.ts` |

## Source Types Indexed

| Source | Directory | Content |
|--------|-----------|---------|
| `session` | `${PAI_DIR}/history/sessions/` | Session summaries |
| `learning` | `${PAI_DIR}/history/learnings/` | Problem-solving narratives |
| `research` | `${PAI_DIR}/history/research/` | Research outputs |
| `obsidian` | `~/Nextcloud/PAI/Obsidian/` | Personal knowledge base |
| `memory` | `${PAI_DIR}/memory/` | Project-specific knowledge |
| `raw-output` | `${PAI_DIR}/history/raw-outputs/` | Session event logs (JSONL) |

## CLI Tools

### SemanticSearch.ts - Search memory

```bash
# Basic search
bun ${PAI_DIR}/skills/SemanticMemory/tools/SemanticSearch.ts "How did we set up Traefik SSL?"

# Filter by source
bun ${PAI_DIR}/skills/SemanticMemory/tools/SemanticSearch.ts "auth flow" --source session,learning

# JSON output for scripting
bun ${PAI_DIR}/skills/SemanticMemory/tools/SemanticSearch.ts "infrastructure" --json --limit 5

# Sync before searching
bun ${PAI_DIR}/skills/SemanticMemory/tools/SemanticSearch.ts "recent work" --sync
```

### IndexManager.ts - Manage the index

```bash
# Check index status
bun ${PAI_DIR}/skills/SemanticMemory/tools/IndexManager.ts status

# Sync new/changed files
bun ${PAI_DIR}/skills/SemanticMemory/tools/IndexManager.ts sync

# Full reindex
bun ${PAI_DIR}/skills/SemanticMemory/tools/IndexManager.ts reindex

# List indexed files
bun ${PAI_DIR}/skills/SemanticMemory/tools/IndexManager.ts files --source session
```

### MemorySync.ts - Sync utility

```bash
# Sync all sources
bun ${PAI_DIR}/skills/SemanticMemory/tools/MemorySync.ts

# Sync one source
bun ${PAI_DIR}/skills/SemanticMemory/tools/MemorySync.ts --source memory

# Dry run
bun ${PAI_DIR}/skills/SemanticMemory/tools/MemorySync.ts --dry-run
```

## How to Use During Conversations

When a user asks about past work, recall, or history:

1. Run a semantic search with the user's query
2. Present the top results with file paths and snippets
3. Read the most relevant file(s) for detailed context
4. Synthesize findings into the response

```bash
# Quick search for context
bun ${PAI_DIR}/skills/SemanticMemory/tools/SemanticSearch.ts "user's question" --limit 5 --json
```

## Knowledge Graph (Temporal)

Entity-relationship triples with time validity. Track who/what/when facts with `valid_from`/`valid_to` dates for temporal queries like "What was Maya working on in January?"

### KnowledgeGraph.ts

```bash
# Add a fact
bun ${PAI_DIR}/skills/SemanticMemory/tools/KnowledgeGraph.ts add "Clint" "owns" "CarbeneAI" --from 2024-01-01 --type person

# Query active facts
bun ${PAI_DIR}/skills/SemanticMemory/tools/KnowledgeGraph.ts query --subject Clint --json

# Point-in-time query ("what was true on this date?")
bun ${PAI_DIR}/skills/SemanticMemory/tools/KnowledgeGraph.ts query --as-of 2025-06-01

# Invalidate a fact (it ended)
bun ${PAI_DIR}/skills/SemanticMemory/tools/KnowledgeGraph.ts invalidate 3

# Entity timeline
bun ${PAI_DIR}/skills/SemanticMemory/tools/KnowledgeGraph.ts timeline "CarbeneAI"

# Stats
bun ${PAI_DIR}/skills/SemanticMemory/tools/KnowledgeGraph.ts stats
```

## Layered Context Loading

4-tier memory loading to reduce startup token cost (inspired by MemPalace):

| Layer | Name | Tokens | When | What |
|-------|------|--------|------|------|
| L0 | Identity | ~66 | Always | Static `identity.txt` |
| L1 | Essential Story | ~800 | Session start | Auto-ranked top chunks by recency + source priority |
| L2 | On-Demand | ~500 | Topic arises | Source-filtered retrieval (no embeddings) |
| L3 | Deep Search | Unlimited | Explicit | Full hybrid BM25 + vector search |

### ContextLoader.ts

```bash
# Wake up — load L0 + L1 for session start (~848 tokens)
bun ${PAI_DIR}/skills/SemanticMemory/tools/ContextLoader.ts wake

# Token count only
bun ${PAI_DIR}/skills/SemanticMemory/tools/ContextLoader.ts wake --tokens

# L2: On-demand by source
bun ${PAI_DIR}/skills/SemanticMemory/tools/ContextLoader.ts on-demand learning --limit 8

# L3: Deep search
bun ${PAI_DIR}/skills/SemanticMemory/tools/ContextLoader.ts search "Traefik" --source session,learning
```

## Cross-Project Tunnels

Auto-discover connections between knowledge sources that share the same topics — without manual tagging.

### Tunnels.ts

```bash
# Discover tunnel for a specific topic
bun ${PAI_DIR}/skills/SemanticMemory/tools/Tunnels.ts discover "security"

# Auto-discover top tunnels across all sources
bun ${PAI_DIR}/skills/SemanticMemory/tools/Tunnels.ts auto --limit 10

# Find bridges between two specific sources
bun ${PAI_DIR}/skills/SemanticMemory/tools/Tunnels.ts bridges session learning

# Stats: how interconnected are your knowledge sources?
bun ${PAI_DIR}/skills/SemanticMemory/tools/Tunnels.ts stats --json
```

## Architecture

- **Database**: SQLite with sqlite-vec extension, FTS5, and knowledge graph at `${PAI_DIR}/data/semantic-memory/memory.db`
- **Embeddings**: Gemini gemini-embedding-001 (primary), OpenAI text-embedding-3-small (fallback)
- **Dimensions**: 768
- **Chunking**: 512 tokens, 102 token overlap, markdown-aware
- **Search**: Hybrid BM25 (30%) + vector cosine similarity (70%)
- **Knowledge Graph**: Temporal entity-relationship triples with `valid_from`/`valid_to`
- **Context Loading**: 4-layer tiered system (L0 identity → L1 essential → L2 on-demand → L3 deep search)
- **Tunnels**: Cross-source topic discovery via TF-IDF + semantic search
- **Index updates**: On-demand via CLI, optional background watcher daemon

## Examples

**Example 1: Recall past Traefik configuration work**
```
User: "What did we do about the Traefik Docker API issue?"
-> Run: bun SemanticSearch.ts "Traefik Docker API issue" --limit 5
-> Returns: Session from 2026-01-28 about removing Docker provider
-> Cite: ~/.claude/history/sessions/2026-01/traefik-fix.md, lines 12-45
```

**Example 2: Find related learnings**
```
User: "What have we learned about SSL certificates?"
-> Run: bun SemanticSearch.ts "SSL certificates learnings" --source learning
-> Returns: Learning about DNS-01 challenge, wildcard certs
-> Synthesize findings from multiple sources
```

**Example 3: Cross-source knowledge retrieval**
```
User: "What do I know about Docker backup strategies?"
-> Run: bun SemanticSearch.ts "Docker backup strategy" --limit 10
-> Returns: Results from sessions, learnings, and memory files
-> Combines operational knowledge with documented procedures
```
