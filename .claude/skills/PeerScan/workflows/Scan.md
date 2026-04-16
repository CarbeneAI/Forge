# PeerScan - Scan Workflow

## Input
- `<name>` - Person's display name
- `<github-username>` - GitHub username
- `<org/repo>` - Repository to scan
- `[period]` - Optional time period (default: "6 months ago")

## Steps

### 1. Fetch PR Data

```bash
gh pr list --repo <org>/<repo> --author <github-username> --state all --limit 200 \
  --json number,title,state,createdAt,mergedAt,additions,deletions,changedFiles,reviews,labels,body
```

Filter results to the specified period using `createdAt`.

### 2. Analyze

For each PR, extract:
- **Volume**: PR count by month, total additions/deletions
- **Themes**: Group PRs by area (features, fixes, infra, docs, tests) based on title patterns and labels
- **Quality signals**: Review comments received, change requests, reverts, test coverage mentions
- **Velocity**: Time from open to merge (median, p90)
- **Notable contributions**: Large PRs, cross-cutting changes, architecture work

### 3. Generate Report

Create a structured markdown report with YAML frontmatter:

```markdown
---
date: YYYY-MM-DD
tags: [peer-scan, assessment, <name>]
description: GitHub PR scan for <name> (<github-username>) in <org/repo>
---

# PR Scan: <Name> — <Period>

## Summary
- **Total PRs:** X (Y merged, Z open, W closed)
- **Lines changed:** +A / -B
- **Median merge time:** X hours
- **Most active month:** Month (N PRs)

## Activity by Month
| Month | PRs | Additions | Deletions |
|-------|-----|-----------|-----------|

## Themes
| Category | Count | Examples |
|----------|-------|----------|

## Quality Signals
- Review comments received: X
- Change requests: Y
- Reverts: Z

## Notable Contributions
1. PR #N - Title (significance)

## Growth Signals
- [Observations about progression, new areas, increasing scope]

## Full PR Table
| # | Title | State | Created | Merged | +/- |
|---|-------|-------|---------|--------|-----|
```

### 4. Save Report

Save to `${OBSIDIAN_VAULT_PATH}/Business/peer-scans/<Name> PRs - <Period>.md`

Create the `peer-scans/` directory if it doesn't exist.
