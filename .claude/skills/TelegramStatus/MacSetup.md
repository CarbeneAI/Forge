# TelegramStatus macOS Setup Guide

Complete setup instructions for Mac Studio and MacBook Pro.

## Overview

This guide walks through setting up the TelegramStatus skill on macOS (Mac Studio, MacBook Pro). macOS uses **launchd** instead of cron for scheduled tasks.

## Prerequisites

1. ✅ PAI repository synced to Mac
2. ✅ Bun installed (via Homebrew or official installer)
3. ✅ Telegram bot created and credentials obtained

## Step 1: Verify Bun Installation

```bash
# Check Bun is installed
which bun
# Expected: /Users/username/.bun/bin/bun or /opt/homebrew/bin/bun

# Test Bun works
bun --version

# If not installed, install via Homebrew:
brew install oven-sh/bun/bun

# Or use official installer:
curl -fsSL https://bun.sh/install | bash
```

## Step 2: Configure Environment Variables

### Copy .env File

**Option A: Copy from Linux machine**
```bash
# From Mac, copy .env from Linux machine
scp username@linux-host:~/PAI/.claude/.env ~/PAI/.claude/.env
```

**Option B: Create manually**
```bash
# Copy from example
cp ~/PAI/.claude/.env.example ~/PAI/.claude/.env

# Edit with your credentials
nano ~/PAI/.claude/.env
```

Add these lines:
```bash
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

### Verify PAI_DIR in settings.json

```bash
# Check settings.json
cat ~/PAI/.claude/settings.json | grep PAI_DIR
```

Expected on Mac:
```json
{
  "env": {
    "PAI_DIR": "/Users/youruser/.claude"
  }
}
```

**If different**: Update to match your Mac's home directory structure.

## Step 3: Test Manual Execution

```bash
# Navigate to tools directory
cd ~/PAI/.claude/skills/TelegramStatus/tools

# Make executable (if not already)
chmod +x send-status.ts

# Run test
bun send-status.ts
```

Expected output:
```
[timestamp] Building status message...
[timestamp] Sending to Telegram...
[timestamp] ✅ Status sent successfully
{"success":true,"timestamp":"2025-12-13T...","message":"Status sent to Telegram"}
```

Check your Telegram for the status message.

## Step 4: Set Up Scheduled Updates (launchd)

### Create Launch Agent Directory

```bash
mkdir -p ~/Library/LaunchAgents
```

### Get Your Username

```bash
whoami
# Example output: youruser
```

### Create plist File

**Replace `youruser` with your actual username:**

```bash
cat > ~/Library/LaunchAgents/com.pai.telegram-status.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.pai.telegram-status</string>

    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/env</string>
        <string>bun</string>
        <string>/Users/youruser/PAI/.claude/skills/TelegramStatus/tools/send-status.ts</string>
    </array>

    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>7</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>

    <key>StandardOutPath</key>
    <string>/Users/youruser/PAI/.claude/logs/telegram-status.log</string>

    <key>StandardErrorPath</key>
    <string>/Users/youruser/PAI/.claude/logs/telegram-status.log</string>

    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin:/Users/youruser/.bun/bin</string>
    </dict>
</dict>
</plist>
EOF
```

**Important**: Update all instances of `/Users/youruser` to match your username!

### Create Log Directory

```bash
mkdir -p ~/PAI/.claude/logs
```

### Load the Launch Agent

```bash
# Load the plist
launchctl load ~/Library/LaunchAgents/com.pai.telegram-status.plist

# Verify it's loaded
launchctl list | grep telegram-status
```

Expected output:
```
-	0	com.pai.telegram-status
```

## Step 5: Test Scheduled Execution

### Trigger Manually

```bash
# Force run now (doesn't wait for 7 AM)
launchctl start com.pai.telegram-status

# Check if message was sent to Telegram
# Check logs
tail ~/PAI/.claude/logs/telegram-status.log
```

### Verify Schedule

```bash
# View plist to confirm schedule
plutil -p ~/Library/LaunchAgents/com.pai.telegram-status.plist | grep -A 3 StartCalendarInterval
```

Expected:
```
"StartCalendarInterval" => {
  "Hour" => 7
  "Minute" => 0
}
```

## Step 6: Verify Timezone

```bash
# Check system timezone
sudo systemsetup -gettimezone
```

Expected: `Time Zone: America/Chicago`

**If incorrect**, set to Central Time:
```bash
sudo systemsetup -settimezone America/Chicago

# Verify
date
```

## Managing the Launch Agent

### View Status

```bash
# Check if loaded
launchctl list | grep telegram-status

# View plist
cat ~/Library/LaunchAgents/com.pai.telegram-status.plist
```

### Stop/Unload

```bash
# Unload (stops scheduled execution)
launchctl unload ~/Library/LaunchAgents/com.pai.telegram-status.plist

# Verify it's unloaded
launchctl list | grep telegram-status
# Should return nothing
```

### Reload After Changes

```bash
# Unload first
launchctl unload ~/Library/LaunchAgents/com.pai.telegram-status.plist

# Make changes to plist file
nano ~/Library/LaunchAgents/com.pai.telegram-status.plist

# Reload
launchctl load ~/Library/LaunchAgents/com.pai.telegram-status.plist
```

### Change Schedule Time

```bash
# Unload current
launchctl unload ~/Library/LaunchAgents/com.pai.telegram-status.plist

# Edit plist
nano ~/Library/LaunchAgents/com.pai.telegram-status.plist

# Change this section:
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>8</integer>  <!-- Changed from 7 to 8 -->
        <key>Minute</key>
        <integer>0</integer>
    </dict>

# Reload
launchctl load ~/Library/LaunchAgents/com.pai.telegram-status.plist
```

### Delete Completely

```bash
# Unload
launchctl unload ~/Library/LaunchAgents/com.pai.telegram-status.plist

# Remove plist file
rm ~/Library/LaunchAgents/com.pai.telegram-status.plist

# Verify removed
ls ~/Library/LaunchAgents/ | grep telegram
```

## Troubleshooting

### Issue: "bun: command not found"

**Solution 1**: Add Bun to PATH in plist
```xml
<key>EnvironmentVariables</key>
<dict>
    <key>PATH</key>
    <string>/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin:/Users/USERNAME/.bun/bin</string>
</dict>
```

**Solution 2**: Use absolute path to bun
```bash
# Find bun location
which bun
# Output: /Users/username/.bun/bin/bun

# Update plist to use absolute path
<string>/Users/username/.bun/bin/bun</string>
```

### Issue: Script runs but no Telegram message

**Check logs**:
```bash
tail -50 ~/PAI/.claude/logs/telegram-status.log
```

**Common causes**:
1. Environment variables not loaded (.env not found)
2. PAI_DIR incorrect
3. Credentials missing or incorrect

**Solution**: Add explicit environment variables to plist:
```xml
<key>EnvironmentVariables</key>
<dict>
    <key>PAI_DIR</key>
    <string>/Users/youruser/.claude</string>
    <key>TELEGRAM_BOT_TOKEN</key>
    <string>your_token_here</string>
    <key>TELEGRAM_CHAT_ID</key>
    <string>your_chat_id_here</string>
</dict>
```

### Issue: Launch agent not running at scheduled time

**Check system log**:
```bash
log show --predicate 'subsystem == "com.apple.launchd"' --last 1h | grep telegram
```

**Verify loaded**:
```bash
launchctl list | grep telegram-status
```

**Force reload**:
```bash
launchctl unload ~/Library/LaunchAgents/com.pai.telegram-status.plist
launchctl load ~/Library/LaunchAgents/com.pai.telegram-status.plist
```

### Issue: Wrong timezone in messages

**Verify system timezone**:
```bash
sudo systemsetup -gettimezone
```

**Set to Central Time**:
```bash
sudo systemsetup -settimezone America/Chicago
```

**Restart launch agent**:
```bash
launchctl unload ~/Library/LaunchAgents/com.pai.telegram-status.plist
launchctl load ~/Library/LaunchAgents/com.pai.telegram-status.plist
```

## Differences from Linux Setup

| Feature | Linux (cron) | macOS (launchd) |
|---------|-------------|-----------------|
| **Config File** | `crontab -e` | `~/Library/LaunchAgents/*.plist` |
| **Format** | Cron syntax | XML plist |
| **List Jobs** | `crontab -l` | `launchctl list` |
| **Load/Enable** | Automatic | `launchctl load` |
| **Unload/Disable** | Remove from crontab | `launchctl unload` |
| **Logs** | Append to file | StandardOutPath/StandardErrorPath |
| **Environment** | Limited | Full control via EnvironmentVariables |
| **Start Now** | Run command | `launchctl start` |

## Verification Checklist

Before considering setup complete:

- [ ] Bun installed and in PATH
- [ ] .env file configured with Telegram credentials
- [ ] PAI_DIR correct in settings.json
- [ ] Manual execution successful (test message received)
- [ ] plist file created in ~/Library/LaunchAgents/
- [ ] Launch agent loaded successfully
- [ ] Forced execution successful
- [ ] Logs directory created
- [ ] Timezone set to America/Chicago
- [ ] Schedule time is 7:00 AM

## Next Steps

Once working on one Mac:

1. **Sync to other Mac** (Mac Studio or MacBook Pro):
   ```bash
   # Copy PAI repo (Git sync)
   cd ~/PAI && git pull

   # Copy .env manually (not in Git)
   scp mac1:~/PAI/.claude/.env ~/PAI/.claude/.env

   # Follow this guide again on second Mac
   ```

2. **Test both machines**:
   - Verify both send at 7 AM
   - Check logs on both systems
   - Confirm Telegram receives messages

3. **Monitor for a week**:
   - Check daily that messages arrive
   - Review logs weekly
   - Adjust schedule if needed

## Reference Files

Key files for macOS setup:

```
~/PAI/.claude/skills/TelegramStatus/
├── tools/send-status.ts              # Main script
├── MacSetup.md                       # This guide
└── TelegramIntegration.md            # Reusable patterns

~/Library/LaunchAgents/
└── com.pai.telegram-status.plist    # Schedule config

~/PAI/.claude/
├── .env                              # Credentials (not in Git)
└── logs/telegram-status.log          # Execution logs
```

## Questions?

For help with macOS setup:
1. Check this guide
2. Review logs: `~/PAI/.claude/logs/telegram-status.log`
3. Test manually first
4. Verify launchd with `launchctl list`
5. Ask Claude Code for assistance

---

**Last Updated**: 2025-12-13
**Platform**: macOS (Mac Studio, MacBook Pro)
**Tested on**: macOS Sonoma, macOS Sequoia
