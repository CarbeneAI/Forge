# ReviewBrief - Generate Workflow

## Input
- `<subject>` - Person being reviewed (name)
- `<audience>` - "manager", "peer", or "self" (changes tone and format)
- `[period]` - Time period (default: current quarter)

## Steps

### 1. Gather Evidence

Search these sources in parallel:
- **Obsidian vault**: `${OBSIDIAN_VAULT_PATH}/` — wins, decisions, project notes mentioning the subject
- **PAI session history**: `${PAI_DIR}/history/sessions/` — completed work entries
- **Peer scan reports**: `${OBSIDIAN_VAULT_PATH}/Business/peer-scans/` — PR evidence if available
- **Git history**: Recent commits and PRs if applicable

Use SemanticMemory search for efficient retrieval:
```bash
bun ${PAI_DIR}/skills/SemanticMemory/tools/SemanticSearch.ts "<subject> achievements" --limit 10 --json
```

### 2. Synthesize

Organize evidence into competency areas:
- **Technical Execution** — Code quality, architecture decisions, problem-solving
- **Impact** — Business outcomes, efficiency gains, risk mitigation
- **Leadership** — Mentoring, cross-team collaboration, initiative
- **Growth** — New skills, expanding scope, taking on challenges

### 3. Generate Document

**Manager audience format:**
- Outcome-focused language (not technical jargon)
- Impact table: What → So What → Now What
- Competency highlights with evidence
- The Arc: narrative of growth over the period
- No wikilinks (standalone document)

**Peer audience format:**
- Project-organized
- More technical detail
- Casual but substantive tone
- Include specific PR/commit references

**Self audience format:**
- First person
- Honest self-assessment
- Growth areas identified
- Goals for next period

### 4. Save Report

Save to `${OBSIDIAN_VAULT_PATH}/Business/reviews/<Subject> - <Period> Review.md`

Include YAML frontmatter:
```yaml
---
date: YYYY-MM-DD
tags: [review-brief, assessment, <subject>]
description: <Audience> review for <Subject> covering <Period>
---
```

Create the `reviews/` directory if it doesn't exist.
