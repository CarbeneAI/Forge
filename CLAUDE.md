# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## Repository Overview

**Forge by CarbeneAI** is an open-source AI operations platform built on Claude Code. It provides skills-based architecture, specialized agent personalities, event-driven automation, and automatic work capture.

## Technology Stack

| Component | Technology | Notes |
|-----------|-----------|-------|
| **Runtime** | Bun | NOT Node.js |
| **Language** | TypeScript | Primary language for hooks and tools |
| **Package Manager** | Bun | NOT npm/yarn/pnpm |
| **Platform** | Claude Code | All features built around Claude Code's hooks and skills system |

## Directory Structure

```
~/Forge/
├── .claude/
│   ├── settings.json          # Configuration (PAI_DIR, DA name, env vars)
│   ├── .env                   # API keys (never committed)
│   ├── hooks/                 # Event-driven automation (TypeScript)
│   │   ├── initialize-session.ts
│   │   ├── capture-all-events.ts
│   │   ├── capture-tool-output.ts
│   │   ├── stop-hook.ts
│   │   └── lib/pai-paths.ts   # Centralized path resolution
│   ├── skills/                # ~125 domain-specific capabilities
│   │   ├── CORE/              # Identity, architecture, principles
│   │   ├── Fabric/            # 248 native AI patterns
│   │   ├── Research/          # Multi-source research workflows
│   │   ├── Private/           # Local Ollama privacy routing
│   │   ├── Observability/     # Real-time agent monitoring dashboard
│   │   └── [90+ more]/
│   ├── agents/                # Specialized agent configs
│   ├── history/               # Automatic work capture (gitignored)
│   └── tools/                 # System utilities
├── scripts/
│   ├── setup-new-machine.sh   # Initial setup
│   └── pai-aliases.sh         # Shell aliases
├── docs/                      # Guides and references
├── CLAUDE.md                  # This file
└── README.md
```

## Common Commands

```bash
# Initial setup on new machine
bash ~/Forge/scripts/setup-new-machine.sh

# Verify configuration
forge-check

# Run health check
forge-test

# List all skills / agents
forge-skills
forge-agents
```

## Architecture Principles

1. **Scaffolding > Model** — System architecture matters more than the AI model
2. **Code Before Prompts** — Write code, use prompts to orchestrate
3. **UNIX Philosophy** — Do one thing well, compose through interfaces
4. **CLI as Interface** — Every operation accessible via command line

Full philosophy: [`.claude/skills/CORE/CONSTITUTION.md`](.claude/skills/CORE/CONSTITUTION.md)

## Skills System

Skills are self-contained AI capability packages that activate automatically based on trigger words.

### Skill Structure (MANDATORY)

```
skills/SkillName/
├── SKILL.md              # Definition with YAML frontmatter and USE WHEN triggers
├── workflows/            # Step-by-step procedures (TitleCase.md)
├── reference/            # Deep-dive documentation (TitleCase.md)
└── tools/                # CLI utilities (TitleCase.ts)
```

### Key Skills

| Category | Skills |
|----------|--------|
| **Core** | CORE, Fabric (248 patterns), Research, Observability |
| **Security** | OSINT, RedTeam, pentest-workflow, Ffuf, WazuhDashboard, CSO, CybersecurityPlaybooks (24 ATT&CK playbooks) |
| **Development** | DevTeam, CodingAgent, CreateCLI, test-driven-development |
| **Business** | ceo-advisor, cto-advisor, cfo-advisor, pricing, mvp, validate-idea |
| **Privacy** | Private (local Ollama routing), OllamaResearcher |
| **Documents** | pdf-processing-pro, xlsx, MarkItDown, Obsidian |

## Agent System

Specialized AI personalities in `.claude/agents/` with biblical names:

| Agent | Role | Model |
|-------|------|-------|
| **Bezalel** | Software architecture, PRDs | sonnet |
| **Hiram** | Software engineering, implementation | sonnet |
| **Miriam** | UI/UX design | sonnet |
| **Nehemiah** | Security auditing, OWASP | opus |
| **Daniel** | Compliance (SOX, GDPR, HIPAA) | opus |
| **Ehud** | Penetration testing | sonnet |
| **Gideon** | Incident response | opus |
| **Solomon** | Code reviews, mentoring | sonnet |
| **Deborah** | Critical thinking | sonnet |

## Hooks System

Event-driven TypeScript automation executed via Bun:

| Hook | Event | Purpose |
|------|-------|---------|
| `initialize-session.ts` | SessionStart | Load context and environment |
| `capture-all-events.ts` | PreToolUse | Log tool invocations |
| `capture-tool-output.ts` | PostToolUse | Capture tool results |
| `capture-session-summary.ts` | SessionEnd | Preserve session learnings |
| `stop-hook.ts` | Stop | Capture context on stop |
| `context-compression-hook.ts` | PreCompact | Manage context compression |

## Environment Configuration

### settings.json

```json
{
  "env": {
    "PAI_DIR": "/home/you/.claude",
    "DA": "Forge",
    "CLAUDE_CODE_MAX_OUTPUT_TOKENS": "64000"
  }
}
```

- `PAI_DIR` — Absolute path to `.claude` directory (machine-specific, auto-configured by setup script)
- `DA` — Digital Assistant name
- `CLAUDE_CODE_MAX_OUTPUT_TOKENS` — Max response length

### API Keys (.env)

All API keys go in `~/.claude/.env` (gitignored). See `.env.example` for the full list.

## File Naming Conventions

- **Skills/Workflows/Tools:** TitleCase (e.g., `CreateSkill.md`, `UpdateInfo.md`)
- **Main skill file:** Always `SKILL.md` (uppercase)
- **Configuration:** lowercase (e.g., `settings.json`, `.env`)

## Mandatory Response Format

Task-based responses use this structured format:

```
SUMMARY: [One sentence]
ANALYSIS: [Key findings]
ACTIONS: [Steps taken]
RESULTS: [Outcomes]
STATUS: [Current state]
CAPTURE: [Context to preserve]
NEXT: [Recommended next steps]
STORY EXPLANATION:
1-8. [Key points]
COMPLETED: [12 words max]
```

## Fabric Patterns

248+ patterns run **natively** within Claude Code (no CLI spawning). Only use `fabric` CLI for YouTube transcripts (`-y`) or pattern updates (`-U`).

## Security Protocols

1. Never commit `.env` files
2. `.env` is gitignored by default
3. Rotate API keys regularly
4. Use minimum required permissions for each API key
5. All code changes pass through Nehemiah (security auditor) in DevTeam workflow

## Creating a New Skill

```bash
forge-new-skill MySkill
# Or: "Create a new skill for [purpose]"
```

See `.claude/skills/CORE/SkillSystem.md` for the canonical guide.

## Troubleshooting

### Hook Failures

If hooks fail with "No such file or directory":
1. Check `PAI_DIR` in `.claude/settings.json`
2. Ensure it's an absolute path
3. Run: `bash ~/Forge/scripts/setup-new-machine.sh`

### PATH Issues on WSL

If `bun` or `claude` commands aren't found after setup:
```bash
source ~/.bashrc
```
