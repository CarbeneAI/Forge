# Paperclip Inspiration Reference

## Source

[paperclipai/paperclip](https://github.com/paperclipai/paperclip) — MIT licensed, open-source orchestration for zero-human companies. 35K stars in 25 days (as of 2026-03-27).

## What We Cherry-Picked

| Paperclip Feature | PAI Implementation | Key Difference |
|---|---|---|
| Per-agent budget tracking with monthly limits | `config/budgets.yml` + `tools/BudgetReport.ts` | File-based YAML config vs PostgreSQL |
| Board approval gates with governance policies | `config/approvals.yml` + `tools/ApprovalGate.ts` | Telegram-based vs web UI |
| Goal ancestry (every task traces to a company goal) | `goals/goals.yml` + `tools/GoalManager.ts` | Injectable context blocks for agent prompts |
| Org chart visualization (SVG rendering) | `tools/OrgChart.ts` | Mermaid output vs custom SVG |
| Heartbeat engine (scheduled agent polling) | `config/standing-orders.yml` + `tools/StandingOrders.ts` | Cron-based vs built-in scheduler |
| Company export/import (portable configs) | `tools/ConfigExport.ts` + `tools/ConfigImport.ts` | Sanitized tarballs vs JSON bundles |
| Multi-company isolation | `config/workspaces.yml` | Logical grouping vs database isolation |
| Atomic task checkout (409 Conflict) | `tools/TaskLock.ts` | File-based locks vs database transactions |

## What We Didn't Take

- **Web server + React UI** — PAI is CLI-first; we don't need a persistent web process
- **PostgreSQL database** — File-based state is simpler, portable, and git-trackable
- **Multi-user auth** — PAI is single-user personal infrastructure
- **Plugin SDK** — PAI's skill system already provides extensibility
- **Adapter system** — PAI agents are already adapter-agnostic via Claude Code's Task tool
- **pnpm** — PAI uses Bun exclusively

## Design Decisions

1. **YAML over database** — Configs are human-readable, git-trackable, and don't require a running service
2. **Telegram over web UI** — The user already has Telegram bot infrastructure; approvals via mobile are faster than opening a dashboard
3. **Mermaid over custom SVG** — Mermaid is a standard, renders anywhere (GitHub, Obsidian, VS Code), and doesn't need a browser
4. **Cron over heartbeat engine** — Standing orders sync to system cron rather than requiring a persistent process
5. **File locks over database transactions** — Simple, no dependencies, works across Claude Code sessions

## Future Integration Possibilities

If Paperclip stabilizes (post-v1.0), a `pai_local` adapter could be built to let Paperclip dispatch to PAI's agent infrastructure. This would give us Paperclip's dashboard while keeping PAI's execution model.
