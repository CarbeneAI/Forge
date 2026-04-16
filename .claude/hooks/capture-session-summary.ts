#!/usr/bin/env bun

/**
 * SessionEnd Hook - Rich Session Summary Capture
 *
 * Reads the Claude Code transcript JSONL to generate meaningful session summaries
 * with: what was asked, what was accomplished, key decisions, files changed,
 * session classification, duration tracking, and captured learnings.
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

interface TranscriptEntry {
  type: 'user' | 'assistant' | 'file-history-snapshot' | 'progress';
  message?: {
    content: string | ContentBlock[];
    [key: string]: any;
  };
  timestamp?: string;
  [key: string]: any;
}

interface ContentBlock {
  type: string;
  text?: string;
  name?: string;
  input?: any;
  content?: any;
  id?: string;
  tool_use_id?: string;
  [key: string]: any;
}

interface SessionAnalysis {
  userQueries: string[];
  accomplishments: string[];
  completedLines: string[];
  captureLines: string[];
  decisions: string[];
  filesModified: string[];
  filesCreated: string[];
  toolsUsed: Set<string>;
  focus: string;
  focusTags: string[];
  durationMinutes: number;
  firstTimestamp: string;
  lastTimestamp: string;
  errorFixPairs: Array<{ error: string; fix: string }>;
  corrections: string[];
  newFacts: string[];
}

// ─── Focus Classification ───────────────────────────────────────────────────

const FOCUS_PATTERNS: Array<{ pattern: RegExp; focus: string; tags: string[] }> = [
  { pattern: /trad(e|ing)|alpaca|multiscan|position.?monitor|portfolio|stock|signal/i, focus: 'trading', tags: ['trading', 'joseph'] },
  { pattern: /polymarket|btc|bitcoin|crypto/i, focus: 'crypto-trading', tags: ['crypto', 'trading'] },
  { pattern: /discord|barnabas|community|server.?admin/i, focus: 'discord', tags: ['discord', 'community'] },
  { pattern: /homelab|traefik|pihole|docker|portainer|proxmox|synology|wazuh/i, focus: 'infrastructure', tags: ['homelab', 'infrastructure'] },
  { pattern: /observability|dashboard|monitoring/i, focus: 'observability', tags: ['observability', 'monitoring'] },
  { pattern: /research|perplexity|gemini|grok/i, focus: 'research', tags: ['research'] },
  { pattern: /semantic.?memory|index.?manager|memory.?system|learning/i, focus: 'memory-system', tags: ['memory', 'pai'] },
  { pattern: /vitepress|blog|website|carbene/i, focus: 'website', tags: ['website', 'content'] },
  { pattern: /telegram|notification/i, focus: 'telegram', tags: ['telegram', 'notifications'] },
  { pattern: /pentest|security|vulnerability|ctf|kali|ehud|nehemiah/i, focus: 'security', tags: ['security'] },
  { pattern: /skill|hook|pai.?(dir|config)|session|core/i, focus: 'pai-system', tags: ['pai', 'system'] },
  { pattern: /fabric|pattern/i, focus: 'fabric', tags: ['fabric', 'patterns'] },
  { pattern: /n8n|workflow|automation/i, focus: 'automation', tags: ['n8n', 'automation'] },
  { pattern: /design|ui|ux|miriam|css|html/i, focus: 'design', tags: ['design', 'ui'] },
  { pattern: /git|commit|push|pull|branch/i, focus: 'git-ops', tags: ['git'] },
];

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

function extractToolCalls(content: string | ContentBlock[] | undefined): Array<{ name: string; input: any }> {
  if (!content || typeof content === 'string') return [];
  if (!Array.isArray(content)) return [];
  return content
    .filter((c) => c?.type === 'tool_use')
    .map((c) => ({ name: c.name || 'unknown', input: c.input || {} }));
}

function parseTranscript(transcriptPath: string): TranscriptEntry[] {
  const entries: TranscriptEntry[] = [];
  try {
    const raw = readFileSync(transcriptPath, 'utf-8');
    for (const line of raw.split('\n')) {
      if (!line.trim()) continue;
      try {
        entries.push(JSON.parse(line));
      } catch {
        // skip invalid JSON lines
      }
    }
  } catch (err) {
    console.error(`[session-capture] Error reading transcript: ${err}`);
  }
  return entries;
}

function classifyFocus(allText: string): { focus: string; tags: string[] } {
  const scores = new Map<string, number>();

  for (const { pattern, focus, tags } of FOCUS_PATTERNS) {
    const matches = allText.match(new RegExp(pattern, 'gi'));
    if (matches) {
      const current = scores.get(focus) || 0;
      scores.set(focus, current + matches.length);
    }
  }

  if (scores.size === 0) {
    return { focus: 'general-development', tags: ['general'] };
  }

  // Sort by frequency, return top focus
  const sorted = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const topFocus = sorted[0][0];
  const topPattern = FOCUS_PATTERNS.find(p => p.focus === topFocus);

  // Collect tags from top 2 focus areas
  const allTags = new Set<string>();
  for (let i = 0; i < Math.min(2, sorted.length); i++) {
    const fp = FOCUS_PATTERNS.find(p => p.focus === sorted[i][0]);
    if (fp) fp.tags.forEach(t => allTags.add(t));
  }

  return { focus: topFocus, tags: [...allTags] };
}

function extractTimestamp(entry: TranscriptEntry): string | null {
  // Check message-level timestamp
  if (entry.timestamp) return entry.timestamp;
  if (entry.message?.timestamp) return entry.message.timestamp;
  // file-history-snapshot entries have snapshot.timestamp
  if (entry.type === 'file-history-snapshot' && (entry as any).snapshot?.timestamp) {
    return (entry as any).snapshot.timestamp;
  }
  return null;
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.substring(0, max) + '...';
}

// ─── Main Analysis ──────────────────────────────────────────────────────────

function analyzeTranscript(entries: TranscriptEntry[]): SessionAnalysis {
  const analysis: SessionAnalysis = {
    userQueries: [],
    accomplishments: [],
    completedLines: [],
    captureLines: [],
    decisions: [],
    filesModified: [],
    filesCreated: [],
    toolsUsed: new Set(),
    focus: 'general-development',
    focusTags: ['general'],
    durationMinutes: 0,
    firstTimestamp: '',
    lastTimestamp: '',
    errorFixPairs: [],
    corrections: [],
    newFacts: [],
  };

  const allText: string[] = [];
  const modifiedFiles = new Set<string>();
  const createdFiles = new Set<string>();
  let firstTs: Date | null = null;
  let lastTs: Date | null = null;

  for (const entry of entries) {
    // Track timestamps for duration
    const ts = extractTimestamp(entry);
    if (ts) {
      try {
        const d = new Date(ts);
        if (!isNaN(d.getTime())) {
          if (!firstTs || d < firstTs) firstTs = d;
          if (!lastTs || d > lastTs) lastTs = d;
        }
      } catch { /* skip */ }
    }

    if (entry.type === 'user' && entry.message?.content) {
      // Only extract actual user-typed text, not tool_results
      const content = entry.message.content;
      let userText = '';
      if (typeof content === 'string') {
        userText = content;
      } else if (Array.isArray(content)) {
        // Only grab text blocks, skip tool_result blocks
        userText = content
          .filter((c: ContentBlock) => c?.type === 'text' && c.text)
          .map((c: ContentBlock) => c.text || '')
          .join('\n')
          .trim();
      }

      const text = contentToText(entry.message.content); // full text for allText
      const cleanText = userText
        .replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '')
        .trim();

      if (cleanText && !cleanText.startsWith('{') && cleanText.length > 10 && cleanText.length < 2000) {
        analysis.userQueries.push(truncate(cleanText, 300));
      }
      allText.push(text);

      // Detect corrections in user messages
      const correctionPatterns = [
        /actually[,.]?\s+(.{10,100})/i,
        /no[,.]?\s+it(?:'s| is)\s+(.{10,100})/i,
        /that(?:'s| is) wrong[,.]?\s*(.{10,100})?/i,
        /I meant\s+(.{10,100})/i,
        /correction:\s*(.{10,100})/i,
      ];
      for (const pat of correctionPatterns) {
        const match = cleanText.match(pat);
        if (match) {
          analysis.corrections.push(truncate(match[0], 200));
        }
      }

      // Detect new facts stated by user
      const factPatterns = [
        /the (?:domain|url|address|ip|port|password|key) (?:is|was|should be)\s+(.{5,100})/i,
        /(?:use|we use|I use|switch to|migrate to)\s+(.{5,80})\s+(?:for|instead|now)/i,
        /(?:the|my|our)\s+\w+\s+(?:is|are)\s+(?:at|on|running on)\s+(.{5,100})/i,
      ];
      for (const pat of factPatterns) {
        const match = cleanText.match(pat);
        if (match) {
          analysis.newFacts.push(truncate(match[0], 200));
        }
      }
    }

    if (entry.type === 'assistant' && entry.message?.content) {
      const text = contentToText(entry.message.content);
      allText.push(text);

      // Extract COMPLETED lines
      const completedMatch = text.match(/COMPLETED:\s*(.+?)(?:\n|$)/im);
      if (completedMatch) {
        analysis.completedLines.push(completedMatch[1].trim().replace(/\*+/g, ''));
      }

      // Extract CAPTURE lines
      const captureMatch = text.match(/CAPTURE:\s*(.+?)(?:\n|$)/im);
      if (captureMatch) {
        analysis.captureLines.push(captureMatch[1].trim().replace(/\*+/g, ''));
      }

      // Extract tool calls
      const toolCalls = extractToolCalls(entry.message.content);
      for (const tc of toolCalls) {
        analysis.toolsUsed.add(tc.name);

        // Track file modifications
        if ((tc.name === 'Edit' || tc.name === 'MultiEdit') && tc.input?.file_path) {
          modifiedFiles.add(tc.input.file_path);
        }
        if (tc.name === 'Write' && tc.input?.file_path) {
          createdFiles.add(tc.input.file_path);
        }
      }
    }
  }

  // Duration
  if (firstTs && lastTs) {
    analysis.durationMinutes = Math.round((lastTs.getTime() - firstTs.getTime()) / 60000);
    analysis.firstTimestamp = firstTs.toISOString();
    analysis.lastTimestamp = lastTs.toISOString();
  }

  // Files
  analysis.filesModified = [...modifiedFiles].filter(f => !createdFiles.has(f)).slice(0, 20);
  analysis.filesCreated = [...createdFiles].slice(0, 20);

  // Focus classification
  const combinedText = allText.join(' ');
  const { focus, tags } = classifyFocus(combinedText);
  analysis.focus = focus;
  analysis.focusTags = tags;

  // Generate accomplishment summary from COMPLETED lines
  analysis.accomplishments = analysis.completedLines
    .filter(l => l.length > 5)
    .map(l => l.replace(/^🎯\s*/, '').trim());

  // Extract decisions from CAPTURE lines and assistant text
  for (const cap of analysis.captureLines) {
    if (/decid|chose|decision|approach|strategy|picked|selected/i.test(cap)) {
      analysis.decisions.push(cap);
    }
  }

  return analysis;
}

// ─── Session Title Generation ───────────────────────────────────────────────

function generateSessionTitle(analysis: SessionAnalysis): string {
  // Use the most informative COMPLETED line if available
  if (analysis.completedLines.length > 0) {
    const best = analysis.completedLines[analysis.completedLines.length - 1];
    if (best.length > 10 && best.length < 80) {
      return best.replace(/^🎯\s*/, '').trim();
    }
  }

  // Fall back to focus + first query summary
  const focusTitle = analysis.focus
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  if (analysis.userQueries.length > 0) {
    const firstQuery = analysis.userQueries[0];
    // Take first meaningful sentence
    const sentence = firstQuery.split(/[.!?\n]/)[0].trim();
    if (sentence.length > 10 && sentence.length < 80) {
      return sentence;
    }
  }

  return `${focusTitle} Session`;
}

// ─── Document Formatting ────────────────────────────────────────────────────

function formatSessionDocument(
  sessionId: string,
  analysis: SessionAnalysis,
  title: string
): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  const sections: string[] = [];

  // YAML frontmatter
  sections.push(`---
capture_type: SESSION
timestamp: ${now.toISOString()}
session_id: ${sessionId}
duration_minutes: ${analysis.durationMinutes}
focus: ${analysis.focus}
tags: [${analysis.focusTags.join(', ')}]
---`);

  // Title
  sections.push(`\n# Session: ${title}`);

  // Metadata
  sections.push(`\n**Date:** ${dateStr}
**Duration:** ${analysis.durationMinutes > 0 ? `${analysis.durationMinutes} minutes` : 'Brief session'}
**Focus:** ${analysis.focusTags.join(', ')}
**Session ID:** ${sessionId}`);

  // What was asked
  if (analysis.userQueries.length > 0) {
    sections.push('\n## What Was Asked\n');
    // Deduplicate and limit
    const uniqueQueries = [...new Set(analysis.userQueries)].slice(0, 8);
    for (const q of uniqueQueries) {
      sections.push(`- ${truncate(q, 200)}`);
    }
  }

  // What was accomplished
  if (analysis.accomplishments.length > 0) {
    sections.push('\n## What Was Accomplished\n');
    const uniqueAccomplishments = [...new Set(analysis.accomplishments)].slice(0, 10);
    for (const a of uniqueAccomplishments) {
      sections.push(`- ${a}`);
    }
  }

  // Key decisions
  if (analysis.decisions.length > 0) {
    sections.push('\n## Key Decisions\n');
    for (const d of analysis.decisions.slice(0, 5)) {
      sections.push(`- ${d}`);
    }
  }

  // Files modified
  if (analysis.filesCreated.length > 0 || analysis.filesModified.length > 0) {
    sections.push('\n## Files Changed\n');
    if (analysis.filesCreated.length > 0) {
      sections.push('**Created:**');
      for (const f of analysis.filesCreated) {
        sections.push(`- \`${f}\` (NEW)`);
      }
    }
    if (analysis.filesModified.length > 0) {
      if (analysis.filesCreated.length > 0) sections.push('');
      sections.push('**Modified:**');
      for (const f of analysis.filesModified) {
        sections.push(`- \`${f}\``);
      }
    }
  }

  // Tools used
  if (analysis.toolsUsed.size > 0) {
    sections.push('\n## Tools Used\n');
    const tools = [...analysis.toolsUsed].filter(t => t !== 'undefined').sort();
    sections.push(tools.map(t => `\`${t}\``).join(', '));
  }

  // Captured context
  if (analysis.captureLines.length > 0) {
    sections.push('\n## Captured Context\n');
    for (const c of analysis.captureLines.slice(0, 10)) {
      sections.push(`- ${c}`);
    }
  }

  // Corrections & new facts (for learning extraction to pick up)
  if (analysis.corrections.length > 0) {
    sections.push('\n## Corrections Made\n');
    for (const c of analysis.corrections.slice(0, 5)) {
      sections.push(`- ${c}`);
    }
  }

  if (analysis.newFacts.length > 0) {
    sections.push('\n## New Facts Noted\n');
    for (const f of analysis.newFacts.slice(0, 5)) {
      sections.push(`- ${f}`);
    }
  }

  sections.push(`\n---\n**Generated:** ${now.toISOString()}`);

  return sections.join('\n');
}

// ─── Memory File Update (Phase 3) ──────────────────────────────────────────

function updateProjectMemory(analysis: SessionAnalysis): void {
  // Map focus areas to project memory files
  const focusToFile: Record<string, string> = {
    'infrastructure': 'homelab.md',
    'trading': 'pai.md',
    'crypto-trading': 'pai.md',
    'pai-system': 'pai.md',
    'memory-system': 'pai.md',
    'website': 'carbene-website.md',
    'discord': 'pai.md',
  };

  const memoryFile = focusToFile[analysis.focus];
  if (!memoryFile) return;

  const memoryPath = join(PAI_DIR, 'memory', 'projects', memoryFile);
  if (!existsSync(memoryPath)) return;

  // Collect facts to potentially append
  const newEntries: string[] = [];
  const now = new Date().toISOString().split('T')[0];

  // Add new facts from user statements
  for (const fact of analysis.newFacts) {
    newEntries.push(`- [${now}] ${fact}`);
  }

  // Add significant corrections
  for (const correction of analysis.corrections) {
    newEntries.push(`- [${now}] Correction: ${correction}`);
  }

  if (newEntries.length === 0) return;

  try {
    const existing = readFileSync(memoryPath, 'utf-8');

    // Check if facts already exist (simple dedup)
    const entriesToAdd = newEntries.filter(entry => {
      const core = entry.replace(/\[[\d-]+\]\s*/, '').toLowerCase();
      return !existing.toLowerCase().includes(core.substring(0, 50));
    });

    if (entriesToAdd.length === 0) return;

    // Append under "## Auto-Captured Updates" section
    const sectionHeader = '\n## Auto-Captured Updates\n';
    let updatedContent: string;

    if (existing.includes('## Auto-Captured Updates')) {
      // Append to existing section
      updatedContent = existing.replace(
        '## Auto-Captured Updates\n',
        `## Auto-Captured Updates\n${entriesToAdd.join('\n')}\n`
      );
    } else {
      // Add new section at the end
      updatedContent = existing.trimEnd() + '\n' + sectionHeader + entriesToAdd.join('\n') + '\n';
    }

    writeFileSync(memoryPath, updatedContent);
    console.error(`[session-capture] Updated project memory: ${memoryFile} (+${entriesToAdd.length} facts)`);
  } catch (err) {
    console.error(`[session-capture] Error updating project memory: ${err}`);
  }
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
      console.error('[session-capture] No transcript_path in input');
      process.exit(0);
    }

    // Parse transcript
    const entries = parseTranscript(transcriptPath);
    if (entries.length === 0) {
      console.error('[session-capture] Empty transcript, skipping');
      process.exit(0);
    }

    // Analyze session
    const analysis = analyzeTranscript(entries);

    // Skip very short sessions (< 2 user messages and no files changed)
    if (analysis.userQueries.length < 2 && analysis.filesModified.length === 0 && analysis.filesCreated.length === 0) {
      console.error('[session-capture] Trivial session (< 2 queries, no file changes), skipping');
      process.exit(0);
    }

    // Generate title
    const title = generateSessionTitle(analysis);

    // Generate filename
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/:/g, '')
      .replace(/\..+/, '')
      .replace('T', '-');
    const yearMonth = timestamp.substring(0, 7);
    const focusSlug = analysis.focus.replace(/[^a-z0-9-]/g, '');
    const filename = `${timestamp}_SESSION_${focusSlug}.md`;

    // Ensure directory exists
    const sessionDir = join(HISTORY_DIR, 'sessions', yearMonth);
    if (!existsSync(sessionDir)) {
      mkdirSync(sessionDir, { recursive: true });
    }

    // Generate and write session document
    const sessionDoc = formatSessionDocument(sessionId, analysis, title);
    writeFileSync(join(sessionDir, filename), sessionDoc);

    console.error(`[session-capture] Wrote session summary: ${filename} (${analysis.focus}, ${analysis.durationMinutes}min)`);

    // Phase 3: Update project memory with new facts
    updateProjectMemory(analysis);

    process.exit(0);
  } catch (error) {
    console.error(`[session-capture] Error: ${error}`);
    process.exit(0);
  }
}

main();
