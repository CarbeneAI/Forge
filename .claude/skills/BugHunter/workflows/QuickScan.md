# Quick Scan Workflow

Fast triage scan for rapid vulnerability assessment. Runs Stages 1-2 only with abbreviated output. Use for PR reviews, initial assessments, or time-constrained audits.

## Prerequisites

- Target repository path or specific directory/files
- Authorization to review the code

## Execution

### Stage 1: Ingest (Abbreviated)

```
Step 1.1: Identify target scope
  - If specific files provided: use those directly
  - If directory: score and take top 50 files
  - If PR: focus on changed files only (git diff --name-only)

Step 1.2: Quick classification
  - Language and framework detection
  - Entry points identification
  - Trust boundary mapping (brief)
```

### Stage 2: Detect (Single Pass)

```
Step 2.1: Parallel analysis
  Launch parallel subagents (3-5 agents, each handling ~10 files).

  Each agent scans for:
  - OWASP Top 10 vulnerabilities
  - Language-specific dangerous patterns
  - Hardcoded secrets or credentials
  - Missing input validation
  - Insecure configuration

Step 2.2: Consolidate and deduplicate
  - Merge findings from all agents
  - Remove duplicates
  - Sort by severity (Critical > High > Medium > Low)
```

### Output

Generate a triage report:

```markdown
# BugHunter Quick Scan - [Target Name]
**Date:** YYYY-MM-DD
**Scope:** X files analyzed out of Y total
**Time:** ~N minutes

## Summary
| Severity | Count |
|----------|-------|
| Critical | X     |
| High     | X     |
| Medium   | X     |
| Low      | X     |

## Findings

### [CRITICAL] Finding Title
- **File:** path:line
- **CWE:** CWE-XXX
- **Pattern:** Brief description
- **Action:** Immediate fix needed

### [HIGH] Finding Title
...

## Recommendation
[Full scan recommended: yes/no and why]
```

## When to Upgrade to Full Scan

- Any Critical findings discovered
- More than 3 High findings
- Complex auth/crypto code detected
- Bug bounty submission planned
