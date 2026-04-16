# Announce Workflow

Post announcements to Discord channels.

## Trigger

User requests:
- "Post an announcement to Discord"
- "Send message to #general"
- "Discord announcement about [topic]"

## Steps

### 1. Gather Content

Extract from user request:
- Message content
- Target channel (default: #general-discussion)
- Optional: Embed formatting (title, description, color)
- Optional: Mentions (@everyone, @role)

### 2. Format Message

Apply Cyber Defense Tactics branding:

**Plain Text:**
```
📢 **Announcement**

[Content here]

---
*Cyber Defense Tactics Team*
```

**Rich Embed:**
```json
{
  "embeds": [{
    "title": "Announcement Title",
    "description": "Content here",
    "color": 0x00BFFF,
    "footer": {
      "text": "Cyber Defense Tactics"
    },
    "timestamp": "2026-01-26T00:00:00.000Z"
  }]
}
```

### 3. Send via API

```bash
bun ${PAI_DIR}/skills/DiscordAdmin/tools/DiscordApi.ts \
  send-message \
  --channel "general-discussion" \
  --content "Message here"
```

Or with embed:
```bash
bun ${PAI_DIR}/skills/DiscordAdmin/tools/DiscordApi.ts \
  send-embed \
  --channel "general-discussion" \
  --title "Title" \
  --description "Content" \
  --color 0x00BFFF
```

### 4. Confirm

Report back:
- Message sent successfully
- Link to message (if available)
- Channel name

## Channel IDs

| Channel | ID |
|---------|-----|
| #welcome | 1462916532265816308 |
| #general-discussion | (lookup required) |
| #announcements | (lookup required) |

## Examples

### Simple Announcement
```
User: "Announce in Discord that the new threat intelligence course launches Monday"
→ Posts: "📢 **Announcement**\n\nThe new Threat Intelligence course launches Monday! Stay tuned for enrollment details.\n\n---\n*Cyber Defense Tactics Team*"
```

### Formatted Embed
```
User: "Post a Discord embed about the weekly mentor session"
→ Posts embed with:
   - Title: "Weekly Mentor Session"
   - Description: "Join us for live Q&A"
   - Color: Blue
   - Timestamp: Current time
```

## Notes

- Avoid @everyone unless critical
- Use embeds for important announcements
- Include call-to-action when relevant
- Check channel permissions before posting
