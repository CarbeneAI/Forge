#!/usr/bin/env bun

/**
 * Cron.ts - Cross-host cron job manager for PAI
 *
 * Manages cron jobs across multiple hosts (local machine and remote server)
 * with PAI-aware filtering and human-readable schedule parsing.
 *
 * Usage:
 *   bun Cron.ts list                          # List all PAI-related cron jobs on all hosts
 *   bun Cron.ts list --host local             # List only local cron jobs
 *   bun Cron.ts list --host ubuntu            # List only ubuntu server cron jobs
 *   bun Cron.ts add --host local --schedule "0 7 * * *" --command "bun ~/.claude/tools/example.ts" --label "Daily example"
 *   bun Cron.ts rm --host local --label "Daily example"
 *   bun Cron.ts rm --host ubuntu --id 3       # Remove by line number
 *   bun Cron.ts --json                        # JSON output for any command
 */

import { execSync } from "child_process";
import { resolve, dirname } from "path";

// ANSI Colors
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const MAGENTA = "\x1b[35m";
const CYAN = "\x1b[36m";
const WHITE = "\x1b[37m";

// Host configuration
const HOSTS = {
  local: {
    name: "local - this machine",
    ssh: null, // Run locally
  },
  remote: {
    name: "remote - configure your server",
    ssh: process.env.REMOTE_SSH_HOST || "youruser@10.0.0.20",
  },
};

// Resolve PAI_DIR from script location: tools/ -> CORE/ -> skills/ -> .claude/
const SCRIPT_DIR = dirname(new URL(import.meta.url).pathname);
const PAI_DIR = resolve(SCRIPT_DIR, "../../../");

interface CronJob {
  id: number;
  schedule: string;
  command: string;
  label: string;
  humanSchedule: string;
  raw: string;
}

interface HostCronJobs {
  host: string;
  hostName: string;
  jobs: CronJob[];
  error?: string;
}

/**
 * Parse cron schedule into human-readable format
 */
function parseSchedule(schedule: string): string {
  const parts = schedule.trim().split(/\s+/);
  if (parts.length < 5) return schedule;

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  // Special cases
  if (schedule === "* * * * *") return "Every minute";
  if (schedule === "0 * * * *") return "Every hour";
  if (schedule === "0 0 * * *") return "Daily at midnight";
  if (schedule === "0 12 * * *") return "Daily at noon";

  let result = "";

  // Day of week patterns
  if (dayOfWeek !== "*") {
    if (dayOfWeek === "1-5") {
      result = "Weekdays";
    } else if (dayOfWeek === "0" || dayOfWeek === "7") {
      result = "Sundays";
    } else if (dayOfWeek === "6") {
      result = "Saturdays";
    } else if (dayOfWeek === "0,6" || dayOfWeek === "6,0") {
      result = "Weekends";
    } else {
      result = `Day ${dayOfWeek}`;
    }
  } else if (dayOfMonth !== "*") {
    result = `Day ${dayOfMonth} of month`;
  } else {
    result = "Daily";
  }

  // Time
  if (hour !== "*" && minute !== "*") {
    const h = parseInt(hour);
    const m = parseInt(minute);
    const timeStr = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    result += ` at ${timeStr} UTC`;
  } else if (hour !== "*") {
    result += ` at hour ${hour}`;
  } else if (minute !== "*") {
    result += ` at minute ${minute}`;
  }

  return result;
}

/**
 * Execute command on a host (local or remote via SSH)
 */
function executeOnHost(
  host: keyof typeof HOSTS,
  command: string,
  options: { timeout?: number } = {}
): { stdout: string; stderr: string; error?: string } {
  const hostConfig = HOSTS[host];
  const timeout = options.timeout || 5000;

  try {
    let fullCommand = command;
    if (hostConfig.ssh) {
      // Remote execution via SSH
      fullCommand = `ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no ${hostConfig.ssh} "${command.replace(/"/g, '\\"')}"`;
    }

    const stdout = execSync(fullCommand, {
      encoding: "utf-8",
      timeout,
      stdio: ["pipe", "pipe", "pipe"],
    });

    return { stdout, stderr: "" };
  } catch (error: any) {
    return {
      stdout: error.stdout || "",
      stderr: error.stderr || "",
      error: error.message,
    };
  }
}

/**
 * List cron jobs for a specific host
 */
function listHostCronJobs(host: keyof typeof HOSTS): HostCronJobs {
  const hostConfig = HOSTS[host];
  const result = executeOnHost(host, "crontab -l 2>/dev/null");

  if (result.error && !result.stdout) {
    return {
      host,
      hostName: hostConfig.name,
      jobs: [],
      error: result.error,
    };
  }

  const lines = result.stdout.split("\n").filter((line) => line.trim());
  const jobs: CronJob[] = [];

  let jobId = 1;
  for (const line of lines) {
    // Skip comments that aren't PAI labels
    if (line.startsWith("#") && !line.includes("PAI:")) continue;

    // Filter to PAI-related jobs (containing bun, PAI, .claude, or trading)
    if (
      !line.includes("bun") &&
      !line.includes("PAI") &&
      !line.includes(".claude") &&
      !line.includes("trading")
    ) {
      continue;
    }

    // Parse job
    const commentMatch = line.match(/#\s*PAI:\s*(.+)$/);
    const label = commentMatch ? commentMatch[1].trim() : "";

    // Remove comment from line to parse cron parts
    const cronLine = line.replace(/#.*$/, "").trim();
    const parts = cronLine.split(/\s+/);

    if (parts.length >= 6) {
      const schedule = parts.slice(0, 5).join(" ");
      const command = parts.slice(5).join(" ");

      jobs.push({
        id: jobId++,
        schedule,
        command,
        label,
        humanSchedule: parseSchedule(schedule),
        raw: line,
      });
    }
  }

  return {
    host,
    hostName: hostConfig.name,
    jobs,
  };
}

/**
 * List all cron jobs (all hosts or specific host)
 */
function listCronJobs(
  hostFilter?: keyof typeof HOSTS,
  jsonOutput = false
): void {
  const hosts = hostFilter ? [hostFilter] : (Object.keys(HOSTS) as Array<keyof typeof HOSTS>);
  const results: HostCronJobs[] = [];

  for (const host of hosts) {
    results.push(listHostCronJobs(host));
  }

  if (jsonOutput) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  // Pretty output
  console.log(`\n${BOLD}${CYAN}PAI Cron Jobs${RESET}`);
  console.log(`${"=".repeat(60)}\n`);

  let totalJobs = 0;
  const hostCounts: Record<string, number> = {};

  for (const result of results) {
    console.log(`${BOLD}${BLUE}[${result.hostName}]${RESET}`);

    if (result.error) {
      console.log(`  ${DIM}${RED}Error: ${result.error}${RESET}\n`);
      continue;
    }

    if (result.jobs.length === 0) {
      console.log(`  ${DIM}No PAI-related cron jobs found${RESET}\n`);
      continue;
    }

    for (const job of result.jobs) {
      console.log(`  ${BOLD}${GREEN}#${job.id}${RESET}  ${YELLOW}${job.label || "(no label)"}${RESET}`);
      console.log(`      ${MAGENTA}${job.schedule}${RESET}     ${WHITE}${job.humanSchedule}${RESET}`);
      console.log(`      ${DIM}${job.command}${RESET}`);
      console.log();
    }

    totalJobs += result.jobs.length;
    hostCounts[result.host] = result.jobs.length;
  }

  console.log(`${"=".repeat(60)}`);
  const hostCountStr = Object.entries(hostCounts)
    .map(([host, count]) => `${count} ${host}`)
    .join(", ");
  console.log(`${BOLD}Total: ${totalJobs} jobs${RESET} ${DIM}(${hostCountStr})${RESET}\n`);
}

/**
 * Add a cron job to a host
 */
function addCronJob(
  host: keyof typeof HOSTS,
  schedule: string,
  command: string,
  label: string,
  jsonOutput = false
): void {
  const hostConfig = HOSTS[host];

  // Build the cron line
  const commentSuffix = label ? ` # PAI: ${label}` : "";
  const cronLine = `${schedule} ${command}${commentSuffix}`;

  // Append to crontab
  const addCommand = `(crontab -l 2>/dev/null; echo "${cronLine}") | crontab -`;
  const result = executeOnHost(host, addCommand);

  if (result.error) {
    if (jsonOutput) {
      console.log(
        JSON.stringify({
          success: false,
          error: result.error,
          host,
        })
      );
    } else {
      console.log(`\n${RED}Error adding cron job:${RESET} ${result.error}\n`);
    }
    process.exit(1);
  }

  if (jsonOutput) {
    console.log(
      JSON.stringify({
        success: true,
        host,
        schedule,
        command,
        label,
      })
    );
  } else {
    console.log(`\n${GREEN}✓ Cron job added successfully${RESET}`);
    console.log(`  ${BOLD}Host:${RESET} ${hostConfig.name}`);
    console.log(`  ${BOLD}Schedule:${RESET} ${schedule} (${parseSchedule(schedule)})`);
    console.log(`  ${BOLD}Command:${RESET} ${command}`);
    if (label) console.log(`  ${BOLD}Label:${RESET} ${label}`);
    console.log();
  }
}

/**
 * Remove a cron job from a host
 */
function removeCronJob(
  host: keyof typeof HOSTS,
  labelOrId: string,
  jsonOutput = false
): void {
  const hostConfig = HOSTS[host];

  // Get current jobs
  const hostJobs = listHostCronJobs(host);

  if (hostJobs.error) {
    if (jsonOutput) {
      console.log(
        JSON.stringify({
          success: false,
          error: hostJobs.error,
          host,
        })
      );
    } else {
      console.log(`\n${RED}Error accessing cron jobs:${RESET} ${hostJobs.error}\n`);
    }
    process.exit(1);
  }

  // Find job by label or ID
  let jobToRemove: CronJob | undefined;
  const isNumeric = /^\d+$/.test(labelOrId);

  if (isNumeric) {
    const id = parseInt(labelOrId);
    jobToRemove = hostJobs.jobs.find((j) => j.id === id);
  } else {
    jobToRemove = hostJobs.jobs.find((j) => j.label === labelOrId);
  }

  if (!jobToRemove) {
    if (jsonOutput) {
      console.log(
        JSON.stringify({
          success: false,
          error: `No cron job found with ${isNumeric ? "ID" : "label"}: ${labelOrId}`,
          host,
        })
      );
    } else {
      console.log(
        `\n${RED}No cron job found with ${isNumeric ? "ID" : "label"}:${RESET} ${labelOrId}\n`
      );
    }
    process.exit(1);
  }

  // Remove the job (escape special regex characters in the raw line)
  const escapedLine = jobToRemove.raw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const removeCommand = `crontab -l 2>/dev/null | grep -v "${escapedLine}" | crontab -`;
  const result = executeOnHost(host, removeCommand);

  if (result.error) {
    if (jsonOutput) {
      console.log(
        JSON.stringify({
          success: false,
          error: result.error,
          host,
        })
      );
    } else {
      console.log(`\n${RED}Error removing cron job:${RESET} ${result.error}\n`);
    }
    process.exit(1);
  }

  if (jsonOutput) {
    console.log(
      JSON.stringify({
        success: true,
        host,
        removed: jobToRemove,
      })
    );
  } else {
    console.log(`\n${GREEN}✓ Cron job removed successfully${RESET}`);
    console.log(`  ${BOLD}Host:${RESET} ${hostConfig.name}`);
    console.log(`  ${BOLD}Schedule:${RESET} ${jobToRemove.schedule} (${jobToRemove.humanSchedule})`);
    console.log(`  ${BOLD}Command:${RESET} ${jobToRemove.command}`);
    if (jobToRemove.label) console.log(`  ${BOLD}Label:${RESET} ${jobToRemove.label}`);
    console.log();
  }
}

/**
 * Show usage help
 */
function showHelp(): void {
  console.log(`
${BOLD}${CYAN}PAI Cron Job Manager${RESET}

${BOLD}USAGE:${RESET}
  bun Cron.ts list [--host <local|ubuntu>] [--json]
  bun Cron.ts add --host <local|ubuntu> --schedule "<cron>" --command "<cmd>" [--label "<label>"] [--json]
  bun Cron.ts rm --host <local|ubuntu> <--label "<label>" | --id <num>> [--json]

${BOLD}COMMANDS:${RESET}
  ${GREEN}list${RESET}     List all PAI-related cron jobs
  ${GREEN}add${RESET}      Add a new cron job
  ${GREEN}rm${RESET}       Remove a cron job by label or ID

${BOLD}OPTIONS:${RESET}
  ${YELLOW}--host${RESET}       Host to operate on (local, ubuntu, or all for list)
  ${YELLOW}--schedule${RESET}   Cron schedule (e.g., "0 7 * * *")
  ${YELLOW}--command${RESET}    Command to execute
  ${YELLOW}--label${RESET}      Human-readable label for the job
  ${YELLOW}--id${RESET}         Job ID to remove (from list output)
  ${YELLOW}--json${RESET}       Output in JSON format

${BOLD}EXAMPLES:${RESET}
  # List all jobs
  bun Cron.ts list

  # List only local jobs
  bun Cron.ts list --host local

  # Add a daily job at 7 AM
  bun Cron.ts add --host local --schedule "0 7 * * *" --command "bun ~/.claude/tools/backup.ts" --label "Daily backup"

  # Remove by label
  bun Cron.ts rm --host local --label "Daily backup"

  # Remove by ID
  bun Cron.ts rm --host ubuntu --id 3

  # JSON output
  bun Cron.ts list --json

${BOLD}HOSTS:${RESET}
  ${BLUE}local${RESET}    this machine (primary host)
  ${BLUE}remote${RESET}   remote server - configure via REMOTE_SSH_HOST env var
`);
}

/**
 * Main CLI entry point
 */
function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    showHelp();
    return;
  }

  const command = args[0];
  const jsonOutput = args.includes("--json");

  // Parse arguments
  const getArg = (flag: string): string | undefined => {
    const index = args.indexOf(flag);
    return index !== -1 && index + 1 < args.length ? args[index + 1] : undefined;
  };

  const host = getArg("--host") as keyof typeof HOSTS | undefined;

  switch (command) {
    case "list":
      listCronJobs(host, jsonOutput);
      break;

    case "add": {
      if (!host) {
        console.log(`${RED}Error: --host is required for add command${RESET}`);
        process.exit(1);
      }

      const schedule = getArg("--schedule");
      const cmd = getArg("--command");
      const label = getArg("--label") || "";

      if (!schedule || !cmd) {
        console.log(`${RED}Error: --schedule and --command are required for add command${RESET}`);
        process.exit(1);
      }

      addCronJob(host, schedule, cmd, label, jsonOutput);
      break;
    }

    case "rm": {
      if (!host) {
        console.log(`${RED}Error: --host is required for rm command${RESET}`);
        process.exit(1);
      }

      const label = getArg("--label");
      const id = getArg("--id");

      if (!label && !id) {
        console.log(`${RED}Error: Either --label or --id is required for rm command${RESET}`);
        process.exit(1);
      }

      removeCronJob(host, label || id!, jsonOutput);
      break;
    }

    default:
      console.log(`${RED}Unknown command: ${command}${RESET}`);
      showHelp();
      process.exit(1);
  }
}

// Run CLI
main();
