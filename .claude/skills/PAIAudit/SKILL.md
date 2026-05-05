---
name: PAIAudit
description: PAI security audit — scans Claude Code config (settings, MCP servers, skills, agents, hooks) for risky configurations, supply-chain drift, and weekly deltas. USE WHEN user mentions audit PAI, security audit, PAI security check, supply chain audit, skill audit, MCP audit, OR wants weekly security report. Inspired by HarmonicSecurity/claudit-sec but built for Claude Code (not Claude Desktop).
---

# PAIAudit

Read-only audit of the PAI Claude Code surface. Catches risky configs, drift in symlinked external skills, and changes week-over-week.

## What It Checks

| Area | Check |
|------|-------|
| **Settings** | `~/.claude/settings.json` + `settings.local.json` — hooks, permissions, env |
| **MCP servers** | `~/.claude.json` — server list, command paths, token presence (count, never values) |
| **Skill supply chain** | All symlinks in `~/.claude/skills/` — target repo + commit SHA, drift since last run |
| **Agents** | `~/.claude/agents/*.md` — flag broad tool access (`*`, Bash, Write on sensitive agents) |
| **Hooks** | Scripts wired in settings — existence, permissions, owner |
| **File permissions** | `~/.claude.json` should be 0600 (holds API tokens) |
| **Delta** | Diff vs last audit — new skills, new MCPs, settings changes, SHA drift |

## Modes

| Mode | Trigger | Output |
|------|---------|--------|
| **Quick** | `audit-summary.ts` | One-line summary for Telegram daily report |
| **Full** | `audit.ts` | Full markdown report → `~/.claude/audit-history/YYYY-MM-DD.md` + Obsidian |
| **Diff** | `audit.ts --diff` | Compare current state to previous audit, surface only changes |

## Tools

| Tool | Purpose |
|------|---------|
| `tools/audit.ts` | Full audit — markdown report with all findings |
| `tools/audit-summary.ts` | Quick check — single status line, exit code reflects severity |

## Usage

```bash
# Full audit (saves to audit-history + prints markdown)
bun ~/.claude/skills/PAIAudit/tools/audit.ts

# Quick summary line (used by TelegramStatus)
bun ~/.claude/skills/PAIAudit/tools/audit-summary.ts

# Diff against last week's audit
bun ~/.claude/skills/PAIAudit/tools/audit.ts --diff
```

## Severity

- **CRITICAL** — exposed secrets, world-writable config, broken file perms on tokens
- **HIGH** — unpinned external skill repos, agents with full `*` access, unknown MCP servers
- **MEDIUM** — symlink target drifted since last audit, new agents/skills added
- **LOW** — settings file warnings, cosmetic config issues
- **INFO** — counts and inventory snapshot

## Supply Chain Posture

External skill repos are **pinned to specific commit SHAs**, not tracking floating branches. Update procedure:
1. `cd <external-repo> && git fetch`
2. Review the diff: `git log <pinned-sha>..origin/main`
3. If safe: `git checkout <new-sha>`
4. Re-run audit to record new SHA baseline

Pinned repos:
- `~/Dev/grc-skills` (15 GRC compliance skills)
- `~/.claude/skills/claude-obsidian` (10 wiki skills)
- `~/.claude/skills/gstack` (29 engineering skills)
- `~/Dev/cve-mcp-server` (CVE/threat-intel MCP, pinned to `a78d720`)

## Schedule

- **Daily 07:00 CT**: Quick summary appended to TelegramStatus daily report
- **Weekly Monday 06:00 CT**: Full audit run + Telegram digest + Obsidian save

## Architecture

```
audit.ts (orchestrator)
  ├── checks/settings.ts      → hooks, perms, env
  ├── checks/mcp.ts           → ~/.claude.json scan
  ├── checks/supply-chain.ts  → symlinks, SHAs, drift
  ├── checks/agents.ts        → tool surface flags
  ├── checks/hooks.ts         → hook script perms
  └── report.ts               → markdown + delta vs last run
```

For now, all in `audit.ts` as one file (~300 LOC). Refactor when it grows.
