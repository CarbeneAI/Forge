---
name: DiscordAdmin
description: Discord server administration and community management. USE WHEN user mentions discord admin, server management, discord moderation, community management, discord announcements, member management, role management, OR wants to manage the Cyber Defense Tactics Discord server.
---

# DiscordAdmin

Discord server administration skill for managing the Cyber Defense Tactics community Discord server.

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **Announce** | "post announcement", "discord announcement" | `workflows/Announce.md` |
| **ModerateUser** | "kick", "ban", "mute", "warn user" | `workflows/ModerateUser.md` |
| **ManageRoles** | "add role", "remove role", "role sync" | `workflows/ManageRoles.md` |
| **ServerStats** | "discord stats", "member count", "server analytics" | `workflows/ServerStats.md` |

## Configuration

### Environment Variables (in ~/.claude/.env)

```bash
# Discord Bot (Cyber Defense Tactics)
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_GUILD_ID=1462915757401706617

# Role IDs
DISCORD_ROLE_PREMIUM=1463398729972449352
DISCORD_ROLE_MENTORSHIP=1463399070298275873
DISCORD_ROLE_ENTERPRISE=1463399178506993685
```

### Server Structure

**Guild ID**: 1462915757401706617

**Channels** (Public):
- #welcome
- #introductions
- #general-discussion
- #free-resources
- #job-postings
- #wins-and-celebrations

**Channels** (Premium - role-gated):
- #premium-lounge
- #detection-engineering
- #ai-tools-and-tips
- #career-strategy
- #course-discussion

**Channels** (Mentorship - role-gated):
- #mentorship-cohort
- #mentor-office-hours (voice)

### Role Hierarchy

| Role | ID | Auto-assigned |
|------|-----|---------------|
| Premium | 1463398729972449352 | On premium subscription |
| Mentorship | 1463399070298275873 | On mentorship subscription |
| Enterprise | 1463399178506993685 | On enterprise subscription |

## Capabilities

### Currently Implemented
- **Role Sync** - Add/remove roles based on subscription tier
- **Member Lookup** - Check if user is server member and their roles

### Implemented Capabilities
- **Role Sync** - Add/remove roles based on subscription tier
- **Member Lookup** - Check if user is server member and their roles
- **Moderation** - Timeout, kick, ban with audit logging
- **Announcements** - Post messages and embeds to channels
- **Analytics** - Server stats, member counts, role distribution

### Planned Capabilities
- **Welcome** - Auto-greet new members, send onboarding DM
- **AI Moderation** - Auto-detect spam, toxicity, scam links
- **Real-time Gateway** - WebSocket connection for live events

## API Reference

### Discord API v10
Base URL: `https://discord.com/api/v10`

### Common Endpoints

```typescript
// Get guild member
GET /guilds/{guild_id}/members/{user_id}

// Add role to member
PUT /guilds/{guild_id}/members/{user_id}/roles/{role_id}

// Remove role from member
DELETE /guilds/{guild_id}/members/{user_id}/roles/{role_id}

// Get guild channels
GET /guilds/{guild_id}/channels

// Send message to channel
POST /channels/{channel_id}/messages

// Get guild info
GET /guilds/{guild_id}
```

### Authentication
All requests require `Authorization: Bot {BOT_TOKEN}` header.

## Examples

**Example 1: Post an announcement**
```
User: "Post an announcement in the general channel about the new course launch"
→ Invokes Announce workflow
→ Formats message with branding
→ Posts to #general-discussion
→ Confirms with message link
```

**Example 2: Check server stats**
```
User: "How many members do we have in Discord?"
→ Invokes ServerStats workflow
→ Fetches guild info via API
→ Returns member count, online count, role distribution
```

**Example 3: Sync a user's role**
```
User: "Add premium role to Discord user 123456789"
→ Invokes ManageRoles workflow
→ Calls Discord API to add role
→ Confirms success
```

## Existing Integration

The bot is already integrated with the Cyber Defense Tactics website:
- **Webhook**: `/api/webhooks/discord` - handles role sync from Stripe subscriptions
- **Flow**: Stripe webhook → Update DB tier → Sync Discord role

## Security Notes

- Bot token is stored in environment variables (never committed)
- Internal API key required for webhook calls
- Role management restricted to subscription-related roles
- Admin commands require verification of user permissions
