---
name: WazuhDashboard
description: Real-time Wazuh SIEM security dashboard with PAI chat integration. USE WHEN user mentions wazuh dashboard, security alerts, SIEM monitoring, alert analysis, OR wants to view security events with AI assistance.
---

# WazuhDashboard

Real-time security monitoring dashboard for Wazuh SIEM alerts with integrated PAI chat for contextual analysis.

## Architecture

```
Wazuh (10.0.0.60) → n8n webhook → JSONL file → Dashboard Server (WebSocket) → Vue Client
                                                                    ↓
                                                          PAI API (localhost:3001)
```

## Features

- **Real-time Alert Feed**: Live streaming of Wazuh security alerts via WebSocket
- **Severity Color-coding**: Visual priority indicators (Critical, High, Medium, Low)
- **Split-screen Layout**: 60% alerts feed, 40% PAI chat panel
- **Alert Filtering**: Filter by severity, agent, rule group
- **PAI Chat Integration**: Context-aware security analysis
- **Quick Actions**: "Analyze", "Remediation", "Related?" buttons

## Ports

| Component | Port | URL |
|-----------|------|-----|
| Server (API/WebSocket) | 4001 | http://localhost:4001 |
| Client (Vue/Vite) | 5173 | http://localhost:5173 |
| Production | 443 | https://wazuh-dashboard.home.yourdomain.com |

## Severity Levels

| Level | Range | Color | Hex |
|-------|-------|-------|-----|
| Critical | 12+ | Red | #f7768e |
| High | 7-11 | Amber | #e0af68 |
| Medium | 3-6 | Purple | #bb9af7 |
| Low | 0-2 | Green | #9ece6a |

## Management

```bash
# Start dashboard
~/.claude/skills/WazuhDashboard/manage.sh start

# Stop dashboard
~/.claude/skills/WazuhDashboard/manage.sh stop

# Restart
~/.claude/skills/WazuhDashboard/manage.sh restart

# Check status
~/.claude/skills/WazuhDashboard/manage.sh status
```

## Configuration

### Environment Variables

Add to `~/.claude/.env`:

```bash
WAZUH_PAI_API_KEY=<your-claude-api-key>
WAZUH_ALERTS_PATH=/path/to/your/wazuh-alerts/alerts.jsonl
```

### n8n Webhook

Configure n8n workflow to receive Wazuh alerts and append to JSONL file:
- Webhook URL: `https://n8n.home.yourdomain.com/webhook/wazuh-alerts`
- Output: Append JSON to `$WAZUH_ALERTS_PATH`

### Wazuh Integration

Add to `/var/ossec/etc/ossec.conf` on Wazuh manager (configure your Wazuh IP):

```xml
<integration>
  <name>custom-webhook</name>
  <hook_url>https://n8n.home.yourdomain.com/webhook/wazuh-alerts</hook_url>
  <level>5</level>
  <alert_format>json</alert_format>
</integration>
```

## File Structure

```
WazuhDashboard/
├── SKILL.md
├── manage.sh
├── apps/
│   ├── server/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── alert-ingest.ts
│   │       ├── pai-client.ts
│   │       └── types.ts
│   └── client/
│       ├── package.json
│       ├── vite.config.ts
│       ├── tailwind.config.js
│       ├── postcss.config.js
│       ├── index.html
│       └── src/
│           ├── main.ts
│           ├── App.vue
│           ├── types.ts
│           ├── styles/
│           │   └── main.css
│           ├── composables/
│           │   ├── useWebSocket.ts
│           │   └── usePAIChat.ts
│           └── components/
│               ├── AlertFeed.vue
│               ├── AlertRow.vue
│               ├── AlertStats.vue
│               ├── ChatPanel.vue
│               └── FilterPanel.vue
└── workflows/
    └── Deploy.md
```

## Examples

**Example 1: View live security alerts**
```
User: "Start wazuh dashboard"
→ Runs manage.sh start
→ Opens dashboard at http://localhost:5173
→ Live alerts stream in real-time
```

**Example 2: Analyze specific alert**
```
User: "What does this brute force alert mean?"
→ PAI analyzes selected alert context
→ Provides explanation and remediation steps
```

**Example 3: Filter high-severity alerts**
```
User: "Show only critical and high alerts"
→ Applies severity filter
→ Displays filtered alert stream
```
