---
name: obsidian-cli
description: Obsidian CLI command reference (90+ commands). Use when searching notes, querying backlinks, managing properties/tags, working with daily notes, executing Obsidian commands, or any vault operation that benefits from native CLI access. Requires Obsidian 1.12.7+ desktop app running.
---

# Obsidian CLI Reference

The Obsidian CLI provides terminal access to nearly all Obsidian functionality. Requires Obsidian 1.12.7+ with the CLI enabled in Settings > General.

## Setup

- **Enable:** Settings > General > "Command line interface"
- **Linux:** `~/.local/bin/obsidian`
- **macOS:** `/usr/local/bin/obsidian`
- **Obsidian must be running** — the CLI communicates with the desktop app

## Invocation

```bash
obsidian <command> [parameters] [flags]   # Single command
obsidian                                   # Interactive TUI mode
```

- Parameters use `key=value` syntax (quote values with spaces)
- `vault=<name>` as first param targets a specific vault
- `--copy` flag copies output to clipboard
- Most commands support `format=json|tsv|csv|yaml|md|tree`

## Command Reference

### File Operations

| Command | Description | Example |
|---------|-------------|---------|
| `create` | Create a new note | `obsidian create path="Projects/new.md" content="# New Project"` |
| `read` | Read note content | `obsidian read path="note.md"` |
| `append` | Append to a note | `obsidian append path="note.md" content="New line"` |
| `prepend` | Prepend to a note | `obsidian prepend path="note.md" content="Top line"` |
| `move` | Move/rename a note | `obsidian move path="old.md" to="folder/new.md"` |
| `rename` | Rename a note | `obsidian rename path="old.md" name="new.md"` |
| `delete` | Delete a note | `obsidian delete path="note.md"` |
| `open` | Open note in Obsidian | `obsidian open path="note.md"` |
| `files` | List all files | `obsidian files format=json` |
| `folders` | List all folders | `obsidian folders` |
| `unique` | Create note with unique name | `obsidian unique content="Quick capture"` |
| `wordcount` | Word count for a note | `obsidian wordcount path="note.md"` |

### Daily Notes

| Command | Description | Example |
|---------|-------------|---------|
| `daily` | Open today's daily note | `obsidian daily` |
| `daily:read` | Read today's daily note | `obsidian daily:read format=json` |
| `daily:append` | Append to daily note | `obsidian daily:append content="- Task completed"` |
| `daily:prepend` | Prepend to daily note | `obsidian daily:prepend content="## Morning"` |
| `daily:path` | Get daily note file path | `obsidian daily:path` |

### Search

| Command | Description | Example |
|---------|-------------|---------|
| `search` | Full-text search | `obsidian search query="threat model" format=json` |
| `search:context` | Search with surrounding context | `obsidian search:context query="API key"` |
| `search:open` | Search and open in Obsidian | `obsidian search:open query="meeting notes"` |
| `random` | Open a random note | `obsidian random` |
| `random:read` | Read a random note | `obsidian random:read` |

### Links & Graph

| Command | Description | Example |
|---------|-------------|---------|
| `backlinks` | Notes that link TO this note | `obsidian backlinks path="note.md" format=json` |
| `links` | Notes this note links TO | `obsidian links path="note.md"` |
| `unresolved` | Wikilinks with no target note | `obsidian unresolved` |
| `orphans` | Notes with no links in or out | `obsidian orphans` |
| `deadends` | Notes with inbound links but no outbound | `obsidian deadends` |

### Properties & Metadata

| Command | Description | Example |
|---------|-------------|---------|
| `properties` | List all properties in a note | `obsidian properties path="note.md" format=json` |
| `property:set` | Set a property value | `obsidian property:set path="note.md" property=status value=active` |
| `property:remove` | Remove a property | `obsidian property:remove path="note.md" property=draft` |
| `property:read` | Read a property value | `obsidian property:read path="note.md" property=tags format=json` |
| `aliases` | List note aliases | `obsidian aliases path="note.md"` |

### Tags

| Command | Description | Example |
|---------|-------------|---------|
| `tags` | List all tags in vault | `obsidian tags format=json` |
| `tag` | Find notes with a tag | `obsidian tag tag=project format=json` |

### Tasks

| Command | Description | Example |
|---------|-------------|---------|
| `tasks` | List all tasks in vault | `obsidian tasks format=json` |
| `task` | Toggle task status | `obsidian task path="note.md" line=12` |

### Outline

| Command | Description | Example |
|---------|-------------|---------|
| `outline` | Get note heading structure | `obsidian outline path="note.md" format=tree` |

### File History

| Command | Description | Example |
|---------|-------------|---------|
| `history` | View file version history | `obsidian history path="note.md"` |
| `history:read` | Read a historical version | `obsidian history:read path="note.md" version=2` |
| `history:restore` | Restore a previous version | `obsidian history:restore path="note.md" version=2` |
| `diff` | Compare local vs sync version | `obsidian diff path="note.md"` |

### Sync (requires Obsidian Sync)

| Command | Description | Example |
|---------|-------------|---------|
| `sync` | Trigger sync | `obsidian sync` |
| `sync:status` | Check sync status | `obsidian sync:status` |
| `sync:history` | View sync history | `obsidian sync:history` |
| `sync:restore` | Restore synced version | `obsidian sync:restore path="note.md" version=1` |
| `sync:deleted` | List deleted synced files | `obsidian sync:deleted` |

### Plugins

| Command | Description | Example |
|---------|-------------|---------|
| `plugins` | List installed plugins | `obsidian plugins format=json` |
| `plugin:enable` | Enable a plugin | `obsidian plugin:enable id="dataview"` |
| `plugin:disable` | Disable a plugin | `obsidian plugin:disable id="dataview"` |
| `plugin:install` | Install a plugin | `obsidian plugin:install id="obsidian-git"` |
| `plugin:uninstall` | Uninstall a plugin | `obsidian plugin:uninstall id="obsidian-git"` |
| `plugin:reload` | Reload a plugin | `obsidian plugin:reload id="dataview"` |

### Themes & Snippets

| Command | Description | Example |
|---------|-------------|---------|
| `themes` | List available themes | `obsidian themes` |
| `theme:set` | Set active theme | `obsidian theme:set name="Minimal"` |
| `theme:install` | Install a theme | `obsidian theme:install name="Minimal"` |
| `snippets` | List CSS snippets | `obsidian snippets` |
| `snippet:enable` | Enable a snippet | `obsidian snippet:enable name="my-style"` |
| `snippet:disable` | Disable a snippet | `obsidian snippet:disable name="my-style"` |

### Bookmarks

| Command | Description | Example |
|---------|-------------|---------|
| `bookmarks` | List bookmarks | `obsidian bookmarks format=json` |
| `bookmark` | Bookmark a note | `obsidian bookmark path="note.md"` |

### Bases (Database Views)

| Command | Description | Example |
|---------|-------------|---------|
| `bases` | List all .base files | `obsidian bases` |
| `base:query` | Query a Base | `obsidian base:query path="Projects.base" format=json` |
| `base:create` | Create a new Base | `obsidian base:create path="Tasks.base"` |

### Templates

| Command | Description | Example |
|---------|-------------|---------|
| `templates` | List available templates | `obsidian templates` |
| `template:read` | Read a template | `obsidian template:read name="Meeting Notes"` |
| `template:insert` | Insert template into note | `obsidian template:insert path="new.md" template="Meeting Notes"` |

### Commands & Hotkeys

| Command | Description | Example |
|---------|-------------|---------|
| `commands` | List all Obsidian commands | `obsidian commands format=json` |
| `command` | Execute any command by ID | `obsidian command id="app:reload"` |
| `hotkeys` | List configured hotkeys | `obsidian hotkeys` |

### Publish (requires Obsidian Publish)

| Command | Description | Example |
|---------|-------------|---------|
| `publish:status` | Check publish status | `obsidian publish:status path="note.md"` |
| `publish:add` | Add note to publish | `obsidian publish:add path="note.md"` |
| `publish:remove` | Remove from publish | `obsidian publish:remove path="note.md"` |
| `publish:list` | List published notes | `obsidian publish:list` |

### Workspaces & Tabs

| Command | Description | Example |
|---------|-------------|---------|
| `workspaces` | List saved workspaces | `obsidian workspaces` |
| `workspace:save` | Save current workspace | `obsidian workspace:save name="research"` |
| `workspace:load` | Load a workspace | `obsidian workspace:load name="research"` |
| `tabs` | List open tabs | `obsidian tabs` |
| `tab:open` | Open a file in a new tab | `obsidian tab:open path="note.md"` |
| `recents` | List recently opened files | `obsidian recents` |

### Vault

| Command | Description | Example |
|---------|-------------|---------|
| `vault` | Current vault info | `obsidian vault` |
| `vaults` | List all vaults | `obsidian vaults` |
| `vault:open` | Open/switch vault | `obsidian vault:open name="Work"` |

### Developer Tools

| Command | Description | Example |
|---------|-------------|---------|
| `devtools` | Open developer tools | `obsidian devtools` |
| `eval` | Run JavaScript in Obsidian | `obsidian eval code="app.vault.getFiles().length"` |
| `dev:screenshot` | Take a screenshot | `obsidian dev:screenshot` |
| `dev:console` | View console output | `obsidian dev:console` |
| `dev:dom` | Inspect DOM | `obsidian dev:dom` |
| `dev:css` | View applied CSS | `obsidian dev:css` |
| `dev:cdp` | Chrome DevTools Protocol | `obsidian dev:cdp` |
| `dev:debug` | Debug mode | `obsidian dev:debug` |
| `dev:mobile` | Mobile emulation | `obsidian dev:mobile` |
| `web` | Open URL in Obsidian | `obsidian web url="https://example.com"` |

### System

| Command | Description | Example |
|---------|-------------|---------|
| `reload` | Reload Obsidian | `obsidian reload` |
| `restart` | Restart Obsidian | `obsidian restart` |

## Common Workflows

### Morning Capture

```bash
# Append to today's daily note
obsidian daily:append content="## Tasks
- [ ] Review PRs
- [ ] Team standup
- [ ] Deploy v2.1"
```

### Graph Health Check

```bash
# Find disconnected notes
obsidian orphans format=json
# Find broken links
obsidian unresolved format=json
# Find dead-end notes (need outbound links)
obsidian deadends format=json
```

### Vault-Wide Task Review

```bash
# Get all open tasks across vault
obsidian tasks format=json
```

### Property Bulk Operations

```bash
# Read all properties from a note
obsidian properties path="Projects/Alpha.md" format=json
# Set status
obsidian property:set path="Projects/Alpha.md" property=status value=complete
```

### Search and Process

```bash
# Find all notes mentioning a topic
obsidian search query="incident response" format=json
# Get backlinks to understand connections
obsidian backlinks path="Incident Response Plan.md" format=json
```
