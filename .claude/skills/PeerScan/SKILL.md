---
name: PeerScan
description: Scan GitHub PR activity for engineering team assessment. USE WHEN user mentions peer scan, PR scan, GitHub activity, team assessment, engineering review, OR developer performance evidence. Generates structured reports from GitHub PR data.
---

# PeerScan

Scans a GitHub user's pull request history for a repository and generates a structured evidence report useful for engineering team assessments, consulting engagements, and performance reviews.

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **Scan** | "scan PRs", "peer scan", "review activity" | `workflows/Scan.md` |

## Examples

**Example 1: Scan a developer's PR history**
```
User: "Scan @johndoe's PRs in acme/backend for the last 6 months"
→ Fetches all PRs via gh CLI
→ Analyzes volume, themes, quality signals
→ Generates structured report
→ Saves to Obsidian vault
```

**Example 2: Client team assessment**
```
User: "Assess the engineering activity for the 3 senior devs at client X"
→ Launches parallel PeerScan agents per developer
→ Generates comparison report
→ Identifies strengths and growth areas
```
