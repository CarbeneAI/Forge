---
name: Obsidian
description: Create, edit, search, and manage Obsidian vault files using the Obsidian CLI and direct file operations. USE WHEN working with .md files in Obsidian vault, creating .base database views, creating .canvas visual canvases, searching notes, managing properties/tags, querying backlinks, OR user mentions wikilinks, callouts, embeds, frontmatter, Obsidian notes, Obsidian Bases, or Canvas files.
---

# Obsidian Skill

Create, edit, search, and manage Obsidian vault files using the Obsidian CLI (90+ commands) and direct file operations with full knowledge of Obsidian-specific syntax extensions.

Based on [kepano/obsidian-skills](https://github.com/kepano/obsidian-skills) by Steph Ango (MIT License).

## Obsidian CLI

The Obsidian CLI (requires Obsidian 1.12.7+) provides native access to vault operations. **Prefer CLI commands over raw file reads for searching, querying, and metadata operations.**

See `reference/ObsidianCLI.md` for the full command reference.

### Prerequisites

- Obsidian desktop app must be running (CLI communicates with the app)
- Enable via: Settings > General > "Command line interface"
- Linux: binary at `~/.local/bin/obsidian`

### When to Use CLI vs Direct File Operations

| Task | Use | Why |
|------|-----|-----|
| **Search notes** | CLI: `obsidian search query="..."` | Native full-text + metadata search |
| **Read a note** | CLI: `obsidian read path="note.md"` | Simpler than resolving vault paths |
| **Create a note** | CLI: `obsidian create path="note.md" content="..."` | Handles templates, dedup |
| **Append to daily note** | CLI: `obsidian daily:append content="..."` | Auto-resolves daily note path |
| **Get/set properties** | CLI: `obsidian property:set/read` | No YAML parsing needed |
| **Find backlinks** | CLI: `obsidian backlinks path="note.md"` | Graph traversal |
| **Find orphan notes** | CLI: `obsidian orphans` | No equivalent via file ops |
| **Query a Base** | CLI: `obsidian base:query path="db.base"` | Native query engine |
| **Toggle tasks** | CLI: `obsidian task path="note.md" line=5` | Clean task management |
| **Write complex Markdown** | Direct Write/Edit tool | Full control over formatting |
| **Create .base files** | Direct Write tool | Full YAML control needed |
| **Create .canvas files** | Direct Write tool | Full JSON control needed |
| **Bulk file operations** | Direct file tools | CLI is per-file |

### High-Value CLI Commands

```bash
# Search across vault
obsidian search query="threat model" format=json

# Daily notes workflow
obsidian daily                           # Open today's daily note
obsidian daily:append content="- Meeting notes from standup"

# Graph analysis
obsidian backlinks path="note.md"        # What links TO this note
obsidian links path="note.md"            # What this note links TO
obsidian orphans                         # Notes with no links in or out
obsidian deadends                        # Notes with links in but none out

# Property management
obsidian property:set path="note.md" property=status value=active
obsidian property:read path="note.md" property=tags format=json

# Task management
obsidian tasks format=json               # All tasks across vault
obsidian task path="note.md" line=12     # Toggle task at line 12

# Templates
obsidian templates                       # List available templates
obsidian template:insert path="new.md" template="Meeting Notes"

# Execute any Obsidian command (including plugins)
obsidian command id="app:reload"
obsidian commands format=json            # List all available commands

# Query Bases from terminal
obsidian base:query path="Projects.base" format=json
```

### Output Formats

Most CLI commands support `format=json|tsv|csv|yaml|md|tree`. Always use `format=json` when processing output programmatically.

## Supported Formats

| Format | Extension | Reference | Use Case |
|--------|-----------|-----------|----------|
| Obsidian Flavored Markdown | `.md` | `reference/ObsidianMarkdown.md` | Notes with wikilinks, callouts, embeds, properties, tags |
| Obsidian Bases | `.base` | `reference/ObsidianBases.md` | Database-like views with filters, formulas, summaries |
| JSON Canvas | `.canvas` | `reference/JsonCanvas.md` | Visual canvases with nodes, edges, groups |
| Obsidian CLI | N/A | `reference/ObsidianCLI.md` | 90+ commands for vault operations |

## Routing

**When searching, querying, or reading vault content:**
Use Obsidian CLI commands. See `reference/ObsidianCLI.md` for the full command reference.

**When creating or editing `.md` files in Obsidian vault:**
Read `reference/ObsidianMarkdown.md` for syntax reference covering wikilinks, callouts, embeds, block references, properties/frontmatter, footnotes, Mermaid diagrams, LaTeX math, and comments.

**When creating or editing `.base` files:**
Read `reference/ObsidianBases.md` for YAML syntax reference covering views (table/cards/list/map), filters, formulas, functions, summaries, and property configuration.

**When creating or editing `.canvas` files:**
Read `reference/JsonCanvas.md` for JSON Canvas spec covering nodes (text/file/link/group), edges, colors, layout guidelines, and validation rules.

## Vault Location

The Obsidian vault is at: `~/Nextcloud/PAI/Obsidian/`

Environment variable: `OBSIDIAN_VAULT_PATH`

## Quick Syntax Reminders

### Wikilinks
```markdown
[[Note Name]]
[[Note Name|Display Text]]
[[Note Name#Heading]]
![[Embedded Note]]
```

### Callouts
```markdown
> [!tip] Title
> Content here

> [!warning]- Foldable (collapsed)
> Hidden content
```

### Properties (Frontmatter)
```yaml
---
title: My Note
tags: [project, active]
date: 2026-02-09
---
```

### Tags
```markdown
#tag #nested/tag
```
