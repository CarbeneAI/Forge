#!/usr/bin/env bun
/**
 * ApprovalGate.ts — Telegram-based approval gates for PAI agents
 * Human-in-the-loop governance for high-impact actions.
 * Usage: bun ApprovalGate.ts <command> [options]
 */

import { readFileSync } from "fs";
import { join } from "path";

const CONFIG_PATH = join(import.meta.dir, "../config/approvals.yml");

// --- Types ---

interface Gate {
  description: string;
  requires: string;
  agents: string[] | "all";
}

interface ApprovalConfig {
  gates: Record<string, Gate>;
  notification: {
    telegram: {
      bot_token_env: string;
      chat_id_env: string;
      timeout_minutes: number;
    };
  };
}

// --- Simple YAML parser ---

function parseConfig(content: string): ApprovalConfig {
  const result: ApprovalConfig = {
    gates: {},
    notification: {
      telegram: { bot_token_env: "TELEGRAM_BOT_TOKEN", chat_id_env: "TELEGRAM_CHAT_ID", timeout_minutes: 30 },
    },
  };

  const lines = content.split("\n");
  let section: "gates" | "notification" | null = null;
  let currentGate: string | null = null;
  let currentObj: Partial<Gate> = {};
  let inAgents = false;

  for (const line of lines) {
    if (line.startsWith("#") || line.trim() === "") continue;

    if (line === "gates:") { section = "gates"; continue; }
    if (line === "notification:") { section = "notification"; continue; }

    if (section === "gates") {
      // Gate name (2-space indent)
      const gateMatch = line.match(/^  (\w+):$/);
      if (gateMatch) {
        if (currentGate) result.gates[currentGate] = currentObj as Gate;
        currentGate = gateMatch[1];
        currentObj = {};
        inAgents = false;
        continue;
      }

      // Gate fields (4-space indent)
      const fieldMatch = line.match(/^    (\w+):\s*(.*)/);
      if (fieldMatch && currentGate) {
        const [, key, val] = fieldMatch;
        const cleanVal = val.replace(/^"|"$/g, "").trim();
        if (key === "agents") {
          if (cleanVal === "all") {
            currentObj.agents = "all";
          } else {
            inAgents = true;
            currentObj.agents = [];
          }
        } else {
          (currentObj as Record<string, unknown>)[key] = cleanVal;
        }
        continue;
      }

      // Agent list items (6-space indent)
      const agentMatch = line.match(/^\s+- (\w+)/);
      if (agentMatch && inAgents && Array.isArray(currentObj.agents)) {
        currentObj.agents.push(agentMatch[1]);
        continue;
      }
    }

    if (section === "notification") {
      const teleMatch = line.match(/^\s+(\w+):\s*(.*)/);
      if (teleMatch) {
        const [, key, val] = teleMatch;
        const cleanVal = val.trim();
        if (key === "timeout_minutes") {
          result.notification.telegram.timeout_minutes = parseInt(cleanVal);
        } else if (key in result.notification.telegram) {
          (result.notification.telegram as Record<string, unknown>)[key] = cleanVal;
        }
      }
    }
  }

  if (currentGate) result.gates[currentGate] = currentObj as Gate;
  return result;
}

function loadConfig(): ApprovalConfig {
  const raw = readFileSync(CONFIG_PATH, "utf-8");
  return parseConfig(raw);
}

// --- Telegram helpers ---

async function sendTelegram(token: string, chatId: string, message: string): Promise<number> {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: "Markdown",
    }),
  });
  const data = (await resp.json()) as { ok: boolean; result?: { message_id: number } };
  if (!data.ok) throw new Error(`Telegram send failed: ${JSON.stringify(data)}`);
  return data.result!.message_id;
}

async function pollForReply(
  token: string,
  chatId: string,
  afterMessageId: number,
  timeoutMs: number,
): Promise<"approve" | "deny" | "timeout"> {
  const startTime = Date.now();
  let lastUpdateId = 0;

  while (Date.now() - startTime < timeoutMs) {
    const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${lastUpdateId + 1}&timeout=10`;
    try {
      const resp = await fetch(url);
      const data = (await resp.json()) as {
        ok: boolean;
        result: Array<{
          update_id: number;
          message?: { message_id: number; chat: { id: number }; text?: string };
        }>;
      };

      if (data.ok && data.result) {
        for (const update of data.result) {
          lastUpdateId = update.update_id;
          const msg = update.message;
          if (!msg || String(msg.chat.id) !== chatId) continue;
          if (msg.message_id <= afterMessageId) continue;

          const text = (msg.text || "").toLowerCase().trim();
          if (text.includes("approve") || text === "yes" || text === "y") return "approve";
          if (text.includes("deny") || text === "no" || text === "n") return "deny";
        }
      }
    } catch {
      // Network error, retry
    }

    await new Promise((r) => setTimeout(r, 5000));
  }

  return "timeout";
}

// --- Commands ---

function cmdCheck(config: ApprovalConfig, gateName: string, agent?: string): void {
  const gate = config.gates[gateName];
  if (!gate) {
    console.log(JSON.stringify({ required: false, reason: "gate_not_found" }));
    return;
  }

  const agentApplies =
    gate.agents === "all" || !agent || (Array.isArray(gate.agents) && gate.agents.includes(agent));

  console.log(
    JSON.stringify({
      required: agentApplies,
      gate: gateName,
      description: gate.description,
      method: gate.requires,
      agents: gate.agents,
    }),
  );
}

async function cmdRequest(
  config: ApprovalConfig,
  gateName: string,
  agent: string,
  action: string,
): Promise<void> {
  const gate = config.gates[gateName];
  if (!gate) {
    console.error(`Gate '${gateName}' not found.`);
    process.exit(1);
  }

  const token = process.env[config.notification.telegram.bot_token_env];
  const chatId = process.env[config.notification.telegram.chat_id_env];

  if (!token || !chatId) {
    console.error(
      `Missing env vars: ${config.notification.telegram.bot_token_env} and/or ${config.notification.telegram.chat_id_env}`,
    );
    console.error("Set these in ~/.claude/.env");
    process.exit(1);
  }

  const message = [
    `*PAI Approval Request*`,
    ``,
    `*Gate:* ${gateName}`,
    `*Agent:* ${agent}`,
    `*Action:* ${action}`,
    `*Description:* ${gate.description}`,
    ``,
    `Reply *approve* or *deny* (timeout: ${config.notification.telegram.timeout_minutes}min)`,
  ].join("\n");

  if (gate.requires === "telegram_notify") {
    // Notify only — no approval needed
    await sendTelegram(token, chatId, message.replace("Reply *approve*", "_Notification only_"));
    console.log(JSON.stringify({ status: "notified", gate: gateName, agent }));
    return;
  }

  console.log(`Sending approval request to Telegram...`);
  const msgId = await sendTelegram(token, chatId, message);
  console.log(`Waiting for response (timeout: ${config.notification.telegram.timeout_minutes}min)...`);

  const timeoutMs = config.notification.telegram.timeout_minutes * 60 * 1000;
  const result = await pollForReply(token, chatId, msgId, timeoutMs);

  const response = { status: result, gate: gateName, agent, action };
  console.log(JSON.stringify(response));

  if (result === "deny" || result === "timeout") {
    await sendTelegram(
      token,
      chatId,
      `*PAI:* Request ${result === "timeout" ? "timed out" : "denied"} — ${gateName} by ${agent}`,
    );
    process.exit(1);
  }

  await sendTelegram(token, chatId, `*PAI:* Approved — ${gateName} by ${agent}`);
}

function cmdListGates(config: ApprovalConfig): void {
  console.log("\nPAI Approval Gates\n" + "=".repeat(60));
  for (const [name, gate] of Object.entries(config.gates)) {
    const agents = gate.agents === "all" ? "all agents" : (gate.agents as string[]).join(", ");
    console.log(`\n  ${name}`);
    console.log(`    ${gate.description}`);
    console.log(`    Method:  ${gate.requires}`);
    console.log(`    Agents:  ${agents}`);
  }
  console.log();
}

function printHelp(): void {
  console.log(`
PAI Approval Gate — Telegram-based governance for agent actions

USAGE:
  bun ApprovalGate.ts <command> [options]

COMMANDS:
  check <gate> [--agent <name>]
      Check if action requires approval. Returns JSON.

  request <gate> --agent <name> --action <description>
      Send Telegram approval request and wait for response.
      Exits 0 on approve, 1 on deny/timeout.

  list
      Show all configured approval gates.

  help
      Show this help message.

ENVIRONMENT:
  TELEGRAM_BOT_TOKEN    Telegram bot token (from ~/.claude/.env)
  TELEGRAM_CHAT_ID      Telegram chat ID (from ~/.claude/.env)

EXAMPLES:
  bun ApprovalGate.ts check deploy --agent hiram
  bun ApprovalGate.ts request deploy --agent hiram --action "Push carbene.ai to production"
  bun ApprovalGate.ts list

CONFIG:
  ${CONFIG_PATH}
`);
}

// --- Arg parsing ---

function parseArgs(args: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--") && args[i + 1]) {
      result[args[i].slice(2)] = args[++i];
    } else if (!result["_pos"]) {
      result["_pos"] = args[i];
    }
  }
  return result;
}

// --- Entry point ---

const [, , cmd, ...rest] = process.argv;
const opts = parseArgs(rest);
const config = loadConfig();

switch (cmd) {
  case "check":
    if (!opts["_pos"]) { console.error("Error: provide gate name"); process.exit(1); }
    cmdCheck(config, opts["_pos"], opts["agent"]);
    break;
  case "request":
    if (!opts["_pos"]) { console.error("Error: provide gate name"); process.exit(1); }
    if (!opts["agent"]) { console.error("Error: --agent required"); process.exit(1); }
    if (!opts["action"]) { console.error("Error: --action required"); process.exit(1); }
    await cmdRequest(config, opts["_pos"], opts["agent"], opts["action"]);
    break;
  case "list":
    cmdListGates(config);
    break;
  case "help":
  case "--help":
  case "-h":
  case undefined:
    printHelp();
    break;
  default:
    console.error(`Unknown command: ${cmd}\nRun 'bun ApprovalGate.ts help' for usage.`);
    process.exit(1);
}
