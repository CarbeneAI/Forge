#!/usr/bin/env bun
/**
 * Status.ts - Unified PAI system overview
 *
 * Comprehensive dashboard showing PAI health, services, infrastructure, and activity.
 *
 * Usage:
 *   bun Status.ts              # Terminal output with colors
 *   bun Status.ts --telegram   # Also send via Telegram
 *   bun Status.ts --json       # JSON output (machine-readable)
 *   bun Status.ts --help       # Show this help
 *
 * Environment:
 *   PAI_DIR              - PAI installation directory (auto-resolved)
 *   TELEGRAM_BOT_TOKEN   - Bot token for Telegram notifications
 *   TELEGRAM_CHAT_ID     - Chat ID for Telegram notifications
 */

import { existsSync, readdirSync, statSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { execSync } from 'child_process';

// ─── Path Resolution ────────────────────────────────────────────────────────

const SCRIPT_DIR = import.meta.dir;
// tools/ -> CORE/ -> skills/ -> .claude/
const PAI_DIR = resolve(SCRIPT_DIR, '..', '..', '..');
const REPO_ROOT = resolve(PAI_DIR, '..');
const HOME = process.env.HOME || '/home/youruser';

// ─── ANSI Colors ────────────────────────────────────────────────────────────

const C = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  reset: '\x1b[0m',
};

// ─── Types ──────────────────────────────────────────────────────────────────

interface StatusData {
  system: {
    hostname: string;
    datetime: string;
    timezone: string;
    uptime: string;
    paiVersion: string;
  };
  components: {
    skills: number;
    agents: number;
    hooks: number;
    tools: number;
  };
  services: {
    memoryStats: boolean;
    observabilityDashboard: boolean;
    observabilityServer: boolean;
    voiceServer: boolean;
  };
  cron: {
    local: number;
    ubuntu: number | null;
  };
  disk: {
    homeUsage: string;
    homePercent: string;
    homeTotal: string;
    historySize: string;
    scratchpadSize: string;
  };
  activity: {
    lastSessionDate: string;
    lastSessionRelative: string;
    lastCommitHash: string;
    lastCommitMessage: string;
    lastCommitDate: string;
  };
  nodes: {
    ubuntu: boolean;
    synology: boolean;
    proxmox: boolean;
  };
}

// ─── Argument Parsing ───────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
PAI System Status

Usage:
  bun Status.ts [options]

Options:
  --telegram    Also send status to Telegram
  --json        Output as JSON (machine-readable)
  --help, -h    Show this help message

Environment Variables:
  PAI_DIR              PAI installation directory (auto-resolved)
  TELEGRAM_BOT_TOKEN   Bot token for Telegram notifications
  TELEGRAM_CHAT_ID     Chat ID for Telegram notifications
`);
    process.exit(0);
  }

  return {
    telegram: args.includes('--telegram'),
    json: args.includes('--json'),
  };
}

// ─── Load Environment ───────────────────────────────────────────────────────

function loadEnv() {
  const envPath = join(PAI_DIR, '.env');
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf-8');
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
}

// ─── Utility Functions ──────────────────────────────────────────────────────

function shellExec(cmd: string, timeout = 5000): string | null {
  try {
    return execSync(cmd, { encoding: 'utf-8', timeout }).trim();
  } catch {
    return null;
  }
}

function countFiles(dirPath: string, extensions?: string[]): number {
  try {
    if (!existsSync(dirPath)) return 0;
    const items = readdirSync(dirPath);
    if (!extensions) return items.filter(i => !i.startsWith('.')).length;
    return items.filter(i => extensions.some(ext => i.endsWith(ext))).length;
  } catch {
    return 0;
  }
}

function formatUptime(uptimeStr: string): string {
  // Convert "up 18 hours, 47 minutes" to "18h 47m"
  const match = uptimeStr.match(/up\s+(?:(\d+)\s+days?,\s*)?(?:(\d+)\s+hours?,\s*)?(?:(\d+)\s+minutes?)?/);
  if (!match) return uptimeStr;

  const [, days, hours, minutes] = match;
  const parts: string[] = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);

  return parts.join(' ') || 'up';
}

function getRelativeTime(dateStr: string): string {
  try {
    const target = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - target.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  } catch {
    return dateStr;
  }
}

async function probePort(port: number, timeout = 2000): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:${port}/health`, {
      signal: AbortSignal.timeout(timeout),
    });
    return response.ok;
  } catch {
    // Try without /health endpoint
    try {
      const response = await fetch(`http://localhost:${port}`, {
        signal: AbortSignal.timeout(timeout),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

async function pingHost(ip: string, timeout = 1000): Promise<boolean> {
  try {
    const result = shellExec(`ping -c 1 -W 1 ${ip} >/dev/null 2>&1 && echo ok`, timeout);
    return result === 'ok';
  } catch {
    return false;
  }
}

// ─── Status Data Collection ─────────────────────────────────────────────────

async function collectStatusData(): Promise<StatusData> {
  // System info
  const hostname = shellExec('hostname') || 'unknown';
  const uptimeRaw = shellExec('uptime -p') || 'unknown';
  const uptime = formatUptime(uptimeRaw);

  const now = new Date();
  const centralTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  const datetime = centralTime.toISOString().slice(0, 16).replace('T', ' ');
  const timezone = 'CST';

  // PAI version (last git commit)
  const gitHash = shellExec(`git -C "${REPO_ROOT}" rev-parse --short HEAD 2>/dev/null`) || 'unknown';
  const gitDate = shellExec(`git -C "${REPO_ROOT}" log -1 --format=%cd --date=short 2>/dev/null`) || 'unknown';
  const paiVersion = `${gitHash} (${gitDate})`;

  // Components
  const skillsCount = countFiles(join(PAI_DIR, 'skills'));
  const agentsCount = countFiles(join(PAI_DIR, 'agents'), ['.md']);
  const hooksCount = countFiles(join(PAI_DIR, 'hooks'), ['.ts']);
  const toolsCount = countFiles(join(PAI_DIR, 'skills', 'CORE', 'tools'));

  // Services (probe ports)
  const memoryStats = await probePort(8084);
  const observabilityDashboard = await probePort(5172);
  const observabilityServer = await probePort(4000);
  const voiceServer = await probePort(8888);

  // Cron jobs
  const cronList = shellExec('crontab -l 2>/dev/null') || '';
  const localCronJobs = cronList.split('\n').filter(line => {
    return !line.trim().startsWith('#') &&
           (line.includes('bun') || line.includes('PAI') || line.includes('.claude'));
  }).length;

  // Ubuntu server cron (via SSH, graceful failure)
  let ubuntuCronJobs: number | null = null;
  try {
    const remoteHost = process.env.REMOTE_SSH_HOST || 'youruser@10.0.0.20';
    const ubuntuCron = shellExec(`ssh -o ConnectTimeout=5 ${remoteHost} "crontab -l 2>/dev/null | grep -E '(bun|PAI|.claude)' | grep -v '^#' | wc -l"`, 5000);
    if (ubuntuCron) {
      ubuntuCronJobs = parseInt(ubuntuCron, 10);
    }
  } catch {
    // SSH failed, leave as null
  }

  // Disk usage
  const dfOutput = shellExec('df -h /home') || '';
  const dfLines = dfOutput.split('\n');
  const dfData = dfLines[1]?.split(/\s+/) || [];
  const homeTotal = dfData[1] || 'unknown';
  const homeUsage = dfData[2] || 'unknown';
  const homePercent = dfData[4] || 'unknown';

  const historySize = shellExec(`du -sh "${join(PAI_DIR, 'history')}" 2>/dev/null | cut -f1`) || 'unknown';
  const scratchpadSize = shellExec(`du -sh "${join(PAI_DIR, 'scratchpad')}" 2>/dev/null | cut -f1`) || 'unknown';

  // Last activity
  const sessionsDir = join(PAI_DIR, 'history', 'sessions');
  let lastSessionDate = 'unknown';
  let lastSessionRelative = 'unknown';

  if (existsSync(sessionsDir)) {
    // Find most recent session file
    const allSessions: string[] = [];
    const walk = (dir: string) => {
      try {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
          const fullPath = join(dir, entry.name);
          if (entry.isDirectory()) {
            walk(fullPath);
          } else if (entry.isFile() && entry.name.endsWith('.md')) {
            allSessions.push(fullPath);
          }
        }
      } catch {
        // Permission denied or similar
      }
    };
    walk(sessionsDir);

    if (allSessions.length > 0) {
      // Sort by mtime
      allSessions.sort((a, b) => {
        try {
          const statA = statSync(a);
          const statB = statSync(b);
          return statB.mtimeMs - statA.mtimeMs;
        } catch {
          return 0;
        }
      });

      const latestFile = allSessions[0];
      try {
        const stat = statSync(latestFile);
        const mtime = stat.mtime;
        lastSessionDate = mtime.toISOString().slice(0, 10);
        lastSessionRelative = getRelativeTime(lastSessionDate);
      } catch {
        // Can't stat file
      }
    }
  }

  // Last git commit
  const lastCommitHash = shellExec(`git -C "${REPO_ROOT}" log -1 --format=%h 2>/dev/null`) || 'unknown';
  const lastCommitMessage = shellExec(`git -C "${REPO_ROOT}" log -1 --format=%s 2>/dev/null`) || 'unknown';
  const lastCommitDate = shellExec(`git -C "${REPO_ROOT}" log -1 --format=%cr 2>/dev/null`) || 'unknown';

  // Node health — configure your homelab IPs via environment variables or edit these defaults
  const ubuntuOnline = await pingHost(process.env.NODE_UBUNTU_IP || '10.0.0.20', 1000);
  const synologyOnline = await pingHost(process.env.NODE_NAS_IP || '10.0.0.30', 1000);
  const proxmoxOnline = await pingHost(process.env.NODE_PROXMOX_IP || '10.0.0.40', 1000);

  return {
    system: {
      hostname,
      datetime,
      timezone,
      uptime,
      paiVersion,
    },
    components: {
      skills: skillsCount,
      agents: agentsCount,
      hooks: hooksCount,
      tools: toolsCount,
    },
    services: {
      memoryStats,
      observabilityDashboard,
      observabilityServer,
      voiceServer,
    },
    cron: {
      local: localCronJobs,
      ubuntu: ubuntuCronJobs,
    },
    disk: {
      homeUsage,
      homePercent,
      homeTotal,
      historySize,
      scratchpadSize,
    },
    activity: {
      lastSessionDate,
      lastSessionRelative,
      lastCommitHash,
      lastCommitMessage,
      lastCommitDate,
    },
    nodes: {
      ubuntu: ubuntuOnline,
      synology: synologyOnline,
      proxmox: proxmoxOnline,
    },
  };
}

// ─── Terminal Output ────────────────────────────────────────────────────────

function printTerminalStatus(data: StatusData): void {
  const upIcon = `${C.green}UP${C.reset}`;
  const downIcon = `${C.dim}--${C.reset}`;

  console.log(`\n${C.bold}PAI System Status${C.reset}`);
  console.log('='.repeat(60));
  console.log(`${data.system.hostname} | ${data.system.datetime} ${data.system.timezone} | up ${data.system.uptime}`);
  console.log('');

  // Components
  console.log(`${C.bold}[Components]${C.reset}`);
  console.log(`  ${C.cyan}Skills:${C.reset} ${data.components.skills}    ${C.cyan}Agents:${C.reset} ${data.components.agents}    ${C.cyan}Hooks:${C.reset} ${data.components.hooks}    ${C.cyan}Tools:${C.reset} ${data.components.tools}`);
  console.log('');

  // Services
  console.log(`${C.bold}[Services]${C.reset}`);
  const memoryIcon = data.services.memoryStats ? upIcon : downIcon;
  const obsDashIcon = data.services.observabilityDashboard ? upIcon : downIcon;
  const obsServIcon = data.services.observabilityServer ? upIcon : downIcon;
  const voiceIcon = data.services.voiceServer ? upIcon : downIcon;

  console.log(`  ${memoryIcon}  Memory Stats (8084)`);
  if (data.services.observabilityDashboard && data.services.observabilityServer) {
    console.log(`  ${C.green}UP${C.reset}  Observability (5172/4000)`);
  } else if (!data.services.observabilityDashboard && !data.services.observabilityServer) {
    console.log(`  ${downIcon}  Observability (5172/4000)`);
  } else {
    console.log(`  ${C.yellow}⚠️${C.reset}  Observability (partial: ${obsDashIcon} 5172, ${obsServIcon} 4000)`);
  }
  console.log(`  ${voiceIcon}  Voice Server (8888)`);
  console.log('');

  // Cron jobs
  console.log(`${C.bold}[Cron Jobs]${C.reset}`);
  const ubuntuCronDisplay = data.cron.ubuntu !== null ? `${data.cron.ubuntu} jobs` : '(unreachable)';
  console.log(`  ${C.cyan}Local:${C.reset} ${data.cron.local} jobs    ${C.cyan}Ubuntu:${C.reset} ${ubuntuCronDisplay}`);
  console.log('');

  // Disk
  console.log(`${C.bold}[Disk]${C.reset}`);
  console.log(`  ${C.cyan}/home:${C.reset} ${data.disk.homePercent} of ${data.disk.homeTotal}    ${C.cyan}History:${C.reset} ${data.disk.historySize}    ${C.cyan}Scratchpad:${C.reset} ${data.disk.scratchpadSize}`);
  console.log('');

  // Last activity
  console.log(`${C.bold}[Last Activity]${C.reset}`);
  console.log(`  ${C.cyan}Session:${C.reset} ${data.activity.lastSessionDate} (${data.activity.lastSessionRelative})`);
  const truncatedMessage = data.activity.lastCommitMessage.length > 50
    ? data.activity.lastCommitMessage.slice(0, 47) + '...'
    : data.activity.lastCommitMessage;
  console.log(`  ${C.cyan}Commit:${C.reset}  ${data.activity.lastCommitHash} "${truncatedMessage}" (${data.activity.lastCommitDate})`);
  console.log('');

  // Nodes
  console.log(`${C.bold}[Nodes]${C.reset}`);
  const ubuntuStatus = data.nodes.ubuntu ? upIcon : `${C.red}DOWN${C.reset}`;
  const synologyStatus = data.nodes.synology ? upIcon : `${C.red}DOWN${C.reset}`;
  const proxmoxStatus = data.nodes.proxmox ? upIcon : `${C.red}DOWN${C.reset}`;
  console.log(`  ${ubuntuStatus}  Ubuntu Server    ${synologyStatus}  Synology    ${proxmoxStatus}  Proxmox`);
  console.log('');

  console.log('='.repeat(60));

  // Overall status
  const allServicesUp = data.services.memoryStats &&
                       data.services.observabilityDashboard &&
                       data.services.observabilityServer &&
                       data.services.voiceServer;
  const allNodesUp = data.nodes.ubuntu && data.nodes.synology && data.nodes.proxmox;

  if (allServicesUp && allNodesUp) {
    console.log(`${C.green}All systems operational.${C.reset}\n`);
  } else if (!allNodesUp) {
    console.log(`${C.yellow}Some infrastructure nodes are offline.${C.reset}\n`);
  } else {
    console.log(`${C.yellow}Some services are not running.${C.reset}\n`);
  }
}

// ─── JSON Output ────────────────────────────────────────────────────────────

function printJsonStatus(data: StatusData): void {
  console.log(JSON.stringify(data, null, 2));
}

// ─── Telegram Output ────────────────────────────────────────────────────────

async function sendTelegramStatus(data: StatusData): Promise<void> {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error(`${C.red}Error: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set in .env${C.reset}`);
    return;
  }

  // Build Markdown message
  let message = `*PAI System Status*\n`;
  message += `${data.system.hostname} | ${data.system.datetime} ${data.system.timezone} | up ${data.system.uptime}\n\n`;

  message += `*Components*\n`;
  message += `Skills: ${data.components.skills} | Agents: ${data.components.agents} | Hooks: ${data.components.hooks} | Tools: ${data.components.tools}\n\n`;

  message += `*Services*\n`;
  const memoryIcon = data.services.memoryStats ? '✅' : '❌';
  const obsIcon = (data.services.observabilityDashboard && data.services.observabilityServer) ? '✅' : '❌';
  const voiceIcon = data.services.voiceServer ? '✅' : '❌';
  message += `${memoryIcon} Memory Stats (8084)\n`;
  message += `${obsIcon} Observability (5172/4000)\n`;
  message += `${voiceIcon} Voice Server (8888)\n\n`;

  message += `*Cron Jobs*\n`;
  const ubuntuCronDisplay = data.cron.ubuntu !== null ? `${data.cron.ubuntu} jobs` : 'unreachable';
  message += `Local: ${data.cron.local} jobs | Ubuntu: ${ubuntuCronDisplay}\n\n`;

  message += `*Disk*\n`;
  message += `/home: ${data.disk.homePercent} of ${data.disk.homeTotal}\n`;
  message += `History: ${data.disk.historySize} | Scratchpad: ${data.disk.scratchpadSize}\n\n`;

  message += `*Last Activity*\n`;
  message += `Session: ${data.activity.lastSessionDate} (${data.activity.lastSessionRelative})\n`;
  message += `Commit: \`${data.activity.lastCommitHash}\` - ${data.activity.lastCommitMessage.slice(0, 60)}${data.activity.lastCommitMessage.length > 60 ? '...' : ''} (${data.activity.lastCommitDate})\n\n`;

  message += `*Nodes*\n`;
  const ubuntuIcon = data.nodes.ubuntu ? '✅' : '❌';
  const synologyIcon = data.nodes.synology ? '✅' : '❌';
  const proxmoxIcon = data.nodes.proxmox ? '✅' : '❌';
  message += `${ubuntuIcon} Ubuntu Server | ${synologyIcon} Synology | ${proxmoxIcon} Proxmox\n\n`;

  message += `_PAI ${data.system.paiVersion}_`;

  // Send to Telegram
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  try {
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

    const result = await response.json();

    if (!result.ok) {
      throw new Error(`Telegram API error: ${result.description || 'Unknown error'}`);
    }

    console.error(`${C.green}✓ Status sent to Telegram${C.reset}`);
  } catch (error) {
    console.error(`${C.red}✗ Failed to send to Telegram: ${error instanceof Error ? error.message : String(error)}${C.reset}`);
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const options = parseArgs();

  // Load environment for Telegram credentials
  if (options.telegram) {
    loadEnv();
  }

  // Collect status data
  const data = await collectStatusData();

  // Output
  if (options.json) {
    printJsonStatus(data);
  } else {
    printTerminalStatus(data);
  }

  // Send to Telegram if requested
  if (options.telegram) {
    await sendTelegramStatus(data);
  }
}

main().catch(error => {
  console.error(`${C.red}Error: ${error instanceof Error ? error.message : String(error)}${C.reset}`);
  process.exit(1);
});
