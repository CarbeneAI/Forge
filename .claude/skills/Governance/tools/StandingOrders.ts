#!/usr/bin/env bun
/**
 * StandingOrders.ts — CLI for managing PAI standing orders (heartbeat)
 * Recurring agent tasks executed on schedules.
 * Usage: bun StandingOrders.ts <command> [options]
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const CONFIG_PATH = join(import.meta.dir, "../config/standing-orders.yml");

// --- Types ---

interface Order {
  agent: string;
  schedule: string;
  description: string;
  goal: string;
  prompt: string;
  enabled: boolean;
}

interface Orders {
  orders: Record<string, Order>;
}

// --- Simple YAML parser ---

function parseYaml(content: string): Orders {
  const result: Orders = { orders: {} };
  const lines = content.split("\n");
  let currentOrder: string | null = null;
  let currentObj: Partial<Order> = {};

  for (const line of lines) {
    if (line.startsWith("#") || line.trim() === "") continue;
    if (line === "orders:") continue;

    // Order name (2-space indent, ends with colon)
    const orderMatch = line.match(/^  (\S+):$/);
    if (orderMatch) {
      if (currentOrder) result.orders[currentOrder] = currentObj as Order;
      currentOrder = orderMatch[1];
      currentObj = {};
      continue;
    }

    // Order field (4-space indent)
    const fieldMatch = line.match(/^    (\w+):\s*(.*)/);
    if (fieldMatch && currentOrder) {
      const [, key, rawVal] = fieldMatch;
      const val = rawVal.split("#")[0].trim();
      if (key === "enabled") {
        (currentObj as Record<string, unknown>)[key] = val === "true";
      } else {
        (currentObj as Record<string, unknown>)[key] = val.replace(/^"|"$/g, "");
      }
    }
  }
  if (currentOrder) result.orders[currentOrder] = currentObj as Order;
  return result;
}

function serializeYaml(data: Orders, original: string): string {
  let result = original;
  for (const [name, order] of Object.entries(data.orders)) {
    const pattern = new RegExp(
      `(  ${name}:[\\s\\S]*?\\n    enabled:\\s*)\\S+`,
      "m",
    );
    result = result.replace(pattern, `$1${order.enabled}`);
  }
  return result;
}

function parseNextRun(cron: string): string {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return "unknown schedule";
  const [min, hour, , , dow] = parts;
  const days: Record<string, string> = {
    "0": "Sunday", "1": "Monday", "2": "Tuesday",
    "3": "Wednesday", "4": "Thursday", "5": "Friday", "6": "Saturday",
  };
  const timeStr = `${hour.padStart(2, "0")}:${min.padStart(2, "0")}`;
  if (dow === "*") return `Daily at ${timeStr}`;
  if (dow === "1-5") return `Weekdays at ${timeStr}`;
  if (dow.includes(",")) {
    return dow.split(",").map((d) => days[d] ?? d).join(", ") + ` at ${timeStr}`;
  }
  return `${days[dow] ?? "day " + dow} at ${timeStr}`;
}

function loadConfig(): { data: Orders; raw: string } {
  const raw = readFileSync(CONFIG_PATH, "utf-8");
  return { data: parseYaml(raw), raw };
}

// --- Commands ---

function cmdList(data: Orders): void {
  console.log("\nPAI Standing Orders\n" + "=".repeat(60));
  for (const [name, order] of Object.entries(data.orders)) {
    const status = order.enabled ? "ENABLED " : "DISABLED";
    console.log(`\n  ${name}`);
    console.log(`    Status:  ${status}`);
    console.log(`    Agent:   ${order.agent}`);
    console.log(`    Goal:    ${order.goal}`);
    console.log(`    When:    ${parseNextRun(order.schedule)}  (${order.schedule})`);
    console.log(`    Task:    ${order.description}`);
  }
  console.log();
}

function cmdEnable(data: Orders, raw: string, name: string): void {
  if (!data.orders[name]) { console.error(`Error: order '${name}' not found`); process.exit(1); }
  data.orders[name].enabled = true;
  writeFileSync(CONFIG_PATH, serializeYaml(data, raw), "utf-8");
  console.log(`Enabled: ${name}`);
}

function cmdDisable(data: Orders, raw: string, name: string): void {
  if (!data.orders[name]) { console.error(`Error: order '${name}' not found`); process.exit(1); }
  data.orders[name].enabled = false;
  writeFileSync(CONFIG_PATH, serializeYaml(data, raw), "utf-8");
  console.log(`Disabled: ${name}`);
}

function cmdRun(data: Orders, name: string): void {
  if (!data.orders[name]) { console.error(`Error: order '${name}' not found`); process.exit(1); }
  const order = data.orders[name];
  console.log(`\nManual trigger: ${name}`);
  console.log(`Agent:  ${order.agent}`);
  console.log(`Goal:   ${order.goal}`);
  console.log(`\nPrompt that would be sent:`);
  console.log("-".repeat(60));
  console.log(order.prompt);
  console.log("-".repeat(60));
  console.log(`\nTo execute: claude --print "${order.prompt}"`);
}

function cmdSync(data: Orders): void {
  console.log("\nCrontab entries for enabled standing orders:");
  console.log("# Add to crontab with: crontab -e");
  console.log("#" + "=".repeat(70));
  let count = 0;
  for (const [name, order] of Object.entries(data.orders)) {
    if (!order.enabled) continue;
    const prompt = order.prompt.replace(/"/g, '\\"');
    console.log(`\n# ${name} — ${order.description}`);
    console.log(`# Agent: ${order.agent} | Goal: ${order.goal}`);
    console.log(`${order.schedule} claude --print "${prompt}"`);
    count++;
  }
  console.log(count === 0 ? "\n(No enabled orders)" : `\n# ${count} order(s)`);
}

function printHelp(): void {
  console.log(`
PAI Standing Orders — Recurring agent task scheduler

USAGE:
  bun StandingOrders.ts <command> [options]

COMMANDS:
  list                    Show all orders with status and schedule
  enable <order-name>     Enable a standing order
  disable <order-name>    Disable a standing order
  run <order-name>        Show prompt that would be sent (manual trigger)
  sync                    Generate crontab entries for enabled orders
  help                    Show this help

EXAMPLES:
  bun StandingOrders.ts list
  bun StandingOrders.ts enable weekly-content-review
  bun StandingOrders.ts run daily-security-check
  bun StandingOrders.ts sync

CONFIG:
  ${CONFIG_PATH}
`);
}

// --- Entry point ---

const [, , cmd, ...args] = process.argv;
const { data, raw } = loadConfig();

switch (cmd) {
  case "list": cmdList(data); break;
  case "enable":
    if (!args[0]) { console.error("Error: provide order name"); process.exit(1); }
    cmdEnable(data, raw, args[0]); break;
  case "disable":
    if (!args[0]) { console.error("Error: provide order name"); process.exit(1); }
    cmdDisable(data, raw, args[0]); break;
  case "run":
    if (!args[0]) { console.error("Error: provide order name"); process.exit(1); }
    cmdRun(data, args[0]); break;
  case "sync": cmdSync(data); break;
  case "help": case "--help": case "-h": case undefined: printHelp(); break;
  default:
    console.error(`Unknown command: ${cmd}\nRun 'bun StandingOrders.ts help' for usage.`);
    process.exit(1);
}
