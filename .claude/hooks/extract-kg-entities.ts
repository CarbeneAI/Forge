#!/usr/bin/env bun

/**
 * extract-kg-entities.ts — SessionEnd Hook
 *
 * Automatically extracts entity-relationship facts from session transcripts
 * and adds them to the SemanticMemory Knowledge Graph.
 *
 * Extracts:
 * - File creation/modification events → (file, created_in/modified_in, session)
 * - Tool usage patterns → (tool, used_in, session)
 * - Project focus areas → (session, focused_on, topic)
 * - New facts stated by user → parsed into entity relationships
 *
 * Inspired by MemPalace's temporal knowledge graph.
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { PAI_DIR, SKILLS_DIR } from "./lib/pai-paths";

interface SessionEndInput {
  session_id: string;
  transcript_path: string;
  cwd: string;
  [key: string]: any;
}

interface ContentBlock {
  type: string;
  text?: string;
  name?: string;
  input?: any;
  [key: string]: any;
}

interface TranscriptEntry {
  type: "user" | "assistant" | "file-history-snapshot" | "progress";
  message?: {
    content: string | ContentBlock[];
    [key: string]: any;
  };
  timestamp?: string;
  [key: string]: any;
}

// Entity extraction patterns from user messages
const ENTITY_PATTERNS: Array<{
  pattern: RegExp;
  extract: (match: RegExpMatchArray) => {
    subject: string;
    predicate: string;
    object: string;
    subjectType?: string;
    objectType?: string;
  } | null;
}> = [
  // "X uses Y" / "we use Y for Z"
  {
    pattern: /(?:we|I|they)\s+(?:use|are using|switched to|migrated to)\s+([A-Z][\w.-]+)(?:\s+for\s+(.+?))?(?:\.|$)/i,
    extract: (m) => ({
      subject: "PAI",
      predicate: "uses",
      object: m[1],
      subjectType: "project",
      objectType: "technology",
    }),
  },
  // "X is deployed on/at Y"
  {
    pattern: /([A-Z][\w.-]+)\s+(?:is|runs|deployed)\s+(?:on|at)\s+([\w.-]+(?::\d+)?)/i,
    extract: (m) => ({
      subject: m[1],
      predicate: "deployed_on",
      object: m[2],
      subjectType: "project",
      objectType: "infrastructure",
    }),
  },
  // "X depends on Y"
  {
    pattern: /([A-Z][\w.-]+)\s+(?:depends on|requires|needs)\s+([A-Z][\w.-]+)/i,
    extract: (m) => ({
      subject: m[1],
      predicate: "depends_on",
      object: m[2],
      subjectType: "technology",
      objectType: "technology",
    }),
  },
  // "X is part of Y"
  {
    pattern: /([A-Z][\w.-]+)\s+(?:is part of|belongs to|is in)\s+([A-Z][\w.-]+)/i,
    extract: (m) => ({
      subject: m[1],
      predicate: "part_of",
      object: m[2],
    }),
  },
];

function contentToText(content: string | ContentBlock[] | undefined): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((c) => {
        if (typeof c === "string") return c;
        if (c?.type === "text" && c.text) return c.text;
        return "";
      })
      .join("\n")
      .trim();
  }
  return "";
}

function extractToolCalls(
  content: string | ContentBlock[] | undefined
): Array<{ name: string; input: any }> {
  if (!content || typeof content === "string") return [];
  if (!Array.isArray(content)) return [];
  return content
    .filter((c) => c?.type === "tool_use")
    .map((c) => ({ name: c.name || "unknown", input: c.input || {} }));
}

async function main() {
  try {
    const input = await Bun.stdin.text();
    if (!input || input.trim() === "") {
      process.exit(0);
    }

    // Check if KG module exists
    const kgPath = join(SKILLS_DIR, "SemanticMemory/src/knowledge-graph.ts");
    if (!existsSync(kgPath)) {
      console.error("[kg-extract] knowledge-graph.ts not found — skipping");
      process.exit(0);
    }

    const data: SessionEndInput = JSON.parse(input);
    const sessionId = data.session_id || "unknown";
    const transcriptPath = data.transcript_path;

    if (!transcriptPath || !existsSync(transcriptPath)) {
      process.exit(0);
    }

    // Parse transcript
    const entries: TranscriptEntry[] = [];
    const raw = readFileSync(transcriptPath, "utf-8");
    for (const line of raw.split("\n")) {
      if (!line.trim()) continue;
      try {
        entries.push(JSON.parse(line));
      } catch {
        /* skip */
      }
    }

    if (entries.length < 3) {
      console.error("[kg-extract] Too few entries — skipping");
      process.exit(0);
    }

    // Import KG module
    const { initKg, addRelation, ensureEntity } = await import(kgPath);
    await initKg();

    const today = new Date().toISOString().split("T")[0];
    const sessionEntity = `session-${sessionId.substring(0, 8)}`;
    let relationsAdded = 0;

    // 1. Extract file operations
    const filesCreated = new Set<string>();
    const filesModified = new Set<string>();

    for (const entry of entries) {
      if (entry.type !== "assistant" || !entry.message?.content) continue;
      const toolCalls = extractToolCalls(entry.message.content);

      for (const tc of toolCalls) {
        if (tc.name === "Write" && tc.input?.file_path) {
          filesCreated.add(tc.input.file_path);
        }
        if (
          (tc.name === "Edit" || tc.name === "MultiEdit") &&
          tc.input?.file_path
        ) {
          filesModified.add(tc.input.file_path);
        }
      }
    }

    // Add file creation relations (limit to 10 most significant)
    const significantFiles = [...filesCreated]
      .filter(
        (f) =>
          !f.includes("node_modules") &&
          !f.includes(".lock") &&
          !f.endsWith(".log")
      )
      .slice(0, 10);

    for (const file of significantFiles) {
      // Extract filename for entity name
      const parts = file.split("/");
      const filename = parts[parts.length - 1];
      try {
        addRelation({
          subject: sessionEntity,
          predicate: "created",
          object: filename,
          validFrom: today,
          source: `session:${sessionId}`,
        });
        relationsAdded++;
      } catch {
        /* skip duplicates */
      }
    }

    // 2. Extract focus area
    const allText: string[] = [];
    for (const entry of entries) {
      if (entry.message?.content) {
        allText.push(contentToText(entry.message.content));
      }
    }
    const combinedText = allText.join(" ");

    // Classify session focus
    const focusPatterns: Array<{
      pattern: RegExp;
      topic: string;
      type: string;
    }> = [
      { pattern: /trad(e|ing)|alpaca|portfolio/i, topic: "Trading", type: "project" },
      { pattern: /homelab|traefik|docker|portainer|infrastructure/i, topic: "Infrastructure", type: "project" },
      { pattern: /semantic.?memory|knowledge.?graph|tunnel/i, topic: "SemanticMemory", type: "project" },
      { pattern: /security|pentest|wazuh|nehemiah/i, topic: "Security", type: "concept" },
      { pattern: /carbene|website|landing/i, topic: "CarbeneAI Website", type: "project" },
      { pattern: /discord|community/i, topic: "Discord Community", type: "project" },
      { pattern: /research|analysis/i, topic: "Research", type: "concept" },
    ];

    for (const { pattern, topic, type } of focusPatterns) {
      const matches = combinedText.match(new RegExp(pattern, "gi"));
      if (matches && matches.length >= 3) {
        try {
          ensureEntity(sessionEntity, "session");
          addRelation({
            subject: sessionEntity,
            predicate: "focused_on",
            object: topic,
            validFrom: today,
            source: `session:${sessionId}`,
          });
          relationsAdded++;
        } catch {
          /* skip */
        }
      }
    }

    // 3. Extract entity relationships from user messages
    for (const entry of entries) {
      if (entry.type !== "user" || !entry.message?.content) continue;
      const text = contentToText(entry.message.content)
        .replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, "")
        .trim();

      if (text.length < 10 || text.length > 2000) continue;

      for (const { pattern, extract } of ENTITY_PATTERNS) {
        const match = text.match(pattern);
        if (match) {
          const result = extract(match);
          if (result) {
            try {
              if (result.subjectType)
                ensureEntity(result.subject, result.subjectType);
              if (result.objectType)
                ensureEntity(result.object, result.objectType);
              addRelation({
                subject: result.subject,
                predicate: result.predicate,
                object: result.object,
                validFrom: today,
                confidence: 0.8, // auto-extracted, not manually confirmed
                source: `session:${sessionId}`,
              });
              relationsAdded++;
            } catch {
              /* skip */
            }
          }
        }
      }
    }

    if (relationsAdded > 0) {
      console.error(
        `[kg-extract] Added ${relationsAdded} relations to knowledge graph from session ${sessionId.substring(0, 8)}`
      );
    } else {
      console.error("[kg-extract] No new relations extracted");
    }

    process.exit(0);
  } catch (error) {
    // Non-fatal
    console.error(`[kg-extract] Error (non-fatal): ${error}`);
    process.exit(0);
  }
}

main();
