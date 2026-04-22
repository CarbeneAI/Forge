---
name: Naabu
description: Port scanner for finding open ports and services on hosts. USE WHEN user mentions port scanning, open ports, service discovery, network reconnaissance, or host enumeration. Wraps ProjectDiscovery's naabu binary as a local MCP server.
---

# Naabu

Fast port scanner powered by [ProjectDiscovery's naabu](https://github.com/projectdiscovery/naabu). Runs locally via MCP server wrapper around the naabu binary.

## Capabilities

- TCP SYN/CONNECT port scanning
- Top 100/1000 port presets (nmap-compatible)
- CIDR range scanning
- JSON Lines output for structured results
- Passive scanning via Shodan InternetDB (no packets sent)
- Service version detection (via nmap passthrough)

## Workflow Routing

| Action | Trigger | Behavior |
|--------|---------|----------|
| **Scan Ports** | "scan ports on", "check open ports", "port scan" | Run naabu against target |
| **Quick Scan** | "quick scan", "top ports" | Scan top 100 ports |
| **Full Scan** | "full port scan", "all ports" | Scan all 65535 ports |
| **Passive Scan** | "passive scan", "no packets" | Use Shodan InternetDB |

## Examples

**Example 1: Scan top ports on a host**
```
User: "Scan the top ports on example.com"
→ naabu -host example.com -top-ports 100 -json -silent
→ Returns JSON list of open ports
```

**Example 2: Scan specific ports on a subnet**
```
User: "Check if SSH and HTTP are open on 192.168.1.0/24"
→ naabu -host 192.168.1.0/24 -p 22,80,443 -json -silent
→ Returns open port findings per host
```

**Example 3: Passive recon (no packets)**
```
User: "Do a passive port scan on example.com"
→ naabu -host example.com -passive -json -silent
→ Returns known open ports from InternetDB without sending packets
```

## CLI Reference

```bash
# Key flags
naabu -host <target>       # Single host, IP, or CIDR
naabu -list <file>         # File with targets (one per line)
naabu -p 22,80,443         # Specific ports
naabu -top-ports 100       # Top 100 or 1000 ports
naabu -json                # JSON Lines output
naabu -silent              # Suppress banner/info
naabu -passive             # Shodan InternetDB lookup (no packets)
naabu -Pn                  # Skip host discovery
naabu -rate 1000           # Packets per second
naabu -o results.jsonl     # Output to file
```

## JSON Output Format

Each open port produces one JSON line:
```json
{"ip":"93.184.216.34","port":80}
{"ip":"93.184.216.34","port":443}
```

## MCP Server

The MCP server (`tools/mcp-server.ts`) wraps the naabu binary and exposes it as a local stdio MCP tool. Configured in `~/PAI/.mcp.json`.

## Requirements

- naabu binary in PATH (`~/bin/naabu`)
- libpcap (`brew install libpcap`)
