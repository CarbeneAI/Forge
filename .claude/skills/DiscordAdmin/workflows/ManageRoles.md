# ManageRoles Workflow

Manage Discord roles for community members.

## Trigger

User requests:
- "Add premium role to [user]"
- "Remove role from [user]"
- "Sync roles for [user]"
- "What roles does [user] have?"

## Steps

### 1. Identify User

Get Discord user ID from:
- Direct ID (e.g., "123456789012345678")
- Username (requires lookup)
- Email (if linked to subscription system)

### 2. Check Current State

```bash
bun ${PAI_DIR}/skills/DiscordAdmin/tools/DiscordApi.ts \
  get-member \
  --user "123456789012345678"
```

Returns:
- Username
- Current roles
- Join date
- Avatar

### 3. Modify Roles

**Add Role:**
```bash
bun ${PAI_DIR}/skills/DiscordAdmin/tools/DiscordApi.ts \
  add-role \
  --user "123456789012345678" \
  --role "premium"
```

**Remove Role:**
```bash
bun ${PAI_DIR}/skills/DiscordAdmin/tools/DiscordApi.ts \
  remove-role \
  --user "123456789012345678" \
  --role "premium"
```

### 4. Confirm

Report back:
- Action taken
- User's current roles after change
- Any errors encountered

## Role Reference

| Role | ID | Purpose |
|------|-----|---------|
| Premium | 1463398729972449352 | Paid subscribers |
| Mentorship | 1463399070298275873 | Mentorship tier |
| Enterprise | 1463399178506993685 | Enterprise tier |
| Barnabas | 1463735931147260006 | Bot role |

## Subscription Sync

When syncing from subscription system:

1. Get user's subscription tier from database
2. Map tier to Discord role(s)
3. Add appropriate role(s)
4. Remove conflicting roles if downgrading

**Tier Mapping:**
- Free → No special roles
- Premium → Premium role
- Mentorship → Premium + Mentorship roles
- Enterprise → Premium + Mentorship + Enterprise roles

## API Endpoints

```typescript
// Add role
PUT /guilds/{guild_id}/members/{user_id}/roles/{role_id}

// Remove role
DELETE /guilds/{guild_id}/members/{user_id}/roles/{role_id}

// Get member
GET /guilds/{guild_id}/members/{user_id}
```

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| 404 | User not in server | Prompt user to join Discord first |
| 403 | Bot lacks permissions | Check bot role hierarchy |
| 400 | Invalid role ID | Verify role ID exists |

## Examples

### Upgrade to Premium
```
User: "Give Discord user 123456789 the premium role"
→ Adds Premium role
→ Reports: "Added Premium role to @username"
```

### Full Subscription Sync
```
User: "Sync roles for email user@example.com"
→ Looks up user by email in subscription DB
→ Gets Discord ID from linked account
→ Checks subscription tier (e.g., Mentorship)
→ Adds Premium + Mentorship roles
→ Reports final role state
```
