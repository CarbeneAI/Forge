#!/usr/bin/env bun
/**
 * DiscordApi.ts - Discord REST API wrapper for PAI
 *
 * Commands:
 *   server-stats           Get server statistics
 *   get-member <user_id>   Get member info
 *   add-role               Add role to member
 *   remove-role            Remove role from member
 *   send-message           Send message to channel
 *   send-embed             Send embed to channel
 *   timeout                Timeout a member
 *   kick                   Kick a member
 *   ban                    Ban a member
 */

const DISCORD_API = "https://discord.com/api/v10";
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID || "1462915757401706617";

// Role mappings
const ROLES: Record<string, string> = {
  premium: "1463398729972449352",
  mentorship: "1463399070298275873",
  enterprise: "1463399178506993685",
  barnabas: "1463735931147260006",
};

// Channel mappings
const CHANNELS: Record<string, string> = {
  welcome: "1462916532265816308",
  // Add more channels as discovered
};

interface DiscordResponse {
  ok: boolean;
  data?: unknown;
  error?: string;
  status?: number;
}

async function discordFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<DiscordResponse> {
  if (!BOT_TOKEN) {
    return { ok: false, error: "DISCORD_BOT_TOKEN not set" };
  }

  const url = `${DISCORD_API}${endpoint}`;
  const headers: Record<string, string> = {
    Authorization: `Bot ${BOT_TOKEN}`,
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  try {
    const response = await fetch(url, { ...options, headers });
    const data = response.status !== 204 ? await response.json() : null;

    if (!response.ok) {
      return {
        ok: false,
        error: (data as { message?: string })?.message || `HTTP ${response.status}`,
        status: response.status,
        data,
      };
    }

    return { ok: true, data, status: response.status };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

// ============================================================================
// Commands
// ============================================================================

async function serverStats(): Promise<void> {
  const result = await discordFetch(`/guilds/${GUILD_ID}?with_counts=true`);

  if (!result.ok) {
    console.error("Error:", result.error);
    process.exit(1);
  }

  const guild = result.data as {
    name: string;
    approximate_member_count: number;
    approximate_presence_count: number;
    description?: string;
    premium_tier: number;
    premium_subscription_count: number;
  };

  console.log("\nDiscord Server Statistics");
  console.log("=".repeat(50));
  console.log(`Server: ${guild.name}`);
  console.log(`Description: ${guild.description || "None"}`);
  console.log("");
  console.log(`Total Members: ${guild.approximate_member_count}`);
  console.log(`Online Now: ${guild.approximate_presence_count}`);
  console.log(`Boost Level: ${guild.premium_tier}`);
  console.log(`Boosters: ${guild.premium_subscription_count}`);

  // Get role counts (requires separate calls)
  console.log("\nRole Counts:");
  for (const [name, id] of Object.entries(ROLES)) {
    if (name === "barnabas") continue;
    console.log(`  ${name}: (count requires member iteration)`);
  }
}

async function getMember(userId: string): Promise<void> {
  const result = await discordFetch(`/guilds/${GUILD_ID}/members/${userId}`);

  if (!result.ok) {
    if (result.status === 404) {
      console.error("User not found in this server");
    } else {
      console.error("Error:", result.error);
    }
    process.exit(1);
  }

  const member = result.data as {
    user: { id: string; username: string; discriminator: string; avatar?: string };
    nick?: string;
    roles: string[];
    joined_at: string;
  };

  console.log("\nMember Info");
  console.log("=".repeat(50));
  console.log(`Username: ${member.user.username}`);
  console.log(`ID: ${member.user.id}`);
  console.log(`Nickname: ${member.nick || "None"}`);
  console.log(`Joined: ${new Date(member.joined_at).toLocaleDateString()}`);

  // Map role IDs to names
  const roleNames = member.roles
    .map((id) => {
      const entry = Object.entries(ROLES).find(([_, rid]) => rid === id);
      return entry ? entry[0] : id;
    })
    .join(", ");

  console.log(`Roles: ${roleNames || "None"}`);
}

async function addRole(userId: string, roleName: string): Promise<void> {
  const roleId = ROLES[roleName.toLowerCase()] || roleName;

  const result = await discordFetch(
    `/guilds/${GUILD_ID}/members/${userId}/roles/${roleId}`,
    { method: "PUT" }
  );

  if (!result.ok) {
    console.error("Error adding role:", result.error);
    process.exit(1);
  }

  console.log(`Added role ${roleName} to user ${userId}`);
}

async function removeRole(userId: string, roleName: string): Promise<void> {
  const roleId = ROLES[roleName.toLowerCase()] || roleName;

  const result = await discordFetch(
    `/guilds/${GUILD_ID}/members/${userId}/roles/${roleId}`,
    { method: "DELETE" }
  );

  if (!result.ok) {
    console.error("Error removing role:", result.error);
    process.exit(1);
  }

  console.log(`Removed role ${roleName} from user ${userId}`);
}

async function sendMessage(channelId: string, content: string): Promise<void> {
  const resolvedChannelId = CHANNELS[channelId.toLowerCase()] || channelId;

  const result = await discordFetch(`/channels/${resolvedChannelId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });

  if (!result.ok) {
    console.error("Error sending message:", result.error);
    process.exit(1);
  }

  const message = result.data as { id: string; channel_id: string };
  console.log(`Message sent to channel ${resolvedChannelId}`);
  console.log(`Message ID: ${message.id}`);
}

async function sendEmbed(
  channelId: string,
  title: string,
  description: string,
  color: number = 0x00bfff
): Promise<void> {
  const resolvedChannelId = CHANNELS[channelId.toLowerCase()] || channelId;

  const embed = {
    title,
    description,
    color,
    timestamp: new Date().toISOString(),
    footer: {
      text: "Cyber Defense Tactics",
    },
  };

  const result = await discordFetch(`/channels/${resolvedChannelId}/messages`, {
    method: "POST",
    body: JSON.stringify({ embeds: [embed] }),
  });

  if (!result.ok) {
    console.error("Error sending embed:", result.error);
    process.exit(1);
  }

  console.log(`Embed sent to channel ${resolvedChannelId}`);
}

async function timeoutMember(
  userId: string,
  duration: string,
  reason: string
): Promise<void> {
  // Parse duration (1m, 5m, 10m, 1h, 1d, 1w)
  const match = duration.match(/^(\d+)([mhdw])$/);
  if (!match) {
    console.error("Invalid duration format. Use: 1m, 5m, 10m, 1h, 1d, 1w");
    process.exit(1);
  }

  const value = parseInt(match[1]);
  const unit = match[2];
  let ms: number;

  switch (unit) {
    case "m":
      ms = value * 60 * 1000;
      break;
    case "h":
      ms = value * 60 * 60 * 1000;
      break;
    case "d":
      ms = value * 24 * 60 * 60 * 1000;
      break;
    case "w":
      ms = value * 7 * 24 * 60 * 60 * 1000;
      break;
    default:
      ms = 0;
  }

  const until = new Date(Date.now() + ms).toISOString();

  const result = await discordFetch(`/guilds/${GUILD_ID}/members/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({ communication_disabled_until: until }),
  });

  if (!result.ok) {
    console.error("Error applying timeout:", result.error);
    process.exit(1);
  }

  console.log(`Timeout applied to user ${userId} until ${until}`);
  console.log(`Reason: ${reason}`);
}

async function kickMember(userId: string, reason: string): Promise<void> {
  const result = await discordFetch(`/guilds/${GUILD_ID}/members/${userId}`, {
    method: "DELETE",
    headers: { "X-Audit-Log-Reason": reason },
  });

  if (!result.ok) {
    console.error("Error kicking member:", result.error);
    process.exit(1);
  }

  console.log(`Kicked user ${userId}`);
  console.log(`Reason: ${reason}`);
}

async function banMember(
  userId: string,
  reason: string,
  deleteMessageDays: number = 0
): Promise<void> {
  const result = await discordFetch(`/guilds/${GUILD_ID}/bans/${userId}`, {
    method: "PUT",
    body: JSON.stringify({
      delete_message_seconds: deleteMessageDays * 24 * 60 * 60,
    }),
    headers: { "X-Audit-Log-Reason": reason },
  });

  if (!result.ok) {
    console.error("Error banning member:", result.error);
    process.exit(1);
  }

  console.log(`Banned user ${userId}`);
  console.log(`Reason: ${reason}`);
  if (deleteMessageDays > 0) {
    console.log(`Deleted ${deleteMessageDays} days of messages`);
  }
}

// ============================================================================
// CLI
// ============================================================================

function printHelp(): void {
  console.log(`
DiscordApi - Discord REST API wrapper for PAI

USAGE:
  bun DiscordApi.ts <command> [options]

COMMANDS:
  server-stats                    Get server statistics
  get-member --user <id>          Get member info
  add-role --user <id> --role <name>     Add role to member
  remove-role --user <id> --role <name>  Remove role from member
  send-message --channel <id> --content <text>   Send message
  send-embed --channel <id> --title <text> --description <text> [--color <hex>]
  timeout --user <id> --duration <1m|1h|1d> --reason <text>
  kick --user <id> --reason <text>
  ban --user <id> --reason <text> [--delete-days <n>]

ROLES:
  premium, mentorship, enterprise

EXAMPLES:
  # Get server stats
  bun DiscordApi.ts server-stats

  # Check member info
  bun DiscordApi.ts get-member --user 123456789012345678

  # Add premium role
  bun DiscordApi.ts add-role --user 123456789 --role premium

  # Send announcement
  bun DiscordApi.ts send-message --channel welcome --content "Hello!"

  # Timeout user for 1 hour
  bun DiscordApi.ts timeout --user 123456789 --duration 1h --reason "Spam"
`);
}

function parseArgs(): {
  command: string;
  user?: string;
  role?: string;
  channel?: string;
  content?: string;
  title?: string;
  description?: string;
  color?: number;
  duration?: string;
  reason?: string;
  deleteDays?: number;
} {
  const args = process.argv.slice(2);
  const result: ReturnType<typeof parseArgs> = { command: args[0] || "" };

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case "--user":
        result.user = next;
        i++;
        break;
      case "--role":
        result.role = next;
        i++;
        break;
      case "--channel":
        result.channel = next;
        i++;
        break;
      case "--content":
        result.content = next;
        i++;
        break;
      case "--title":
        result.title = next;
        i++;
        break;
      case "--description":
        result.description = next;
        i++;
        break;
      case "--color":
        result.color = parseInt(next, 16);
        i++;
        break;
      case "--duration":
        result.duration = next;
        i++;
        break;
      case "--reason":
        result.reason = next;
        i++;
        break;
      case "--delete-days":
        result.deleteDays = parseInt(next);
        i++;
        break;
    }
  }

  return result;
}

// Main
const opts = parseArgs();

switch (opts.command) {
  case "server-stats":
    await serverStats();
    break;

  case "get-member":
    if (!opts.user) {
      console.error("--user required");
      process.exit(1);
    }
    await getMember(opts.user);
    break;

  case "add-role":
    if (!opts.user || !opts.role) {
      console.error("--user and --role required");
      process.exit(1);
    }
    await addRole(opts.user, opts.role);
    break;

  case "remove-role":
    if (!opts.user || !opts.role) {
      console.error("--user and --role required");
      process.exit(1);
    }
    await removeRole(opts.user, opts.role);
    break;

  case "send-message":
    if (!opts.channel || !opts.content) {
      console.error("--channel and --content required");
      process.exit(1);
    }
    await sendMessage(opts.channel, opts.content);
    break;

  case "send-embed":
    if (!opts.channel || !opts.title || !opts.description) {
      console.error("--channel, --title, and --description required");
      process.exit(1);
    }
    await sendEmbed(opts.channel, opts.title, opts.description, opts.color);
    break;

  case "timeout":
    if (!opts.user || !opts.duration || !opts.reason) {
      console.error("--user, --duration, and --reason required");
      process.exit(1);
    }
    await timeoutMember(opts.user, opts.duration, opts.reason);
    break;

  case "kick":
    if (!opts.user || !opts.reason) {
      console.error("--user and --reason required");
      process.exit(1);
    }
    await kickMember(opts.user, opts.reason);
    break;

  case "ban":
    if (!opts.user || !opts.reason) {
      console.error("--user and --reason required");
      process.exit(1);
    }
    await banMember(opts.user, opts.reason, opts.deleteDays);
    break;

  case "--help":
  case "-h":
  case "help":
    printHelp();
    break;

  default:
    if (opts.command) {
      console.error(`Unknown command: ${opts.command}`);
    }
    printHelp();
    process.exit(opts.command ? 1 : 0);
}
