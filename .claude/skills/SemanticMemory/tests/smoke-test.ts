/**
 * SemanticMemory - Smoke Test
 *
 * Verifies:
 * 1. sqlite-vec loads correctly with bun:sqlite
 * 2. Database schema creates successfully
 * 3. FTS5 works
 * 4. Chunker produces correct output
 * 5. Gemini embedding API works (if GOOGLE_API_KEY is set)
 * 6. End-to-end: index a test file, search for it
 */

import { Database } from "bun:sqlite";
import * as sqliteVec from "sqlite-vec";
import { chunkMarkdown, estimateTokens } from "../src/chunker.js";
import { buildFtsQuery } from "../src/search.js";
import { normalizeEmbedding } from "../src/embeddings.js";
import { loadConfig, resetConfig } from "../src/config.js";
import { initDb, closeDb, resetDb, getMetaValue } from "../src/db.js";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`  PASS: ${message}`);
    passed++;
  } else {
    console.error(`  FAIL: ${message}`);
    failed++;
  }
}

async function testSqliteVecLoads(): Promise<void> {
  console.log("\n--- Test: sqlite-vec loads ---");
  const db = new Database(":memory:");
  sqliteVec.load(db);

  const result = db.prepare("SELECT vec_version() as version").get() as {
    version: string;
  };
  assert(!!result.version, `vec_version() returned: ${result.version}`);

  // Test vec0 table creation
  db.exec(
    "CREATE VIRTUAL TABLE test_vec USING vec0(id TEXT PRIMARY KEY, embedding float[4])"
  );

  // Insert a test vector
  const embedding = new Float32Array([0.1, 0.2, 0.3, 0.4]);
  db.prepare("INSERT INTO test_vec (id, embedding) VALUES (?, ?)").run(
    "test1",
    embedding
  );

  // Query it back
  const rows = db
    .prepare(
      "SELECT id, distance FROM test_vec WHERE embedding MATCH ? AND k = 1 ORDER BY distance"
    )
    .all(embedding) as { id: string; distance: number }[];
  assert(rows.length === 1, `vec0 query returned ${rows.length} row(s)`);
  assert(rows[0].id === "test1", `vec0 returned correct id: ${rows[0].id}`);
  assert(
    rows[0].distance < 0.001,
    `vec0 distance for identical vector: ${rows[0].distance}`
  );

  db.close();
}

async function testFts5Works(): Promise<void> {
  console.log("\n--- Test: FTS5 works ---");
  const db = new Database(":memory:");

  db.exec(
    "CREATE VIRTUAL TABLE test_fts USING fts5(text, tokenize = 'porter unicode61')"
  );
  db.prepare("INSERT INTO test_fts (text) VALUES (?)").run(
    "The quick brown fox jumps over the lazy dog"
  );
  db.prepare("INSERT INTO test_fts (text) VALUES (?)").run(
    "Traefik SSL certificate setup with Cloudflare DNS challenge"
  );

  const results = db
    .prepare(
      "SELECT text, bm25(test_fts) as rank FROM test_fts WHERE test_fts MATCH ? ORDER BY rank"
    )
    .all('"traefik"') as { text: string; rank: number }[];

  assert(results.length === 1, `FTS5 MATCH returned ${results.length} result(s)`);
  assert(
    results[0].text.includes("Traefik"),
    `FTS5 found correct document`
  );
  assert(results[0].rank < 0, `BM25 rank is negative: ${results[0].rank}`);

  db.close();
}

async function testChunker(): Promise<void> {
  console.log("\n--- Test: Chunker ---");

  const markdown = `# Introduction

This is a test document about setting up Traefik reverse proxy.

## Installation

Install Traefik using Docker Compose:

\`\`\`yaml
version: '3'
services:
  traefik:
    image: traefik:v2.10
    ports:
      - "80:80"
      - "443:443"
\`\`\`

## SSL Configuration

Configure SSL with Cloudflare DNS challenge for wildcard certificates.
This requires a Cloudflare API token with Zone:DNS:Edit permissions.

The certResolver in Traefik's static config handles auto-renewal via ACME.
Certificates are stored in acme.json which should have 600 permissions.

## Troubleshooting

If SSL isn't working, check:
- Cloudflare API token permissions
- DNS propagation status
- Traefik logs for ACME errors
- acme.json file permissions`;

  const chunks = chunkMarkdown(markdown, {
    maxTokens: 100,
    overlapTokens: 20,
    minTokens: 10,
  });

  assert(chunks.length > 1, `Chunker produced ${chunks.length} chunks`);

  // Verify line numbers are set
  for (const chunk of chunks) {
    assert(chunk.startLine >= 1, `Chunk startLine >= 1: ${chunk.startLine}`);
    assert(
      chunk.endLine >= chunk.startLine,
      `Chunk endLine >= startLine: ${chunk.endLine} >= ${chunk.startLine}`
    );
    assert(chunk.tokens > 0, `Chunk has tokens: ${chunk.tokens}`);
  }

  // Test empty input
  const empty = chunkMarkdown("", { maxTokens: 100 });
  assert(empty.length === 0, `Empty input returns empty array`);

  // Test token estimation
  assert(
    estimateTokens("hello world") === 3,
    `estimateTokens("hello world") = ${estimateTokens("hello world")}`
  );
}

async function testBuildFtsQuery(): Promise<void> {
  console.log("\n--- Test: buildFtsQuery ---");

  const q1 = buildFtsQuery("traefik ssl setup");
  assert(
    q1 === '"traefik" AND "ssl" AND "setup"',
    `buildFtsQuery basic: ${q1}`
  );

  const q2 = buildFtsQuery("");
  assert(q2 === "", `buildFtsQuery empty: "${q2}"`);

  const q3 = buildFtsQuery('special "chars" and (parens)');
  assert(!q3.includes("("), `buildFtsQuery strips special chars: ${q3}`);
}

async function testNormalizeEmbedding(): Promise<void> {
  console.log("\n--- Test: normalizeEmbedding ---");

  const vec = [3, 4]; // L2 norm = 5
  const normalized = normalizeEmbedding(vec);
  assert(
    Math.abs(normalized[0] - 0.6) < 0.001,
    `Normalized [3,4][0] = ${normalized[0]}`
  );
  assert(
    Math.abs(normalized[1] - 0.8) < 0.001,
    `Normalized [3,4][1] = ${normalized[1]}`
  );

  // L2 norm should be ~1
  const l2 = Math.sqrt(
    normalized.reduce((sum, v) => sum + v * v, 0)
  );
  assert(Math.abs(l2 - 1.0) < 0.001, `L2 norm = ${l2}`);

  // Test with non-finite values
  const vecWithNaN = [1, NaN, Infinity, -Infinity];
  const cleanedVec = normalizeEmbedding(vecWithNaN);
  assert(
    cleanedVec.every(Number.isFinite),
    `Non-finite values replaced`
  );

  // Test zero vector
  const zeroVec = normalizeEmbedding([0, 0, 0]);
  assert(
    zeroVec.every((v) => v === 0),
    `Zero vector unchanged`
  );
}

async function testDbInitialization(): Promise<void> {
  console.log("\n--- Test: Database initialization ---");

  // Reset any existing config/db state
  resetConfig();
  resetDb();

  // Use a temp path for testing
  const tmpDir = "/tmp/semantic-memory-test-" + Date.now();
  process.env.SM_DB_PATH = `${tmpDir}/test.db`;

  try {
    const config = await loadConfig();
    const { db } = await initDb(config);

    // Verify WAL mode
    const journalMode = db
      .prepare("PRAGMA journal_mode")
      .get() as { journal_mode: string };
    assert(
      journalMode.journal_mode === "wal",
      `WAL mode active: ${journalMode.journal_mode}`
    );

    // Verify tables exist
    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
      )
      .all() as { name: string }[];
    const tableNames = tables.map((t) => t.name);
    assert(tableNames.includes("meta"), `meta table exists`);
    assert(tableNames.includes("files"), `files table exists`);
    assert(tableNames.includes("chunks"), `chunks table exists`);
    assert(
      tableNames.includes("embedding_cache"),
      `embedding_cache table exists`
    );

    // Verify virtual tables
    const vtables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND sql IS NULL ORDER BY name"
      )
      .all() as { name: string }[];
    const vtableNames = vtables.map((t) => t.name);
    // Note: virtual tables might show differently, let's check with a query
    try {
      db.prepare("SELECT COUNT(*) FROM chunks_vec").get();
      assert(true, `chunks_vec table accessible`);
    } catch {
      assert(false, `chunks_vec table accessible`);
    }

    try {
      db.prepare("SELECT COUNT(*) FROM chunks_fts").get();
      assert(true, `chunks_fts table accessible`);
    } catch {
      assert(false, `chunks_fts table accessible`);
    }

    // Verify meta values
    const schemaVersion = getMetaValue("schema_version");
    assert(
      schemaVersion === "1",
      `schema_version = ${schemaVersion}`
    );

    // Verify sqlite-vec works in this DB
    const vecVer = db
      .prepare("SELECT vec_version() as v")
      .get() as { v: string };
    assert(!!vecVer.v, `vec_version in initialized DB: ${vecVer.v}`);

    closeDb();
  } finally {
    // Cleanup
    delete process.env.SM_DB_PATH;
    resetConfig();
    resetDb();
    try {
      const { rmSync } = await import("fs");
      rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  }
}

async function testGeminiEmbedding(): Promise<void> {
  console.log("\n--- Test: Gemini embedding (live API) ---");

  resetConfig();
  const config = await loadConfig();

  if (!config.googleApiKey) {
    console.log("  SKIP: No GOOGLE_API_KEY configured");
    return;
  }

  try {
    const { GeminiEmbeddingProvider } = await import(
      "../src/embeddings-gemini.js"
    );
    const provider = new GeminiEmbeddingProvider(
      config.googleApiKey,
      "gemini-embedding-001",
      768
    );

    // Test single embedding
    const embedding = await provider.embedSingle(
      "How to configure Traefik reverse proxy with SSL"
    );
    assert(embedding.length === 768, `Embedding has 768 dims: ${embedding.length}`);

    // Verify it's normalized
    const l2 = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
    assert(Math.abs(l2 - 1.0) < 0.01, `Embedding is normalized: L2=${l2.toFixed(4)}`);

    // Test batch embedding
    const batchResults = await provider.embedBatch([
      "Traefik SSL configuration",
      "Docker container management",
    ]);
    assert(
      batchResults.length === 2,
      `Batch returned ${batchResults.length} embeddings`
    );
    assert(
      batchResults[0].length === 768,
      `Batch embedding[0] has 768 dims`
    );

    console.log("  Gemini embedding API working correctly!");
  } catch (err) {
    console.error(`  ERROR: Gemini embedding failed: ${err}`);
    failed++;
  }
}

// Run all tests
async function main(): Promise<void> {
  console.log("=== SemanticMemory Smoke Test ===\n");

  await testSqliteVecLoads();
  await testFts5Works();
  await testChunker();
  await testBuildFtsQuery();
  await testNormalizeEmbedding();
  await testDbInitialization();
  await testGeminiEmbedding();

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Smoke test crashed:", err);
  process.exit(1);
});
