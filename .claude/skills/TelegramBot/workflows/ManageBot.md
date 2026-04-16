# Manage Bot Workflow

Control the PAI Telegram Bot service.

## Quick Commands

```bash
# Start
~/.claude/skills/TelegramBot/tools/Manage.sh start

# Stop
~/.claude/skills/TelegramBot/tools/Manage.sh stop

# Restart
~/.claude/skills/TelegramBot/tools/Manage.sh restart

# Status
~/.claude/skills/TelegramBot/tools/Manage.sh status

# View logs
~/.claude/skills/TelegramBot/tools/Manage.sh logs
```

## systemd Commands (if enabled)

```bash
# Start/Stop/Restart
systemctl --user start pai-telegram-bot
systemctl --user stop pai-telegram-bot
systemctl --user restart pai-telegram-bot

# Check status
systemctl --user status pai-telegram-bot

# View logs
journalctl --user -u pai-telegram-bot -f

# Enable/Disable auto-start
systemctl --user enable pai-telegram-bot
systemctl --user disable pai-telegram-bot
```

## Log Locations

- **Main log**: `~/.claude/logs/telegram-bot.log`
- **systemd journal**: `journalctl --user -u pai-telegram-bot`

## Common Operations

### Update and Restart

After code changes:

```bash
~/.claude/skills/TelegramBot/tools/Manage.sh restart
```

### Check Health

```bash
# Quick status
~/.claude/skills/TelegramBot/tools/Manage.sh status

# Or in Telegram
/status
```

### Clear Conversation

In Telegram:
```
/clear
```

### View Saved Files

In Telegram:
```
/saves
```

Or locally:
```bash
ls -la ~/.claude/scratchpad/telegram-saves/
```
