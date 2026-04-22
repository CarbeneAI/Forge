# Wazuh Dashboard Deployment Workflow

## Architecture

```
Wazuh Manager (10.0.0.x)
  → custom-webhook script POSTs alert JSON
  → n8n webhook (n8n.home.yourdomain.com/webhook/wazuh-alerts)
  → n8n HTTP Request node POSTs to dashboard API
  → Dashboard API (localhost:4001/alerts/ingest)
  → WebSocket broadcast to browser clients
```

n8n runs on a separate host (not on the dashboard machine). It cannot write to the local JSONL file. Instead, n8n POSTs alerts to the dashboard's HTTP `/alerts/ingest` endpoint.

## Prerequisites

1. **DNS Entry in Pi-hole**
   - Add local DNS record: `wazuh-dashboard.home.yourdomain.com` → `10.0.0.70`
   - Add local DNS record: `wazuh-dashboard-api.home.yourdomain.com` → `10.0.0.70`

2. **Dashboard server running on your host machine (10.0.0.10)**
   - Server listens on port 4001 with POST `/alerts/ingest` endpoint
   - Accepts single alert or array of alerts as JSON body
   - Broadcasts to WebSocket clients automatically

## Deployment Steps

### 1. Copy Traefik Config to Remote

```bash
scp ~/PAI/homelab-deploy/traefik/dynamic.yml youruser@10.0.0.70:~/homelab-deploy/traefik/
```

Traefik auto-reloads (watch: true is enabled).

### 2. Install systemd Service (on your host machine)

```bash
# Copy service file
sudo cp ~/PAI/.claude/skills/WazuhDashboard/wazuh-dashboard.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable auto-start on boot
sudo systemctl enable wazuh-dashboard

# Start the service
sudo systemctl start wazuh-dashboard

# Check status
sudo systemctl status wazuh-dashboard
```

### 3. Verify Deployment

```bash
# Check server health
curl http://localhost:4001/health

# Check client is running
curl http://localhost:5173

# Check via Traefik (from any host)
curl -I https://wazuh-dashboard.home.yourdomain.com
```

## n8n Webhook Integration

### Create Wazuh Alert Receiver Workflow in n8n

1. Create new workflow: "Wazuh Alert Receiver"
2. Add **Webhook** node:
   - Method: POST
   - Path: `wazuh-alerts`
   - Response: "Respond Immediately"

3. Add **HTTP Request** node (NOT a Code node):
   - Method: POST
   - URL: `https://wazuh-dashboard-api.home.yourdomain.com/alerts/ingest`
   - Note: n8n may be on a different subnet and cannot reach your dashboard host's local IP directly. Use the Traefik/reverse-proxy URL.
   - Body Content Type: JSON
   - Body: Pass through the alert payload (`{{ JSON.stringify($json.body) }}`)

4. Activate the workflow

5. Test webhook URL: `https://n8n.home.yourdomain.com/webhook/wazuh-alerts`

### Configure Wazuh Custom Integration Script

SSH to Wazuh manager (10.0.0.60) and create the integration script:

```bash
sudo tee /var/ossec/integrations/custom-webhook > /dev/null << 'SCRIPT'
#!/usr/bin/env python3
"""
Wazuh custom integration: forwards alerts to n8n webhook.
"""
import sys
import json
try:
    from urllib.request import Request, urlopen
    from urllib.error import URLError, HTTPError
except ImportError:
    from urllib2 import Request, urlopen, URLError, HTTPError

def main():
    if len(sys.argv) < 4:
        sys.exit(1)
    alert_file = sys.argv[1]
    hook_url = sys.argv[2]
    try:
        with open(alert_file) as f:
            alert_json = f.read()
    except Exception as e:
        print(f"Error reading alert file: {e}", file=sys.stderr)
        sys.exit(1)
    try:
        json.loads(alert_json)
    except json.JSONDecodeError as e:
        print(f"Invalid JSON: {e}", file=sys.stderr)
        sys.exit(1)
    try:
        request = Request(hook_url, data=alert_json.encode('utf-8'))
        request.add_header('Content-Type', 'application/json')
        response = urlopen(request, timeout=10)
        if response.getcode() != 200:
            print(f"Webhook returned {response.getcode()}", file=sys.stderr)
            sys.exit(1)
    except (HTTPError, URLError) as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
SCRIPT

sudo chown root:wazuh /var/ossec/integrations/custom-webhook
sudo chmod 750 /var/ossec/integrations/custom-webhook
```

### Configure ossec.conf

Add the integration block to `/var/ossec/etc/ossec.conf`:

```bash
# Backup first
sudo cp /var/ossec/etc/ossec.conf /var/ossec/etc/ossec.conf.bak.$(date +%Y%m%d)

# Add integration block before closing tag
sudo sed -i '/<\/ossec_config>/i \
  <integration>\
    <name>custom-webhook</name>\
    <hook_url>https://n8n.home.yourdomain.com/webhook/wazuh-alerts</hook_url>\
    <level>5</level>\
    <alert_format>json</alert_format>\
  </integration>' /var/ossec/etc/ossec.conf
```

Verify and restart:

```bash
grep -A5 'custom-webhook' /var/ossec/etc/ossec.conf
sudo systemctl restart wazuh-manager
sudo systemctl status wazuh-manager
```

## Testing End-to-End

### 1. Test n8n webhook directly

```bash
curl -X POST https://n8n.home.yourdomain.com/webhook/wazuh-alerts \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2026-01-28T20:00:00Z",
    "rule": {"level": 10, "description": "Test alert from curl", "id": "100001"},
    "agent": {"id": "000", "name": "test-agent"}
  }'
```

### 2. Verify dashboard received the alert

```bash
curl -s http://localhost:4001/alerts/recent | python3 -m json.tool | head -20
```

### 3. Check Wazuh integration logs (on Wazuh server)

```bash
sudo tail -50 /var/ossec/logs/integrations.log
```

### 4. Check n8n execution history

Visit n8n UI → Workflow "Wazuh Alert Receiver" → Executions tab

## Troubleshooting

### Check Logs

```bash
# systemd service logs (your host machine)
journalctl -u wazuh-dashboard -f

# Manual server logs (your host machine)
cd ~/.claude/skills/WazuhDashboard/apps/server
bun run dev

# Manual client logs (your host machine)
cd ~/.claude/skills/WazuhDashboard/apps/client
bun run dev

# Wazuh integration logs (Wazuh server 10.0.0.60)
sudo tail -f /var/ossec/logs/integrations.log
```

### Common Issues

1. **WebSocket not connecting**
   - Check if port 4001 is listening: `ss -tlnp | grep 4001`
   - Check Traefik logs for WebSocket upgrade issues

2. **No alerts appearing**
   - Test n8n webhook: `curl -X POST https://n8n.home.yourdomain.com/webhook/wazuh-alerts -H "Content-Type: application/json" -d '{"test":true}'`
   - Test dashboard ingest directly: `curl -X POST http://localhost:4001/alerts/ingest -H "Content-Type: application/json" -d '{"rule":{"level":5,"description":"direct test"}}'`
   - Check n8n execution history for errors
   - Check Wazuh integration logs: `sudo tail /var/ossec/logs/integrations.log` on 10.0.0.60

3. **PAI chat not responding**
   - Verify ANTHROPIC_API_KEY in ~/.claude/.env
   - Check server logs for API errors

4. **n8n HTTP Request failing**
   - n8n may be on a different subnet than your dashboard host — use the Traefik/reverse-proxy URL, not a direct IP
   - Workflow must target `https://wazuh-dashboard-api.home.yourdomain.com/alerts/ingest`
   - The `$json` from the Webhook node wraps body in envelope — use `$json.body` to get the alert payload
