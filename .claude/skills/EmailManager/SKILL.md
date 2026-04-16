---
name: EmailManager
description: |
  Intelligent email management for Gmail accounts with spam filtering and Telegram notifications.
  USE WHEN user mentions email monitoring, check emails, email spam, email digest, email notifications,
  OR wants to manage Gmail accounts, filter spam, or get email alerts via Telegram.
agent: Philemon
---

# EmailManager

Intelligent email management system for PAI that monitors Gmail accounts (personal + workspace), filters spam/phishing with 4-layer detection, and surfaces legitimate emails via Telegram notifications.

## Agent: Philemon

Biblical character who received Paul's most important personal letter — a masterclass in diplomatic communication and message handling. Perfect for an email management agent.

## Architecture

```
Gmail API (Personal) ─┐
                      ├→ EmailMonitor.ts → SpamFilter.ts → Telegram Notification
Gmail API (Workspace) ─┘
```

- **Auth**: OAuth2 with encrypted refresh tokens
- **Polling**: Every 2 minutes via systemd service on your host machine
- **Storage**: JSON files in `data/` (gitignored)
- **Notifications**: Telegram (reuses existing PAI bot)

## Quick Start

### 1. Setup OAuth (one-time per account)

```bash
# Personal Gmail
bun ~/.claude/skills/EmailManager/tools/OAuth2Setup.ts --account personal

# Workspace Gmail
bun ~/.claude/skills/EmailManager/tools/OAuth2Setup.ts --account workspace
```

### 2. Test Gmail Access

```bash
# List unread emails
bun ~/.claude/skills/EmailManager/tools/GmailClient.ts list --account personal --query "is:unread" --max 5
```

### 3. Test Spam Filter

```bash
# Analyze a specific message
bun ~/.claude/skills/EmailManager/tools/SpamFilter.ts analyze --account personal --message-id <id>
```

### 4. Run Monitor (manual)

```bash
# Dry run - no notifications
bun ~/.claude/skills/EmailManager/tools/EmailMonitor.ts --once --dry-run

# Single run with notifications
bun ~/.claude/skills/EmailManager/tools/EmailMonitor.ts --once

# Daemon mode
bun ~/.claude/skills/EmailManager/tools/EmailMonitor.ts --daemon
```

### 5. Service Management (Linux host)

```bash
~/.claude/skills/EmailManager/tools/manage.sh start
~/.claude/skills/EmailManager/tools/manage.sh status
~/.claude/skills/EmailManager/tools/manage.sh stop
```

## Priority Gate System (Phase 4)

For high-volume inboxes (300+ emails/day), the Priority Gate drastically reduces Telegram noise by scoring emails on "decision required" probability.

### Tier System

| Tier | Criteria | Action |
|------|----------|--------|
| **Tier 1 (Immediate)** | VIP sender OR (urgent category + decision score > 70) | Telegram notification |
| **Tier 2 (Daily Review)** | action_needed category OR decision score 40-70 | Daily digest only |
| **Tier 3 (Auto-Archive)** | Everything else | Silent, no notification |

**Expected result for 300+ emails/day:**
- Tier 1: ~3-5 Telegram notifications/day
- Tier 2: ~10-20 emails in daily digest
- Tier 3: ~280+ auto-archived

### Configuration

```bash
# Show current config
bun ~/.claude/skills/EmailManager/tools/PriorityGate.ts config

# Analyze specific email
bun ~/.claude/skills/EmailManager/tools/PriorityGate.ts tier --account personal --message-id <id>
```

### Tuning

Edit `data/email-config.json` to adjust:
- `priorityGate.tier1Threshold` (default: 70)
- `priorityGate.tier2Threshold` (default: 40)
- `priorityGate.vipAlwaysTier1` (default: true)
- `priorityGate.urgentCategoriesForTier1` (default: ["urgent", "action_needed"])

## Spam Filter - 4 Layers

| Layer | Weight | Checks |
|-------|--------|--------|
| **Auth Headers** | 0.4 | SPF, DKIM, DMARC pass/fail from `Authentication-Results` |
| **Sender Reputation** | 0.2 | Known vs unknown sender, domain analysis |
| **Content Analysis** | 0.2 | Suspicious URLs, urgency language, display name mismatch |
| **AI Analysis** | 0.2 | Claude Haiku spam probability scoring |

**Scoring**: Weighted average 0-100
- `>80` = Spam (auto-filtered)
- `50-80` = Suspicious (flagged, still delivered)
- `<50` = Legitimate (delivered normally)

## Email Categories (Phase 2)

| Category | Priority | Description |
|----------|----------|-------------|
| `urgent` | 100 | Time-sensitive, requires immediate attention |
| `action_needed` | 80 | Requires response or action |
| `direct` | 70 | Personal emails directly addressed to you |
| `contact_form` | 65 | Website contact form submissions |
| `fyi` | 40 | Informational only |
| `receipt` | 30 | Purchase/shipping confirmations |
| `newsletter` | 20 | Subscribed content, bulk mail |

Categorization uses heuristics first (subject patterns, sender analysis), then Claude Haiku for ambiguous cases.

## Daily Digest (Phase 2)

Daily summary sent to Telegram at 6 PM CST:
- Total emails processed
- Category breakdown
- VIP emails highlighted
- Urgent/action items listed
- Spam blocked count

```bash
# Generate and send today's digest
bun ~/.claude/skills/EmailManager/tools/DailyDigest.ts --today --send-telegram

# Preview without sending
bun ~/.claude/skills/EmailManager/tools/DailyDigest.ts --today --dry-run
```

Cron: `0 0 * * *` (midnight UTC = 6 PM CST, adjust for your timezone)

## Data Directory

```
data/
├── oauth-tokens.json          # Encrypted OAuth refresh tokens
├── email-state.json           # Last processed message IDs
├── inbox/YYYY-MM/             # Processed email metadata
├── spam-log/YYYY-MM-DD.jsonl  # Spam filter decisions
└── digests/YYYY-MM-DD.md      # Daily digests (Phase 2)
```

All data is gitignored. Tokens encrypted with AES-256-GCM.

## Environment Variables

Required in `~/.claude/.env`:

```bash
GMAIL_CLIENT_ID=xxxx.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-xxxx
GMAIL_REDIRECT_URI=http://localhost:8888/oauth2callback
EMAIL_ENCRYPTION_KEY=<32-byte-hex>
GMAIL_PERSONAL_EMAIL=your@gmail.com
GMAIL_WORKSPACE_EMAIL=your@workspace.com
```

## Telegram Notifications

Legitimate emails trigger Telegram notifications with:
- Sender name and email
- Subject line
- Category (if categorized)
- 200-char preview
- Direct Gmail link

## Response & Scheduling (Phase 3)

### Draft Email Replies

```bash
# Draft a reply with intent
bun ~/.claude/skills/EmailManager/tools/ResponseDrafter.ts draft --account personal --message-id <id> --intent "politely decline"

# Draft with specific tone
bun ~/.claude/skills/EmailManager/tools/ResponseDrafter.ts draft --account personal --message-id <id> --tone friendly

# Send a drafted reply (requires user approval)
bun ~/.claude/skills/EmailManager/tools/ResponseDrafter.ts send --account personal --message-id <id> --draft "Your draft text..."

# Get quick reply suggestions
bun ~/.claude/skills/EmailManager/tools/ResponseDrafter.ts quick --account personal --message-id <id>
```

### Calendar Management

```bash
# List upcoming events
bun ~/.claude/skills/EmailManager/tools/CalendarClient.ts list --account personal --days 7

# Find available slots
bun ~/.claude/skills/EmailManager/tools/CalendarClient.ts available --account personal --start "2026-02-10" --end "2026-02-14" --duration 30

# Create a meeting
bun ~/.claude/skills/EmailManager/tools/CalendarClient.ts create --account personal --title "Meeting" --start "2026-02-10T10:00:00" --duration 60

# Check free/busy
bun ~/.claude/skills/EmailManager/tools/CalendarClient.ts freebusy --account personal --start "2026-02-10T09:00:00" --end "2026-02-10T17:00:00"
```

### Meeting Scheduling

```bash
# Parse meeting request from email
bun ~/.claude/skills/EmailManager/tools/MeetingScheduler.ts parse --account personal --message-id <id>

# Full workflow: parse, find slots, prepare response
bun ~/.claude/skills/EmailManager/tools/MeetingScheduler.ts process --account personal --message-id <id>

# Schedule from a slot
bun ~/.claude/skills/EmailManager/tools/MeetingScheduler.ts schedule --account personal --message-id <id> --slot 0 --send-invite
```

### OAuth Scope Upgrade (Required for Phase 3)

Phase 3 requires additional scopes. Re-run OAuth setup for each account:

```bash
bun ~/.claude/skills/EmailManager/tools/OAuth2Setup.ts --account personal
bun ~/.claude/skills/EmailManager/tools/OAuth2Setup.ts --account workspace
```

New scopes added:
- `gmail.modify` - Modify message labels
- `gmail.send` - Send emails
- `calendar.readonly` - Read calendar events
- `calendar.events` - Create/modify calendar events

## Phases

| Phase | Status | Features |
|-------|--------|----------|
| **1. Foundation** | Complete | OAuth, Gmail API, SpamFilter, Monitor, Telegram buttons |
| **2. Smart Inbox** | Complete | EmailCategorizer, DailyDigest, priority scoring |
| **3. Respond** | Complete | ResponseDrafter, CalendarClient, MeetingScheduler |
| **4. Priority Gate** | Complete | Decision scoring, 3-tier system, reduced Telegram noise |

## Workflows

| Workflow | File | Purpose |
|----------|------|---------|
| Monitor | `workflows/Monitor.md` | Email monitoring workflow |
| Respond | `workflows/Respond.md` | Response drafting workflow |
| Schedule | `workflows/Schedule.md` | Meeting scheduling workflow |

## Tools

| Tool | Purpose |
|------|---------|
| `OAuth2Setup.ts` | One-time OAuth browser flow (Phase 3 scopes) |
| `GmailClient.ts` | Gmail API wrapper (list, get, send, labels) |
| `SpamFilter.ts` | 4-layer spam detection |
| `EmailCategorizer.ts` | Smart categorization (urgent, action_needed, fyi, etc.) |
| `EmailMonitor.ts` | Polling daemon with spam + category + priority gate |
| `DailyDigest.ts` | End-of-day summary with Tier 2 emails to Telegram |
| `EmailConfig.ts` | Tune thresholds and lists |
| `PriorityGate.ts` | Decision scoring, tier determination for high-volume inboxes |
| `ResponseDrafter.ts` | Draft replies with Claude Sonnet |
| `CalendarClient.ts` | Google Calendar API (events, freebusy, available) |
| `MeetingScheduler.ts` | Parse meeting requests, suggest times, schedule |
| `manage.sh` | Service start/stop/restart |

## Service Deployment

Runs as systemd service (example for Linux host):

```bash
# Install service
sudo cp ~/.claude/skills/EmailManager/linux-service/emailmanager.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable emailmanager
sudo systemctl start emailmanager
```

## Security

- OAuth tokens encrypted with AES-256-GCM
- Email bodies never logged (200 char preview max)
- `data/` directory gitignored
- Response drafts require user approval before sending
- File permissions: `chmod 600 data/oauth-tokens.json`

### OAuth Scopes by Phase

| Phase | Scopes |
|-------|--------|
| 1-2 | `gmail.readonly`, `userinfo.email` |
| 3 | + `gmail.modify`, `gmail.send`, `calendar.readonly`, `calendar.events` |
