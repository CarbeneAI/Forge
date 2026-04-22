#!/usr/bin/env bun
/**
 * Naabu MCP Server - Local port scanner tool
 * Wraps ProjectDiscovery's naabu binary as a stdio MCP server
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { spawn } from "child_process";

const NAABU_PATH = process.env.NAABU_PATH || "naabu";

interface ScanResult {
  ip: string;
  port: number;
}

async function runNaabu(args: string[]): Promise<{ results: ScanResult[]; stderr: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(NAABU_PATH, args, {
      timeout: 300_000, // 5 minute max
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => { stdout += data.toString(); });
    proc.stderr.on("data", (data) => { stderr += data.toString(); });

    proc.on("error", (err) => reject(new Error(`Failed to run naabu: ${err.message}`)));
    proc.on("close", (code) => {
      const results: ScanResult[] = [];
      for (const line of stdout.trim().split("\n")) {
        if (!line) continue;
        try {
          results.push(JSON.parse(line));
        } catch {
          // Non-JSON line (banner etc), skip
        }
      }
      resolve({ results, stderr });
    });
  });
}

const server = new Server(
  { name: "naabu", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "scan_ports",
      description:
        "Scan a target host, IP, or CIDR range for open ports using naabu. Returns JSON results with IP and port for each finding.",
      inputSchema: {
        type: "object" as const,
        properties: {
          target: {
            type: "string",
            description: "Target host, IP address, or CIDR range (e.g. 'example.com', '192.168.1.0/24')",
          },
          ports: {
            type: "string",
            description: "Ports to scan: comma-separated (e.g. '22,80,443'), range ('1-1000'), or '-' for all 65535. Omit to use top_ports.",
          },
          top_ports: {
            type: "number",
            enum: [100, 1000],
            description: "Scan top N ports (100 or 1000). Ignored if ports is specified. Default: 100.",
          },
          passive: {
            type: "boolean",
            description: "Use passive mode (Shodan InternetDB lookup, no packets sent). Default: false.",
          },
          skip_host_discovery: {
            type: "boolean",
            description: "Skip host discovery and treat all hosts as up (-Pn). Useful when ICMP is blocked. Default: false.",
          },
          rate: {
            type: "number",
            description: "Packets per second. Default: 1000.",
          },
          timeout: {
            type: "number",
            description: "Timeout in milliseconds per probe. Default: 1000.",
          },
        },
        required: ["target"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "scan_ports") {
    return {
      content: [{ type: "text", text: `Unknown tool: ${request.params.name}` }],
      isError: true,
    };
  }

  const args = request.params.arguments as Record<string, unknown>;
  const target = args.target as string;

  if (!target) {
    return {
      content: [{ type: "text", text: "Error: target is required" }],
      isError: true,
    };
  }

  const cliArgs: string[] = ["-host", target, "-json", "-silent"];

  if (args.ports) {
    cliArgs.push("-p", args.ports as string);
  } else if (args.passive) {
    // passive mode handles its own port discovery
  } else {
    cliArgs.push("-top-ports", String(args.top_ports || 100));
  }

  if (args.passive) cliArgs.push("-passive");
  if (args.skip_host_discovery) cliArgs.push("-Pn");
  if (args.rate) cliArgs.push("-rate", String(args.rate));
  if (args.timeout) cliArgs.push("-timeout", String(args.timeout));

  try {
    const { results, stderr } = await runNaabu(cliArgs);

    const summary = results.length > 0
      ? `Found ${results.length} open port(s) on ${target}`
      : `No open ports found on ${target}`;

    const output = {
      summary,
      command: `naabu ${cliArgs.join(" ")}`,
      total_open_ports: results.length,
      results,
    };

    return {
      content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
    };
  } catch (err) {
    return {
      content: [{ type: "text", text: `Scan failed: ${(err as Error).message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("MCP server failed:", err);
  process.exit(1);
});
