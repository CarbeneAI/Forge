# Setup Workflow

Initial setup and configuration for SemanticMemory.

## Prerequisites

- Bun runtime installed
- GOOGLE_API_KEY in `${PAI_DIR}/.env` (for Gemini embeddings, free tier)
- Optional: OPENAI_API_KEY in `${PAI_DIR}/.env` (fallback provider)

## Initial Setup

### Step 1: Install Dependencies

```bash
cd ${PAI_DIR}/skills/SemanticMemory
bun install
```

### Step 2: Verify Configuration

```bash
# Check that API keys are available
grep GOOGLE_API_KEY ${PAI_DIR}/.env

# Check index status (will create empty database)
bun ${PAI_DIR}/skills/SemanticMemory/tools/IndexManager.ts status
```

### Step 3: Dry Run

See what files would be indexed before committing:

```bash
bun ${PAI_DIR}/skills/SemanticMemory/tools/MemorySync.ts --dry-run
```

### Step 4: Initial Sync

Start with a small source to verify everything works:

```bash
# Index just memory files first (usually small)
bun ${PAI_DIR}/skills/SemanticMemory/tools/MemorySync.ts --source memory

# Verify with a search
bun ${PAI_DIR}/skills/SemanticMemory/tools/SemanticSearch.ts "test query"
```

### Step 5: Full Sync

Once verified, index all sources:

```bash
bun ${PAI_DIR}/skills/SemanticMemory/tools/MemorySync.ts
```

This may take several minutes depending on the number of files and embedding API latency.

### Step 6: Verify Index

```bash
bun ${PAI_DIR}/skills/SemanticMemory/tools/IndexManager.ts status
```

## Optional: Background Watcher

Start the file watcher daemon for automatic incremental indexing:

```bash
# Start daemon
bun ${PAI_DIR}/skills/SemanticMemory/tools/IndexManager.ts watch --daemon

# Check status
bun ${PAI_DIR}/skills/SemanticMemory/tools/IndexManager.ts watch --status

# Stop daemon
bun ${PAI_DIR}/skills/SemanticMemory/tools/IndexManager.ts watch --stop
```

## Configuration

Override defaults via environment variables or `${PAI_DIR}/data/semantic-memory/config.json`:

| Variable | Default | Description |
|----------|---------|-------------|
| SM_PRIMARY_PROVIDER | gemini | Primary embedding provider |
| SM_FALLBACK_PROVIDER | openai | Fallback provider |
| SM_EMBEDDING_DIMS | 768 | Embedding dimensions |
| SM_CHUNK_MAX_TOKENS | 512 | Max tokens per chunk |
| SM_VECTOR_WEIGHT | 0.7 | Semantic search weight |
| SM_TEXT_WEIGHT | 0.3 | Keyword search weight |

## Troubleshooting

### "GOOGLE_API_KEY is required"
Add your Google API key to `${PAI_DIR}/.env`:
```
GOOGLE_API_KEY=your_key_here
```

### Empty search results
1. Check if files are indexed: `bun IndexManager.ts status`
2. Run a sync: `bun MemorySync.ts`
3. Try a broader query with lower min-score: `--min-score 0.05`

### Slow indexing
- Gemini free tier is limited to 100 RPM
- Large corpora may take several minutes on first sync
- Subsequent syncs are fast due to hash-based change detection and embedding cache
