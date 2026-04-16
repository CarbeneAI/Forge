# ServerStats Workflow

Get analytics and statistics for the Discord server.

## Trigger

User requests:
- "How many members in Discord?"
- "Discord server stats"
- "Show me the community metrics"
- "What's our Discord growth?"

## Steps

### 1. Fetch Server Info

```bash
bun ${PAI_DIR}/skills/DiscordAdmin/tools/DiscordApi.ts \
  server-stats
```

### 2. Compile Report

Gather and format:
- Total member count
- Online/offline breakdown
- Role distribution
- Channel activity (if available)
- Recent joins (if tracking)

### 3. Present Stats

```markdown
## Cyber Defense Tactics Discord Stats

**Members:** 1,234 total
- Online: 456
- Idle: 78
- DND: 23
- Offline: 677

**Subscription Tiers:**
- Free: 1,100
- Premium: 89
- Mentorship: 34
- Enterprise: 11

**Recent Activity:**
- Joined today: 5
- Joined this week: 23
- Joined this month: 87

**Top Channels (by message volume):**
1. #general-discussion
2. #free-resources
3. #wins-and-celebrations
```

## API Endpoints

```typescript
// Get guild with member count
GET /guilds/{guild_id}?with_counts=true

// Response includes:
// - approximate_member_count
// - approximate_presence_count
// - name
// - icon
// - description
```

## Role Counting

To get role member counts:

```bash
# Get all members with specific role
GET /guilds/{guild_id}/members?limit=1000

# Filter by role in response
# Note: Requires iterating through pages for large servers
```

## Caching

- Server info: Cache for 5 minutes
- Role counts: Cache for 15 minutes
- Member list: Cache for 1 hour

## Report Template

```markdown
# Discord Server Stats - {date}

## Overview
| Metric | Value |
|--------|-------|
| Total Members | {count} |
| Online Now | {online} |
| Premium Subscribers | {premium} |
| Mentorship Members | {mentorship} |
| Enterprise Members | {enterprise} |

## Growth
- Today: +{today}
- This Week: +{week}
- This Month: +{month}

## Health Indicators
- Engagement Rate: {rate}%
- Premium Conversion: {conv}%
- Retention (30-day): {ret}%
```

## Examples

### Quick Stats
```
User: "How many Discord members?"
→ "1,234 members (456 online)"
```

### Full Report
```
User: "Give me a Discord analytics report"
→ Returns full formatted report with:
   - Member counts
   - Role distribution
   - Growth metrics
   - Activity summary
```

### Specific Metric
```
User: "How many premium subscribers in Discord?"
→ "89 members have the Premium role"
```
