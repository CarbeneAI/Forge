# TelegramStatus Skill - Quick Reference

Complete PAI system status notifications via Telegram.

## What This Skill Does

- ✅ Sends formatted PAI status updates to your Telegram chat
- ✅ On-demand status checks (run anytime)
- ✅ Automated daily updates (7:00 AM Central Time)
- ✅ Cross-platform (Linux and macOS)
- ✅ Reusable pattern for other skills

## Quick Start

### 1. Verify Setup

```bash
# Check credentials are configured
grep TELEGRAM ~/PAI/.claude/.env

# Test manual send
cd ~/PAI/.claude/skills/TelegramStatus/tools
bun send-status.ts
```

### 2. Use Cases

**Send status now**:
```bash
bun ~/.claude/skills/TelegramStatus/tools/send-status.ts
```

**Check scheduled updates**:
```bash
# Linux
crontab -l | grep telegram-status

# macOS
launchctl list | grep telegram-status
```

**View logs**:
```bash
tail -f ~/.claude/logs/telegram-status.log
```

## File Structure

```
TelegramStatus/
├── SKILL.md                      # Main skill definition
├── README.md                     # This file
├── TelegramIntegration.md        # Reusable integration patterns
├── MacSetup.md                   # macOS setup guide
├── tools/
│   └── send-status.ts           # CLI tool for sending status
└── workflows/
    ├── SendStatus.md            # On-demand workflow
    └── ScheduleDaily.md         # Scheduling workflow
```

## Key Files

### For Daily Use

- **send-status.ts** - The CLI tool (path: `~/.claude/skills/TelegramStatus/tools/send-status.ts`)
- **telegram-status.log** - Execution logs (path: `~/.claude/logs/telegram-status.log`)
- **.env** - Credentials (path: `~/.claude/.env`)

### For Reference

- **TelegramIntegration.md** - Copy patterns from here to add Telegram to other skills
- **MacSetup.md** - Follow this guide for Mac Studio and MacBook Pro setup
- **SKILL.md** - Full skill documentation and capabilities

## Reusable Integration Path

**The path to remember**: `~/.claude/skills/TelegramStatus/tools/send-status.ts`

**To integrate Telegram into other skills**:

1. Read `TelegramIntegration.md` for complete patterns
2. Use same credentials from `~/.claude/.env`:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
3. Copy the `sendToTelegram()` function from `send-status.ts`
4. Format your message (Markdown supported)
5. Call the function to send

**Quick example**:
```typescript
// In your new skill's tool
async function sendToTelegram(message: string): Promise<void> {
  // Copy implementation from TelegramStatus/tools/send-status.ts
}

// Use it
await sendToTelegram(`*Your Title*\n\nYour message here`);
```

## Cross-Machine Setup

### Current Machine (Linux)
✅ Already configured
- Cron job running (7:00 AM daily)
- Credentials in .env
- Logs to ~/.claude/logs/telegram-status.log

### Mac Studio / MacBook Pro
⏳ Follow `MacSetup.md` for complete instructions

**Quick setup**:
1. Sync PAI repo via Git
2. Copy `.env` file (not in Git)
3. Test manual execution
4. Set up launchd (macOS scheduler)
5. Verify scheduled execution

## Troubleshooting

### No message received

**Check credentials**:
```bash
grep TELEGRAM ~/.claude/.env
```

**Test bot token**:
```bash
curl https://api.telegram.org/bot<YOUR_TOKEN>/getMe
```

**Check logs**:
```bash
tail -20 ~/.claude/logs/telegram-status.log
```

### Script runs but fails

**Common issues**:
- Environment variables not loaded
- PAI_DIR incorrect
- Bun not in PATH (cron/launchd)

**Solution**: Check logs for specific error

### Wrong timezone

**Verify system timezone**:
```bash
# Linux
timedatectl

# macOS
sudo systemsetup -gettimezone
```

**Set to Central Time**:
```bash
# Linux
sudo timedatectl set-timezone America/Chicago

# macOS
sudo systemsetup -settimezone America/Chicago
```

## Documentation Index

| File | Purpose | When to Use |
|------|---------|-------------|
| **README.md** | Quick reference (this file) | Starting point, quick lookups |
| **SKILL.md** | Full skill documentation | Understanding capabilities, workflows |
| **TelegramIntegration.md** | Integration patterns | Adding Telegram to other skills |
| **MacSetup.md** | macOS setup guide | Setting up on Mac Studio/MacBook Pro |
| **SendStatus.md** | On-demand workflow | Sending status manually |
| **ScheduleDaily.md** | Scheduling workflow | Setting up automated updates |

## Quick Commands Reference

```bash
# Manual status send
bun ~/.claude/skills/TelegramStatus/tools/send-status.ts

# View cron (Linux)
crontab -l | grep telegram

# View launchd (macOS)
launchctl list | grep telegram

# Check logs
tail -f ~/.claude/logs/telegram-status.log

# Test bot token
curl https://api.telegram.org/bot<TOKEN>/getMe

# Get chat ID
# Message @userinfobot on Telegram
```

## Integration Examples

### Example 1: Research Completion Alert

```typescript
// In Research skill
const results = await doResearch(topic);
await sendToTelegram(`✅ *Research Complete*\n\n${results.summary}`);
```

### Example 2: Error Alert

```typescript
// In any skill
try {
  await criticalOperation();
} catch (error) {
  await sendToTelegram(`❌ *Error*\n\n\`\`\`\n${error.message}\n\`\`\``);
  throw error;
}
```

### Example 3: Daily Report

```typescript
// In scheduled task
const stats = await gatherStats();
await sendToTelegram(`📊 *Daily Stats*\n\nTasks: ${stats.tasks}\nErrors: ${stats.errors}`);
```

## Version History

- **v1.0** (2025-12-13): Initial implementation
  - On-demand status updates
  - Scheduled daily updates (7 AM CST)
  - Linux (cron) and macOS (launchd) support
  - Comprehensive documentation
  - Reusable integration patterns

## Need Help?

1. **Check logs**: `tail -f ~/.claude/logs/telegram-status.log`
2. **Read docs**: Start with this README, then SKILL.md
3. **Test manually**: Run `send-status.ts` directly
4. **Review patterns**: See `TelegramIntegration.md`
5. **Ask Claude Code**: "Help me debug TelegramStatus"

---

**Created**: 2025-12-13
**Machine**: Linux (working), macOS (documented for setup)
**Status**: Production ready
