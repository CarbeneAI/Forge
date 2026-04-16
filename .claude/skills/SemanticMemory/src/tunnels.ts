/**
 * SemanticMemory - Cross-Project Tunnels
 *
 * Discovers connections between different knowledge source types that share
 * common topics. A "tunnel" is a cross-source link: the same concept appearing
 * in sessions, learnings, obsidian notes, research, etc.
 *
 * Two discovery strategies:
 *   - discoverTunnels()    — semantic: uses existing search() with embedding
 *   - autoDiscoverTunnels() — lightweight: pure SQL + text processing, no embeddings
 *   - findBridges()         — pair-wise: finds overlapping topics between two sources
 */

import { initDb } from "./db.js";
import { loadConfig } from "./config.js";
import { search } from "./search.js";
import type { SourceType } from "./types.js";

// ─── Public Types ─────────────────────────────────────────────────────────────

export interface Tunnel {
  topic: string;
  sources: TunnelEndpoint[];
  strength: number; // 0-1
}

export interface TunnelEndpoint {
  source: SourceType;
  chunkId: string;
  path: string;
  startLine: number;
  endLine: number;
  snippet: string; // First 200 chars
  score: number;   // Relevance to topic
}

export interface TunnelStats {
  totalSources: number;
  sourcesWithChunks: string[];
  topSharedTerms: { term: string; sources: string[]; count: number }[];
}

// ─── Internal Types ───────────────────────────────────────────────────────────

interface ChunkRow {
  id: string;
  path: string;
  source: string;
  start_line: number;
  end_line: number;
  text: string;
}

interface FtsMatchRow {
  chunk_id: string;
  path: string;
  source: string;
  start_line: number;
  end_line: number;
  text: string;
  rank: number;
}

// ─── Stopwords ────────────────────────────────────────────────────────────────

const STOPWORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "shall", "can", "need", "dare", "ought",
  "used", "to", "of", "in", "for", "on", "with", "at", "by", "from",
  "as", "into", "through", "during", "before", "after", "above", "below",
  "between", "out", "off", "over", "under", "again", "further", "then",
  "once", "here", "there", "when", "where", "why", "how", "all", "each",
  "every", "both", "few", "more", "most", "other", "some", "such", "no",
  "nor", "not", "only", "own", "same", "so", "than", "too", "very",
  "just", "because", "but", "and", "or", "if", "while", "about", "up",
  "what", "which", "who", "whom", "this", "that", "these", "those",
  "am", "it", "its", "i", "me", "my", "we", "our", "you", "your",
  "he", "him", "his", "she", "her", "they", "them", "their",
]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ALL_SOURCE_TYPES: SourceType[] = [
  "session", "learning", "research", "obsidian", "memory", "raw-output",
];

/**
 * Extract significant single-word terms from a block of text.
 * Filters stopwords and short tokens.
 */
function extractTerms(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 4 && !STOPWORDS.has(t) && !/^\d+$/.test(t));
}

/**
 * Count term frequencies from an array of terms.
 */
function countFrequencies(terms: string[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const t of terms) {
    freq.set(t, (freq.get(t) ?? 0) + 1);
  }
  return freq;
}

/**
 * Shorten a snippet to maxLen characters.
 */
function makeSnippet(text: string, maxLen = 200): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.length <= maxLen ? cleaned : cleaned.slice(0, maxLen).trimEnd() + "...";
}

/**
 * Compute tunnel strength:
 *   (distinct sources / total known source types) * average endpoint score
 */
function computeStrength(endpoints: TunnelEndpoint[]): number {
  if (endpoints.length === 0) return 0;
  const distinctSources = new Set(endpoints.map((e) => e.source)).size;
  const sourceRatio = distinctSources / ALL_SOURCE_TYPES.length;
  const avgScore =
    endpoints.reduce((sum, e) => sum + e.score, 0) / endpoints.length;
  // Weight: source breadth counts for 60%, relevance quality for 40%
  return Math.min(1, sourceRatio * 0.6 + avgScore * 0.4);
}

// ─── discoverTunnels ──────────────────────────────────────────────────────────

/**
 * Discover tunnels for a given topic query using semantic search.
 *
 * Algorithm:
 *  1. Run hybrid search across ALL sources for the topic
 *  2. Group results by source type
 *  3. If results span 2+ source types → it's a tunnel
 *  4. Strength = f(distinct sources, avg relevance score)
 */
export async function discoverTunnels(
  topic: string,
  minSources = 2,
  limit = 3
): Promise<Tunnel> {
  // Pull a generous pool — limit * 6 across all sources
  const results = await search({
    query: topic,
    limit: limit * 6,
    minScore: 0.05,
  });

  // Group by source
  const bySource = new Map<SourceType, typeof results>();
  for (const r of results) {
    const bucket = bySource.get(r.source) ?? [];
    bucket.push(r);
    bySource.set(r.source, bucket);
  }

  // Build endpoints, taking top `limit` per source
  const endpoints: TunnelEndpoint[] = [];
  for (const [source, chunks] of bySource) {
    const top = chunks.slice(0, limit);
    for (const c of top) {
      endpoints.push({
        source,
        chunkId: c.chunkId,
        path: c.path,
        startLine: c.startLine,
        endLine: c.endLine,
        snippet: makeSnippet(c.text),
        score: c.combinedScore,
      });
    }
  }

  const distinctSources = bySource.size;
  const strength =
    distinctSources >= minSources ? computeStrength(endpoints) : 0;

  return {
    topic,
    sources: endpoints,
    strength,
  };
}

// ─── autoDiscoverTunnels ──────────────────────────────────────────────────────

/**
 * Auto-discover tunnels by finding terms that appear across multiple source types.
 *
 * Algorithm (no embeddings — pure SQL + text):
 *  1. Fetch all chunk texts grouped by source from the DB
 *  2. Compute per-source term frequencies
 *  3. Find terms with freq >= 3 in 2+ source types
 *  4. For each shared term, fetch sample chunks via FTS5 MATCH
 *  5. Build Tunnel objects and score by (source count * avg freq)
 *  6. Return top N by score
 */
export async function autoDiscoverTunnels(limit = 10): Promise<Tunnel[]> {
  const config = await loadConfig();
  const { db } = await initDb(config);

  // Step 1: Fetch all chunk texts by source
  const rows = db
    .prepare(
      "SELECT id, path, source, start_line, end_line, text FROM chunks ORDER BY source, updated_at DESC"
    )
    .all() as ChunkRow[];

  // Step 2: Build per-source term frequency maps
  const sourceTermFreq = new Map<string, Map<string, number>>();
  for (const row of rows) {
    const src = row.source;
    const existing = sourceTermFreq.get(src) ?? new Map<string, number>();
    for (const term of extractTerms(row.text)) {
      existing.set(term, (existing.get(term) ?? 0) + 1);
    }
    sourceTermFreq.set(src, existing);
  }

  const sources = Array.from(sourceTermFreq.keys());

  // Step 3: Find terms appearing in 2+ sources with freq >= 3
  // termSourceMap: term -> { source -> frequency }
  const termSourceMap = new Map<string, Map<string, number>>();
  for (const [src, freqMap] of sourceTermFreq) {
    for (const [term, freq] of freqMap) {
      if (freq < 3) continue;
      const existing = termSourceMap.get(term) ?? new Map<string, number>();
      existing.set(src, freq);
      termSourceMap.set(term, existing);
    }
  }

  // Step 4: Filter to multi-source terms and score them
  const candidates: { term: string; srcMap: Map<string, number>; score: number }[] = [];
  for (const [term, srcMap] of termSourceMap) {
    if (srcMap.size < 2) continue;
    const totalFreq = Array.from(srcMap.values()).reduce((a, b) => a + b, 0);
    const score = srcMap.size * (totalFreq / srcMap.size); // sources * avg freq
    candidates.push({ term, srcMap, score });
  }

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score);
  const topCandidates = candidates.slice(0, limit * 3); // overselect before dedup

  if (topCandidates.length === 0) {
    return [];
  }

  // Step 5: For each candidate, fetch sample chunks via FTS5 MATCH
  const tunnels: Tunnel[] = [];
  const seen = new Set<string>();

  for (const { term, srcMap } of topCandidates) {
    if (tunnels.length >= limit) break;

    // Deduplicate by normalized term
    const normalized = term.toLowerCase().trim();
    if (seen.has(normalized)) continue;
    seen.add(normalized);

    const endpoints: TunnelEndpoint[] = [];

    for (const [src] of srcMap) {
      try {
        // Escape special FTS5 characters and build simple match query
        const safeTerm = term.replace(/['"*(){}[\]^~:!@#$%&\\]/g, " ").trim();
        if (!safeTerm) continue;

        const ftsRows = db
          .prepare(
            `SELECT chunk_id, path, source, start_line, end_line, text, bm25(chunks_fts) as rank
             FROM chunks_fts
             WHERE chunks_fts MATCH ?
               AND source = ?
             ORDER BY rank
             LIMIT 2`
          )
          .all(`"${safeTerm}"`, src) as FtsMatchRow[];

        // Fallback: prefix match if exact phrase returns nothing
        const matchRows =
          ftsRows.length > 0
            ? ftsRows
            : (db
                .prepare(
                  `SELECT chunk_id, path, source, start_line, end_line, text, bm25(chunks_fts) as rank
                   FROM chunks_fts
                   WHERE chunks_fts MATCH ?
                     AND source = ?
                   ORDER BY rank
                   LIMIT 2`
                )
                .all(`${safeTerm}*`, src) as FtsMatchRow[]);

        for (const row of matchRows) {
          // Normalize BM25 (negative, lower = better)
          const score = 1 / (1 + Math.abs(row.rank));
          endpoints.push({
            source: row.source as SourceType,
            chunkId: row.chunk_id,
            path: row.path,
            startLine: row.start_line,
            endLine: row.end_line,
            snippet: makeSnippet(row.text),
            score,
          });
        }
      } catch {
        // FTS match failed for this term/source — skip silently
      }
    }

    if (endpoints.length < 2) continue;

    const strength = computeStrength(endpoints);
    tunnels.push({ topic: term, sources: endpoints, strength });
  }

  // Sort final tunnels by strength
  tunnels.sort((a, b) => b.strength - a.strength);
  return tunnels.slice(0, limit);
}

// ─── findBridges ──────────────────────────────────────────────────────────────

/**
 * Find all topics that connect two specific source types.
 *
 * Algorithm:
 *  1. Compute term frequencies for sourceA and sourceB separately
 *  2. Intersection = terms with freq >= 3 in BOTH sources
 *  3. Score by product of frequencies (high in both = strong bridge)
 *  4. For each bridge term, fetch sample chunks from both sources via FTS5
 *  5. Build Tunnel objects
 */
export async function findBridges(
  sourceA: SourceType,
  sourceB: SourceType,
  limit = 10
): Promise<Tunnel[]> {
  const config = await loadConfig();
  const { db } = await initDb(config);

  // Fetch chunks for each source
  const fetchChunks = (src: SourceType): ChunkRow[] =>
    db
      .prepare(
        "SELECT id, path, source, start_line, end_line, text FROM chunks WHERE source = ?"
      )
      .all(src) as ChunkRow[];

  const chunksA = fetchChunks(sourceA);
  const chunksB = fetchChunks(sourceB);

  if (chunksA.length === 0 || chunksB.length === 0) {
    return [];
  }

  // Build term frequency maps
  const buildFreqMap = (chunks: ChunkRow[]): Map<string, number> => {
    const all: string[] = [];
    for (const c of chunks) all.push(...extractTerms(c.text));
    return countFrequencies(all);
  };

  const freqA = buildFreqMap(chunksA);
  const freqB = buildFreqMap(chunksB);

  // Intersection: terms with freq >= 3 in both
  const bridges: { term: string; score: number }[] = [];
  for (const [term, fA] of freqA) {
    if (fA < 3) continue;
    const fB = freqB.get(term) ?? 0;
    if (fB < 3) continue;
    bridges.push({ term, score: fA * fB }); // product rewards high frequency in both
  }

  // Sort descending
  bridges.sort((a, b) => b.score - a.score);

  const results: Tunnel[] = [];
  const seen = new Set<string>();

  for (const { term } of bridges) {
    if (results.length >= limit) break;

    const normalized = term.toLowerCase().trim();
    if (seen.has(normalized)) continue;
    seen.add(normalized);

    const safeTerm = term.replace(/['"*(){}[\]^~:!@#$%&\\]/g, " ").trim();
    if (!safeTerm) continue;

    const endpoints: TunnelEndpoint[] = [];

    for (const src of [sourceA, sourceB]) {
      try {
        let matchRows = db
          .prepare(
            `SELECT chunk_id, path, source, start_line, end_line, text, bm25(chunks_fts) as rank
             FROM chunks_fts
             WHERE chunks_fts MATCH ?
               AND source = ?
             ORDER BY rank
             LIMIT 2`
          )
          .all(`"${safeTerm}"`, src) as FtsMatchRow[];

        if (matchRows.length === 0) {
          matchRows = db
            .prepare(
              `SELECT chunk_id, path, source, start_line, end_line, text, bm25(chunks_fts) as rank
               FROM chunks_fts
               WHERE chunks_fts MATCH ?
                 AND source = ?
               ORDER BY rank
               LIMIT 2`
            )
            .all(`${safeTerm}*`, src) as FtsMatchRow[];
        }

        for (const row of matchRows) {
          const score = 1 / (1 + Math.abs(row.rank));
          endpoints.push({
            source: row.source as SourceType,
            chunkId: row.chunk_id,
            path: row.path,
            startLine: row.start_line,
            endLine: row.end_line,
            snippet: makeSnippet(row.text),
            score,
          });
        }
      } catch {
        // Skip FTS errors silently
      }
    }

    if (endpoints.length < 2) continue;

    const strength = computeStrength(endpoints);
    results.push({ topic: term, sources: endpoints, strength });
  }

  results.sort((a, b) => b.strength - a.strength);
  return results;
}

// ─── getTunnelStats ───────────────────────────────────────────────────────────

/**
 * Get tunnel statistics — how interconnected are the knowledge sources?
 */
export async function getTunnelStats(): Promise<TunnelStats> {
  const config = await loadConfig();
  const { db } = await initDb(config);

  // Which sources have chunks?
  const sourceRows = db
    .prepare("SELECT DISTINCT source FROM chunks ORDER BY source")
    .all() as { source: string }[];
  const sourcesWithChunks = sourceRows.map((r) => r.source);

  // Total distinct sources in DB
  const totalSources = sourcesWithChunks.length;

  if (totalSources === 0) {
    return { totalSources: 0, sourcesWithChunks: [], topSharedTerms: [] };
  }

  // Build per-source term frequency maps (same as autoDiscover)
  const rows = db
    .prepare("SELECT source, text FROM chunks")
    .all() as { source: string; text: string }[];

  const sourceTermFreq = new Map<string, Map<string, number>>();
  for (const row of rows) {
    const existing = sourceTermFreq.get(row.source) ?? new Map<string, number>();
    for (const term of extractTerms(row.text)) {
      existing.set(term, (existing.get(term) ?? 0) + 1);
    }
    sourceTermFreq.set(row.source, existing);
  }

  // Find terms that appear in 2+ sources with freq >= 3
  const termSourceMap = new Map<string, Map<string, number>>();
  for (const [src, freqMap] of sourceTermFreq) {
    for (const [term, freq] of freqMap) {
      if (freq < 3) continue;
      const existing = termSourceMap.get(term) ?? new Map<string, number>();
      existing.set(src, freq);
      termSourceMap.set(term, existing);
    }
  }

  const shared: { term: string; sources: string[]; count: number }[] = [];
  for (const [term, srcMap] of termSourceMap) {
    if (srcMap.size < 2) continue;
    const totalCount = Array.from(srcMap.values()).reduce((a, b) => a + b, 0);
    shared.push({
      term,
      sources: Array.from(srcMap.keys()).sort(),
      count: totalCount,
    });
  }

  // Top 20 by total count
  shared.sort((a, b) => b.count - a.count);

  return {
    totalSources,
    sourcesWithChunks,
    topSharedTerms: shared.slice(0, 20),
  };
}
