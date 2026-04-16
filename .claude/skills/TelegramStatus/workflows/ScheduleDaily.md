# ScheduleDaily Workflow

Configure automated daily PAI status updates to Telegram at 7:00 AM Central Time.

## Trigger Phrases

- "Schedule daily Telegram updates"
- "Set up 7 AM Telegram status"
- "Automate morning Telegram report"
- "Daily PAI status to Telegram"

## Prerequisites

1. Telegram credentials configured in `~/.claude/.env`
2. Cron service running on system
3. SendStatus workflow tested successfully

## Workflow Steps

### 1. Verify Current Cron Jobs

```bash
# List existing cron jobs
crontab -l
```

### 2. Create Cron Job for 7 AM CST

**Important:** Central Time considerations:
- CST (Winter): UTC-6 → 7 AM CST = 13:00 UTC
- CDT (Summer): UTC-5 → 7 AM CDT = 12:00 UTC

**Recommended:** Use 7 AM local system time (assumes system is in Central timezone):

```bash
# Add cron job (runs at 7 AM every day)
(crontab -l 2>/dev/null; echo "0 7 * * * /usr/bin/env bun $HOME/PAI/.claude/skills/TelegramStatus/tools/send-status.ts >> $HOME/PAI/.claude/logs/telegram-status.log 2>&1") | crontab -
```

**Alternative:** Explicitly handle timezone (if system is NOT in Central Time):

```bash
# For CST (Winter - November to March)
(crontab -l 2>/dev/null; echo "0 13 * * * /usr/bin/env bun $HOME/PAI/.claude/skills/TelegramStatus/tools/send-status.ts >> $HOME/PAI/.claude/logs/telegram-status.log 2>&1") | crontab -

# For CDT (Summer - March to November)
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/env bun $HOME/PAI/.claude/skills/TelegramStatus/tools/send-status.ts >> $HOME/PAI/.claude/logs/telegram-status.log 2>&1") | crontab -
```

### 3. Verify Cron Job Installation

```bash
# Check that cron job was added
crontab -l | grep telegram-status
```

Expected output:
```
0 7 * * * /usr/bin/env bun /home/username/PAI/.claude/skills/TelegramStatus/tools/send-status.ts >> /home/username/PAI/.claude/logs/telegram-status.log 2>&1
```

### 4. Create Log Directory

```bash
# Ensure log directory exists
mkdir -p ~/PAI/.claude/logs
```

### 5. Test Cron Execution

```bash
# Run the cron command manually to verify it works
/usr/bin/env bun $HOME/PAI/.claude/skills/TelegramStatus/tools/send-status.ts
```

### 6. Monitor First Execution

```bash
# Check logs after first scheduled run
tail -f ~/PAI/.claude/logs/telegram-status.log
```

## Cron Schedule Explanation

**Format:** `minute hour day month weekday command`

**Our schedule:** `0 7 * * *`
- `0` - At minute 0 (top of the hour)
- `7` - At hour 7 (7 AM)
- `*` - Every day of month
- `*` - Every month
- `*` - Every day of week

## Managing the Cron Job

### View Scheduled Jobs

```bash
crontab -l
```

### Remove the Telegram Status Job

```bash
# Remove only the telegram-status line
crontab -l | grep -v telegram-status | crontab -
```

### Temporarily Disable (Comment Out)

```bash
# Edit crontab manually
crontab -e

# Add # at the beginning of the line:
# 0 7 * * * /usr/bin/env bun ...
```

### Change Schedule Time

```bash
# Remove existing job
crontab -l | grep -v telegram-status | crontab -

# Add new job with different time (e.g., 8 AM)
(crontab -l 2>/dev/null; echo "0 8 * * * /usr/bin/env bun $HOME/PAI/.claude/skills/TelegramStatus/tools/send-status.ts >> $HOME/PAI/.claude/logs/telegram-status.log 2>&1") | crontab -
```

## Troubleshooting

### Cron Job Not Running

**Verify cron service:**
```bash
# Check if cron is running
systemctl status cron  # Debian/Ubuntu
systemctl status crond # RHEL/CentOS
```

**Start cron if stopped:**
```bash
sudo systemctl start cron   # Debian/Ubuntu
sudo systemctl start crond  # RHEL/CentOS
```

### Script Runs But No Telegram Message

**Check logs:**
```bash
cat ~/PAI/.claude/logs/telegram-status.log
```

**Common issues:**
1. Environment variables not loaded (PAI_DIR, TELEGRAM_BOT_TOKEN)
2. Bun not in PATH for cron user
3. .env file not readable

**Solution:** Use explicit paths in cron:
```bash
0 7 * * * cd /home/username/PAI/.claude/skills/TelegramStatus/tools && /home/username/.bun/bin/bun send-status.ts >> /home/username/PAI/.claude/logs/telegram-status.log 2>&1
```

### Wrong Timezone

**Check system timezone:**
```bash
timedatectl
```

**Set to Central Time:**
```bash
sudo timedatectl set-timezone America/Chicago
```

## Log Rotation

Prevent log file from growing too large:

```bash
# Create logrotate config
sudo tee /etc/logrotate.d/pai-telegram << EOF
/home/username/PAI/.claude/logs/telegram-status.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
}
EOF
```

## Alternative Scheduling Options

### Using systemd Timers (Modern Alternative)

**Create service file:**
```bash
sudo tee /etc/systemd/system/pai-telegram-status.service << EOF
[Unit]
Description=PAI Telegram Status Update

[Service]
Type=oneshot
User=username
ExecStart=/usr/bin/env bun /home/username/PAI/.claude/skills/TelegramStatus/tools/send-status.ts
EOF
```

**Create timer file:**
```bash
sudo tee /etc/systemd/system/pai-telegram-status.timer << EOF
[Unit]
Description=PAI Telegram Status Daily Timer

[Timer]
OnCalendar=*-*-* 07:00:00
Persistent=true

[Install]
WantedBy=timers.target
EOF
```

**Enable and start:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable pai-telegram-status.timer
sudo systemctl start pai-telegram-status.timer

# Check status
systemctl status pai-telegram-status.timer
```

## Verification Checklist

- [ ] Cron job listed in `crontab -l`
- [ ] Log directory created
- [ ] Manual execution successful
- [ ] Telegram message received
- [ ] Correct timestamp in message
- [ ] Schedule time is 7 AM Central

## Related Workflows

- **SendStatus** - Send status on demand
