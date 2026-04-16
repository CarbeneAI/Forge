#!/usr/bin/env bun

/**
 * Nodes.ts - PAI Homelab Host Management CLI
 *
 * Unified interface for monitoring and managing PAI homelab hosts.
 *
 * Usage:
 *   bun Nodes.ts list                              # List all hosts
 *   bun Nodes.ts status                            # Ping all hosts
 *   bun Nodes.ts status --host ubuntu              # Status of single host
 *   bun Nodes.ts exec ubuntu "docker ps"           # Run command on host
 *   bun Nodes.ts health                            # Comprehensive health check
 *   bun Nodes.ts health --host ubuntu              # Health of single host
 *   bun Nodes.ts --json                            # JSON output (any command)
 */

import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ANSI color codes (similar to SecurityAudit.ts)
const COLORS = {
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m',
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  CYAN: '\x1b[36m',
  GRAY: '\x1b[90m',
};

// PAI_DIR resolution (tools/ -> CORE/ -> skills/ -> .claude/)
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PAI_DIR = resolve(dirname(SCRIPT_PATH), '../../../');

// Host registry
interface Host {
  id: string;
  name: string;
  ip: string;
  role: string;
  local?: boolean;
}

const HOSTS: Host[] = [
  // Configure your homelab hosts here
  { id: 'primary', name: 'Primary Host', ip: '192.168.1.10', role: 'PAI Primary', local: true },
  { id: 'server', name: 'Server', ip: '192.168.1.20', role: 'Services host' },
  { id: 'nas', name: 'NAS', ip: '192.168.1.3', role: 'NAS, storage' },
  { id: 'proxmox', name: 'Proxmox', ip: '192.168.1.5', role: 'Virtualization' },
  { id: 'kali', name: 'Kali Linux', ip: '192.168.1.121', role: 'Pentesting VM' },
  { id: 'wazuh', name: 'Wazuh', ip: '192.168.1.76', role: 'SIEM' },
];

const SSH_USER = process.env.SSH_USER || 'youruser';
const SSH_TIMEOUT = 5;

// Helper functions
function printHeader(text: string) {
  console.log(`\n${COLORS.BOLD}${COLORS.CYAN}${text}${COLORS.RESET}`);
  console.log('='.repeat(text.length));
}

function printSuccess(text: string) {
  console.log(`${COLORS.GREEN}${text}${COLORS.RESET}`);
}

function printError(text: string) {
  console.log(`${COLORS.RED}${text}${COLORS.RESET}`);
}

function printWarning(text: string) {
  console.log(`${COLORS.YELLOW}${text}${COLORS.RESET}`);
}

function printInfo(text: string) {
  console.log(`${COLORS.BLUE}${text}${COLORS.RESET}`);
}

function execCommand(command: string, suppressError = false): { success: boolean; output: string; error?: string } {
  try {
    const output = execSync(command, {
      encoding: 'utf-8',
      stdio: suppressError ? 'pipe' : ['pipe', 'pipe', 'pipe'],
      timeout: SSH_TIMEOUT * 1000,
    });
    return { success: true, output: output.trim() };
  } catch (error: any) {
    return {
      success: false,
      output: '',
      error: error.message || 'Command failed',
    };
  }
}

function sshCommand(host: Host, command: string): { success: boolean; output: string; error?: string } {
  if (host.local) {
    // Run locally without SSH
    return execCommand(command, true);
  }

  const sshCmd = `ssh -o ConnectTimeout=${SSH_TIMEOUT} -o StrictHostKeyChecking=no ${SSH_USER}@${host.ip} "${command}"`;
  return execCommand(sshCmd, true);
}

function pingHost(host: Host): { reachable: boolean; latency?: string } {
  if (host.local) {
    return { reachable: true, latency: 'local' };
  }

  const result = execCommand(`ping -c 1 -W 2 ${host.ip}`, true);

  if (!result.success) {
    return { reachable: false };
  }

  // Extract latency from ping output (e.g., "time=1.23 ms")
  const match = result.output.match(/time=([\d.]+)\s*ms/);
  const latency = match ? `${match[1]}ms` : 'unknown';

  return { reachable: true, latency };
}

// Command implementations
function listHosts(jsonOutput: boolean) {
  if (jsonOutput) {
    console.log(JSON.stringify(HOSTS, null, 2));
    return;
  }

  printHeader('PAI Nodes');
  console.log();

  // Print table header
  console.log(`  ${COLORS.BOLD}ID${' '.repeat(11)}Host${' '.repeat(12)}IP${' '.repeat(14)}Role${COLORS.RESET}`);

  // Print each host
  for (const host of HOSTS) {
    const idPad = ' '.repeat(13 - host.id.length);
    const namePad = ' '.repeat(18 - host.name.length);
    const ipPad = ' '.repeat(16 - host.ip.length);

    console.log(`  ${host.id}${idPad}${host.name}${namePad}${host.ip}${ipPad}${host.role}`);
  }

  console.log();
  console.log('='.repeat(80));
  console.log(`${HOSTS.length} nodes total`);
}

function statusHosts(hostFilter: string | null, jsonOutput: boolean) {
  const hostsToCheck = hostFilter
    ? HOSTS.filter(h => h.id === hostFilter)
    : HOSTS;

  if (hostsToCheck.length === 0) {
    printError(`Host '${hostFilter}' not found`);
    process.exit(1);
  }

  const results: Array<{ host: Host; reachable: boolean; latency?: string }> = [];

  for (const host of hostsToCheck) {
    const ping = pingHost(host);
    results.push({ host, ...ping });
  }

  if (jsonOutput) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  printHeader('PAI Nodes');
  console.log();

  // Print table header
  console.log(`  ${COLORS.BOLD}ID${' '.repeat(11)}Host${' '.repeat(12)}IP${' '.repeat(14)}Role${' '.repeat(30)}Status${COLORS.RESET}`);

  // Print each host
  for (const result of results) {
    const { host, reachable, latency } = result;
    const idPad = ' '.repeat(Math.max(0, 13 - host.id.length));
    const namePad = ' '.repeat(Math.max(0, 18 - host.name.length));
    const ipPad = ' '.repeat(Math.max(0, 16 - host.ip.length));
    const rolePad = ' '.repeat(Math.max(0, 34 - host.role.length));

    const statusText = reachable
      ? `${COLORS.GREEN}UP${COLORS.RESET} (${latency})`
      : `${COLORS.RED}DOWN${COLORS.RESET}`;

    console.log(`  ${host.id}${idPad}${host.name}${namePad}${host.ip}${ipPad}${host.role}${rolePad}${statusText}`);
  }

  console.log();
  console.log('='.repeat(80));

  const upCount = results.filter(r => r.reachable).length;
  const downCount = results.length - upCount;
  console.log(`${results.length} nodes: ${upCount} up, ${downCount} down`);
}

function execOnHost(hostId: string, command: string, jsonOutput: boolean) {
  const host = HOSTS.find(h => h.id === hostId);

  if (!host) {
    printError(`Host '${hostId}' not found`);
    process.exit(1);
  }

  const result = sshCommand(host, command);

  if (jsonOutput) {
    console.log(JSON.stringify({
      host: host.id,
      command,
      success: result.success,
      output: result.output,
      error: result.error,
    }, null, 2));
    return;
  }

  printHeader(`Executing on ${host.name} (${host.ip})`);
  console.log(`${COLORS.GRAY}Command: ${command}${COLORS.RESET}`);
  console.log();

  if (result.success) {
    console.log(result.output);
  } else {
    printError(`Error: ${result.error}`);
    console.log(result.output);
    process.exit(1);
  }
}

function healthCheck(hostFilter: string | null, jsonOutput: boolean) {
  const hostsToCheck = hostFilter
    ? HOSTS.filter(h => h.id === hostFilter)
    : HOSTS;

  if (hostsToCheck.length === 0) {
    printError(`Host '${hostFilter}' not found`);
    process.exit(1);
  }

  const results: Array<{
    host: Host;
    reachable: boolean;
    uptime?: string;
    load?: string;
    disk?: string;
    containers?: Array<{ name: string; status: string }>;
    error?: string;
  }> = [];

  for (const host of hostsToCheck) {
    const ping = pingHost(host);

    if (!ping.reachable) {
      results.push({ host, reachable: false });
      continue;
    }

    // Get uptime
    const uptimeResult = sshCommand(host, 'uptime');
    const uptime = uptimeResult.success ? uptimeResult.output : 'unknown';

    // Get disk usage
    const diskResult = sshCommand(host, `df -h / | tail -1 | awk '{print $5 " used (" $4 " free)"}'`);
    const disk = diskResult.success ? diskResult.output : 'unknown';

    // Get load average
    const loadResult = sshCommand(host, "uptime | awk -F'load average:' '{print $2}' | xargs");
    const load = loadResult.success ? loadResult.output : 'unknown';

    // Get docker containers (top 10)
    const dockerResult = sshCommand(host, "docker ps --format '{{.Names}}|{{.Status}}' 2>/dev/null | head -10");
    const containers: Array<{ name: string; status: string }> = [];

    if (dockerResult.success && dockerResult.output) {
      const lines = dockerResult.output.split('\n');
      for (const line of lines) {
        const [name, status] = line.split('|');
        if (name && status) {
          containers.push({ name: name.trim(), status: status.trim() });
        }
      }
    }

    results.push({
      host,
      reachable: true,
      uptime,
      load,
      disk,
      containers,
    });
  }

  if (jsonOutput) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  printHeader('PAI Nodes Health');
  console.log();

  for (const result of results) {
    const { host, reachable } = result;

    console.log(`${COLORS.BOLD}${COLORS.CYAN}${host.name}${COLORS.RESET} (${host.id}) - ${host.ip}`);
    console.log(`${COLORS.GRAY}Role: ${host.role}${COLORS.RESET}`);

    if (!reachable) {
      printError('  Status: DOWN');
      console.log();
      continue;
    }

    printSuccess('  Status: UP');
    console.log(`  ${COLORS.BOLD}Uptime:${COLORS.RESET} ${result.uptime}`);
    console.log(`  ${COLORS.BOLD}Load:${COLORS.RESET} ${result.load}`);
    console.log(`  ${COLORS.BOLD}Disk:${COLORS.RESET} ${result.disk}`);

    if (result.containers && result.containers.length > 0) {
      console.log(`  ${COLORS.BOLD}Containers:${COLORS.RESET}`);
      for (const container of result.containers) {
        const statusColor = container.status.toLowerCase().includes('up')
          ? COLORS.GREEN
          : COLORS.RED;
        console.log(`    - ${container.name}: ${statusColor}${container.status}${COLORS.RESET}`);
      }
    } else if (result.containers) {
      console.log(`  ${COLORS.GRAY}No containers running${COLORS.RESET}`);
    }

    console.log();
  }

  console.log('='.repeat(80));
  const upCount = results.filter(r => r.reachable).length;
  const downCount = results.length - upCount;
  console.log(`${results.length} nodes checked: ${upCount} healthy, ${downCount} down`);
}

// Main CLI
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`${COLORS.BOLD}PAI Nodes - Homelab Host Management${COLORS.RESET}`);
    console.log();
    console.log('Usage:');
    console.log('  bun Nodes.ts list                              # List all hosts');
    console.log('  bun Nodes.ts status                            # Ping all hosts');
    console.log('  bun Nodes.ts status --host ubuntu              # Status of single host');
    console.log('  bun Nodes.ts exec ubuntu "docker ps"           # Run command on host');
    console.log('  bun Nodes.ts health                            # Comprehensive health check');
    console.log('  bun Nodes.ts health --host ubuntu              # Health of single host');
    console.log('  bun Nodes.ts --json                            # JSON output (any command)');
    console.log();
    console.log('Available hosts:');
    for (const host of HOSTS) {
      console.log(`  ${host.id.padEnd(13)} ${host.name.padEnd(18)} ${host.ip}`);
    }
    process.exit(0);
  }

  const jsonOutput = args.includes('--json');
  const filteredArgs = args.filter(a => a !== '--json');
  const command = filteredArgs[0];

  // Extract --host flag
  const hostFlagIndex = filteredArgs.indexOf('--host');
  const hostFilter = hostFlagIndex >= 0 ? filteredArgs[hostFlagIndex + 1] : null;

  switch (command) {
    case 'list':
      listHosts(jsonOutput);
      break;

    case 'status':
      statusHosts(hostFilter, jsonOutput);
      break;

    case 'exec': {
      if (filteredArgs.length < 3) {
        printError('Usage: bun Nodes.ts exec <host> "<command>"');
        process.exit(1);
      }
      const hostId = filteredArgs[1];
      const execCmd = filteredArgs[2];
      execOnHost(hostId, execCmd, jsonOutput);
      break;
    }

    case 'health':
      healthCheck(hostFilter, jsonOutput);
      break;

    default:
      printError(`Unknown command: ${command}`);
      console.log('Run "bun Nodes.ts" without arguments to see usage');
      process.exit(1);
  }
}

main();
