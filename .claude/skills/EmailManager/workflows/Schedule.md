# Schedule Workflow

Parse meeting requests and schedule meetings with calendar integration.

## Overview

This workflow handles meeting scheduling from email requests:
1. Detect meeting requests in emails
2. Find available time slots
3. Propose times to the requester
4. Create calendar events

## Steps

### 1. Parse Meeting Request

Detect if an email is a meeting request:

```bash
bun ~/.claude/skills/EmailManager/tools/MeetingScheduler.ts parse \
  --account <account> \
  --message-id <id>
```

Returns:
- `isMeetingRequest`: true/false
- `suggestedDuration`: Detected meeting length (30, 45, 60, 90 min)
- `preferredTimeframe`: When they want to meet
- `topic`: Meeting topic if mentioned
- `urgency`: How urgent the request is

### 2. Find Available Slots

Get available times from your calendar:

```bash
bun ~/.claude/skills/EmailManager/tools/MeetingScheduler.ts suggest \
  --account <account> \
  --duration 30 \
  --start "2026-02-10" \
  --end "2026-02-14" \
  --max-slots 5
```

Returns time slots with formatted display strings.

### 3. Full Workflow (Parse + Suggest + Draft Response)

For end-to-end processing:

```bash
bun ~/.claude/skills/EmailManager/tools/MeetingScheduler.ts process \
  --account <account> \
  --message-id <id>
```

Returns:
- Parsed meeting request
- Available slots
- Pre-drafted response email

### 4. Send Proposed Times

After reviewing available slots:

```bash
bun ~/.claude/skills/EmailManager/tools/MeetingScheduler.ts respond \
  --account <account> \
  --message-id <id> \
  --slots "2026-02-10T10:00,2026-02-10T14:00,2026-02-11T09:00" \
  --tone professional
```

Sends an email proposing the specified times.

### 5. Schedule Meeting

Once a time is confirmed:

```bash
bun ~/.claude/skills/EmailManager/tools/MeetingScheduler.ts schedule \
  --account <account> \
  --message-id <id> \
  --slot 0 \
  --title "Custom title (optional)" \
  --send-invite
```

Creates calendar event and optionally sends invite.

## Calendar Management

### List Upcoming Events

```bash
bun ~/.claude/skills/EmailManager/tools/CalendarClient.ts list \
  --account <account> \
  --days 7
```

### Find Available Times

```bash
bun ~/.claude/skills/EmailManager/tools/CalendarClient.ts available \
  --account <account> \
  --start "2026-02-10" \
  --end "2026-02-14" \
  --duration 30 \
  --max-slots 10
```

### Check Free/Busy

```bash
bun ~/.claude/skills/EmailManager/tools/CalendarClient.ts freebusy \
  --account <account> \
  --start "2026-02-10T09:00:00" \
  --end "2026-02-10T17:00:00"
```

### Create Event Directly

```bash
bun ~/.claude/skills/EmailManager/tools/CalendarClient.ts create \
  --account <account> \
  --title "Meeting Title" \
  --start "2026-02-10T10:00:00" \
  --duration 60 \
  --location "Zoom" \
  --attendees "user@example.com" \
  --send-updates
```

## Example: Full Meeting Scheduling Flow

```bash
# 1. Check if email is a meeting request
bun MeetingScheduler.ts parse --account personal --message-id abc123
# Output: isMeetingRequest: true, suggestedDuration: 30

# 2. Get the full workflow processing
bun MeetingScheduler.ts process --account personal --message-id abc123
# Output: available slots and draft response

# 3. Review and send proposed times
bun MeetingScheduler.ts respond --account personal --message-id abc123 \
  --slots "2026-02-10T10:00,2026-02-11T14:00,2026-02-12T09:00"

# 4. Once they confirm, schedule it
bun MeetingScheduler.ts schedule --account personal --message-id abc123 \
  --slot 0 --send-invite
```

## Working Hours

By default, available slots are found within:
- **Hours**: 9 AM - 5 PM local time
- **Days**: Weekdays only (Mon-Fri)

To customize:
```bash
bun CalendarClient.ts available \
  --account personal \
  --start "2026-02-10" \
  --end "2026-02-14" \
  --duration 30
# Working hours configured in CalendarClient.ts (workingHoursStart/End)
```

## OAuth Requirements

Phase 3 requires calendar scopes. If you see "Calendar scopes not authorized":

```bash
bun ~/.claude/skills/EmailManager/tools/OAuth2Setup.ts --account personal
bun ~/.claude/skills/EmailManager/tools/OAuth2Setup.ts --account workspace
```

This re-authorizes with the new scopes:
- `calendar.readonly` - Read calendar
- `calendar.events` - Create/modify events
