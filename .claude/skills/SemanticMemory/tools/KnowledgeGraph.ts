#!/usr/bin/env bun
/**
 * KnowledgeGraph.ts - CLI for the SemanticMemory Temporal Knowledge Graph
 *
 * Usage:
 *   bun tools/KnowledgeGraph.ts <subcommand> [options]
 *
 * Subcommands:
 *   add      <subject> <predicate> <object>  [--from DATE] [--to DATE] [--type TYPE] [--source FILE]
 *   query    [--subject NAME] [--predicate PRED] [--object NAME] [--as-of DATE] [--include-expired] [--json]
 *   invalidate <relation-id>                 [--date DATE]
 *   timeline <entity-name>                   [--json]
 *   entities [--type TYPE]                   [--json]
 *   stats    [--json]
 *   help
 */

import {
  initKg,
  ensureEntity,
  addRelation,
  invalidateRelation,
  queryRelations,
  getEntityRelations,
  getTimeline,
  listEntities,
  getStats,
} from "../src/knowledge-graph.js";
import type { KgEntity, KgRelation } from "../src/knowledge-graph.js";

// ─── ANSI color helpers ───────────────────────────────────────────────────────

const C = {
  reset:   "\x1b[0m",
  bold:    "\x1b[1m",
  dim:     "\x1b[2m",
  red:     "\x1b[31m",
  green:   "\x1b[32m",
  yellow:  "\x1b[33m",
  blue:    "\x1b[34m",
  magenta: "\x1b[35m",
  cyan:    "\x1b[36m",
  white:   "\x1b[37m",
  gray:    "\x1b[90m",
};

function bold(s: string): string    { return `${C.bold}${s}${C.reset}`; }
function dim(s: string): string     { return `${C.dim}${s}${C.reset}`; }
function green(s: string): string   { return `${C.green}${s}${C.reset}`; }
function yellow(s: string): string  { return `${C.yellow}${s}${C.reset}`; }
function cyan(s: string): string    { return `${C.cyan}${s}${C.reset}`; }
function gray(s: string): string    { return `${C.gray}${s}${C.reset}`; }
function red(s: string): string     { return `${C.red}${s}${C.reset}`; }
function magenta(s: string): string { return `${C.magenta}${s}${C.reset}`; }

// ─── Help text ────────────────────────────────────────────────────────────────

function printHelp(): void {
  console.log(`
${bold("KnowledgeGraph")} — Temporal Knowledge Graph for SemanticMemory
${"─".repeat(56)}

${bold("USAGE")}
  bun tools/KnowledgeGraph.ts <subcommand> [options]

${bold("SUBCOMMANDS")}

  ${cyan("add")} <subject> <predicate> <object>
      Add a relation between two entities.
      ${dim("Options:")}
        --from  DATE   valid_from date (ISO 8601, default: today)
        --to    DATE   valid_to   date (ISO 8601, default: null = still valid)
        --type  TYPE   entity type for subject: person|project|technology|
                       organization|concept  (default: unknown)
        --source FILE  source file or label (default: "manual")

  ${cyan("query")} [filters]
      Query relations with optional filters.
      ${dim("Options:")}
        --subject  NAME   filter by subject entity name
        --predicate PRED  filter by predicate string
        --object   NAME   filter by object entity name
        --as-of    DATE   only return facts valid on this date
        --include-expired include invalidated relations
        --json            output as JSON

  ${cyan("invalidate")} <relation-id>
      Mark a relation as no longer valid.
      ${dim("Options:")}
        --date DATE  invalidation date (default: today)

  ${cyan("timeline")} <entity-name>
      Full chronological history for an entity (both directions).
      ${dim("Options:")}
        --json  output as JSON

  ${cyan("entities")} [--type TYPE] [--json]
      List all entities, optionally filtered by type.

  ${cyan("stats")} [--json]
      Show knowledge graph statistics.

  ${cyan("help")}
      Show this help message.

${bold("EXAMPLES")}
  # Add a fact
  bun tools/KnowledgeGraph.ts add "Alice" "works_on" "ProjectX" --type person

  # Add a time-bounded fact
  bun tools/KnowledgeGraph.ts add "Alice" "employed_by" "Acme" \\
      --from 2024-01-01 --to 2025-06-30 --type person

  # Query all active relations involving Alice
  bun tools/KnowledgeGraph.ts query --subject "Alice"

  # What was true on a specific date?
  bun tools/KnowledgeGraph.ts query --as-of 2024-12-31

  # Full entity timeline
  bun tools/KnowledgeGraph.ts timeline "Alice"

  # Invalidate a relation
  bun tools/KnowledgeGraph.ts invalidate 42

  # All person entities as JSON
  bun tools/KnowledgeGraph.ts entities --type person --json
`.trimStart());
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

function fmtDate(ts: number): string {
  return new Date(ts).toISOString().replace("T", " ").slice(0, 19);
}

function fmtRelation(r: KgRelation, idx?: number): void {
  const prefix = idx !== undefined ? `${gray(`[${idx + 1}]`)} ` : "";
  const validity = r.validTo
    ? `${yellow(r.validFrom)} → ${red(r.validTo)}`
    : `${green(r.validFrom)} → ${dim("present")}`;

  console.log(
    `${prefix}${bold(r.subjectName)} ${cyan(r.predicate)} ${bold(r.objectName)}`
  );
  console.log(
    `     ${dim("id:")} ${r.id}  ${dim("valid:")} ${validity}  ${dim("conf:")} ${r.confidence.toFixed(2)}` +
    (r.source ? `  ${dim("src:")} ${gray(r.source)}` : "")
  );
}

function fmtEntity(e: KgEntity): void {
  console.log(
    `${bold(e.name)} ${gray(`[${e.type}]`)} ${dim("id:")} ${e.id}`
  );
}

// ─── Subcommand handlers ──────────────────────────────────────────────────────

function cmdAdd(args: string[]): void {
  if (args.length < 3) {
    console.error(red("Error: add requires <subject> <predicate> <object>"));
    process.exit(1);
  }

  const [subject, predicate, object] = args;
  let validFrom: string | undefined;
  let validTo: string | undefined;
  let subjectType = "unknown";
  let source: string | undefined = "manual";

  let i = 3;
  while (i < args.length) {
    switch (args[i]) {
      case "--from":
        validFrom = args[++i];
        break;
      case "--to":
        validTo = args[++i];
        break;
      case "--type":
        subjectType = args[++i];
        break;
      case "--source":
        source = args[++i];
        break;
      default:
        console.error(red(`Error: Unknown option "${args[i]}"`));
        process.exit(1);
    }
    i++;
  }

  // Ensure subject entity is created with the specified type
  ensureEntity(subject, subjectType);

  const id = addRelation({ subject, predicate, object, validFrom, validTo, source });

  console.log(green("Relation added."));
  console.log(
    `  ${bold(subject)} ${cyan(predicate)} ${bold(object)}  ${dim("relation id:")} ${id}`
  );
}

function cmdQuery(args: string[]): void {
  let subject: string | undefined;
  let predicate: string | undefined;
  let object: string | undefined;
  let asOf: string | undefined;
  let includeExpired = false;
  let json = false;

  let i = 0;
  while (i < args.length) {
    switch (args[i]) {
      case "--subject":
        subject = args[++i];
        break;
      case "--predicate":
        predicate = args[++i];
        break;
      case "--object":
        object = args[++i];
        break;
      case "--as-of":
        asOf = args[++i];
        break;
      case "--include-expired":
        includeExpired = true;
        break;
      case "--json":
        json = true;
        break;
      default:
        console.error(red(`Error: Unknown option "${args[i]}"`));
        process.exit(1);
    }
    i++;
  }

  const results = queryRelations({ subject, predicate, object, asOf, includeExpired });

  if (json) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  if (results.length === 0) {
    console.log(dim("No relations found."));
    return;
  }

  console.log(bold(`${results.length} relation${results.length !== 1 ? "s" : ""} found:\n`));
  for (let idx = 0; idx < results.length; idx++) {
    fmtRelation(results[idx], idx);
  }
}

function cmdInvalidate(args: string[]): void {
  if (args.length < 1) {
    console.error(red("Error: invalidate requires <relation-id>"));
    process.exit(1);
  }

  const id = parseInt(args[0], 10);
  if (isNaN(id)) {
    console.error(red(`Error: relation-id must be an integer, got "${args[0]}"`));
    process.exit(1);
  }

  let date: string | undefined;
  let i = 1;
  while (i < args.length) {
    if (args[i] === "--date") {
      date = args[++i];
    } else {
      console.error(red(`Error: Unknown option "${args[i]}"`));
      process.exit(1);
    }
    i++;
  }

  try {
    invalidateRelation(id, date);
    console.log(
      green(`Relation ${id} invalidated.`) +
        (date ? `  ${dim("valid_to:")} ${date}` : `  ${dim("valid_to:")} today`)
    );
  } catch (err) {
    console.error(red(`Error: ${err instanceof Error ? err.message : String(err)}`));
    process.exit(1);
  }
}

function cmdTimeline(args: string[]): void {
  let json = false;
  const positional: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--json") {
      json = true;
    } else if (!args[i].startsWith("--")) {
      positional.push(args[i]);
    } else {
      console.error(red(`Error: Unknown option "${args[i]}"`));
      process.exit(1);
    }
  }

  if (positional.length === 0) {
    console.error(red("Error: timeline requires <entity-name>"));
    process.exit(1);
  }

  const entityName = positional.join(" ");
  const relations = getTimeline(entityName);

  if (json) {
    console.log(JSON.stringify(relations, null, 2));
    return;
  }

  if (relations.length === 0) {
    console.log(dim(`No timeline data for "${entityName}".`));
    return;
  }

  console.log(bold(`Timeline for "${entityName}" (${relations.length} event${relations.length !== 1 ? "s" : ""}):\n`));

  for (let idx = 0; idx < relations.length; idx++) {
    fmtRelation(relations[idx], idx);
  }
}

function cmdEntities(args: string[]): void {
  let type: string | undefined;
  let json = false;

  let i = 0;
  while (i < args.length) {
    switch (args[i]) {
      case "--type":
        type = args[++i];
        break;
      case "--json":
        json = true;
        break;
      default:
        console.error(red(`Error: Unknown option "${args[i]}"`));
        process.exit(1);
    }
    i++;
  }

  const entities = listEntities(type);

  if (json) {
    console.log(JSON.stringify(entities, null, 2));
    return;
  }

  if (entities.length === 0) {
    console.log(dim(type ? `No entities of type "${type}".` : "No entities found."));
    return;
  }

  const header = type
    ? `${entities.length} ${bold(type)} entit${entities.length !== 1 ? "ies" : "y"}:`
    : `${entities.length} entit${entities.length !== 1 ? "ies" : "y"}:`;

  console.log(bold(header) + "\n");
  for (const e of entities) {
    fmtEntity(e);
  }
}

function cmdStats(args: string[]): void {
  const json = args.includes("--json");
  const stats = getStats();

  if (json) {
    console.log(JSON.stringify(stats, null, 2));
    return;
  }

  console.log(bold("Knowledge Graph Statistics"));
  console.log("─".repeat(30));
  console.log(`  ${magenta("Entities")}         ${bold(String(stats.entities))}`);
  console.log(`  ${cyan("Relations")}         ${bold(String(stats.relations))}`);
  console.log(`  ${green("Active relations")}  ${bold(String(stats.activeRelations))}`);
  const expired = stats.relations - stats.activeRelations;
  if (expired > 0) {
    console.log(`  ${gray("Expired relations")} ${dim(String(expired))}`);
  }
}

// ─── Entry point ──────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const argv = process.argv.slice(2);

  if (argv.length === 0 || argv[0] === "help" || argv[0] === "--help" || argv[0] === "-h") {
    printHelp();
    process.exit(0);
  }

  const subcommand = argv[0];
  const rest = argv.slice(1);

  try {
    await initKg();

    switch (subcommand) {
      case "add":
        cmdAdd(rest);
        break;
      case "query":
        cmdQuery(rest);
        break;
      case "invalidate":
        cmdInvalidate(rest);
        break;
      case "timeline":
        cmdTimeline(rest);
        break;
      case "entities":
        cmdEntities(rest);
        break;
      case "stats":
        cmdStats(rest);
        break;
      default:
        console.error(red(`Error: Unknown subcommand "${subcommand}". Run "help" for usage.`));
        process.exit(1);
    }

    process.exit(0);
  } catch (err) {
    console.error(red(`Fatal: ${err instanceof Error ? err.message : String(err)}`));
    if (err instanceof Error && err.stack) {
      console.error(dim(err.stack));
    }
    process.exit(1);
  }
}

main();
