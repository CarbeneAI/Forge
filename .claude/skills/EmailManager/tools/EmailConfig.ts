#!/usr/bin/env bun
/**
 * EmailConfig.ts - Manage email filtering configuration
 *
 * Usage:
 *   bun EmailConfig.ts show                          # Show current config
 *   bun EmailConfig.ts vip add user@example.com      # Add VIP email
 *   bun EmailConfig.ts vip add-domain example.com    # Add VIP domain
 *   bun EmailConfig.ts vip remove user@example.com   # Remove VIP
 *   bun EmailConfig.ts block add user@example.com    # Block email
 *   bun EmailConfig.ts block add-domain example.com  # Block domain
 *   bun EmailConfig.ts whitelist add-domain example.com
 *   bun EmailConfig.ts threshold notify 30           # Only notify if score < 30
 */

import * as fs from "fs";
import * as path from "path";
import { parseArgs } from "util";

// Constants
const SKILL_DIR = path.dirname(path.dirname(import.meta.path));
const DATA_DIR = path.join(SKILL_DIR, "data");
const CONFIG_FILE = path.join(DATA_DIR, "email-config.json");

interface EmailConfig {
  version: number;
  lastUpdated: string;
  thresholds: {
    spam: number;
    suspicious: number;
    notifyBelow: number;
  };
  vipSenders: {
    description: string;
    emails: string[];
    domains: string[];
  };
  whitelist: {
    description: string;
    emails: string[];
    domains: string[];
    subjectPatterns: string[];
  };
  blacklist: {
    description: string;
    emails: string[];
    domains: string[];
    subjectPatterns: string[];
  };
  categoryFilters: {
    description: string;
    enabled: boolean;
    allowedCategories: string[];
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
  };
  notes: string;
}

function loadConfig(): EmailConfig {
  if (!fs.existsSync(CONFIG_FILE)) {
    return createDefaultConfig();
  }
  return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
}

function saveConfig(config: EmailConfig): void {
  config.lastUpdated = new Date().toISOString();
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function createDefaultConfig(): EmailConfig {
  return {
    version: 1,
    lastUpdated: new Date().toISOString(),
    thresholds: {
      spam: 80,
      suspicious: 50,
      notifyBelow: 40,
    },
    vipSenders: {
      description: "Always notify immediately, bypass spam filter",
      emails: [],
      domains: [],
    },
    whitelist: {
      description: "Lower spam score by 30 points (more likely to notify)",
      emails: [],
      domains: [],
      subjectPatterns: [],
    },
    blacklist: {
      description: "Never notify, auto-mark as spam",
      emails: [],
      domains: [],
      subjectPatterns: [],
    },
    categoryFilters: {
      description: "Only notify for these categories (empty = notify all)",
      enabled: false,
      allowedCategories: [],
    },
    quietHours: {
      enabled: false,
      start: "22:00",
      end: "07:00",
      timezone: "America/Chicago",
    },
    notes: "Edit this file to tune email notifications. Changes take effect on next poll cycle (2 min).",
  };
}

function showConfig(config: EmailConfig): void {
  console.log("\n📧 Email Configuration\n");
  console.log(`Last Updated: ${config.lastUpdated}\n`);

  console.log("📊 Thresholds:");
  console.log(`  Spam: >= ${config.thresholds.spam}`);
  console.log(`  Suspicious: >= ${config.thresholds.suspicious}`);
  console.log(`  Notify Below: < ${config.thresholds.notifyBelow}`);

  console.log("\n⭐ VIP Senders (always notify):");
  if (config.vipSenders.emails.length > 0) {
    console.log("  Emails:");
    config.vipSenders.emails.forEach((e) => console.log(`    - ${e}`));
  }
  if (config.vipSenders.domains.length > 0) {
    console.log("  Domains:");
    config.vipSenders.domains.forEach((d) => console.log(`    - ${d}`));
  }
  if (config.vipSenders.emails.length === 0 && config.vipSenders.domains.length === 0) {
    console.log("  (none)");
  }

  console.log("\n✅ Whitelist (lower spam score by 30):");
  if (config.whitelist.emails.length > 0) {
    console.log("  Emails:");
    config.whitelist.emails.forEach((e) => console.log(`    - ${e}`));
  }
  if (config.whitelist.domains.length > 0) {
    console.log("  Domains:");
    config.whitelist.domains.forEach((d) => console.log(`    - ${d}`));
  }
  if (config.whitelist.subjectPatterns.length > 0) {
    console.log("  Subject Patterns:");
    config.whitelist.subjectPatterns.forEach((p) => console.log(`    - "${p}"`));
  }
  if (
    config.whitelist.emails.length === 0 &&
    config.whitelist.domains.length === 0 &&
    config.whitelist.subjectPatterns.length === 0
  ) {
    console.log("  (none)");
  }

  console.log("\n🚫 Blacklist (never notify):");
  if (config.blacklist.emails.length > 0) {
    console.log("  Emails:");
    config.blacklist.emails.forEach((e) => console.log(`    - ${e}`));
  }
  if (config.blacklist.domains.length > 0) {
    console.log("  Domains:");
    config.blacklist.domains.forEach((d) => console.log(`    - ${d}`));
  }
  if (config.blacklist.subjectPatterns.length > 0) {
    console.log("  Subject Patterns:");
    config.blacklist.subjectPatterns.forEach((p) => console.log(`    - "${p}"`));
  }
  if (
    config.blacklist.emails.length === 0 &&
    config.blacklist.domains.length === 0 &&
    config.blacklist.subjectPatterns.length === 0
  ) {
    console.log("  (none)");
  }

  console.log("\n🌙 Quiet Hours:");
  if (config.quietHours.enabled) {
    console.log(`  Enabled: ${config.quietHours.start} - ${config.quietHours.end} (${config.quietHours.timezone})`);
  } else {
    console.log("  Disabled");
  }

  console.log("\n📁 Config File:", CONFIG_FILE);
}

function addToList(list: string[], item: string): boolean {
  const normalized = item.toLowerCase();
  if (list.map((i) => i.toLowerCase()).includes(normalized)) {
    console.log(`Already in list: ${item}`);
    return false;
  }
  list.push(item);
  return true;
}

function removeFromList(list: string[], item: string): boolean {
  const normalized = item.toLowerCase();
  const index = list.findIndex((i) => i.toLowerCase() === normalized);
  if (index === -1) {
    console.log(`Not found in list: ${item}`);
    return false;
  }
  list.splice(index, 1);
  return true;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "help" || args[0] === "--help" || args[0] === "-h") {
    console.log(`
EmailConfig.ts - Manage email filtering configuration

Usage:
  bun EmailConfig.ts show                              Show current config
  bun EmailConfig.ts vip add <email>                   Add VIP email
  bun EmailConfig.ts vip add-domain <domain>           Add VIP domain
  bun EmailConfig.ts vip remove <email>                Remove VIP email
  bun EmailConfig.ts vip remove-domain <domain>        Remove VIP domain
  bun EmailConfig.ts block add <email>                 Block email
  bun EmailConfig.ts block add-domain <domain>         Block domain
  bun EmailConfig.ts block add-subject <pattern>       Block subject pattern
  bun EmailConfig.ts block remove <email>              Unblock email
  bun EmailConfig.ts block remove-domain <domain>      Unblock domain
  bun EmailConfig.ts whitelist add <email>             Whitelist email
  bun EmailConfig.ts whitelist add-domain <domain>     Whitelist domain
  bun EmailConfig.ts whitelist add-subject <pattern>   Whitelist subject pattern
  bun EmailConfig.ts whitelist remove <email>          Remove from whitelist
  bun EmailConfig.ts threshold notify <value>          Set notify threshold (0-100)
  bun EmailConfig.ts threshold spam <value>            Set spam threshold
  bun EmailConfig.ts threshold suspicious <value>      Set suspicious threshold
  bun EmailConfig.ts reset                             Reset to defaults

Examples:
  bun EmailConfig.ts vip add john@important-client.com
  bun EmailConfig.ts vip add-domain carbene.ai
  bun EmailConfig.ts block add-domain newsletter.com
  bun EmailConfig.ts block add-subject "Weekly Digest"
  bun EmailConfig.ts threshold notify 30
`);
    process.exit(0);
  }

  const config = loadConfig();
  const command = args[0];
  const subcommand = args[1];
  const value = args[2];

  switch (command) {
    case "show":
      showConfig(config);
      break;

    case "vip":
      if (!subcommand || !value) {
        console.error("Usage: bun EmailConfig.ts vip <add|add-domain|remove|remove-domain> <value>");
        process.exit(1);
      }
      switch (subcommand) {
        case "add":
          if (addToList(config.vipSenders.emails, value)) {
            saveConfig(config);
            console.log(`✅ Added VIP email: ${value}`);
          }
          break;
        case "add-domain":
          if (addToList(config.vipSenders.domains, value)) {
            saveConfig(config);
            console.log(`✅ Added VIP domain: ${value}`);
          }
          break;
        case "remove":
          if (removeFromList(config.vipSenders.emails, value)) {
            saveConfig(config);
            console.log(`✅ Removed VIP email: ${value}`);
          }
          break;
        case "remove-domain":
          if (removeFromList(config.vipSenders.domains, value)) {
            saveConfig(config);
            console.log(`✅ Removed VIP domain: ${value}`);
          }
          break;
        default:
          console.error(`Unknown subcommand: ${subcommand}`);
          process.exit(1);
      }
      break;

    case "block":
      if (!subcommand || !value) {
        console.error("Usage: bun EmailConfig.ts block <add|add-domain|add-subject|remove|remove-domain> <value>");
        process.exit(1);
      }
      switch (subcommand) {
        case "add":
          if (addToList(config.blacklist.emails, value)) {
            saveConfig(config);
            console.log(`🚫 Blocked email: ${value}`);
          }
          break;
        case "add-domain":
          if (addToList(config.blacklist.domains, value)) {
            saveConfig(config);
            console.log(`🚫 Blocked domain: ${value}`);
          }
          break;
        case "add-subject":
          if (addToList(config.blacklist.subjectPatterns, value)) {
            saveConfig(config);
            console.log(`🚫 Blocked subject pattern: "${value}"`);
          }
          break;
        case "remove":
          if (removeFromList(config.blacklist.emails, value)) {
            saveConfig(config);
            console.log(`✅ Unblocked email: ${value}`);
          }
          break;
        case "remove-domain":
          if (removeFromList(config.blacklist.domains, value)) {
            saveConfig(config);
            console.log(`✅ Unblocked domain: ${value}`);
          }
          break;
        case "remove-subject":
          if (removeFromList(config.blacklist.subjectPatterns, value)) {
            saveConfig(config);
            console.log(`✅ Removed subject pattern: "${value}"`);
          }
          break;
        default:
          console.error(`Unknown subcommand: ${subcommand}`);
          process.exit(1);
      }
      break;

    case "whitelist":
      if (!subcommand || !value) {
        console.error("Usage: bun EmailConfig.ts whitelist <add|add-domain|add-subject|remove> <value>");
        process.exit(1);
      }
      switch (subcommand) {
        case "add":
          if (addToList(config.whitelist.emails, value)) {
            saveConfig(config);
            console.log(`✅ Whitelisted email: ${value}`);
          }
          break;
        case "add-domain":
          if (addToList(config.whitelist.domains, value)) {
            saveConfig(config);
            console.log(`✅ Whitelisted domain: ${value}`);
          }
          break;
        case "add-subject":
          if (addToList(config.whitelist.subjectPatterns, value)) {
            saveConfig(config);
            console.log(`✅ Whitelisted subject pattern: "${value}"`);
          }
          break;
        case "remove":
          if (removeFromList(config.whitelist.emails, value)) {
            saveConfig(config);
            console.log(`✅ Removed from whitelist: ${value}`);
          }
          break;
        case "remove-domain":
          if (removeFromList(config.whitelist.domains, value)) {
            saveConfig(config);
            console.log(`✅ Removed domain from whitelist: ${value}`);
          }
          break;
        default:
          console.error(`Unknown subcommand: ${subcommand}`);
          process.exit(1);
      }
      break;

    case "threshold":
      if (!subcommand || !value) {
        console.error("Usage: bun EmailConfig.ts threshold <notify|spam|suspicious> <value>");
        process.exit(1);
      }
      const numValue = parseInt(value, 10);
      if (isNaN(numValue) || numValue < 0 || numValue > 100) {
        console.error("Threshold must be a number between 0 and 100");
        process.exit(1);
      }
      switch (subcommand) {
        case "notify":
          config.thresholds.notifyBelow = numValue;
          saveConfig(config);
          console.log(`✅ Set notify threshold to: ${numValue} (only notify if score < ${numValue})`);
          break;
        case "spam":
          config.thresholds.spam = numValue;
          saveConfig(config);
          console.log(`✅ Set spam threshold to: ${numValue}`);
          break;
        case "suspicious":
          config.thresholds.suspicious = numValue;
          saveConfig(config);
          console.log(`✅ Set suspicious threshold to: ${numValue}`);
          break;
        default:
          console.error(`Unknown threshold type: ${subcommand}`);
          process.exit(1);
      }
      break;

    case "reset":
      const newConfig = createDefaultConfig();
      saveConfig(newConfig);
      console.log("✅ Config reset to defaults");
      showConfig(newConfig);
      break;

    default:
      console.error(`Unknown command: ${command}`);
      console.error("Run with --help for usage");
      process.exit(1);
  }
}

// Run if called directly
if (import.meta.main) {
  main();
}

export { loadConfig, saveConfig, EmailConfig };
