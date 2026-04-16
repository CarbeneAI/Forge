/**
 * SemanticMemory - Layered Context Loading
 *
 * Implements a 4-layer memory loading model inspired by MemPalace:
 *
 *   L0 Identity     ~100 tokens  Always         Static identity from identity.txt
 *   L1 Essential    ~800 tokens  Session wake   Top-importance chunks, grouped by source
 *   L2 On-Demand    ~500 tokens  Topic arises   Source-filtered recency retrieval (no search)
 *   L3 Deep Search  Unlimited    Explicit       Full hybrid BM25+vector search via search.ts
 */

import { initDb, getDb } from "./db.js";
import { loadConfig, PAI_DIR } from "./config.js";
import { search } from "./search.js";
import type { SourceType, SearchResult } from "./types.js";

// ─── Public Types ─────────────────────────────────────────────────────────────

export interface LayerResult {
  layer: 0 | 1 | 2 | 3;
  name: string;
  /** Estimated token count (~4 chars per token). */
  tokens: number;
  text: string;
  /** File paths that contributed to this result. */
  sources: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const IDENTITY_FILE = `${PAI_DIR}/skills/SemanticMemory/identity.txt`;

const IDENTITY_DEFAULT =
  "PAI (Personal AI Infrastructure) — Personal AI assistant.\n" +
  "Built on Claude Code with skills-based architecture, event-driven automation, and multi-agent orchestration.";

/** Source priority for Essential Story scoring. Higher = more important. */
const SOURCE_PRIORITY: Record<string, number> = {
  learning: 6,
  session: 5,
  research: 4,
  memory: 3,
  obsidian: 2,
  "raw-output": 1,
};

/** Human-readable section headers for each source type in L1 output. */
const SOURCE_HEADERS: Record<string, string> = {
  learning: "Recent Learnings",
  session: "Recent Sessions",
  research: "Research",
  memory: "Memory",
  obsidian: "Notes",
  "raw-output": "Raw Output",
};

/** Maximum characters for the L1 Essential Story body (~800 tokens at 4 chars/token). */
const L1_MAX_CHARS = 3200;

/** Maximum characters for each individual snippet in L1. */
const L1_SNIPPET_CHARS = 200;

/** Number of top chunks to pull for L1. */
const L1_TOP_CHUNKS = 15;

/** Maximum characters for the L2 On-Demand body (~500 tokens). */
const L2_MAX_CHARS = 2000;

/** Default chunk limit for L2. */
const L2_DEFAULT_LIMIT = 5;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Estimate token count from a string (~4 chars per token).
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Strip markdown headers and collapse whitespace from a chunk for use as snippet.
 */
function cleanSnippet(text: string, maxChars: number): string {
  const cleaned = text
    .replace(/^#{1,6}\s+.*/gm, "") // remove markdown headers
    .replace(/\n{2,}/g, "\n")       // collapse blank lines
    .replace(/^\s+|\s+$/g, "")      // trim
    .replace(/\n/g, " ");           // flatten to single line

  if (cleaned.length <= maxChars) return cleaned;
  return cleaned.slice(0, maxChars).trimEnd() + "...";
}

// ─── Layer 0: Identity ────────────────────────────────────────────────────────

/**
 * L0 — Identity Layer
 *
 * Reads the static identity.txt file. If it doesn't exist, returns a
 * sensible built-in default so the layer never fails silently.
 *
 * File location: ~/.claude/skills/SemanticMemory/identity.txt
 */
export async function loadIdentity(): Promise<LayerResult> {
  let text = IDENTITY_DEFAULT;
  const sourcePaths: string[] = [];

  try {
    const file = Bun.file(IDENTITY_FILE);
    if (await file.exists()) {
      text = (await file.text()).trimEnd();
      sourcePaths.push(IDENTITY_FILE);
    }
  } catch {
    // Fall through to default — non-fatal
  }

  return {
    layer: 0,
    name: "Identity",
    tokens: estimateTokens(text),
    text,
    sources: sourcePaths,
  };
}

// ─── Layer 1: Essential Story ─────────────────────────────────────────────────

interface ChunkRow {
  id: string;
  path: string;
  source: string;
  text: string;
  updated_at: number;
}

interface FileRow {
  path: string;
  mtime: number;
}

/**
 * L1 — Essential Story Layer
 *
 * Pulls the most important chunks from the database, scored by recency and
 * source priority, grouped by source type, and formatted as a compact
 * markdown summary.
 *
 * Algorithm:
 *   1. Query all chunks from DB (text + metadata)
 *   2. Join with files table to get mtime for recency scoring
 *   3. Score: 0.6 * recencyScore + 0.4 * priorityScore
 *      - recencyScore = 1 / (1 + daysSinceIndexed / 30)
 *      - priorityScore = SOURCE_PRIORITY[source] / 6
 *   4. Take top L1_TOP_CHUNKS chunks
 *   5. Group by source type, format as markdown sections
 *   6. Truncate total output to L1_MAX_CHARS
 */
export async function loadEssentialStory(): Promise<LayerResult> {
  await initDb();
  const db = getDb();

  // Fetch all chunks with their file mtime for recency scoring.
  // Join on files table — if no file record exists, use updated_at as fallback.
  const rows = db
    .prepare(
      `SELECT c.id, c.path, c.source, c.text, c.updated_at,
              COALESCE(f.mtime, c.updated_at) as file_mtime
       FROM chunks c
       LEFT JOIN files f ON c.path = f.path
       ORDER BY c.updated_at DESC`
    )
    .all() as (ChunkRow & { file_mtime: number })[];

  if (rows.length === 0) {
    const text = "(No memory indexed yet. Run IndexManager sync to populate.)";
    return {
      layer: 1,
      name: "Essential Story",
      tokens: estimateTokens(text),
      text,
      sources: [],
    };
  }

  const nowMs = Date.now();

  // Score each chunk.
  const scored = rows.map((row) => {
    const daysSince = (nowMs - row.file_mtime) / (1000 * 60 * 60 * 24);
    const recencyScore = 1 / (1 + daysSince / 30);
    const priority = SOURCE_PRIORITY[row.source] ?? 1;
    const priorityScore = priority / 6;
    const finalScore = 0.6 * recencyScore + 0.4 * priorityScore;
    return { ...row, finalScore };
  });

  // Sort descending by score and take top N.
  scored.sort((a, b) => b.finalScore - a.finalScore);
  const topChunks = scored.slice(0, L1_TOP_CHUNKS);

  // Group by source type, preserving order of first appearance.
  const groups = new Map<string, typeof topChunks>();
  for (const chunk of topChunks) {
    const existing = groups.get(chunk.source);
    if (existing) {
      existing.push(chunk);
    } else {
      groups.set(chunk.source, [chunk]);
    }
  }

  // Build formatted output.
  const sections: string[] = [];
  const allPaths = new Set<string>();

  for (const [source, chunks] of groups) {
    const header = SOURCE_HEADERS[source] ?? source;
    const bullets = chunks.map(
      (c) => `- ${cleanSnippet(c.text, L1_SNIPPET_CHARS)}`
    );
    sections.push(`## ${header}\n${bullets.join("\n")}`);
    for (const c of chunks) allPaths.add(c.path);
  }

  let text = sections.join("\n\n");

  // Truncate to budget.
  if (text.length > L1_MAX_CHARS) {
    text = text.slice(0, L1_MAX_CHARS).trimEnd();
    // Don't end mid-word or mid-bullet — trim to last newline.
    const lastNewline = text.lastIndexOf("\n");
    if (lastNewline > L1_MAX_CHARS * 0.8) {
      text = text.slice(0, lastNewline);
    }
    text += "\n\n[... truncated to fit token budget ...]";
  }

  return {
    layer: 1,
    name: "Essential Story",
    tokens: estimateTokens(text),
    text,
    sources: Array.from(allPaths),
  };
}

// ─── Layer 2: On-Demand ───────────────────────────────────────────────────────

/**
 * L2 — On-Demand Layer
 *
 * Returns the top chunks from a specific source type ordered by recency
 * (most recently updated file first, then by chunk position). No semantic
 * search — structured retrieval only.
 *
 * @param source - The source type to load from
 * @param limit  - Max chunks to return (default 5)
 */
export async function loadOnDemand(
  source: SourceType,
  limit: number = L2_DEFAULT_LIMIT
): Promise<LayerResult> {
  await initDb();
  const db = getDb();

  const effectiveLimit = Math.max(1, Math.min(limit, 20));

  // Fetch top chunks for the given source, sorted by file recency then chunk order.
  const rows = db
    .prepare(
      `SELECT c.id, c.path, c.source, c.text, c.updated_at,
              COALESCE(f.mtime, c.updated_at) as file_mtime,
              c.start_line
       FROM chunks c
       LEFT JOIN files f ON c.path = f.path
       WHERE c.source = ?
       ORDER BY file_mtime DESC, c.start_line ASC
       LIMIT ?`
    )
    .all(source, effectiveLimit) as (ChunkRow & {
    file_mtime: number;
    start_line: number;
  })[];

  if (rows.length === 0) {
    const text = `(No content indexed for source: ${source})`;
    return {
      layer: 2,
      name: `On-Demand: ${source}`,
      tokens: estimateTokens(text),
      text,
      sources: [],
    };
  }

  // Format as a simple bulleted list grouped by file.
  const fileGroups = new Map<string, typeof rows>();
  for (const row of rows) {
    const existing = fileGroups.get(row.path);
    if (existing) {
      existing.push(row);
    } else {
      fileGroups.set(row.path, [row]);
    }
  }

  const sections: string[] = [];
  const allPaths = new Set<string>();

  for (const [filePath, chunks] of fileGroups) {
    // Show a shortened path as the group label.
    const label = filePath.replace(/^.*\/history\//, "history/").replace(/^.*\/Obsidian\//, "Obsidian/");
    const bullets = chunks.map(
      (c) => `- ${cleanSnippet(c.text, L1_SNIPPET_CHARS)}`
    );
    sections.push(`### ${label}\n${bullets.join("\n")}`);
    allPaths.add(filePath);
  }

  let text = `## ${SOURCE_HEADERS[source] ?? source} (on-demand)\n\n` + sections.join("\n\n");

  // Truncate to L2 budget.
  if (text.length > L2_MAX_CHARS) {
    text = text.slice(0, L2_MAX_CHARS).trimEnd() + "\n\n[... truncated ...]";
  }

  return {
    layer: 2,
    name: `On-Demand: ${source}`,
    tokens: estimateTokens(text),
    text,
    sources: Array.from(allPaths),
  };
}

// ─── Layer 3: Deep Search ─────────────────────────────────────────────────────

/**
 * L3 — Deep Search Layer
 *
 * Wraps the existing hybrid BM25+vector search() function with LayerResult
 * metadata. Results are unlimited — caller controls via `limit`.
 *
 * @param query   - Natural language search query
 * @param sources - Optional source type filter
 * @param limit   - Max results (default 10)
 */
export async function loadDeepSearch(
  query: string,
  sources?: SourceType[],
  limit: number = 10
): Promise<LayerResult> {
  const results: SearchResult[] = await search({
    query,
    limit,
    sources,
  });

  if (results.length === 0) {
    const text = `(No results found for: "${query}")`;
    return {
      layer: 3,
      name: "Deep Search",
      tokens: estimateTokens(text),
      text,
      sources: [],
    };
  }

  // Format results as ranked markdown blocks.
  const lines: string[] = [`## Search: "${query}"\n`];
  const allPaths = new Set<string>();

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const scoreStr = r.combinedScore.toFixed(2);
    const label = r.path.replace(/^.*\/history\//, "history/").replace(/^.*\/Obsidian\//, "Obsidian/");
    lines.push(`### [${i + 1}] ${label} (score: ${scoreStr}, source: ${r.source})`);
    lines.push(r.snippet || cleanSnippet(r.text, 300));
    lines.push("");
    allPaths.add(r.path);
  }

  const text = lines.join("\n");

  return {
    layer: 3,
    name: "Deep Search",
    tokens: estimateTokens(text),
    text,
    sources: Array.from(allPaths),
  };
}

// ─── Wake Up ──────────────────────────────────────────────────────────────────

/**
 * Wake Up — Load L0 + L1 together for session startup context.
 *
 * Target: ~100 tokens (L0) + ~800 tokens (L1) = ~900 tokens total.
 * Returns both layers plus a combined token count.
 */
export async function wakeUp(): Promise<{
  identity: LayerResult;
  essential: LayerResult;
  totalTokens: number;
}> {
  const [identity, essential] = await Promise.all([
    loadIdentity(),
    loadEssentialStory(),
  ]);

  return {
    identity,
    essential,
    totalTokens: identity.tokens + essential.tokens,
  };
}
