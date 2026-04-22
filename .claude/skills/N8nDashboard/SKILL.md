---
name: N8nDashboard
description: Real-time n8n workflow status dashboard. USE WHEN user mentions n8n dashboard, n8n status, workflow status, automation status, OR wants to monitor n8n workflows.
---

# N8nDashboard

Real-time status dashboard for n8n automation workflows with execution history.

## Architecture

```
n8n API (your-n8n-host:5678) → Dashboard Server (port 4002) → Vue Client (port 5174)
```

## Features

- List all n8n workflows with active/inactive status
- Recent execution history with success/error indicators
- Auto-refresh every 30 seconds
- Manual refresh button
- Workflow activation/deactivation toggle (future)

## Requirements

- n8n API key (generate in n8n Settings > n8n API)
- Environment variable: `N8N_API_KEY` in `~/.claude/.env`
- Environment variable: `N8N_API_URL` (default: http://10.0.0.20:5678)

## Quick Start

```bash
# Start dashboard
~/.claude/skills/N8nDashboard/manage.sh start

# Stop dashboard
~/.claude/skills/N8nDashboard/manage.sh stop

# Check status
~/.claude/skills/N8nDashboard/manage.sh status
```

## Ports

| Component | Port | URL |
|-----------|------|-----|
| Server | 4002 | http://localhost:4002 |
| Client | 5174 | http://localhost:5174 |

## Production URLs

- Dashboard: https://n8n-dashboard.home.yourdomain.com
- API: https://n8n-dashboard-api.home.yourdomain.com

## API Endpoints

### Server Endpoints (port 4002)

| Endpoint | Method | Description |
|----------|--------|-------------|
| /health | GET | Health check |
| /workflows | GET | List all workflows |
| /workflows/:id | GET | Get specific workflow |
| /executions | GET | Recent executions |
| /executions?workflowId=X | GET | Executions for workflow |

## Setup n8n API Key

1. Open n8n: https://n8n.home.yourdomain.com
2. Go to Settings > n8n API
3. Create a new API key
4. Add to `~/.claude/.env`:
   ```
   N8N_API_KEY=your-api-key-here
   N8N_API_URL=http://10.0.0.20:5678
   ```
