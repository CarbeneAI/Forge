/**
 * SemanticMemory - Temporal Knowledge Graph Module
 *
 * Stores entities and time-bounded relations in the existing SQLite database.
 * All relations carry a valid_from / valid_to range so the graph can be
 * queried "as of" any past date, giving you a full temporal audit trail.
 */

import { createHash } from "crypto";
import { initDb, getDb, runInTransaction } from "./db.js";

// ─── Schema ──────────────────────────────────────────────────────────────────

const KG_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS kg_entities (
    id         TEXT    PRIMARY KEY,
    name       TEXT    NOT NULL UNIQUE,
    type       TEXT    NOT NULL DEFAULT 'unknown',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS kg_relations (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id TEXT    NOT NULL,
    predicate  TEXT    NOT NULL,
    object_id  TEXT    NOT NULL,
    valid_from TEXT    NOT NULL,
    valid_to   TEXT,
    confidence REAL    NOT NULL DEFAULT 1.0,
    source     TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (subject_id) REFERENCES kg_entities(id),
    FOREIGN KEY (object_id)  REFERENCES kg_entities(id)
);

CREATE INDEX IF NOT EXISTS idx_kg_relations_subject   ON kg_relations(subject_id);
CREATE INDEX IF NOT EXISTS idx_kg_relations_object    ON kg_relations(object_id);
CREATE INDEX IF NOT EXISTS idx_kg_relations_predicate ON kg_relations(predicate);
CREATE INDEX IF NOT EXISTS idx_kg_relations_valid     ON kg_relations(valid_from, valid_to);
`;

// ─── Public Types ─────────────────────────────────────────────────────────────

export interface KgEntity {
  id: string;
  name: string;
  type: string;
  createdAt: number;
  updatedAt: number;
}

export interface KgRelation {
  id: number;
  subjectName: string;
  predicate: string;
  objectName: string;
  validFrom: string;
  validTo: string | null;
  confidence: number;
  source: string | null;
  createdAt: number;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Canonical entity ID: SHA-256 of the lower-cased name (first 16 hex chars).
 * Using the full 64-char hash is wasteful for a local SQLite; 16 chars gives
 * 2^64 collision resistance — more than sufficient.
 */
function entityId(name: string): string {
  return createHash("sha256").update(name.toLowerCase().trim()).digest("hex").slice(0, 16);
}

/** ISO date string for today, e.g. "2026-04-07". */
function today(): string {
  return new Date().toISOString().split("T")[0];
}

// ─── Initialisation ───────────────────────────────────────────────────────────

/**
 * Ensure the KG tables exist.  Call this before any other KG function.
 * Internally calls initDb() so it is safe to call even if the main db has not
 * been opened yet.
 */
export async function initKg(): Promise<void> {
  await initDb();
  getDb().exec(KG_SCHEMA_SQL);
}

// ─── Entity management ────────────────────────────────────────────────────────

/**
 * Return the ID for a named entity, creating it if it does not yet exist.
 * The stored `name` preserves original casing; lookup is case-insensitive.
 *
 * If the entity already exists and `type` differs from "unknown", the type
 * is updated to the more specific value.
 */
export function ensureEntity(name: string, type = "unknown"): string {
  const db = getDb();
  const id = entityId(name);
  const now = Date.now();

  const existing = db.prepare("SELECT id, type FROM kg_entities WHERE id = ?").get(id) as
    | { id: string; type: string }
    | null;

  if (existing) {
    // Upgrade type when a more specific one is supplied
    if (type !== "unknown" && existing.type === "unknown") {
      db.prepare("UPDATE kg_entities SET type = ?, updated_at = ? WHERE id = ?").run(
        type,
        now,
        id
      );
    }
    return id;
  }

  db.prepare(
    "INSERT INTO kg_entities (id, name, type, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
  ).run(id, name.trim(), type, now, now);

  return id;
}

/**
 * Fetch a single entity by name.  Returns null when not found.
 */
function getEntityByName(name: string): KgEntity | null {
  const row = getDb()
    .prepare("SELECT id, name, type, created_at, updated_at FROM kg_entities WHERE id = ?")
    .get(entityId(name)) as
    | { id: string; name: string; type: string; created_at: number; updated_at: number }
    | null;

  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    type: row.type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── Relation CRUD ────────────────────────────────────────────────────────────

/**
 * Add a directed relation between two entities (auto-creating them when needed).
 * Returns the new relation's integer ID.
 */
export function addRelation(opts: {
  subject: string;
  predicate: string;
  object: string;
  validFrom?: string;
  validTo?: string;
  confidence?: number;
  source?: string;
}): number {
  const subjectId = ensureEntity(opts.subject);
  const objectId = ensureEntity(opts.object);

  const validFrom = opts.validFrom ?? today();
  const validTo = opts.validTo ?? null;
  const confidence = opts.confidence ?? 1.0;
  const source = opts.source ?? null;
  const now = Date.now();

  if (confidence < 0 || confidence > 1) {
    throw new RangeError(`confidence must be in [0, 1], got ${confidence}`);
  }

  const result = getDb()
    .prepare(
      `INSERT INTO kg_relations
         (subject_id, predicate, object_id, valid_from, valid_to, confidence, source, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(subjectId, opts.predicate, objectId, validFrom, validTo, confidence, source, now);

  return result.lastInsertRowid as number;
}

/**
 * Mark a relation as no longer valid by setting its valid_to date.
 * Defaults to today if `validTo` is not supplied.
 */
export function invalidateRelation(relationId: number, validTo?: string): void {
  const date = validTo ?? today();
  const changed = getDb()
    .prepare("UPDATE kg_relations SET valid_to = ? WHERE id = ? AND valid_to IS NULL")
    .run(date, relationId).changes;

  if (changed === 0) {
    // Either not found or already invalidated — both are acceptable.
    const exists = getDb()
      .prepare("SELECT id FROM kg_relations WHERE id = ?")
      .get(relationId);
    if (!exists) {
      throw new Error(`Relation ${relationId} not found`);
    }
    // Already has a valid_to — silently allow (idempotent)
  }
}

// ─── Row → KgRelation mapping ─────────────────────────────────────────────────

interface RelationRow {
  id: number;
  subject_name: string;
  predicate: string;
  object_name: string;
  valid_from: string;
  valid_to: string | null;
  confidence: number;
  source: string | null;
  created_at: number;
}

function rowToRelation(row: RelationRow): KgRelation {
  return {
    id: row.id,
    subjectName: row.subject_name,
    predicate: row.predicate,
    objectName: row.object_name,
    validFrom: row.valid_from,
    validTo: row.valid_to,
    confidence: row.confidence,
    source: row.source,
    createdAt: row.created_at,
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Query relations with optional filters.
 *
 * - `subject`, `predicate`, `object` — narrow by entity name or predicate string
 * - `asOf` — ISO date; returns only facts whose [valid_from, valid_to] window
 *   covers that date (valid_to IS NULL counts as "still valid")
 * - `includeExpired` — when true, also returns invalidated relations (ignored when
 *   `asOf` is set, since asOf already handles validity window logic precisely)
 */
export function queryRelations(opts: {
  subject?: string;
  predicate?: string;
  object?: string;
  asOf?: string;
  includeExpired?: boolean;
}): KgRelation[] {
  const db = getDb();
  const conditions: string[] = [];
  const params: (string | number | null)[] = [];

  if (opts.subject) {
    conditions.push("r.subject_id = ?");
    params.push(entityId(opts.subject));
  }
  if (opts.predicate) {
    conditions.push("r.predicate = ?");
    params.push(opts.predicate);
  }
  if (opts.object) {
    conditions.push("r.object_id = ?");
    params.push(entityId(opts.object));
  }

  if (opts.asOf) {
    // Fact must have started on or before asOf and not yet ended (or ended after asOf)
    conditions.push("r.valid_from <= ?");
    params.push(opts.asOf);
    conditions.push("(r.valid_to IS NULL OR r.valid_to > ?)");
    params.push(opts.asOf);
  } else if (!opts.includeExpired) {
    conditions.push("r.valid_to IS NULL");
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const sql = `
    SELECT
      r.id,
      s.name AS subject_name,
      r.predicate,
      o.name AS object_name,
      r.valid_from,
      r.valid_to,
      r.confidence,
      r.source,
      r.created_at
    FROM kg_relations r
    JOIN kg_entities s ON s.id = r.subject_id
    JOIN kg_entities o ON o.id = r.object_id
    ${where}
    ORDER BY r.valid_from DESC, r.id DESC
  `;

  const rows = db.prepare(sql).all(...params) as RelationRow[];
  return rows.map(rowToRelation);
}

/**
 * Return all active (or historical) relations where an entity appears as either
 * subject or object.
 */
export function getEntityRelations(
  entityName: string,
  asOf?: string
): { asSubject: KgRelation[]; asObject: KgRelation[] } {
  const asSubject = queryRelations({ subject: entityName, asOf, includeExpired: !asOf });
  const asObject = queryRelations({ object: entityName, asOf, includeExpired: !asOf });
  return { asSubject, asObject };
}

/**
 * Full chronological timeline of an entity — all relations (expired or active)
 * sorted by valid_from ascending.
 */
export function getTimeline(entityName: string): KgRelation[] {
  const db = getDb();
  const eid = entityId(entityName);

  const sql = `
    SELECT
      r.id,
      s.name AS subject_name,
      r.predicate,
      o.name AS object_name,
      r.valid_from,
      r.valid_to,
      r.confidence,
      r.source,
      r.created_at
    FROM kg_relations r
    JOIN kg_entities s ON s.id = r.subject_id
    JOIN kg_entities o ON o.id = r.object_id
    WHERE r.subject_id = ? OR r.object_id = ?
    ORDER BY r.valid_from ASC, r.id ASC
  `;

  const rows = db.prepare(sql).all(eid, eid) as RelationRow[];
  return rows.map(rowToRelation);
}

/**
 * Return all entities, optionally filtered by type.
 */
export function listEntities(type?: string): KgEntity[] {
  const db = getDb();

  if (type) {
    const rows = db
      .prepare(
        "SELECT id, name, type, created_at, updated_at FROM kg_entities WHERE type = ? ORDER BY name ASC"
      )
      .all(type) as { id: string; name: string; type: string; created_at: number; updated_at: number }[];

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  const rows = db
    .prepare("SELECT id, name, type, created_at, updated_at FROM kg_entities ORDER BY name ASC")
    .all() as { id: string; name: string; type: string; created_at: number; updated_at: number }[];

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

/**
 * High-level statistics about the knowledge graph.
 */
export function getStats(): { entities: number; relations: number; activeRelations: number } {
  const db = getDb();

  const entities = (
    db.prepare("SELECT COUNT(*) AS n FROM kg_entities").get() as { n: number }
  ).n;

  const relations = (
    db.prepare("SELECT COUNT(*) AS n FROM kg_relations").get() as { n: number }
  ).n;

  const activeRelations = (
    db.prepare("SELECT COUNT(*) AS n FROM kg_relations WHERE valid_to IS NULL").get() as {
      n: number;
    }
  ).n;

  return { entities, relations, activeRelations };
}

// Re-export runInTransaction so callers can batch operations efficiently
export { runInTransaction };
