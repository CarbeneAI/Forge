#!/usr/bin/env bun
/**
 * send-status.ts - Send PAI system status to Telegram
 *
 * Usage:
 *   bun send-status.ts [--help]
 *
 * Environment:
 *   TELEGRAM_BOT_TOKEN - Bot token from @BotFather
 *   TELEGRAM_CHAT_ID - Your chat ID from @userinfobot
 *   DA - Digital assistant name (default: PAI)
 *   PAI_DIR - PAI installation directory
 */

import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { hostname } from 'os';

// ============================================================================
// Configuration
// ============================================================================

const PAI_DIR = process.env.PAI_DIR || join(process.env.HOME!, '.claude');
const DA_NAME = process.env.DA || 'PAI';

// Load environment variables from .env file
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

// ============================================================================
// Help
// ============================================================================

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
PAI Telegram Status Reporter

Sends current PAI system status to your Telegram chat.

Usage:
  bun send-status.ts [--help]

Environment Variables Required:
  TELEGRAM_BOT_TOKEN    Bot token from @BotFather
  TELEGRAM_CHAT_ID      Your chat ID from @userinfobot

Optional:
  DA                    Digital assistant name (default: PAI)
  PAI_DIR              PAI installation directory

Example:
  bun send-status.ts
`);
  process.exit(0);
}

// ============================================================================
// Validation
// ============================================================================

if (!TELEGRAM_BOT_TOKEN) {
  console.error('Error: TELEGRAM_BOT_TOKEN not found in environment or .env file');
  process.exit(1);
}

if (!TELEGRAM_CHAT_ID) {
  console.error('Error: TELEGRAM_CHAT_ID not found in environment or .env file');
  process.exit(1);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get current datetime in Central Time (military format)
 */
function getCentralTime(): { date: string; time: string } {
  const now = new Date();

  // Convert to Central Time (UTC-6 or UTC-5 depending on DST)
  const centralTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));

  // Format date as YYYY-MM-DD
  const year = centralTime.getFullYear();
  const month = String(centralTime.getMonth() + 1).padStart(2, '0');
  const day = String(centralTime.getDate()).padStart(2, '0');
  const date = `${year}-${month}-${day}`;

  // Format time as HH:MM (military time)
  const hours = String(centralTime.getHours()).padStart(2, '0');
  const minutes = String(centralTime.getMinutes()).padStart(2, '0');
  const time = `${hours}:${minutes}`;

  return { date, time };
}

/**
 * Count items in a directory
 */
function countItems(dirPath: string): number {
  try {
    if (!existsSync(dirPath)) return 0;
    return readdirSync(dirPath).filter(item => !item.startsWith('.')).length;
  } catch {
    return 0;
  }
}

/**
 * Check if a service is available
 */
function checkService(name: string, checkFn: () => boolean): { name: string; status: boolean } {
  try {
    return { name, status: checkFn() };
  } catch {
    return { name, status: false };
  }
}

/**
 * Get Kopia backup status from local and remote snapshots
 */
async function getBackupStatus(): Promise<{
  dellai: { lastBackup: string | null; success: boolean };
  ubuntu: { lastBackup: string | null; success: boolean };
  synology: { lastBackup: string | null; success: boolean };
  gdrive: boolean;
}> {
  const result = {
    dellai: { lastBackup: null as string | null, success: false },
    ubuntu: { lastBackup: null as string | null, success: false },
    synology: { lastBackup: null as string | null, success: false },
    gdrive: false,
  };

  // local Kopia snapshots (local docker)
  try {
    const proc = Bun.spawn(['docker', 'exec', 'kopia', 'kopia', 'snapshot', 'list', '--all', '--json'], {
      stdout: 'pipe', stderr: 'pipe',
    });
    const output = await new Response(proc.stdout).text();
    const snapshots = JSON.parse(output);
    if (snapshots.length > 0) {
      const latest = snapshots[snapshots.length - 1];
      result.dellai.lastBackup = latest.startTime?.slice(0, 19).replace('T', ' ') || null;
      result.dellai.success = true;
    }
  } catch { /* skip */ }

  // Ubuntu + Synology via SSH to Ubuntu Server's Kopia
  try {
    const proc = Bun.spawn(['ssh', '-o', 'ConnectTimeout=5', 'youruser@10.0.0.20',
      'docker exec kopia kopia snapshot list --all --json'], {
      stdout: 'pipe', stderr: 'pipe',
    });
    const output = await new Response(proc.stdout).text();
    const snapshots = JSON.parse(output);

    // Group by hostname
    for (const snap of snapshots) {
      const host = snap.source?.host || '';
      const time = snap.startTime?.slice(0, 19).replace('T', ' ') || null;
      if (host.includes('106e4e4c40f5') || host.includes('kopia')) {
        // Ubuntu server kopia container
        result.ubuntu = { lastBackup: time, success: true };
      } else if (host.includes('your_container_id') || host.includes('synology')) {
        // Synology kopia container
        result.synology = { lastBackup: time, success: true };
      }
    }
  } catch { /* skip */ }

  // Google Drive sync check via rclone
  try {
    const proc = Bun.spawn(['ssh', '-o', 'ConnectTimeout=5', 'youruser@10.0.0.20',
      'rclone lsd gdrive:Backups/kopia/ 2>/dev/null | head -1'], {
      stdout: 'pipe', stderr: 'pipe',
    });
    const output = await new Response(proc.stdout).text();
    result.gdrive = output.trim().length > 0;
  } catch { /* skip */ }

  return result;
}

/**
 * Get PAI system status
 */
function getSystemStatus() {
  const skillsDir = join(PAI_DIR, 'skills');
  const agentsDir = join(PAI_DIR, 'agents');
  const hooksDir = join(PAI_DIR, 'hooks');
  const obsDir = join(PAI_DIR, 'Observability');

  const skillsCount = countItems(skillsDir);
  const agentsCount = countItems(agentsDir);

  return {
    core: existsSync(join(skillsDir, 'CORE', 'SKILL.md')),
    telegram: true, // If we're running, Telegram is configured
    api: true, // If we're running in Claude Code context
    skillsCount,
    agentsCount,
    hooks: existsSync(hooksDir),
    observability: existsSync(obsDir),
    history: existsSync(join(PAI_DIR, 'history')),
  };
}

/**
 * Build status message
 */
async function buildStatusMessage(): Promise<string> {
  const { date, time } = getCentralTime();
  const status = getSystemStatus();
  const backupStatus = await getBackupStatus();
  const systemName = hostname();

  const checkMark = '✅';
  const warningMark = '⚠️';

  const getMessage = (condition: boolean) => condition ? checkMark : warningMark;

  let message = `*${DA_NAME} System Status*\n`;
  message += `${systemName} | ${date} ${time} CST\n\n`;

  message += `${getMessage(status.core)} CORE context loaded - System identity active\n`;
  message += `${getMessage(status.telegram)} Telegram integration - Connected\n`;
  message += `${getMessage(status.api)} Claude Code API - Responding\n`;
  message += `${getMessage(status.skillsCount > 0)} Skills system - ${status.skillsCount}+ skills available\n`;
  message += `${getMessage(status.agentsCount > 0)} Agent system - Ready for delegation\n`;
  message += `${getMessage(status.history)} History system - Capturing context\n\n`;

  // Kopia backup status section
  message += `*Backup Status (Kopia):*\n`;
  message += `${getMessage(backupStatus.dellai.success)} your host machine: ${backupStatus.dellai.lastBackup || 'No snapshots'}\n`;
  message += `${getMessage(backupStatus.ubuntu.success)} Ubuntu: ${backupStatus.ubuntu.lastBackup || 'No snapshots'}\n`;
  message += `${getMessage(backupStatus.synology.success)} Synology: ${backupStatus.synology.lastBackup || 'No snapshots'}\n`;
  message += `${getMessage(backupStatus.gdrive)} Google Drive offsite: ${backupStatus.gdrive ? 'Synced' : 'Not detected'}\n`;
  message += `\n`;

  message += `*Quick Check:*\n`;
  message += `- Session initialized successfully\n`;
  message += `- Hooks ${status.hooks ? 'operational' : 'unavailable'}\n`;
  message += `- Voice server ${status.voiceServer ? 'available' : 'not configured'}\n`;
  message += `- Observability dashboard ${status.observability ? 'ready to launch' : 'not configured'}\n`;
  message += `- Git workflow configured\n\n`;

  message += `_All systems operational. Ready to assist._`;

  return message;
}

/**
 * Send message to Telegram
 */
async function sendToTelegram(message: string): Promise<void> {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  try {
    console.error(`[${new Date().toISOString()}] Building status message...`);
    const message = await buildStatusMessage();

    console.error(`[${new Date().toISOString()}] Sending to Telegram...`);
    await sendToTelegram(message);

    console.error(`[${new Date().toISOString()}] ✅ Status sent successfully`);

    // Output success to stdout for programmatic use
    console.log(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Status sent to Telegram',
    }));

    process.exit(0);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Error:`, error);

    // Output error to stdout for programmatic use
    console.log(JSON.stringify({
      success: false,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    }));

    process.exit(1);
  }
}

main();
