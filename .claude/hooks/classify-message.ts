#!/usr/bin/env bun
/**
 * classify-message.ts — UserPromptSubmit hook
 * Classifies user messages and injects routing hints for CarbeneAI workflows.
 * Inspired by obsidian-mind's classify-message.py, ported to TypeScript.
 *
 * No API calls — pure regex pattern matching. Always exits 0.
 */

interface Signal {
  name: string;
  message: string;
  patterns: string[];
}

const SIGNALS: Signal[] = [
  {
    name: "DECISION",
    message: "DECISION detected — consider creating a Decision Record in Obsidian",
    patterns: [
      "decided", "deciding", "decision", "we chose", "agreed to",
      "let's go with", "the call is", "we're going with", "final answer",
    ],
  },
  {
    name: "INCIDENT",
    message: "INCIDENT detected — consider using incident capture workflow",
    patterns: [
      "incident", "outage", "pagerduty", "severity",
      "p0", "p1", "p2", "sev1", "sev2", "postmortem", "rca",
      "breach", "compromised", "vulnerability found",
    ],
  },
  {
    name: "ARCHITECTURE",
    message: "ARCHITECTURE detected — consider documenting in Obsidian brain/ directory",
    patterns: [
      "architecture", "system design", "tech stack", "migration",
      "refactor", "scalability", "microservice", "monolith",
      "api design", "infrastructure", "design pattern",
    ],
  },
  {
    name: "CLIENT_CONTEXT",
    message: "CLIENT CONTEXT detected — consider updating client notes in Obsidian",
    patterns: [
      "client", "prospect", "engagement", "stakeholder",
      "advisory", "consulting", "retainer", "sow", "statement of work",
      "onboarding", "deliverable",
    ],
  },
  {
    name: "WIN",
    message: "WIN detected — consider logging in brag doc",
    patterns: [
      "shipped", "launched", "deployed", "completed", "milestone",
      "landed", "closed deal", "signed", "won", "success",
    ],
  },
  {
    name: "PROJECT_UPDATE",
    message: "PROJECT UPDATE detected — consider updating project notes",
    patterns: [
      "sprint", "milestone", "release", "roadmap", "backlog",
      "deadline", "timeline", "deliverable", "blocked", "unblocked",
    ],
  },
  {
    name: "SECURITY",
    message: "SECURITY detected — consider documenting in security notes",
    patterns: [
      "vulnerability", "cve", "exploit", "patch", "hardening",
      "pentest", "audit", "compliance", "owasp", "threat model",
      "zero day", "ransomware", "phishing",
    ],
  },
];

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchesAny(patterns: string[], text: string): boolean {
  for (const phrase of patterns) {
    // Use lookarounds instead of \b for CJK compatibility
    const regex = new RegExp(
      `(?<![a-zA-Z])${escapeRegex(phrase)}(?![a-zA-Z])`,
      "i"
    );
    if (regex.test(text)) return true;
  }
  return false;
}

try {
  const input = await Bun.stdin.text();
  const data = JSON.parse(input);
  const prompt: string = data.prompt || "";

  if (!prompt) process.exit(0);

  const matched = SIGNALS.filter((sig) => matchesAny(sig.patterns, prompt));

  if (matched.length > 0) {
    const hints = matched.map((s) => `- ${s.message}`).join("\n");
    const output = {
      hookSpecificOutput: {
        hookEventName: "UserPromptSubmit",
        additionalContext: `Content routing hints (from classify-message hook):\n${hints}`,
      },
    };
    process.stdout.write(JSON.stringify(output));
  }

  process.exit(0);
} catch {
  process.exit(0);
}
