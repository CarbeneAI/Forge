/**
 * SemanticMemory - Database Layer
 *
 * Initializes SQLite with sqlite-vec extension, creates all tables,
 * provides typed helpers for queries and transactions.
 */

import Database from "better-sqlite3";
import * as sqliteVec from "sqlite-vec";
import { loadConfig } from "./config.js";
import type { SemanticMemoryConfig } from "./types.js";
import { mkdirSync, existsSync } from "fs";
import { dirname } from "path";

let _db: Database.Database | null = null;

/**
 * Schema creation SQL statements.
 */
const SCHEMA_SQL = `
-- Metadata table for tracking index configuration
CREATE TABLE IF NOT EXISTS meta (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Tracked source files with hash-based change detection
CREATE TABLE IF NOT EXISTS files (
    path        TEXT PRIMARY KEY,
    source      TEXT NOT NULL DEFAULT 'session',
    hash        TEXT NOT NULL,
    mtime       INTEGER NOT NULL,
    size        INTEGER NOT NULL,
    chunk_count INTEGER NOT NULL DEFAULT 0,
    indexed_at  INTEGER NOT NULL
);

-- Text chunks with embeddings
CREATE TABLE IF NOT EXISTS chunks (
    id          TEXT PRIMARY KEY,
    path        TEXT NOT NULL,
    source      TEXT NOT NULL,
    start_line  INTEGER NOT NULL,
    end_line    INTEGER NOT NULL,
    hash        TEXT NOT NULL,
    text        TEXT NOT NULL,
    model       TEXT NOT NULL,
    provider    TEXT NOT NULL,
    tokens      INTEGER NOT NULL DEFAULT 0,
    updated_at  INTEGER NOT NULL,
    FOREIGN KEY (path) REFERENCES files(path) ON DELETE CASCADE
);

-- Embedding cache to avoid re-computing unchanged chunks
CREATE TABLE IF NOT EXISTS embedding_cache (
    provider     TEXT NOT NULL,
    model        TEXT NOT NULL,
    text_hash    TEXT NOT NULL,
    embedding    BLOB NOT NULL,
    dims         INTEGER NOT NULL,
    created_at   INTEGER NOT NULL,
    PRIMARY KEY (provider, model, text_hash)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chunks_path ON chunks(path);
CREATE INDEX IF NOT EXISTS idx_chunks_source ON chunks(source);
CREATE INDEX IF NOT EXISTS idx_chunks_hash ON chunks(hash);
CREATE INDEX IF NOT EXISTS idx_files_source ON files(source);
CREATE INDEX IF NOT EXISTS idx_embedding_cache_created ON embedding_cache(created_at);
`;

/**
 * Create the vec0 virtual table for vector storage.
 * This must be done after sqlite-vec is loaded.
 */
function createVecTable(db: Database.Database, dims: number): void {
  // Check if the table already exists by trying to query it
  try {
    db.exec(`SELECT COUNT(*) FROM chunks_vec`);
  } catch {
    // Table doesn't exist, create it
    db.exec(
      `CREATE VIRTUAL TABLE chunks_vec USING vec0(
        chunk_id TEXT PRIMARY KEY,
        embedding float[${dims}]
      )`
    );
  }
}

/**
 * Create the FTS5 virtual table for full-text search.
 */
function createFtsTable(db: Database.Database): void {
  try {
    db.exec(`SELECT COUNT(*) FROM chunks_fts`);
  } catch {
    db.exec(
      `CREATE VIRTUAL TABLE chunks_fts USING fts5(
        text,
        chunk_id UNINDEXED,
        path UNINDEXED,
        source UNINDEXED,
        start_line UNINDEXED,
        end_line UNINDEXED,
        tokenize = 'porter unicode61'
      )`
    );
  }
}

/**
 * Insert default meta values if they don't exist.
 */
function initializeMetaDefaults(db: Database.Database, config: SemanticMemoryConfig): void {
  const insertOrIgnore = db.prepare(
    `INSERT OR IGNORE INTO meta (key, value) VALUES (?, ?)`
  );

  const defaults: [string, string][] = [
    ["schema_version", "1"],
    ["embedding_provider", config.primaryProvider],
    ["embedding_model", config.embeddingModel],
    ["embedding_dims", String(config.embeddingDims)],
    ["chunk_size_tokens", String(config.chunkMaxTokens)],
    ["chunk_overlap_tokens", String(config.chunkOverlapTokens)],
    ["vector_weight", String(config.defaultVectorWeight)],
    ["text_weight", String(config.defaultTextWeight)],
    ["created_at", String(Date.now())],
    ["last_full_sync", "0"],
  ];

  for (const [key, value] of defaults) {
    insertOrIgnore.run(key, value);
  }
}

/**
 * Check if stored config matches current config.
 * Returns true if a full reindex is needed.
 */
function checkConfigMismatch(db: Database.Database, config: SemanticMemoryConfig): boolean {
  const storedModel = getMetaValueFromDb(db, "embedding_model");
  const storedDims = getMetaValueFromDb(db, "embedding_dims");
  const storedProvider = getMetaValueFromDb(db, "embedding_provider");

  if (!storedModel || !storedDims || !storedProvider) return false;

  const mismatch =
    storedModel !== config.embeddingModel ||
    storedDims !== String(config.embeddingDims) ||
    storedProvider !== config.primaryProvider;

  if (mismatch) {
    console.error(
      `[db] Embedding config mismatch detected. Stored: ${storedProvider}/${storedModel}/${storedDims}. ` +
        `Current: ${config.primaryProvider}/${config.embeddingModel}/${config.embeddingDims}. ` +
        `A full reindex is recommended.`
    );
    // Update meta to match current config
    setMetaValueInDb(db, "embedding_provider", config.primaryProvider);
    setMetaValueInDb(db, "embedding_model", config.embeddingModel);
    setMetaValueInDb(db, "embedding_dims", String(config.embeddingDims));
  }

  return mismatch;
}

function getMetaValueFromDb(db: Database.Database, key: string): string | null {
  const row = db.prepare("SELECT value FROM meta WHERE key = ?").get(key) as
    | { value: string }
    | null;
  return row?.value ?? null;
}

function setMetaValueInDb(db: Database.Database, key: string, value: string): void {
  db.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)").run(
    key,
    value
  );
}

/**
 * Initialize and return the database instance.
 * Creates the database file and directory if they don't exist.
 * Loads sqlite-vec, creates all tables, and sets up WAL mode.
 */
export async function initDb(
  config?: SemanticMemoryConfig
): Promise<{ db: Database.Database; needsReindex: boolean }> {
  if (_db) {
    return { db: _db, needsReindex: false };
  }

  const cfg = config || (await loadConfig());

  // Ensure directory exists
  const dbDir = dirname(cfg.dbPath);
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true, mode: 0o700 });
  }

  // Create database
  const db = new Database(cfg.dbPath);

  // Load sqlite-vec extension
  sqliteVec.load(db);

  // Set WAL journal mode for concurrent read/write
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec("PRAGMA busy_timeout = 5000");

  // Create standard tables
  db.exec(SCHEMA_SQL);

  // Create virtual tables (sqlite-vec and FTS5)
  createVecTable(db, cfg.embeddingDims);
  createFtsTable(db);

  // Initialize meta defaults
  initializeMetaDefaults(db, cfg);

  // Check for config mismatch
  const needsReindex = checkConfigMismatch(db, cfg);

  _db = db;

  // Graceful shutdown
  process.on("exit", () => {
    try {
      _db?.close();
    } catch {
      // Ignore close errors on exit
    }
  });

  return { db, needsReindex };
}

/**
 * Get the database instance. Throws if not initialized.
 */
export function getDb(): Database.Database {
  if (!_db) {
    throw new Error("Database not initialized. Call initDb() first.");
  }
  return _db;
}

/**
 * Run a function inside a transaction. Rolls back on error.
 */
export function runInTransaction<T>(fn: () => T): T {
  const db = getDb();
  const transaction = db.transaction(fn);
  return transaction();
}

/**
 * Get a meta value by key.
 */
export function getMetaValue(key: string): string | null {
  return getMetaValueFromDb(getDb(), key);
}

/**
 * Set a meta value by key.
 */
export function setMetaValue(key: string, value: string): void {
  setMetaValueInDb(getDb(), key, value);
}

/**
 * Close the database connection.
 */
export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}

/**
 * Reset the db reference (for testing purposes).
 */
export function resetDb(): void {
  _db = null;
}
