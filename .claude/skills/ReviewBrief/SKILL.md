---
name: ReviewBrief
description: Generate performance review documents from evidence sources. USE WHEN user mentions review brief, performance review, self-review, team assessment, OR brag doc compilation. Produces manager-ready or peer-style review documents.
---

# ReviewBrief

Generates structured performance review documents by synthesizing evidence from multiple sources: brag docs, PR history, project notes, and Obsidian vault content.

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **Generate** | "generate review", "review brief", "self-review" | `workflows/Generate.md` |

## Examples

**Example 1: Self-review for Your Name**
```
User: "Generate a self-review brief for Q1 2026"
→ Searches Obsidian vault for wins, projects, decisions
→ Searches PAI session history for completed work
→ Generates structured review document
```

**Example 2: Client team member assessment**
```
User: "Generate a review brief for John Smith based on his peer scan and project notes"
→ Reads peer scan report
→ Cross-references with project documentation
→ Generates assessment document
```
