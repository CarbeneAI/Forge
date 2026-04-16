# Codebase Indexer

**Status:** 🟢 **ALWAYS ACTIVE** - This skill runs automatically before ALL code-related tasks

**Auto-invoke:** When user asks about codebase structure, wants to find files by concept, or needs semantic search through code. **ALWAYS RUNS FIRST for any code work.**

**Description:**
Smart codebase navigation system using semantic embeddings and token-efficient indexing. Enables concept-to-file mapping without reading entire codebase.

**Triggers:**
- "find files related to [concept]"
- "where is [feature] implemented"
- "show me codebase structure"
- "search codebase for [concept]"
- "how is [X] organized"
- "semantic search"

**Core Capabilities:**

1. **Semantic Indexing**
   - Generate embeddings for code concepts
   - Map concepts to file paths
   - Token-efficient summaries
   - Incremental updates

2. **Smart Navigation**
   - Natural language queries
   - Concept-based file discovery
   - Dependency mapping
   - Related code suggestions

3. **Token Optimization**
   - Compressed file summaries
   - Lazy loading of file contents
   - Cached embeddings
   - Query result ranking

**Implementation:**

## Phase 1: Index Codebase

```
1. Scan project structure (file extensions: .ts, .tsx, .js, .jsx, .py, .go, .rs, etc.)
2. Extract key concepts from:
   - File/directory names
   - Export/class/function names
   - Comments and docstrings
   - Import statements
3. Generate embeddings for each concept
4. Store concept → file mappings in JSON index
5. Cache embeddings for reuse
```

## Phase 2: Semantic Search

```
Given user query: "authentication flow"
1. Generate embedding for query
2. Compare with concept embeddings (cosine similarity)
3. Rank results by relevance
4. Return top N files with context summaries
5. Offer to open files or provide deeper analysis
```

## Phase 3: Concept Mapping

```
Maintain bidirectional index:
- Concept → Files (which files implement this concept)
- File → Concepts (what concepts does this file contain)
- Dependencies (what other concepts/files are referenced)
- Usage graph (where is this concept used)
```

**Commands to Create:**

```bash
# Build initial index
~/.claude/skills/codebase-indexer/build-index.sh

# Search codebase
~/.claude/skills/codebase-indexer/search.sh "your query"

# Update index (incremental)
~/.claude/skills/codebase-indexer/update-index.sh

# Show concept map
~/.claude/skills/codebase-indexer/concept-map.sh "concept-name"

# Index statistics
~/.claude/skills/codebase-indexer/stats.sh
```

**Index Structure:**

```json
{
  "version": "1.0",
  "last_updated": "2026-01-25T23:00:00Z",
  "project_root": "/path/to/project",
  "concepts": {
    "authentication": {
      "files": ["src/auth/login.ts", "src/middleware/auth.ts"],
      "related_concepts": ["authorization", "session", "jwt"],
      "summary": "JWT-based authentication with middleware support"
    },
    "database": {
      "files": ["src/db/connection.ts", "src/models/*.ts"],
      "related_concepts": ["orm", "migration", "query"],
      "summary": "PostgreSQL with Prisma ORM"
    }
  },
  "embeddings": {
    "authentication": [0.123, 0.456, ...],
    "database": [0.789, 0.234, ...]
  },
  "file_summaries": {
    "src/auth/login.ts": {
      "concepts": ["authentication", "jwt", "validation"],
      "exports": ["login", "verifyToken"],
      "imports": ["jsonwebtoken", "bcrypt"],
      "line_count": 127,
      "token_estimate": 3500
    }
  }
}
```

**Token Efficiency Strategies:**

1. **Lazy Loading**: Only read files when user explicitly requests
2. **Summaries**: Store 2-3 sentence summaries instead of full content
3. **Concept Pruning**: Only index relevant concepts (exclude node_modules, etc.)
4. **Incremental Updates**: Only reindex changed files
5. **Query Expansion**: Use embeddings to find related terms without full text search

**Integration with Claude Code:**

```bash
# Hook into Claude Code's pre-processing
~/.claude/hooks/codebase-indexer-hook.sh
  → Runs before each session
  → Detects if project has index
  → Injects relevant context based on user query
  → Updates index if files changed (git status)
```

**Dependencies:**
- Python 3.10+ (for embeddings)
- sentence-transformers (pip install)
- Optional: OpenAI Embeddings API (for higher quality)

**Error Handling:**
- Fallback to grep if embeddings unavailable
- Graceful degradation if index missing
- Auto-rebuild if index version mismatch

**Performance:**
- Index build: ~10-30s for medium codebase (1000 files)
- Query: <1s for semantic search
- Incremental update: <5s for 10 changed files

**Example Usage:**

```
User: "Where is the payment processing logic?"

Skill executes:
1. Generate embedding for "payment processing logic"
2. Search index for similar concepts
3. Return:
   - src/payments/stripe.ts (0.92 similarity)
   - src/services/billing.ts (0.87 similarity)
   - src/api/webhooks/stripe.ts (0.81 similarity)
4. Show summaries for each file
5. Ask: "Would you like me to analyze any of these files?"
```

**Outputs:**
- `.codebase-index.json` - Main index file
- `.codebase-embeddings.npy` - Cached embeddings (numpy)
- `~/.claude/logs/codebase-indexer.log` - Operation logs
