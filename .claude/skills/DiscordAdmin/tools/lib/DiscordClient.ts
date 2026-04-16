/**
 * DiscordClient.ts - Discord Gateway WebSocket client for PAI
 *
 * Handles:
 * - Gateway WebSocket connection with heartbeat
 * - Message sending via REST API
 * - Message chunking for Discord's 2000 char limit
 * - Typing indicators
 * - Reconnect/resume on disconnect
 */

import { existsSync } from 'fs';
import { join } from 'path';

// ============================================================================
// Types
// ============================================================================

export interface DiscordMessage {
  id: string;
  channel_id: string;
  author: {
    id: string;
    username: string;
    bot?: boolean;
  };
  content: string;
  timestamp: string;
  guild_id?: string;
  referenced_message?: DiscordMessage | null;
}

export interface GatewayPayload {
  op: number;
  d: unknown;
  s?: number | null;
  t?: string | null;
}

export type MessageHandler = (message: DiscordMessage) => Promise<void>;

// Gateway Opcodes
const GatewayOp = {
  DISPATCH: 0,
  HEARTBEAT: 1,
  IDENTIFY: 2,
  PRESENCE_UPDATE: 3,
  VOICE_STATE_UPDATE: 4,
  RESUME: 6,
  RECONNECT: 7,
  REQUEST_GUILD_MEMBERS: 8,
  INVALID_SESSION: 9,
  HELLO: 10,
  HEARTBEAT_ACK: 11,
} as const;

// Intents
const Intents = {
  GUILDS: 1 << 0,
  GUILD_MESSAGES: 1 << 9,
  MESSAGE_CONTENT: 1 << 15,
};

const GATEWAY_INTENTS = Intents.GUILDS | Intents.GUILD_MESSAGES | Intents.MESSAGE_CONTENT;

// ============================================================================
// Environment Loading
// ============================================================================

const PAI_DIR = process.env.PAI_DIR || join(process.env.HOME!, '.claude');

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

// ============================================================================
// Logging
// ============================================================================

function log(message: string): void {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [DiscordClient] ${message}`);
}

// ============================================================================
// DiscordClient Class
// ============================================================================

export class DiscordClient {
  private token: string;
  private guildId: string;
  private channelIds: string[];
  private ownerId: string;
  private baseUrl: string = 'https://discord.com/api/v10';

  // Gateway state
  private ws: WebSocket | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private heartbeatAcked: boolean = true;
  private sequence: number | null = null;
  private sessionId: string | null = null;
  private resumeGatewayUrl: string | null = null;
  private messageHandler: MessageHandler | null = null;
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;

  constructor() {
    this.token = process.env.DISCORD_BOT_TOKEN || '';
    this.guildId = process.env.DISCORD_GUILD_ID || '';
    this.ownerId = process.env.DISCORD_OWNER_ID || '';

    // Build list of monitored channel IDs
    const paiChannel = process.env.DISCORD_PAI_CHANNEL_ID || '';
    const josephChannel = process.env.DISCORD_JOSEPH_CHANNEL_ID || '';
    this.channelIds = [paiChannel, josephChannel].filter(Boolean);

    if (!this.token) {
      throw new Error('DISCORD_BOT_TOKEN not found in environment');
    }
    if (!this.guildId) {
      throw new Error('DISCORD_GUILD_ID not found in environment');
    }
    if (this.channelIds.length === 0) {
      throw new Error('No channel IDs configured (DISCORD_PAI_CHANNEL_ID or DISCORD_JOSEPH_CHANNEL_ID)');
    }
    if (!this.ownerId) {
      throw new Error('DISCORD_OWNER_ID not found in environment');
    }
  }

  /**
   * Set the message handler callback
   */
  onMessage(handler: MessageHandler): void {
    this.messageHandler = handler;
  }

  /**
   * Connect to the Discord Gateway
   */
  async connect(): Promise<void> {
    if (this.isConnecting) return;
    this.isConnecting = true;

    try {
      const gatewayUrl = this.resumeGatewayUrl || await this.getGatewayUrl();
      log(`Connecting to Gateway: ${gatewayUrl}`);

      this.ws = new WebSocket(`${gatewayUrl}?v=10&encoding=json`);

      this.ws.onopen = () => {
        log('Gateway WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event: MessageEvent) => {
        this.handleGatewayMessage(event.data as string);
      };

      this.ws.onclose = (event: CloseEvent) => {
        log(`Gateway disconnected: ${event.code} ${event.reason}`);
        this.cleanup();
        this.handleDisconnect(event.code);
      };

      this.ws.onerror = (event: Event) => {
        log(`Gateway error: ${event}`);
      };
    } catch (error) {
      this.isConnecting = false;
      throw error;
    }
  }

  /**
   * Get the Gateway URL from Discord
   */
  private async getGatewayUrl(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/gateway/bot`, {
      headers: { Authorization: `Bot ${this.token}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to get Gateway URL: ${response.status}`);
    }

    const data = await response.json() as { url: string };
    return data.url;
  }

  /**
   * Handle incoming Gateway messages
   */
  private handleGatewayMessage(raw: string): void {
    const payload: GatewayPayload = JSON.parse(raw);

    // Update sequence number
    if (payload.s !== null && payload.s !== undefined) {
      this.sequence = payload.s;
    }

    switch (payload.op) {
      case GatewayOp.HELLO:
        this.handleHello(payload.d as { heartbeat_interval: number });
        break;

      case GatewayOp.HEARTBEAT:
        this.sendHeartbeat();
        break;

      case GatewayOp.HEARTBEAT_ACK:
        this.heartbeatAcked = true;
        break;

      case GatewayOp.DISPATCH:
        this.handleDispatch(payload.t!, payload.d);
        break;

      case GatewayOp.RECONNECT:
        log('Received RECONNECT, reconnecting...');
        this.ws?.close(4000, 'Reconnect requested');
        break;

      case GatewayOp.INVALID_SESSION:
        const canResume = payload.d as boolean;
        log(`Invalid session, resumable: ${canResume}`);
        if (!canResume) {
          this.sessionId = null;
          this.sequence = null;
        }
        setTimeout(() => this.connect(), 1000 + Math.random() * 4000);
        break;
    }
  }

  /**
   * Handle HELLO - start heartbeat and identify/resume
   */
  private handleHello(data: { heartbeat_interval: number }): void {
    log(`Heartbeat interval: ${data.heartbeat_interval}ms`);

    // Start heartbeat
    this.startHeartbeat(data.heartbeat_interval);

    // Send initial heartbeat with jitter
    setTimeout(() => this.sendHeartbeat(), Math.random() * data.heartbeat_interval);

    // Identify or resume
    if (this.sessionId && this.sequence !== null) {
      this.sendResume();
    } else {
      this.sendIdentify();
    }
  }

  /**
   * Start the heartbeat interval
   */
  private startHeartbeat(interval: number): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (!this.heartbeatAcked) {
        log('Heartbeat not acknowledged, reconnecting...');
        this.ws?.close(4000, 'Heartbeat timeout');
        return;
      }
      this.heartbeatAcked = false;
      this.sendHeartbeat();
    }, interval);
  }

  /**
   * Send heartbeat
   */
  private sendHeartbeat(): void {
    this.wsSend({ op: GatewayOp.HEARTBEAT, d: this.sequence });
  }

  /**
   * Send IDENTIFY payload
   */
  private sendIdentify(): void {
    log('Sending IDENTIFY');
    this.wsSend({
      op: GatewayOp.IDENTIFY,
      d: {
        token: this.token,
        intents: GATEWAY_INTENTS,
        properties: {
          os: 'linux',
          browser: 'pai-discord-bot',
          device: 'pai-discord-bot',
        },
      },
    });
  }

  /**
   * Send RESUME payload
   */
  private sendResume(): void {
    log(`Resuming session: ${this.sessionId}`);
    this.wsSend({
      op: GatewayOp.RESUME,
      d: {
        token: this.token,
        session_id: this.sessionId,
        seq: this.sequence,
      },
    });
  }

  /**
   * Handle DISPATCH events
   */
  private handleDispatch(event: string, data: unknown): void {
    switch (event) {
      case 'READY': {
        const ready = data as { session_id: string; resume_gateway_url: string; user: { username: string } };
        this.sessionId = ready.session_id;
        this.resumeGatewayUrl = ready.resume_gateway_url;
        log(`Ready! Logged in as ${ready.user.username} (session: ${this.sessionId})`);
        break;
      }

      case 'RESUMED':
        log('Session resumed successfully');
        break;

      case 'MESSAGE_CREATE': {
        const message = data as DiscordMessage;

        // Ignore bot messages
        if (message.author.bot) return;

        // Only process messages from monitored channels
        if (!this.channelIds.includes(message.channel_id)) return;

        // Only process messages from the authorized owner
        if (message.author.id !== this.ownerId) {
          log(`Unauthorized user ${message.author.username} (${message.author.id}) - ignoring`);
          this.sendSingle(message.channel_id, 'This channel is restricted to the PAI owner.').catch(() => {});
          return;
        }

        if (this.messageHandler) {
          this.messageHandler(message).catch((err) => {
            log(`Message handler error: ${err}`);
          });
        }
        break;
      }
    }
  }

  /**
   * Handle disconnect - attempt reconnect
   */
  private handleDisconnect(code: number): void {
    // Codes that should not reconnect
    const noReconnectCodes = [4004, 4010, 4011, 4012, 4013, 4014];
    if (noReconnectCodes.includes(code)) {
      log(`Fatal close code ${code}, not reconnecting`);
      process.exit(1);
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      log('Max reconnect attempts reached, exiting');
      process.exit(1);
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => this.connect(), delay);
  }

  /**
   * Cleanup on disconnect
   */
  private cleanup(): void {
    this.isConnecting = false;
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Send a payload through the WebSocket
   */
  private wsSend(payload: { op: number; d: unknown }): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  // ========================================================================
  // REST API Methods
  // ========================================================================

  /**
   * Send a text message to a channel
   * Automatically chunks messages over 2000 characters
   */
  async send(channelId: string, text: string): Promise<void> {
    const MAX_LENGTH = 1900; // Leave buffer

    const chunks = this.chunkMessage(text, MAX_LENGTH);

    for (const chunk of chunks) {
      await this.sendSingle(channelId, chunk);
      if (chunks.length > 1) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }
  }

  /**
   * Send a single message via REST API
   */
  private async sendSingle(channelId: string, text: string): Promise<DiscordMessage> {
    const response = await fetch(`${this.baseUrl}/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: text }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Discord API error (${response.status}): ${error}`);
    }

    return response.json();
  }

  /**
   * Send typing indicator
   */
  async sendTyping(channelId: string): Promise<void> {
    await fetch(`${this.baseUrl}/channels/${channelId}/typing`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${this.token}`,
      },
    }).catch(() => {}); // Non-critical, don't throw
  }

  /**
   * Chunk a long message into smaller pieces
   */
  private chunkMessage(text: string, maxLength: number): string[] {
    if (text.length <= maxLength) {
      return [text];
    }

    const chunks: string[] = [];
    let remaining = text;

    while (remaining.length > 0) {
      if (remaining.length <= maxLength) {
        chunks.push(remaining);
        break;
      }

      let splitIndex = maxLength;

      // Try to split at a natural boundary
      const paragraphBreak = remaining.lastIndexOf('\n\n', maxLength);
      if (paragraphBreak > maxLength * 0.5) {
        splitIndex = paragraphBreak + 2;
      } else {
        const lineBreak = remaining.lastIndexOf('\n', maxLength);
        if (lineBreak > maxLength * 0.5) {
          splitIndex = lineBreak + 1;
        } else {
          const sentenceEnd = remaining.lastIndexOf('. ', maxLength);
          if (sentenceEnd > maxLength * 0.5) {
            splitIndex = sentenceEnd + 2;
          }
        }
      }

      chunks.push(remaining.substring(0, splitIndex).trim());
      remaining = remaining.substring(splitIndex).trim();
    }

    return chunks;
  }

  /**
   * Get bot info
   */
  async getMe(): Promise<{ id: string; username: string }> {
    const response = await fetch(`${this.baseUrl}/users/@me`, {
      headers: { Authorization: `Bot ${this.token}` },
    });

    if (!response.ok) {
      throw new Error(`Discord API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get the primary (PAI) channel ID
   */
  getChannelId(): string {
    return this.channelIds[0] || '';
  }

  /**
   * Get all monitored channel IDs
   */
  getChannelIds(): string[] {
    return this.channelIds;
  }

  /**
   * Get the configured guild ID
   */
  getGuildId(): string {
    return this.guildId;
  }

  /**
   * Get the authorized owner ID
   */
  getOwnerId(): string {
    return this.ownerId;
  }

  /**
   * Disconnect from the Gateway
   */
  disconnect(): void {
    this.cleanup();
    if (this.ws) {
      this.ws.close(1000, 'Bot shutting down');
      this.ws = null;
    }
  }
}

export default DiscordClient;
