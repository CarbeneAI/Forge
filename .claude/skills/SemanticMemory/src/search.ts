/**
 * SemanticMemory - Hybrid Search
 *
 * Executes parallel BM25 (FTS5) and vector (vec0) searches,
 * normalizes scores, and merges with configurable weighting.
 */

import { getDb, initDb } from "./db.js";
import { loadConfig } from "./config.js";
import { createEmbeddingProvider } from "./embeddings.js";
import type {
  SearchOptions,
  SearchResult,
  SourceType,
  EmbeddingProvider,
} from "./types.js";

// Common English stopwords to filter from FTS queries
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

/**
 * Build an FTS5 MATCH query from a natural language query.
 * Filters stopwords, adds prefix matching with *, joins with OR
 * for broader recall. Each token is matched both exact and as prefix.
 * Example: "traefik ssl setup" -> '"traefik" OR traefik* OR "ssl" OR ssl* OR "setup" OR setup*'
 */
export function buildFtsQuery(query: string): string {
  // Remove FTS5 special characters to prevent syntax errors
  const cleaned = query.replace(/['"*(){}[\]^~:!@#$%&\\]/g, " ");

  const tokens = cleaned
    .split(/\s+/)
    .filter((t) => t.length > 0)
    .map((t) => t.toLowerCase())
    .filter((t) => !STOPWORDS.has(t) && t.length > 1);

  if (tokens.length === 0) return "";

  // Each token gets exact match + prefix match, joined with OR for broad recall
  const parts: string[] = [];
  for (const t of tokens) {
    parts.push(`"${t}"`);
    // Add prefix match for tokens 3+ chars (avoids too-broad matches)
    if (t.length >= 3) {
      parts.push(`${t}*`);
    }
  }

  return parts.join(" OR ");
}

interface FtsResult {
  chunk_id: string;
  text: string;
  path: string;
  source: string;
  start_line: number;
  end_line: number;
  rank: number;
}

interface VecResult {
  chunk_id: string;
  distance: number;
}

/**
 * Execute FTS5 (BM25) search.
 */
function searchFts(
  db: ReturnType<typeof getDb>,
  ftsQuery: string,
  limit: number,
  sources?: SourceType[]
): FtsResult[] {
  if (!ftsQuery) return [];

  try {
    let sql: string;
    const params: (string | number)[] = [];

    if (sources && sources.length > 0) {
      const placeholders = sources.map(() => "?").join(", ");
      sql = `SELECT chunk_id, text, path, source, start_line, end_line, bm25(chunks_fts) as rank
             FROM chunks_fts
             WHERE chunks_fts MATCH ?
             AND source IN (${placeholders})
             ORDER BY rank
             LIMIT ?`;
      params.push(ftsQuery, ...sources, limit);
    } else {
      sql = `SELECT chunk_id, text, path, source, start_line, end_line, bm25(chunks_fts) as rank
             FROM chunks_fts
             WHERE chunks_fts MATCH ?
             ORDER BY rank
             LIMIT ?`;
      params.push(ftsQuery, limit);
    }

    return db.prepare(sql).all(...params) as FtsResult[];
  } catch (err) {
    console.error(`[search] FTS5 query failed: ${err}`);
    return [];
  }
}

/**
 * Execute vector (vec0) similarity search.
 */
function searchVec(
  db: ReturnType<typeof getDb>,
  embedding: number[],
  limit: number,
  sources?: SourceType[]
): VecResult[] {
  try {
    const embeddingBlob = new Float32Array(embedding);

    // vec0 search with MATCH
    let sql: string;
    const params: any[] = [];

    if (sources && sources.length > 0) {
      // When filtering by source, we need to join with chunks table
      // Fetch more from vec and filter after
      const expandedLimit = limit * 3; // Fetch more to account for filtering
      sql = `SELECT v.chunk_id, v.distance
             FROM chunks_vec v
             WHERE v.embedding MATCH ?
             AND v.k = ?
             ORDER BY v.distance`;
      params.push(embeddingBlob, expandedLimit);
    } else {
      sql = `SELECT chunk_id, distance
             FROM chunks_vec
             WHERE embedding MATCH ?
             AND k = ?
             ORDER BY distance`;
      params.push(embeddingBlob, limit);
    }

    const results = db.prepare(sql).all(...params) as VecResult[];

    // If filtering by source, post-filter
    if (sources && sources.length > 0) {
      const sourceSet = new Set(sources);
      const filtered: VecResult[] = [];
      for (const r of results) {
        if (filtered.length >= limit) break;
        // Look up source from chunks table
        const chunk = db
          .prepare("SELECT source FROM chunks WHERE id = ?")
          .get(r.chunk_id) as { source: string } | null;
        if (chunk && sourceSet.has(chunk.source as SourceType)) {
          filtered.push(r);
        }
      }
      return filtered;
    }

    return results;
  } catch (err) {
    console.error(`[search] Vector search failed: ${err}`);
    return [];
  }
}

/**
 * Normalize BM25 rank to a 0-1 score.
 * BM25 returns negative values where more negative = more relevant.
 * Formula: 1 / (1 + Math.abs(rank))
 */
function normalizeBm25Score(rank: number): number {
  return 1 / (1 + Math.abs(rank));
}

/**
 * Normalize vector distance to a 0-1 similarity score.
 * sqlite-vec returns L2 (Euclidean) distance by default.
 * For normalized unit vectors, the relationship is:
 *   cosine_similarity = 1 - (L2_distance^2 / 2)
 * L2 distance range for unit vectors: [0, 2]
 *   0 = identical vectors (similarity = 1)
 *   sqrt(2) ≈ 1.414 = orthogonal vectors (similarity = 0)
 *   2 = opposite vectors (similarity = -1, clamped to 0)
 */
function normalizeVectorScore(distance: number): number {
  const cosineSim = 1 - (distance * distance) / 2;
  return Math.max(0, Math.min(1, cosineSim));
}

/**
 * Create a snippet from text (first ~200 chars).
 */
function createSnippet(text: string, maxLen: number = 200): string {
  const cleaned = text.replace(/\n+/g, " ").trim();
  if (cleaned.length <= maxLen) return cleaned;
  return cleaned.slice(0, maxLen).trimEnd() + "...";
}

/**
 * Merge FTS and vector results with weighted scoring.
 */
function mergeResults(
  vectorResults: VecResult[],
  textResults: FtsResult[],
  vectorWeight: number,
  textWeight: number,
  db: ReturnType<typeof getDb>
): SearchResult[] {
  const resultMap = new Map<string, SearchResult>();

  // Process vector results
  for (const vr of vectorResults) {
    const vectorScore = normalizeVectorScore(vr.distance);

    // Look up chunk metadata
    const chunk = db
      .prepare(
        "SELECT id, text, path, source, start_line, end_line FROM chunks WHERE id = ?"
      )
      .get(vr.chunk_id) as {
      id: string;
      text: string;
      path: string;
      source: string;
      start_line: number;
      end_line: number;
    } | null;

    if (!chunk) continue;

    resultMap.set(vr.chunk_id, {
      chunkId: vr.chunk_id,
      text: chunk.text,
      path: chunk.path,
      source: chunk.source as SourceType,
      startLine: chunk.start_line,
      endLine: chunk.end_line,
      vectorScore,
      textScore: 0,
      combinedScore: vectorWeight * vectorScore,
      snippet: createSnippet(chunk.text),
    });
  }

  // Process text results
  for (const tr of textResults) {
    const textScore = normalizeBm25Score(tr.rank);
    const existing = resultMap.get(tr.chunk_id);

    if (existing) {
      // Merge: chunk appears in both result sets
      existing.textScore = textScore;
      existing.combinedScore =
        vectorWeight * existing.vectorScore + textWeight * textScore;
    } else {
      resultMap.set(tr.chunk_id, {
        chunkId: tr.chunk_id,
        text: tr.text,
        path: tr.path,
        source: tr.source as SourceType,
        startLine: tr.start_line,
        endLine: tr.end_line,
        vectorScore: 0,
        textScore,
        combinedScore: textWeight * textScore,
        snippet: createSnippet(tr.text),
      });
    }
  }

  // Sort by combined score descending
  const results = Array.from(resultMap.values());
  results.sort((a, b) => b.combinedScore - a.combinedScore);

  return results;
}

/**
 * Execute a hybrid search combining BM25 full-text and vector similarity.
 */
export async function search(options: SearchOptions): Promise<SearchResult[]> {
  const config = await loadConfig();
  const { db } = await initDb(config);
  const provider = createEmbeddingProvider(config);

  const {
    query,
    limit = config.defaultLimit,
    minScore = config.defaultMinScore,
    sources,
    vectorWeight = config.defaultVectorWeight,
    textWeight = config.defaultTextWeight,
  } = options;

  if (!query || query.trim().length === 0) return [];

  const effectiveLimit = Math.min(Math.max(limit, 1), 50);

  // Embed the query
  const queryEmbedding = await provider.embedSingle(query);

  // Execute parallel FTS5 and vec0 searches
  // FTS5 search
  const ftsQuery = buildFtsQuery(query);
  const textResults = searchFts(db, ftsQuery, effectiveLimit * 2, sources);

  // Vector search
  const vectorResults = searchVec(
    db,
    queryEmbedding,
    effectiveLimit * 2,
    sources
  );

  // Merge results
  let results = mergeResults(
    vectorResults,
    textResults,
    vectorWeight,
    textWeight,
    db
  );

  // Apply minScore filter
  if (minScore > 0) {
    results = results.filter((r) => r.combinedScore >= minScore);
  }

  // Apply limit
  return results.slice(0, effectiveLimit);
}
