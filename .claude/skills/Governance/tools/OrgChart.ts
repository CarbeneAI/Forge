#!/usr/bin/env bun
/**
 * OrgChart.ts - Auto-generates a Mermaid org chart from PAI agent config files.
 *
 * Usage:
 *   bun OrgChart.ts [--output mermaid|svg] [--save <path>] [--help]
 *
 * The hierarchy is defined in HIERARCHY below. Agent metadata (model, color) is
 * sourced from YAML frontmatter in each .md file under the agents directory.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import { resolve, join } from "path";
import { execSync } from "child_process";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAI_DIR =
  process.env.PAI_DIR ??
  join(process.env.HOME ?? "/home/youruser", ".claude");
const AGENTS_DIR = join(PAI_DIR, "agents");

// ---------------------------------------------------------------------------
// Org hierarchy definition
//
// Each node: { id, label, role, human?, placeholder?, children? }
//   id          - maps to the agent `name` field in frontmatter (lowercase)
//   label       - display name shown in the chart
//   role        - role subtitle shown in the chart
//   human       - true for real humans (no .md agent file)
//   placeholder - true for structural group nodes (CTO, CSO, etc.)
//   children    - subordinate nodes
// ---------------------------------------------------------------------------

interface OrgNode {
  id: string;
  label: string;
  role: string;
  human?: boolean;
  placeholder?: boolean;
  children?: OrgNode[];
}

const HIERARCHY: OrgNode = {
  id: "ceo",
  label: "Clint Garrison",
  role: "CEO",
  human: true,
  children: [
    {
      id: "cto",
      label: "CTO",
      role: "CTO",
      placeholder: true,
      children: [
        { id: "solomon", label: "Solomon", role: "Principal Engineer" },
        {
          id: "joshua",
          label: "Joshua",
          role: "PM / DevTeam",
          children: [
            { id: "hiram",  label: "Hiram",  role: "Engineer" },
            { id: "ezra",   label: "Ezra",   role: "QA"       },
            { id: "miriam", label: "Miriam", role: "Designer" },
          ],
        },
        { id: "bezalel",  label: "Bezalel",  role: "Architect"         },
        { id: "nehemiah", label: "Nehemiah", role: "Security Auditor"  },
        { id: "daniel",   label: "Daniel",   role: "Compliance"        },
        { id: "gideon",   label: "Gideon",   role: "Incident Response" },
      ],
    },
    {
      id: "phoebe",
      label: "Phoebe",
      role: "CMO",
      children: [
        { id: "barnabas", label: "Barnabas", role: "Discord Community" },
      ],
    },
    { id: "aquila", label: "Aquila", role: "VP Sales" },
    { id: "lydia",  label: "Lydia",  role: "CFO"      },
    {
      id: "cso",
      label: "CSO",
      role: "CSO",
      placeholder: true,
      children: [
        { id: "ehud", label: "Ehud", role: "Pentester" },
      ],
    },
    {
      id: "research",
      label: "Research",
      role: "Research Division",
      placeholder: true,
      children: [
        { id: "luke",                  label: "Luke",                 role: "VP Research"  },
        { id: "claude-researcher",     label: "ClaudeResearcher",     role: "Researcher"   },
        { id: "perplexity-researcher", label: "PerplexityResearcher", role: "Researcher"   },
        { id: "gemini-researcher",     label: "GeminiResearcher",     role: "Researcher"   },
        { id: "grok-researcher",       label: "GrokResearcher",       role: "Researcher"   },
      ],
    },
    {
      id: "advisory",
      label: "Advisory",
      role: "Advisory Division",
      placeholder: true,
      children: [
        { id: "deborah", label: "Deborah", role: "Critical Thinking" },
        { id: "jethro",  label: "Jethro",  role: "Delegation"        },
        { id: "nathan",  label: "Nathan",  role: "Feedback"          },
        { id: "esther",  label: "Esther",  role: "Stakeholder"       },
      ],
    },
    {
      id: "operations",
      label: "Operations",
      role: "Operations Division",
      placeholder: true,
      children: [
        { id: "philemon", label: "Philemon", role: "Email"   },
        { id: "joseph",   label: "Joseph",   role: "Trading" },
        { id: "abigail",  label: "Abigail",  role: "Admin"   },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Agent metadata
// ---------------------------------------------------------------------------

interface AgentMeta {
  name: string;
  model?: string;
  color?: string;
  description?: string;
  found: boolean;
}

type AgentRegistry = Map<string, AgentMeta>;

/**
 * Parse simple `key: value` YAML frontmatter from markdown content.
 * Handles quoted and unquoted values; ignores nested structures.
 */
function parseFrontmatter(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!fmMatch) return result;

  for (const line of fmMatch[1].split("\n")) {
    const kv = line.match(/^([\w-]+):\s*(.+)$/);
    if (kv) {
      result[kv[1]] = kv[2].trim().replace(/^['"]|['"]$/g, "");
    }
  }
  return result;
}

/**
 * Load all agent .md files from agentsDir and build a registry keyed by
 * the agent's `name` field value (lowercased).
 */
function loadAgents(agentsDir: string): AgentRegistry {
  const registry: AgentRegistry = new Map();

  if (!existsSync(agentsDir)) {
    process.stderr.write(`[warn] Agents directory not found: ${agentsDir}\n`);
    return registry;
  }

  const files = readdirSync(agentsDir).filter((f) => f.endsWith(".md"));

  for (const file of files) {
    const filePath = join(agentsDir, file);
    try {
      const content = readFileSync(filePath, "utf-8");
      const fm = parseFrontmatter(content);
      const id = (fm["name"] ?? file.replace(/\.md$/, "")).toLowerCase();
      registry.set(id, {
        name:        fm["name"]        ?? id,
        model:       fm["model"]?.toLowerCase(),
        color:       fm["color"]?.toLowerCase(),
        description: fm["description"],
        found:       true,
      });
    } catch (err) {
      process.stderr.write(`[warn] Could not read ${file}: ${err}\n`);
    }
  }

  return registry;
}

// ---------------------------------------------------------------------------
// Mermaid generation
// ---------------------------------------------------------------------------

/** Map model name -> Mermaid classDef name */
const MODEL_CLASS: Record<string, string> = {
  opus:   "opusNode",
  sonnet: "sonnetNode",
  haiku:  "haikuNode",
};

/**
 * Convert a node id to a valid Mermaid node identifier (alphanumeric + underscore).
 */
function mid(id: string): string {
  return id.replace(/[^a-zA-Z0-9]/g, "_");
}

/**
 * Escape text for use inside a Mermaid quoted label.
 * Removes characters that break Mermaid's parser.
 */
function esc(text: string): string {
  return text.replace(/"/g, "'").replace(/[<>{}|#]/g, " ").trim();
}

interface WalkCtx {
  edges:   string[];   // "parentId --> childNode[...]" lines
  classes: string[];   // "class nodeId className" lines
  registry: AgentRegistry;
  warnings: string[];
}

/**
 * Recursively walk the hierarchy tree, emitting Mermaid edge and class lines.
 */
function walkNode(node: OrgNode, parentId: string | null, ctx: WalkCtx): void {
  const nid = mid(node.id);

  // Verify agent file exists for non-structural nodes
  if (!node.human && !node.placeholder) {
    const meta = ctx.registry.get(node.id.toLowerCase());
    if (!meta) {
      ctx.warnings.push(`Agent file missing for: ${node.id} (${node.label})`);
    }
  }

  // Build the node label: "Name\nRole" (or role-only for placeholders)
  let nodeExpr: string;
  if (node.human) {
    nodeExpr = `${nid}["${esc(node.label)}\n${esc(node.role)}\n(Human)"]`;
  } else if (node.placeholder) {
    nodeExpr = `${nid}(["${esc(node.role)}"])`;
  } else {
    nodeExpr = `${nid}["${esc(node.label)}\n${esc(node.role)}"]`;
  }

  // Emit edge or standalone root
  if (parentId !== null) {
    ctx.edges.push(`    ${mid(parentId)} --> ${nodeExpr}`);
  } else {
    ctx.edges.push(`    ${nodeExpr}`);
  }

  // Assign style class
  if (node.human) {
    ctx.classes.push(`    class ${nid} humanNode`);
  } else if (node.placeholder) {
    ctx.classes.push(`    class ${nid} placeholderNode`);
  } else {
    const meta  = ctx.registry.get(node.id.toLowerCase());
    const model = meta?.model ?? "";
    const cls   = MODEL_CLASS[model] ?? "unknownNode";
    ctx.classes.push(`    class ${nid} ${cls}`);
  }

  // Recurse
  if (node.children) {
    for (const child of node.children) {
      walkNode(child, node.id, ctx);
    }
  }
}

/**
 * Generate the complete Mermaid flowchart string.
 */
function generateMermaid(
  registry: AgentRegistry
): { mermaid: string; warnings: string[] } {
  const ctx: WalkCtx = {
    edges:    [],
    classes:  [],
    registry,
    warnings: [],
  };

  walkNode(HIERARCHY, null, ctx);

  const lines: string[] = [
    "flowchart TD",
    "",
    "    %% ── Style Definitions ────────────────────────────────────────────",
    "    classDef humanNode       fill:#3d3d3d,stroke:#999999,color:#ffffff,font-weight:bold",
    "    classDef placeholderNode fill:#1e1e36,stroke:#5555aa,color:#9999cc,font-style:italic",
    "    classDef opusNode        fill:#5c1010,stroke:#cc2222,color:#ffcccc,font-weight:bold",
    "    classDef sonnetNode      fill:#0d2b5e,stroke:#2255cc,color:#ccddff",
    "    classDef haikuNode       fill:#0d3d1a,stroke:#22aa44,color:#ccffdd",
    "    classDef unknownNode     fill:#2a2a2a,stroke:#666666,color:#bbbbbb",
    "",
    "    %% ── Legend ─────────────────────────────────────────────────────",
    '    LEGEND(["Legend"])',
    '    L_human["Human"]',
    '    L_placeholder(["Structural Group"])',
    '    L_opus["Opus Model\nDeep Reasoning"]',
    '    L_sonnet["Sonnet Model\nStandard Tasks"]',
    '    L_haiku["Haiku Model\nFast Tasks"]',
    "    class LEGEND    placeholderNode",
    "    class L_human   humanNode",
    "    class L_placeholder placeholderNode",
    "    class L_opus    opusNode",
    "    class L_sonnet  sonnetNode",
    "    class L_haiku   haikuNode",
    "",
    "    %% ── Org Hierarchy ───────────────────────────────────────────────",
    ...ctx.edges,
    "",
    "    %% ── Node Style Assignments ──────────────────────────────────────",
    ...ctx.classes,
  ];

  return { mermaid: lines.join("\n"), warnings: ctx.warnings };
}

// ---------------------------------------------------------------------------
// SVG rendering via mmdc
// ---------------------------------------------------------------------------

function renderSvg(mermaidSource: string, savePath: string | null): void {
  const ts       = Date.now();
  const tmpInput = `/tmp/orgchart-${ts}.mmd`;
  const tmpOut   = savePath ? resolve(savePath) : `/tmp/orgchart-${ts}.svg`;

  writeFileSync(tmpInput, mermaidSource, "utf-8");

  // Find mmdc — try PATH first, then bunx as fallback
  let mmdcCmd = "mmdc";
  try {
    execSync("which mmdc", { stdio: "pipe" });
  } catch {
    mmdcCmd = "bunx @mermaid-js/mermaid-cli";
  }

  try {
    execSync(
      `${mmdcCmd} -i "${tmpInput}" -o "${tmpOut}" --backgroundColor transparent`,
      { stdio: "inherit" }
    );

    if (!savePath) {
      process.stdout.write(readFileSync(tmpOut, "utf-8") + "\n");
    } else {
      process.stdout.write(`[ok] SVG written to: ${tmpOut}\n`);
    }
  } catch (err) {
    process.stderr.write(
      `[error] SVG rendering failed. Install mmdc:\n` +
      `  bun add -g @mermaid-js/mermaid-cli\n\n` +
      `  Error: ${err}\n`
    );
    process.exit(1);
  } finally {
    try { execSync(`rm -f "${tmpInput}"`, { stdio: "pipe" }); } catch { /* ignore */ }
    if (!savePath) {
      try { execSync(`rm -f "${tmpOut}"`,   { stdio: "pipe" }); } catch { /* ignore */ }
    }
  }
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

interface CliArgs {
  output:    "mermaid" | "svg";
  save:      string | null;
  agentsDir: string;
  help:      boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    output:    "mermaid",
    save:      null,
    agentsDir: AGENTS_DIR,
    help:      false,
  };

  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];

    if (flag === "--help" || flag === "-h") {
      args.help = true;
      continue;
    }

    if (flag === "--output" || flag === "-o") {
      const val = argv[++i];
      if (val !== "mermaid" && val !== "svg") {
        process.stderr.write(
          `[error] --output must be "mermaid" or "svg", got: ${val}\n`
        );
        process.exit(1);
      }
      args.output = val;
      continue;
    }

    if (flag === "--save" || flag === "-s") {
      args.save = argv[++i];
      if (!args.save) {
        process.stderr.write("[error] --save requires a path argument\n");
        process.exit(1);
      }
      continue;
    }

    if (flag === "--agents-dir") {
      args.agentsDir = argv[++i];
      if (!args.agentsDir) {
        process.stderr.write("[error] --agents-dir requires a path argument\n");
        process.exit(1);
      }
      continue;
    }

    // Unknown flag — warn but continue (forward compatibility)
    if (flag.startsWith("-")) {
      process.stderr.write(`[warn] Unknown flag ignored: ${flag}\n`);
    }
  }

  return args;
}

function printHelp(): void {
  process.stdout.write(`
OrgChart.ts — Generate a Mermaid org chart from PAI agent config files.

USAGE
  bun OrgChart.ts [OPTIONS]

OPTIONS
  -o, --output   mermaid|svg   Output format (default: mermaid)
  -s, --save     <path>        Write output to file instead of stdout
      --agents-dir <path>      Override agents directory
                               (default: \$PAI_DIR/agents)
  -h, --help                   Show this help message

EXAMPLES
  # Print Mermaid diagram to stdout
  bun OrgChart.ts

  # Save Mermaid source to a file
  bun OrgChart.ts --save ~/org.mmd

  # Render directly to SVG (requires mmdc)
  bun OrgChart.ts --output svg --save ~/org.svg

  # Install mmdc if needed
  bun add -g @mermaid-js/mermaid-cli

NOTES
  - Agent metadata (model, color) is read from YAML frontmatter in each .md file.
  - The org hierarchy is hardcoded; agent files are used purely for styling.
  - Node colors: opus = red  |  sonnet = blue  |  haiku = green
  - Placeholder group nodes (CTO, CSO, etc.) use italic dark-blue style.
  - Human nodes (CEO) use grey style.
  - Missing agent file warnings are printed to stderr and do not abort.
`.trimStart());
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

function main(): void {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const registry = loadAgents(args.agentsDir);
  const { mermaid, warnings } = generateMermaid(registry);

  for (const w of warnings) {
    process.stderr.write(`[warn] ${w}\n`);
  }

  if (args.output === "svg") {
    renderSvg(mermaid, args.save);
    return;
  }

  // Mermaid output (default)
  if (args.save) {
    const dest = resolve(args.save);
    writeFileSync(dest, mermaid + "\n", "utf-8");
    process.stdout.write(`[ok] Mermaid diagram written to: ${dest}\n`);
  } else {
    process.stdout.write(mermaid + "\n");
  }
}

main();
