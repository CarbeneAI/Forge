# Timeline Workflow

Generate activity timelines for PAI sessions.

## Trigger

User asks about:
- "Session timeline"
- "When did I work on [topic]"
- "Activity over time"
- "Show me the history of [project]"

## Steps

### 1. Determine Scope

Extract:
- Keyword filter (optional)
- Date range
- Granularity (session, day, week)

### 2. Generate Timeline

```bash
bun ${PAI_DIR}/skills/SessionSearch/tools/SessionSearch.ts \
  --timeline \
  --date-from "2026-01-01" \
  --keyword "optional-filter" \
  --output text
```

### 3. Present Timeline

Visual timeline format:
- Chronological order
- Session markers with duration
- Key events highlighted
- Working directory context

## Example Output

```
PAI Activity Timeline
=====================

2026-01-26 (Today)
├─ 19:16 - Session started (cwd: /home/youruser)
│  ├─ 19:17 - Task: Create SessionSearch skill
│  ├─ 19:18 - Read SkillSystem.md
│  ├─ 19:19 - Write SKILL.md
│  └─ 19:25 - Session active...
│
2026-01-25
├─ 14:30 - Session (cwd: ~/PAI/.claude)
│  ├─ Worked on: Clawdbot analysis
│  ├─ Duration: 2h 15m
│  └─ Tools: 87 total
│
├─ 09:00 - Session (cwd: ~/Dev/carbene-ai-website)
│  ├─ Worked on: Website updates
│  ├─ Duration: 45m
│  └─ Tools: 34 total
│
2026-01-24
├─ 16:00 - Session (cwd: ~/PAI)
│  ├─ Worked on: Homelab updates
│  ├─ Duration: 3h 20m
│  └─ Tools: 156 total
...
```

## Timeline Views

### Daily Summary
```bash
--granularity day
```
Shows sessions per day with aggregates.

### Session Detail
```bash
--granularity session
```
Shows each session with tool breakdown.

### Weekly Overview
```bash
--granularity week
```
Shows weekly activity patterns.

## Filtering

### By keyword
```bash
--keyword "discord"
```
Only shows sessions mentioning the keyword.

### By working directory
```bash
--cwd "carbene"
```
Only shows sessions in matching directories.

### By tool
```bash
--tool "Task"
```
Only shows sessions using specific tools.
