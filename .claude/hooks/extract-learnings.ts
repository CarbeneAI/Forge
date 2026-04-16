#!/usr/bin/env bun

/**
 * SessionEnd Hook - Automatic Learning Extraction
 *
 * Scans the session transcript for learning patterns:
 * - CAPTURE lines from PAI response format
 * - Error → fix sequences
 * - User corrections ("actually", "no, it's", "that's wrong")
 * - New facts stated by user
 * - Explicit learnings ("I learned", "TIL", "note to self")
 *
 * Writes structured learning documents to history/learnings/
 * Runs AFTER capture-session-summary.ts and BEFORE semantic-memory-sync.ts
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { PAI_DIR, HISTORY_DIR } from './lib/pai-paths';

// ─── Types ──────────────────────────────────────────────────────────────────

interface SessionEndInput {
  session_id: string;
  transcript_path: string;
  cwd: string;
  reason?: string;
  [key: string]: any;
}

interface ContentBlock {
  type: string;
  text?: string;
  name?: string;
  input?: any;
  content?: any;
  [key: string]: any;
}

interface TranscriptEntry {
  type: 'user' | 'assistant' | 'file-history-snapshot' | 'progress';
  message?: {
    content: string | ContentBlock[];
    [key: string]: any;
  };
  [key: string]: any;
}

interface ExtractedLearning {
  category: 'technical' | 'workflow' | 'configuration' | 'correction' | 'insight';
  title: string;
  context: string;
  content: string;
  source: 'capture-line' | 'error-fix' | 'correction' | 'user-fact' | 'explicit';
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function contentToText(content: string | ContentBlock[] | undefined): string {
  if (!content) return '';
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((c) => {
        if (typeof c === 'string') return c;
        if (c?.type === 'text' && c.text) return c.text;
        if (c?.type === 'tool_result' && c.content) {
          if (typeof c.content === 'string') return c.content;
          if (Array.isArray(c.content)) {
            return c.content.map((sub: any) => sub?.text || '').join(' ');
          }
        }
        return '';
      })
      .join('\n')
      .trim();
  }
  return '';
}

function parseTranscript(transcriptPath: string): TranscriptEntry[] {
  const entries: TranscriptEntry[] = [];
  try {
    const raw = readFileSync(transcriptPath, 'utf-8');
    for (const line of raw.split('\n')) {
      if (!line.trim()) continue;
      try {
        entries.push(JSON.parse(line));
      } catch { /* skip */ }
    }
  } catch (err) {
    console.error(`[extract-learnings] Error reading transcript: ${err}`);
  }
  return entries;
}

function cleanSystemReminders(text: string): string {
  return text.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '').trim();
}

function truncate(str: string, max: number): string {
  return str.length <= max ? str : str.substring(0, max) + '...';
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

// ─── Learning Extraction ────────────────────────────────────────────────────

function extractLearnings(entries: TranscriptEntry[]): ExtractedLearning[] {
  const learnings: ExtractedLearning[] = [];
  const seen = new Set<string>(); // Dedup by content hash

  // Walk through entries in order
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    // Extract from assistant CAPTURE lines
    if (entry.type === 'assistant' && entry.message?.content) {
      const text = contentToText(entry.message.content);

      const captureMatch = text.match(/CAPTURE:\s*(.+?)(?:\n|$)/im);
      if (captureMatch) {
        const content = captureMatch[1].trim().replace(/\*+/g, '');
        if (content.length > 15 && !seen.has(content.toLowerCase())) {
          seen.add(content.toLowerCase());

          // Classify the capture
          const category = classifyLearning(content);
          learnings.push({
            category,
            title: generateTitle(content),
            context: getContext(entries, i),
            content,
            source: 'capture-line',
          });
        }
      }
    }

    // Extract from user corrections
    if (entry.type === 'user' && entry.message?.content) {
      const rawText = contentToText(entry.message.content);
      const text = cleanSystemReminders(rawText);

      const correctionPatterns = [
        { pattern: /actually[,.]?\s+(.{15,200})/i, label: 'correction' },
        { pattern: /no[,.]?\s+it(?:'s| is)\s+(.{10,200})/i, label: 'correction' },
        { pattern: /that(?:'s| is) wrong[,.]?\s*(.{10,200})/i, label: 'correction' },
        { pattern: /I meant\s+(.{10,200})/i, label: 'correction' },
        { pattern: /correction:\s*(.{10,200})/i, label: 'correction' },
      ];

      for (const { pattern, label } of correctionPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          const content = match[1].trim();
          const key = content.toLowerCase().substring(0, 80);
          if (!seen.has(key)) {
            seen.add(key);
            learnings.push({
              category: 'correction',
              title: `Correction: ${generateTitle(content)}`,
              context: getContext(entries, i),
              content: match[0].trim(),
              source: 'correction',
            });
          }
        }
      }

      // Extract explicit learnings
      const explicitPatterns = [
        /(?:I learned|TIL|note to self|remember that|important:)\s+(.{15,300})/i,
        /(?:lesson learned|takeaway|key insight):\s*(.{15,300})/i,
      ];

      for (const pattern of explicitPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          const content = match[1].trim();
          const key = content.toLowerCase().substring(0, 80);
          if (!seen.has(key)) {
            seen.add(key);
            learnings.push({
              category: 'insight',
              title: generateTitle(content),
              context: getContext(entries, i),
              content: match[0].trim(),
              source: 'explicit',
            });
          }
        }
      }
    }

    // Detect error → fix sequences
    if (entry.type === 'user' && entry.message?.content) {
      const userText = cleanSystemReminders(contentToText(entry.message.content));
      const errorPatterns = [
        /error|failed|broken|doesn't work|not working|crash|bug|issue/i,
      ];

      if (errorPatterns.some(p => p.test(userText)) && userText.length > 20) {
        // Look ahead for the fix in next few assistant messages
        for (let j = i + 1; j < Math.min(i + 6, entries.length); j++) {
          if (entries[j].type === 'assistant' && entries[j].message?.content) {
            const assistantText = contentToText(entries[j].message.content);
            const fixPatterns = [
              /(?:the (?:fix|solution|issue|problem) (?:is|was))\s+(.{15,200})/i,
              /(?:fixed by|resolved by|solution:)\s*(.{15,200})/i,
              /(?:change|update|replace|use)\s+`([^`]+)`\s+(?:to|with|instead)/i,
            ];

            for (const fp of fixPatterns) {
              const fixMatch = assistantText.match(fp);
              if (fixMatch) {
                const content = `Problem: ${truncate(userText, 100)}\nFix: ${fixMatch[0].trim()}`;
                const key = content.toLowerCase().substring(0, 80);
                if (!seen.has(key)) {
                  seen.add(key);
                  learnings.push({
                    category: 'technical',
                    title: `Fix: ${generateTitle(fixMatch[1] || fixMatch[0])}`,
                    context: truncate(userText, 150),
                    content,
                    source: 'error-fix',
                  });
                }
                break;
              }
            }
            // Also check for COMPLETED lines that suggest a fix was applied
            const completedMatch = assistantText.match(/COMPLETED:\s*(.+?)(?:\n|$)/im);
            if (completedMatch && /fix|resolv|debug|repair/i.test(completedMatch[1])) {
              const content = `Problem: ${truncate(userText, 100)}\nResolution: ${completedMatch[1].trim()}`;
              const key = content.toLowerCase().substring(0, 80);
              if (!seen.has(key)) {
                seen.add(key);
                learnings.push({
                  category: 'technical',
                  title: `Fix: ${generateTitle(completedMatch[1])}`,
                  context: truncate(userText, 150),
                  content,
                  source: 'error-fix',
                });
              }
              break;
            }
          }
        }
      }
    }
  }

  return learnings;
}

function classifyLearning(content: string): ExtractedLearning['category'] {
  if (/config|setting|env|port|url|ip|path|install/i.test(content)) return 'configuration';
  if (/workflow|process|step|pipeline|procedure/i.test(content)) return 'workflow';
  if (/fix|bug|error|issue|workaround|hack/i.test(content)) return 'technical';
  if (/insight|pattern|principle|approach|strategy/i.test(content)) return 'insight';
  return 'technical';
}

function generateTitle(content: string): string {
  // Take first sentence or first N words
  const firstSentence = content.split(/[.!?\n]/)[0].trim();
  if (firstSentence.length > 10 && firstSentence.length < 80) {
    return firstSentence;
  }
  // Fall back to first few words
  const words = content.split(/\s+/).slice(0, 8);
  return words.join(' ');
}

function getContext(entries: TranscriptEntry[], currentIndex: number): string {
  // Get the nearest user query before this entry
  for (let i = currentIndex; i >= 0; i--) {
    if (entries[i].type === 'user' && entries[i].message?.content) {
      const text = cleanSystemReminders(contentToText(entries[i].message.content));
      if (text.length > 10 && text.length < 500) {
        return truncate(text, 200);
      }
    }
  }
  return 'No context available';
}

// ─── Document Writing ───────────────────────────────────────────────────────

function writeLearnings(learnings: ExtractedLearning[], sessionId: string): number {
  if (learnings.length === 0) return 0;

  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const dateStr = now.toISOString().split('T')[0];
  const learningsDir = join(HISTORY_DIR, 'learnings', yearMonth);

  if (!existsSync(learningsDir)) {
    mkdirSync(learningsDir, { recursive: true });
  }

  // Write all learnings to a single file per session
  const timestamp = now.toISOString()
    .replace(/:/g, '')
    .replace(/\..+/, '')
    .replace('T', '-');

  const sections: string[] = [];

  sections.push(`---
capture_type: LEARNING
timestamp: ${now.toISOString()}
session_id: ${sessionId}
learning_count: ${learnings.length}
categories: [${[...new Set(learnings.map(l => l.category))].join(', ')}]
---`);

  sections.push(`\n# Learnings from Session ${dateStr}`);
  sections.push(`\n**Session ID:** ${sessionId}`);
  sections.push(`**Extracted:** ${learnings.length} learning(s)\n`);

  for (let i = 0; i < learnings.length; i++) {
    const l = learnings[i];
    sections.push(`## ${i + 1}. ${l.title}`);
    sections.push(`\n**Category:** ${l.category}`);
    sections.push(`**Source:** ${l.source}`);
    sections.push(`**Context:** ${l.context}`);
    sections.push(`\n${l.content}\n`);
  }

  sections.push(`---\n**Generated:** ${now.toISOString()}`);

  const filename = `${timestamp}_LEARNINGS_${sessionId.substring(0, 8)}.md`;
  writeFileSync(join(learningsDir, filename), sections.join('\n'));

  return learnings.length;
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  try {
    const input = await Bun.stdin.text();
    if (!input || input.trim() === '') {
      process.exit(0);
    }

    const data: SessionEndInput = JSON.parse(input);
    const sessionId = data.session_id || 'unknown';
    const transcriptPath = data.transcript_path;

    if (!transcriptPath) {
      console.error('[extract-learnings] No transcript_path in input');
      process.exit(0);
    }

    // Parse transcript
    const entries = parseTranscript(transcriptPath);
    if (entries.length === 0) {
      console.error('[extract-learnings] Empty transcript, skipping');
      process.exit(0);
    }

    // Extract learnings
    const learnings = extractLearnings(entries);

    if (learnings.length === 0) {
      console.error('[extract-learnings] No learnings extracted from this session');
      process.exit(0);
    }

    // Write learning documents
    const count = writeLearnings(learnings, sessionId);
    console.error(`[extract-learnings] Extracted ${count} learning(s) from session ${sessionId.substring(0, 8)}`);

    process.exit(0);
  } catch (error) {
    console.error(`[extract-learnings] Error: ${error}`);
    process.exit(0);
  }
}

main();
