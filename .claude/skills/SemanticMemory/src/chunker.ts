/**
 * SemanticMemory - Markdown-Aware Chunker
 *
 * Splits markdown documents into overlapping chunks that respect document structure.
 * Never splits inside code blocks or table rows.
 * 512 token chunks, 102 token overlap, 20 token minimum.
 */

import type { Chunk, ChunkOptions } from "./types.js";

// ─── Sensitive File Detection ────────────────────────────────────────────────

const SENSITIVE_FILE_PATTERNS = [/\.env$/, /\.key$/, /\.pem$/, /credentials/i];
const SENSITIVE_CONTENT_MARKERS = [
  "API_KEY=",
  "SECRET=",
  "PASSWORD=",
  "TOKEN=",
  "PRIVATE_KEY",
];

/**
 * Check if a file should be skipped due to sensitive content.
 * Checks both the file path (for known sensitive extensions/names)
 * and optionally the first 5 lines of content for secret markers.
 */
export function isSensitiveFile(path: string, content?: string): boolean {
  // Check file path patterns
  for (const pattern of SENSITIVE_FILE_PATTERNS) {
    if (pattern.test(path)) return true;
  }

  // Check content if provided
  if (content) {
    const firstLines = content.split("\n").slice(0, 5).join("\n");
    if (SENSITIVE_CONTENT_MARKERS.some((marker) => firstLines.includes(marker))) {
      return true;
    }
  }

  return false;
}

// ─── Chunking ────────────────────────────────────────────────────────────────

const DEFAULT_OPTIONS: Required<ChunkOptions> = {
  maxTokens: 512,
  overlapTokens: 102,
  minTokens: 20,
};

/**
 * Estimate token count from text length.
 * Approximation: ~4 characters per token (good enough for chunking).
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Determine if a line is a heading boundary.
 */
function isHeading(line: string): boolean {
  return /^#{1,6}\s/.test(line);
}

/**
 * Determine if a line starts or ends a code block.
 */
function isCodeFence(line: string): boolean {
  return /^```/.test(line.trim());
}

/**
 * Determine if a line is a list item.
 */
function isListItem(line: string): boolean {
  return /^\s*[-*+]\s/.test(line) || /^\s*\d+\.\s/.test(line);
}

/**
 * Determine if a line is empty (whitespace only).
 */
function isEmpty(line: string): boolean {
  return line.trim().length === 0;
}

/**
 * Determine if a line is part of a table.
 */
function isTableRow(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.startsWith("|") && trimmed.endsWith("|");
}

/**
 * Score a line as a potential split point (higher = better).
 * Returns -1 if the line is not a valid split point.
 */
function splitScore(line: string, nextLine: string | undefined): number {
  // Heading boundaries are the best split points
  if (isHeading(line)) return 100;

  // Empty lines (paragraph breaks)
  if (isEmpty(line)) return 80;

  // List item boundaries
  if (isListItem(line)) return 60;

  // Sentence boundary (line ends with period followed by space + uppercase in next line)
  if (
    /\.\s*$/.test(line) &&
    nextLine &&
    /^\s*[A-Z]/.test(nextLine)
  ) {
    return 40;
  }

  // Any line break is a last resort
  return 20;
}

interface LineInfo {
  text: string;
  lineNum: number; // 1-indexed line number in source file
  inCodeBlock: boolean;
  inTable: boolean;
}

/**
 * Parse content into line info with code block and table state tracking.
 */
function parseLines(content: string): LineInfo[] {
  const rawLines = content.split("\n");
  const lines: LineInfo[] = [];
  let inCodeBlock = false;

  for (let i = 0; i < rawLines.length; i++) {
    const text = rawLines[i];

    // Track code block state
    if (isCodeFence(text)) {
      inCodeBlock = !inCodeBlock;
    }

    // Track table state
    const inTable = isTableRow(text);

    lines.push({
      text,
      lineNum: i + 1, // 1-indexed
      inCodeBlock,
      inTable,
    });
  }

  return lines;
}

/**
 * Find the best split point near the target index.
 * Looks backwards from the target for the highest-scoring split point.
 * Never splits inside code blocks or table rows.
 */
function findBestSplit(
  lines: LineInfo[],
  targetIdx: number,
  startIdx: number
): number {
  // Search window: look back up to 20% of chunk size from target
  const searchStart = Math.max(startIdx, targetIdx - Math.floor((targetIdx - startIdx) * 0.3));

  let bestIdx = targetIdx;
  let bestScore = -1;

  for (let i = targetIdx; i >= searchStart; i--) {
    const line = lines[i];

    // Never split inside code blocks
    if (line.inCodeBlock) continue;

    // Never split inside table rows (unless it's the last row)
    if (line.inTable && i + 1 < lines.length && lines[i + 1].inTable) continue;

    const score = splitScore(
      line.text,
      i + 1 < lines.length ? lines[i + 1].text : undefined
    );

    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }

  // If we couldn't find any valid split point, use the target
  return bestIdx;
}

/**
 * Chunk markdown content into overlapping chunks that respect document structure.
 */
export function chunkMarkdown(
  content: string,
  options?: ChunkOptions
): Chunk[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (!content || content.trim().length === 0) return [];

  const lines = parseLines(content);
  const chunks: Chunk[] = [];

  let startIdx = 0;

  while (startIdx < lines.length) {
    // Accumulate lines until we hit the token limit
    let tokens = 0;
    let endIdx = startIdx;

    while (endIdx < lines.length) {
      const lineTokens = estimateTokens(lines[endIdx].text + "\n");
      if (tokens + lineTokens > opts.maxTokens && endIdx > startIdx) {
        break;
      }
      tokens += lineTokens;
      endIdx++;
    }

    // If we hit the token limit, find the best split point
    if (endIdx < lines.length) {
      const bestSplit = findBestSplit(lines, endIdx - 1, startIdx);
      // Only use the best split if it's past the start
      if (bestSplit > startIdx) {
        endIdx = bestSplit + 1; // +1 because endIdx is exclusive
      }
    }

    // Build chunk text
    const chunkLines = lines.slice(startIdx, endIdx);
    const text = chunkLines.map((l) => l.text).join("\n");
    const chunkTokens = estimateTokens(text);

    // Only add chunks that meet the minimum token threshold
    if (chunkTokens >= opts.minTokens) {
      chunks.push({
        text,
        startLine: chunkLines[0].lineNum,
        endLine: chunkLines[chunkLines.length - 1].lineNum,
        tokens: chunkTokens,
      });
    }

    // Calculate overlap: move back by overlapTokens worth of lines
    if (endIdx >= lines.length) break;

    // Find where to start the next chunk (overlap)
    let overlapTokens = 0;
    let overlapStart = endIdx;
    while (overlapStart > startIdx && overlapTokens < opts.overlapTokens) {
      overlapStart--;
      overlapTokens += estimateTokens(lines[overlapStart].text + "\n");
    }

    // Ensure forward progress
    if (overlapStart <= startIdx) {
      startIdx = endIdx;
    } else {
      startIdx = overlapStart;
    }
  }

  return chunks;
}

/**
 * Chunk JSONL content (session event logs) into searchable chunks.
 * Extracts user/assistant message pairs and formats them as readable text.
 */
export function chunkJsonl(
  content: string,
  options?: ChunkOptions
): Chunk[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (!content || content.trim().length === 0) return [];

  const lines = content.split("\n");
  const messages: { lineNum: number; text: string }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      const record = JSON.parse(line);

      // Extract message-type records
      if (record.type === "message" || record.role) {
        const role = record.role || record.type || "unknown";
        let text = "";

        if (typeof record.content === "string") {
          text = record.content;
        } else if (record.message) {
          text =
            typeof record.message === "string"
              ? record.message
              : JSON.stringify(record.message);
        } else if (record.text) {
          text = record.text;
        } else if (Array.isArray(record.content)) {
          // Handle content array format (Claude API style)
          text = record.content
            .filter(
              (c: { type: string; text?: string }) =>
                c.type === "text" && c.text
            )
            .map((c: { text: string }) => c.text)
            .join("\n");
        }

        if (text.trim()) {
          const roleName =
            role === "user" || role === "human"
              ? "User"
              : role === "assistant"
                ? "Assistant"
                : role;
          messages.push({
            lineNum: i + 1,
            text: `${roleName}: ${text.trim()}`,
          });
        }
      }

      // Also handle tool_use and tool_result types for context
      if (record.type === "tool_use" && record.name) {
        messages.push({
          lineNum: i + 1,
          text: `Tool: ${record.name}${record.input ? " - " + JSON.stringify(record.input).slice(0, 200) : ""}`,
        });
      }
    } catch {
      // Skip malformed JSONL lines
      continue;
    }
  }

  if (messages.length === 0) return [];

  // Convert extracted messages to a single text block, then chunk it
  const formattedContent = messages
    .map((m) => `[L${m.lineNum}] ${m.text}`)
    .join("\n\n");

  // Use chunkMarkdown on the formatted content
  // But we need to remap line numbers back to original JSONL lines
  const chunks = chunkMarkdown(formattedContent, opts);

  // Remap line numbers: use the JSONL line numbers from messages
  for (const chunk of chunks) {
    // Find the original JSONL line range by looking at [L###] markers
    const lineMarkers = chunk.text.match(/\[L(\d+)\]/g);
    if (lineMarkers && lineMarkers.length > 0) {
      const firstLine = parseInt(lineMarkers[0].slice(2, -1), 10);
      const lastLine = parseInt(
        lineMarkers[lineMarkers.length - 1].slice(2, -1),
        10
      );
      chunk.startLine = firstLine;
      chunk.endLine = lastLine;
    }
  }

  return chunks;
}
