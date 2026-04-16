# Telegram Integration Reference

Complete guide for integrating Telegram notifications into PAI skills.

## Overview

This guide provides reusable patterns for adding Telegram notifications to any PAI skill. Use this reference when building new skills that need to send alerts, status updates, or other notifications via Telegram.

## Quick Start

### Prerequisites

1. **Telegram Bot Token** - From @BotFather
2. **Telegram Chat ID** - From @userinfobot
3. **Credentials in .env** - Add to `~/.claude/.env`

### Basic Implementation

```typescript
#!/usr/bin/env bun

// 1. Load environment variables
const PAI_DIR = process.env.PAI_DIR || join(process.env.HOME!, '.claude');
const envPath = join(PAI_DIR, '.env');

// Parse .env file (see full implementation below)
// ...

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// 2. Define send function
async function sendToTelegram(message: string): Promise<void> {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'Markdown',
    }),
  });

  const data = await response.json();
  if (!data.ok) {
    throw new Error(`Telegram API error: ${data.description}`);
  }
}

// 3. Build and send message
const message = `*Your Title*\n\nYour content here`;
await sendToTelegram(message);
```

## Configuration

### Environment Variables

Add to `~/.claude/.env`:

```bash
# Telegram Bot (for notifications)
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789
```

### Getting Credentials

**Bot Token**:
1. Open Telegram
2. Message @BotFather
3. Send `/newbot`
4. Follow prompts to create bot
5. Copy token provided

**Chat ID**:
1. Message @userinfobot
2. Send `/start`
3. Copy the ID number in response

## Complete .env Loader Implementation

Use this code block in your TypeScript tools to load environment variables:

```typescript
import { existsSync } from 'fs';
import { join } from 'path';

const PAI_DIR = process.env.PAI_DIR || join(process.env.HOME!, '.claude');

// Load .env file
const envPath = join(PAI_DIR, '.env');
if (existsSync(envPath)) {
  const envContent = await Bun.file(envPath).text();
  const lines = envContent.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
```

## Message Formatting

Telegram supports **Markdown** formatting:

### Basic Formatting

```typescript
const message = `
*Bold Text*
_Italic Text_
\`Monospace\`
\`\`\`
Code Block
\`\`\`
[Link Text](https://example.com)
`;
```

### Emoji Support

```typescript
const message = `
✅ Success
❌ Error
⚠️ Warning
💡 Info
🚀 Launch
📊 Stats
🔔 Notification
`;
```

### Structured Messages

```typescript
const message = `
*${title}*

${description}

*Details:*
- Item 1
- Item 2
- Item 3

_${footer}_
`;
```

## Error Handling

### Validation Pattern

```typescript
// Validate credentials
if (!TELEGRAM_BOT_TOKEN) {
  console.error('Error: TELEGRAM_BOT_TOKEN not found in environment or .env');
  process.exit(1);
}

if (!TELEGRAM_CHAT_ID) {
  console.error('Error: TELEGRAM_CHAT_ID not found in environment or .env');
  process.exit(1);
}
```

### Try-Catch Pattern

```typescript
async function sendToTelegram(message: string): Promise<void> {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(`Telegram API error: ${data.description || 'Unknown error'}`);
    }

    return data;
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
    throw error;
  }
}
```

## Advanced Features

### Send Photos

```typescript
async function sendPhoto(photoUrl: string, caption: string): Promise<void> {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      photo: photoUrl,
      caption: caption,
      parse_mode: 'Markdown',
    }),
  });

  const data = await response.json();
  if (!data.ok) throw new Error(`Telegram API error: ${data.description}`);
}
```

### Send Documents

```typescript
async function sendDocument(fileUrl: string, caption: string): Promise<void> {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      document: fileUrl,
      caption: caption,
      parse_mode: 'Markdown',
    }),
  });

  const data = await response.json();
  if (!data.ok) throw new Error(`Telegram API error: ${data.description}`);
}
```

### Inline Buttons

```typescript
async function sendWithButtons(message: string, buttons: Array<{text: string, url: string}>): Promise<void> {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  const keyboard = {
    inline_keyboard: [
      buttons.map(btn => ({ text: btn.text, url: btn.url }))
    ]
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    }),
  });

  const data = await response.json();
  if (!data.ok) throw new Error(`Telegram API error: ${data.description}`);
}

// Usage
await sendWithButtons(
  '*Choose an option:*',
  [
    { text: 'View Dashboard', url: 'https://dashboard.example.com' },
    { text: 'Read Docs', url: 'https://docs.example.com' },
  ]
);
```

## Integration Patterns

### Pattern 1: Notification on Completion

```typescript
// In your skill's tool
async function processTask() {
  // Do work
  const result = await doSomeWork();

  // Notify on completion
  await sendToTelegram(`✅ *Task Complete*\n\n${result.summary}`);
}
```

### Pattern 2: Error Alerts

```typescript
async function criticalOperation() {
  try {
    await riskyOperation();
  } catch (error) {
    await sendToTelegram(`❌ *Error Alert*\n\n\`\`\`\n${error.message}\n\`\`\``);
    throw error;
  }
}
```

### Pattern 3: Progress Updates

```typescript
async function longRunningTask() {
  await sendToTelegram('🚀 *Task Started*');

  await step1();
  await sendToTelegram('⏳ *Step 1 Complete* (33%)');

  await step2();
  await sendToTelegram('⏳ *Step 2 Complete* (66%)');

  await step3();
  await sendToTelegram('✅ *Task Complete* (100%)');
}
```

### Pattern 4: Scheduled Reports

```typescript
// In cron job or scheduled task
async function dailyReport() {
  const stats = await gatherStats();

  const message = `
*Daily Report*
${new Date().toLocaleDateString()}

📊 *Statistics:*
- Users: ${stats.users}
- Tasks: ${stats.tasks}
- Errors: ${stats.errors}

_Automated daily report_
  `;

  await sendToTelegram(message);
}
```

## Testing

### Test Connection

```typescript
async function testTelegram(): Promise<void> {
  try {
    await sendToTelegram('🧪 *Test Message*\n\nTelegram integration is working!');
    console.log('✅ Test message sent successfully');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}
```

### Validate Bot Token

```bash
# Check bot info
curl https://api.telegram.org/bot<YOUR_TOKEN>/getMe
```

Expected response:
```json
{
  "ok": true,
  "result": {
    "id": 1234567890,
    "is_bot": true,
    "first_name": "Your Bot Name",
    "username": "your_bot_username"
  }
}
```

## Common Use Cases by Skill

### Research Skill

```typescript
// After completing research
const summary = await doResearch(topic);
await sendToTelegram(`
*Research Complete: ${topic}*

${summary.keyFindings}

📎 Full report saved to history
`);
```

### Observability Skill

```typescript
// Alert on threshold breach
if (metrics.cpuUsage > 90) {
  await sendToTelegram(`
⚠️ *High CPU Alert*

Current: ${metrics.cpuUsage}%
Threshold: 90%
Host: ${hostname}

🔗 [View Dashboard](http://localhost:5172)
  `);
}
```

### Git Workflow

```typescript
// Notify on deployment
await sendToTelegram(`
✅ *Deployment Complete*

Commit: \`${commitHash}\`
Branch: ${branch}
Environment: ${env}
Time: ${timestamp}
`);
```

### Backup Operations

```typescript
// Confirm backup completion
await sendToTelegram(`
💾 *Backup Complete*

Size: ${backupSize}
Location: ${backupPath}
Duration: ${duration}

Next backup: ${nextBackupTime}
`);
```

## Cross-Machine Setup

### macOS (Mac Studio, MacBook Pro)

For scheduled notifications, use **launchd** instead of cron:

**Create plist**: `~/Library/LaunchAgents/com.pai.telegram-notify.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.pai.telegram-notify</string>

    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/env</string>
        <string>bun</string>
        <string>/Users/USERNAME/PAI/.claude/skills/YourSkill/tools/notify.ts</string>
    </array>

    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>7</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>

    <key>StandardOutPath</key>
    <string>/Users/USERNAME/PAI/.claude/logs/telegram-notify.log</string>

    <key>StandardErrorPath</key>
    <string>/Users/USERNAME/PAI/.claude/logs/telegram-notify.log</string>
</dict>
</plist>
```

**Load**:
```bash
launchctl load ~/Library/LaunchAgents/com.pai.telegram-notify.plist
```

### Linux

Use standard cron:

```bash
# Add to crontab
crontab -e

# Add line:
0 7 * * * /usr/bin/env bun "$HOME/PAI/.claude/skills/YourSkill/tools/notify.ts" >> "$HOME/PAI/.claude/logs/telegram-notify.log" 2>&1
```

## Security Best Practices

1. **Never commit tokens**
   - Keep tokens in `.env` only
   - Ensure `.env` is in `.gitignore`
   - Verify before every commit

2. **Rotate tokens regularly**
   - Generate new bot token via @BotFather
   - Update `.env` on all machines
   - Revoke old token

3. **Limit bot permissions**
   - Use @BotFather settings
   - Disable unused features
   - Set privacy mode

4. **Monitor bot activity**
   - Check bot messages periodically
   - Review logs for errors
   - Watch for unauthorized use

## Troubleshooting

### Bot not responding

**Check bot is started**:
1. Open Telegram
2. Find your bot
3. Send `/start`

### Invalid token error

**Verify token**:
```bash
curl https://api.telegram.org/bot<TOKEN>/getMe
```

### Chat not found

**Verify chat ID**:
- Message @userinfobot
- Ensure ID is numeric (no quotes in .env)
- Try sending /start to your bot again

### Message too long

**Telegram limit**: 4096 characters

**Solution**:
```typescript
function truncateMessage(msg: string, maxLen = 4000): string {
  if (msg.length <= maxLen) return msg;
  return msg.substring(0, maxLen) + '\n\n_[Message truncated]_';
}
```

## Reference Implementation

See complete working example:
```
~/.claude/skills/TelegramStatus/tools/send-status.ts
```

This file contains:
- ✅ Environment loading
- ✅ Validation
- ✅ Error handling
- ✅ Message formatting
- ✅ Logging
- ✅ Exit codes

## Additional Resources

- **Telegram Bot API Docs**: https://core.telegram.org/bots/api
- **@BotFather**: https://t.me/botfather
- **@userinfobot**: https://t.me/userinfobot
- **Markdown Guide**: https://core.telegram.org/bots/api#markdown-style

## Future Enhancements

### Shared Library (Planned)

Create reusable Telegram library:

```typescript
// ~/.claude/lib/telegram.ts
export class TelegramClient {
  constructor(private token: string, private chatId: string) {}

  async send(message: string): Promise<void> { /* ... */ }
  async sendPhoto(url: string, caption: string): Promise<void> { /* ... */ }
  async sendDocument(url: string, caption: string): Promise<void> { /* ... */ }
}

// Usage in skills
import { TelegramClient } from '~/.claude/lib/telegram.ts';
const telegram = new TelegramClient(TOKEN, CHAT_ID);
await telegram.send('Hello!');
```

## Questions?

For help with Telegram integration:
1. Check this reference guide
2. Review working implementation: `TelegramStatus/tools/send-status.ts`
3. Test with bot API directly: `curl https://api.telegram.org/bot<TOKEN>/getMe`
4. Ask Claude Code for assistance

---

**Last Updated**: 2025-12-13
**Version**: 1.0
**Maintained by**: PAI Team
