---
name: Obsidian
description: Create and edit Obsidian vault files including Markdown, Bases, and Canvas. USE WHEN working with .md files in Obsidian vault, creating .base database views, creating .canvas visual canvases, OR user mentions wikilinks, callouts, embeds, frontmatter, Obsidian notes, Obsidian Bases, or Canvas files.
---

# Obsidian Skill

Create and edit Obsidian-compatible plain text files with full knowledge of Obsidian-specific syntax extensions.

Based on [kepano/obsidian-skills](https://github.com/kepano/obsidian-skills) by Steph Ango (MIT License).

## Supported Formats

| Format | Extension | Reference | Use Case |
|--------|-----------|-----------|----------|
| Obsidian Flavored Markdown | `.md` | `reference/ObsidianMarkdown.md` | Notes with wikilinks, callouts, embeds, properties, tags |
| Obsidian Bases | `.base` | `reference/ObsidianBases.md` | Database-like views with filters, formulas, summaries |
| JSON Canvas | `.canvas` | `reference/JsonCanvas.md` | Visual canvases with nodes, edges, groups |

## Routing

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
