---
name: TelegramStatus
description: Send PAI system status updates to Telegram with on-demand or scheduled delivery. USE WHEN user says 'send status to telegram', 'telegram update', 'schedule daily telegram', 'setup telegram cron', or requests PAI status notifications via Telegram. Includes system health checks, formatted messages with timestamps, and automated 7 AM daily updates.
---

# TelegramStatus

Send PAI system status updates to Telegram, either on-demand or via scheduled cron jobs.

## Capabilities

- **On-Demand Status**: Send current system health check to Telegram
- **Scheduled Updates**: 7 AM daily status report (Central Time)
- **System Health**: Checks CORE, skills, agents, hooks, voice server, observability
- **Formatted Messages**: Clean, emoji-formatted status with timestamp

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **SendStatus** | "send status to telegram", "telegram update" | `workflows/SendStatus.md` |
| **ScheduleDaily** | "schedule daily telegram", "setup telegram cron" | `workflows/ScheduleDaily.md` |

## Tools

| Tool | Purpose | File |
|------|---------|------|
| **send-status.ts** | Send PAI status to Telegram with datetime | `tools/send-status.ts` |

## Usage Examples

**Example 1: Send status on demand**
```
User: "Send PAI status to Telegram"
→ Executes send-status.ts
→ Sends formatted status message to configured Telegram chat
→ Confirms delivery
```

**Example 2: Schedule daily updates**
```
User: "Set up daily Telegram status at 7 AM"
→ Creates cron job
→ Configures 7 AM Central Time execution
→ Tests cron configuration
→ Confirms scheduled task
```

## Configuration

Telegram credentials stored in `~/.claude/.env`:
- `TELEGRAM_BOT_TOKEN` - Bot token from @BotFather
- `TELEGRAM_CHAT_ID` - Your chat ID from @userinfobot

## Architecture

```
User Request
    ↓
Workflow (SendStatus.md)
    ↓
CLI Tool (send-status.ts)
    ↓
Telegram Bot API
    ↓
User's Telegram Chat
```

## Status Message Format

```
PAI System Status
[System Name] | [Date] [Time] CST

[Status emoji] CORE context loaded - System identity active
[Status emoji] Telegram integration - Connected
[Status emoji] Claude Code API - Responding
[Status emoji] Skills system - [N]+ skills available
[Status emoji] Agent system - Ready for delegation
[Status emoji] History system - Capturing context

Quick Check:
- Session initialized
- All hooks operational
- Voice server [status]
- Observability dashboard [status]
- Git workflow configured

[Timestamp footer]
```

## Related Skills

- **CORE** - System identity and health checks
- **Observability** - Real-time monitoring dashboard

## Version History

- **v1.0** (2025-12-13): Initial implementation with on-demand and scheduled updates
