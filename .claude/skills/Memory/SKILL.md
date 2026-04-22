---
name: Memory
description: Persistent project knowledge and context management. USE WHEN learning new facts about projects, user preferences, or environment details OR when needing to recall previously learned information. Auto-captures learnings to prevent repetition.
---

# Memory - Persistent Knowledge System

**Purpose:** Maintain persistent knowledge about projects, environments, and user preferences so you never have to repeat yourself.

## Core Principle

**If you tell me something once, I should remember it forever.**

This skill captures and organizes:
- Project-specific facts (hosting, domains, tech stack, integrations)
- Environment details (API keys locations, deployment workflows)
- User preferences (coding style, communication preferences)
- Decisions and their rationale
- Lessons learned from debugging sessions

## Memory Structure

All memories stored in `${PAI_DIR}/memory/`:

```
memory/
├── projects/           # Project-specific knowledge
│   ├── carbene-website.md
│   ├── carbene-homelab.md
│   ├── pai.md
│   └── cyberdefense-tactics.md
├── user/               # User preferences and personal info
│   └── preferences.md
└── global/             # Cross-project knowledge
    └── integrations.md
```

## Workflows

### 1. Capture Learning (Proactive)

**When to use:** Automatically after learning something new about a project or user.

```
TRIGGER: Any of these situations:
- User corrects a mistake ("It's Vercel, not Cloudflare")
- User provides new information ("The domain is carbene.ai")
- Discovering project structure or integrations
- User states a preference
- Resolving a confusing issue

ACTION:
1. Identify the memory category (project/user/global)
2. Read existing memory file (if exists)
3. Append new fact with timestamp
4. Confirm capture to user (briefly)
```

### 2. Recall Context (On Session Start)

**When to use:** At the beginning of each session, based on working directory.

```
ACTION:
1. Detect current working directory
2. Map to project memory file
3. Load relevant memories into context
4. Silently apply (no need to announce)
```

### 3. Query Memory

**When to use:** When user asks "What do you know about X?"

```
ACTION:
1. Search memory files for relevant content
2. Return organized summary
3. Offer to update if anything is outdated
```

## Memory Format

Each memory file uses this format:

```markdown
# Project: [Name]

## Quick Facts
| Key | Value |
|-----|-------|
| Domain | example.com |
| Hosting | Vercel |
| Repo | github.com/user/repo |

## Tech Stack
- Framework: Next.js 16
- Package Manager: Bun
- Styling: Tailwind CSS

## Integrations
- **Google Sheets**: Contact form and assessment data
- **Apps Script**: Email automation at `docs/google-apps-script.js`

## Key Files
- `CLAUDE.md` - Project instructions
- `.env.local` - Environment variables
- `docs/google-apps-script.js` - Email automation code

## Decisions & Rationale
- [2026-01-20] Using Vercel instead of Cloudflare Pages for easier deployment
- [2026-01-20] Assessment tracks by index not value due to duplicate scores

## Lessons Learned
- [2026-01-20] Apps Script requires NEW deployment after changes (saving isn't enough)
- [2026-01-20] carbene.ai is production, yourdomain.com is homelab/internal - never confuse

## Notes
Additional context that doesn't fit elsewhere.
```

## Directory-to-Project Mapping

| Directory Pattern | Project Memory |
|-------------------|----------------|
| `*/carbene-ai-website*` | `projects/carbene-website.md` |
| `*/homelab*` | `projects/carbene-homelab.md` |
| `*/PAI*` or `*/.claude*` | `projects/pai.md` |
| `*/cyberdefense*` | `projects/cyberdefense-tactics.md` |

## Auto-Capture Triggers

The Memory skill should automatically capture when:

1. **Correction detected**: User says "no", "actually", "it's not X, it's Y"
2. **New fact provided**: User shares hosting, domain, credentials location
3. **Integration discovered**: Finding how systems connect
4. **Decision made**: Choosing one approach over another
5. **Bug resolved**: Understanding why something failed

## Commands

- `/memory show [project]` - Display memories for a project
- `/memory add [project] [fact]` - Manually add a memory
- `/memory search [query]` - Search across all memories
- `/memory projects` - List all tracked projects

## Integration with Session Hooks

The `SessionStart` hook should:
1. Detect working directory
2. Load matching project memory
3. Apply context silently

The `SessionEnd` hook should:
1. Review session for new learnings
2. Prompt to capture important facts
3. Update relevant memory files

## Example Memories to Capture

**From today's session:**
- CarbeneAI website hosted on Vercel (not Cloudflare)
- Production domain: carbene.ai
- Homelab domain: yourdomain.com
- Google Apps Script in `docs/google-apps-script.js`
- Notification email: you@yourdomain.com
- Assessment has 10 questions with duplicate score values
- Apps Script requires new deployment after code changes
