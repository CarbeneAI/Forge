# SendStatus Workflow

Send current PAI system status to Telegram immediately.

## Trigger Phrases

- "Send status to Telegram"
- "Send PAI status update"
- "Telegram status check"
- "Update me on Telegram"

## Prerequisites

1. Telegram bot token configured in `~/.claude/.env`
2. Telegram chat ID configured in `~/.claude/.env`
3. Bot must be started (user must send /start to bot)

## Workflow Steps

### 1. Verify Configuration

```bash
# Check that credentials are configured
grep TELEGRAM_BOT_TOKEN ~/.claude/.env
grep TELEGRAM_CHAT_ID ~/.claude/.env
```

### 2. Execute Status Send

```bash
# Run the status sender tool
bun ~/.claude/skills/TelegramStatus/tools/send-status.ts
```

### 3. Confirm Delivery

Check that:
- Tool reports success in output
- User receives message in Telegram chat
- Message contains current timestamp
- Status checks are accurate

## Expected Output

**Console:**
```json
{
  "success": true,
  "timestamp": "2025-12-13T17:00:00.000Z",
  "message": "Status sent to Telegram"
}
```

**Telegram Message:**
```
PAI System Status
PAI | 2025-12-13 17:00 CST

✅ CORE context loaded - System identity active
✅ Telegram integration - Connected
✅ Claude Code API - Responding
✅ Skills system - 30+ skills available
✅ Agent system - Ready for delegation
✅ History system - Capturing context

Quick Check:
- Session initialized successfully
- Hooks operational
- Voice server available
- Observability dashboard ready to launch
- Git workflow configured

All systems operational. Ready to assist.
```

## Error Handling

### Missing Credentials

**Error:** "TELEGRAM_BOT_TOKEN not found"

**Solution:**
1. Check `~/.claude/.env` file exists
2. Verify TELEGRAM_BOT_TOKEN is set
3. Ensure no quotes around token value

### Bot Not Started

**Error:** "Telegram API error: Forbidden: bot can't initiate conversation"

**Solution:**
1. Open Telegram
2. Find your bot by name
3. Send /start command to bot
4. Retry status send

### Invalid Chat ID

**Error:** "Telegram API error: Bad Request: chat not found"

**Solution:**
1. Verify TELEGRAM_CHAT_ID in .env
2. Get correct ID from @userinfobot
3. Ensure chat ID is numeric (no quotes)

## Manual Execution

To send status manually from command line:

```bash
# From anywhere
bun ~/.claude/skills/TelegramStatus/tools/send-status.ts

# Or with explicit environment
TELEGRAM_BOT_TOKEN=your_token \
TELEGRAM_CHAT_ID=your_id \
bun ~/.claude/skills/TelegramStatus/tools/send-status.ts
```

## Integration with Other Skills

This workflow can be called from:
- CORE skill (system health checks)
- Observability skill (alert notifications)
- Custom hooks (event-driven notifications)

## Related Workflows

- **ScheduleDaily** - Set up automated 7 AM status updates
