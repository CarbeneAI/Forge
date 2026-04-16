# ModerateUser Workflow

Moderation actions for Discord community members.

## Trigger

User requests:
- "Kick [user] from Discord"
- "Ban [user]"
- "Mute [user] for [duration]"
- "Warn [user]"

## Moderation Actions

### Warn

Issue a warning (stored for future reference):
- DM user with warning
- Log warning in moderation channel
- Track warning count

### Timeout (Mute)

Temporarily restrict user:
```bash
bun ${PAI_DIR}/skills/DiscordAdmin/tools/DiscordApi.ts \
  timeout \
  --user "123456789" \
  --duration "1h" \
  --reason "Violation of community guidelines"
```

Durations: 1m, 5m, 10m, 1h, 1d, 1w

### Kick

Remove from server (can rejoin):
```bash
bun ${PAI_DIR}/skills/DiscordAdmin/tools/DiscordApi.ts \
  kick \
  --user "123456789" \
  --reason "Multiple guideline violations"
```

### Ban

Permanent removal (cannot rejoin):
```bash
bun ${PAI_DIR}/skills/DiscordAdmin/tools/DiscordApi.ts \
  ban \
  --user "123456789" \
  --reason "Severe violation" \
  --delete-days 7
```

## Steps

### 1. Verify Request

- Confirm user identity
- Check current moderation history
- Validate reason provided

### 2. Execute Action

Choose appropriate action based on:
- Severity of violation
- Previous warnings/actions
- User's history in community

### 3. Log Action

Record in moderation log:
- Action taken
- Target user
- Moderator (PAI)
- Reason
- Timestamp

### 4. Notify Appropriately

- DM user about action (if possible)
- Log to mod channel
- Report back to requesting admin

## API Endpoints

```typescript
// Timeout (communication_disabled_until)
PATCH /guilds/{guild_id}/members/{user_id}
{
  "communication_disabled_until": "2026-01-27T00:00:00.000Z"
}

// Kick
DELETE /guilds/{guild_id}/members/{user_id}

// Ban
PUT /guilds/{guild_id}/bans/{user_id}
{
  "delete_message_seconds": 604800,  // 7 days
  "reason": "Reason here"
}

// Unban
DELETE /guilds/{guild_id}/bans/{user_id}
```

## Escalation Path

1. **First offense (minor):** Warning
2. **Second offense:** 1-hour timeout
3. **Third offense:** 24-hour timeout
4. **Fourth offense:** Kick
5. **Fifth offense or severe violation:** Ban

## Safety Checks

Before executing:
- [ ] Confirm user is not an admin/mod
- [ ] Verify action is appropriate for offense
- [ ] Check for any protected users list
- [ ] Ensure proper logging is in place

## Examples

### Issue Warning
```
User: "Warn Discord user 123 about spam"
→ DMs user: "⚠️ Warning: Please avoid spamming the chat."
→ Logs to mod channel
→ Reports: "Warning issued to @username"
```

### Timeout User
```
User: "Mute Discord user 123 for 1 hour for off-topic posts"
→ Applies 1-hour timeout
→ DMs user explanation
→ Reports: "1-hour timeout applied to @username"
```

### Ban User
```
User: "Ban Discord user 123 for scam links - severe violation"
→ Applies permanent ban
→ Deletes 7 days of messages
→ Reports: "@username has been banned. Reason: Scam links"
```

## Notes

- Always provide a reason for transparency
- DM users before taking action when possible
- Keep moderation logs for audit purposes
- Review bans periodically (some may deserve appeal)
