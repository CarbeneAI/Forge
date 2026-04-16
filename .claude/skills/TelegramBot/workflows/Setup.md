# Setup Workflow

Initial setup for PAI Telegram Bot.

## Prerequisites

1. Telegram bot token from @BotFather
2. Your Telegram chat ID from @userinfobot
3. Anthropic API key (for Claude access)
4. Bun installed

## Steps

### 1. Configure Environment Variables

Add to `~/.claude/.env`:

```bash
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here

# Claude API
ANTHROPIC_API_KEY=your_anthropic_key_here

# Optional: Custom save location
TELEGRAM_SAVES_PATH=/custom/path/to/saves
```

### 2. Test Manual Start

```bash
# Start bot manually
~/.claude/skills/TelegramBot/tools/Manage.sh start

# Check status
~/.claude/skills/TelegramBot/tools/Manage.sh status

# View logs
tail -f ~/.claude/logs/telegram-bot.log
```

### 3. Test in Telegram

Send these messages to your bot:

1. `/help` - Should show help menu
2. `Hello!` - Should get Claude response
3. `/status` - Should show bot status

### 4. Enable Auto-Start (systemd)

```bash
# Create user systemd directory
mkdir -p ~/.config/systemd/user

# Copy service file
cp ~/.claude/skills/TelegramBot/linux-service/pai-telegram-bot.service ~/.config/systemd/user/

# Reload systemd
systemctl --user daemon-reload

# Enable and start
systemctl --user enable pai-telegram-bot
systemctl --user start pai-telegram-bot

# Check status
systemctl --user status pai-telegram-bot
```

### 5. Configure Obsidian Symlink (Optional)

```bash
# On machine with Obsidian vault
ln -s ~/.claude/scratchpad/telegram-saves ~/ObsidianVault/PAI-Telegram
```

## Verification

Send `/status` to your bot. You should see:
- Bot: Online
- Claude API: Connected
- Polling: Active

## Troubleshooting

### Bot not responding

```bash
# Check if running
~/.claude/skills/TelegramBot/tools/Manage.sh status

# Check logs
tail -50 ~/.claude/logs/telegram-bot.log

# Restart
~/.claude/skills/TelegramBot/tools/Manage.sh restart
```

### Claude API errors

1. Verify ANTHROPIC_API_KEY in ~/.claude/.env
2. Check API key is valid
3. Check for rate limiting

### Webhook conflict

If you see "webhook is active" errors:

```bash
# Delete webhook (bot does this automatically on start)
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook"
```
