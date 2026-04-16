# Telegram Integration for PAI

## Overview

The Telegram integration allows you to interact with your PAI (Personal AI Infrastructure) through Telegram messaging. This creates a mobile interface to your local Claude Code instance, giving you access to all PAI skills, agents, and capabilities from anywhere.

## Architecture

```
Telegram App (You)
    ↓
Telegram Bot API
    ↓
Webhook (via ngrok/tunnel)
    ↓
Claude Code API Server (Local)
    ↓
Claude Code CLI (PAI)
    ↓
Your Skills, Agents, History
```

### How It Works

1. **You send a message** to your Telegram bot
2. **Telegram servers** forward the message to your webhook URL
3. **Your local API server** receives the webhook
4. **Claude Code processes** the request with full PAI context
5. **Response flows back** through the same path to your Telegram app

## Components

### 1. Claude Code API Server

**Location**: `~/.claude/tools/claude-code-api-server.ts`

A Bun-based HTTP server that exposes Claude Code as an API with these endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check and status |
| `/v1/messages` | POST | Anthropic-compatible chat endpoint |
| `/v1/skills` | POST | Execute specific PAI skill |
| `/v1/agents` | POST | Execute specific PAI agent |
| `/v1/sessions` | GET | List active sessions |

**Key Features**:
- API key authentication via `x-api-key` header
- Session persistence in `~/.claude/api-sessions/`
- Full access to PAI skills and agents
- CORS enabled for web integrations
- Anthropic API-compatible format

**Security**:
- Generates secure random API key automatically
- Stored in `~/.claude/.env` as `CLAUDE_API_KEY`
- All requests require valid API key
- Session data isolated per user (when multi-user)

### 2. Startup Scripts

**Setup Script**: `~/.claude/tools/setup-telegram-api.sh`

Automates initial configuration:
- Checks/creates `.env` file
- Generates secure API key if needed
- Installs Bun if not present
- Installs ngrok if not present
- Makes scripts executable
- Provides next steps guidance

**Server Start Script**: `~/.claude/tools/start-api-server.sh`

Starts the API server with:
- Environment variable loading
- API key validation/generation
- Bun installation check
- Server launch with proper config

### 3. Tunnel/Proxy Layer

**Why Needed**: Your local API server runs on `localhost:3001`, but Telegram needs a public HTTPS URL for webhooks.

**Options**:

#### Option A: ngrok (Easiest)
```bash
# Install ngrok
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok

# Configure auth token (from ngrok.com dashboard)
ngrok config add-authtoken YOUR_TOKEN

# Start tunnel
ngrok http 3001
```

**Pros**: Free tier available, HTTPS automatic, easy setup
**Cons**: URL changes each restart (unless paid plan), public endpoint

#### Option B: SSH Tunnel to Your VPS
```bash
# Create reverse SSH tunnel
ssh -R 3001:localhost:3001 your-vps-hostname

# Then configure nginx/Traefik on VPS to proxy
# telegram.yourdomain.com → localhost:3001
```

**Pros**: Your own domain, persistent URL, more control
**Cons**: Requires VPS configuration, manual HTTPS setup

#### Option C: Cloudflare Tunnel
```bash
cloudflared tunnel --url http://localhost:3001
```

**Pros**: Free, secure, persistent URL option available
**Cons**: Cloudflare account required, additional tool

### 4. Telegram Bot Setup

**Create Bot**:
1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot` command
3. Choose name and username
4. Save the API token provided

**Configure Webhook**:
```bash
# Get your public URL from ngrok/tunnel
# Example: https://abc123.ngrok.io

# Set webhook
curl -X POST "https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://abc123.ngrok.io/v1/messages"}'

# Verify webhook
curl "https://api.telegram.org/bot<YOUR_TOKEN>/getWebhookInfo"
```

### 5. n8n Workflow (Optional but Recommended)

**Why Use n8n**:
- Adds message formatting and preprocessing
- Provides webhook → API transformation
- Enables complex workflows and routing
- Gives you debugging visibility
- Allows multi-bot management

**Workflow File**: `~/telegram-pai-local-workflow.json`

**Setup**:
1. Import workflow into n8n
2. Add Telegram bot credentials
3. Update HTTP Request node with your ngrok URL
4. Set `x-api-key` header to your `CLAUDE_API_KEY`
5. Activate workflow

## Quick Start Guide

### Prerequisites

- PAI installed and configured
- Bun installed (`curl -fsSL https://bun.sh/install | bash`)
- Telegram account
- ngrok account (free tier works)

### Step 1: Initial Setup

```bash
# Run setup script
bash ~/.claude/tools/setup-telegram-api.sh
```

This will:
- Create/configure `.env` file
- Generate secure API key
- Install dependencies
- Provide next steps

### Step 2: Start API Server

```bash
# Start the server
bash ~/.claude/tools/start-api-server.sh
```

You should see:
```
🚀 Claude Code API Server started!

Endpoint: http://localhost:3001
PAI Directory: /home/username/.claude
Session Storage: /home/username/.claude/api-sessions

API Key: abc123def456...
```

**Keep this terminal open** - the server must stay running.

### Step 3: Expose via Tunnel

**In a new terminal**:

```bash
# Start ngrok tunnel
ngrok http 3001
```

You'll see:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:3001
```

**Copy the HTTPS URL** - you'll need it for webhook setup.

### Step 4: Create Telegram Bot

1. Open Telegram, message [@BotFather](https://t.me/BotFather)
2. Send `/newbot`
3. Follow prompts (name: "My PAI Bot", username: "myusername_pai_bot")
4. Save the token (looks like `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

### Step 5: Configure Webhook

```bash
# Set your variables
BOT_TOKEN="your_bot_token_here"
WEBHOOK_URL="https://abc123.ngrok.io/v1/messages"

# Set webhook
curl -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"${WEBHOOK_URL}\"}"

# Should respond: {"ok":true,"result":true,"description":"Webhook was set"}
```

### Step 6: Test Integration

1. Open Telegram
2. Find your bot (search for the username you created)
3. Send a message: "Hello, what can you do?"
4. Watch the server logs in your terminal
5. Receive response from PAI!

## Configuration

### Environment Variables

Add to `~/.claude/.env`:

```bash
# Claude Code API Server
CLAUDE_API_KEY=your_generated_key_here  # Auto-generated by setup script
CLAUDE_API_PORT=3001                    # Default port

# Telegram Bot (optional - for direct integration)
TELEGRAM_BOT_TOKEN=your_bot_token      # From @BotFather

# ngrok (optional - for persistent URLs)
NGROK_AUTHTOKEN=your_ngrok_token       # From ngrok.com dashboard
```

### API Server Options

You can customize the server by modifying `claude-code-api-server.ts`:

```typescript
// Change port
const PORT = parseInt(process.env.CLAUDE_API_PORT || "3001");

// Change session storage location
const SESSION_DIR = join(PAI_DIR, "api-sessions");

// Adjust timeouts
timeout 180 "$CLAUDE_CMD" ...  // 180s timeout for research
```

## Making It Persistent

### Option 1: systemd Service (Recommended for Linux)

Create service file:

```bash
sudo nano /etc/systemd/system/pai-api-server.service
```

Add:

```ini
[Unit]
Description=PAI Claude Code API Server
After=network.target

[Service]
Type=simple
User=yourusername
WorkingDirectory=/home/yourusername/.claude
Environment="PAI_DIR=/home/yourusername/.claude"
ExecStart=/home/yourusername/.bun/bin/bun /home/yourusername/.claude/tools/claude-code-api-server.ts
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable on boot
sudo systemctl enable pai-api-server

# Start now
sudo systemctl start pai-api-server

# Check status
sudo systemctl status pai-api-server

# View logs
sudo journalctl -u pai-api-server -f
```

### Option 2: systemd for ngrok

Create ngrok service:

```bash
sudo nano /etc/systemd/system/pai-ngrok.service
```

Add:

```ini
[Unit]
Description=ngrok tunnel for PAI API Server
After=network.target pai-api-server.service

[Service]
Type=simple
User=yourusername
ExecStart=/usr/local/bin/ngrok http 3001 --log=stdout
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable pai-ngrok
sudo systemctl start pai-ngrok

# Check status
sudo systemctl status pai-ngrok
```

**Note**: Free ngrok URLs change on restart. For persistent URL, either:
- Upgrade to ngrok paid plan (static domain)
- Use SSH tunnel to your VPS instead
- Use Cloudflare Tunnel with custom domain

### Option 3: tmux/screen (Quick Alternative)

```bash
# Start in tmux
tmux new-session -d -s pai-api "bash ~/.claude/tools/start-api-server.sh"
tmux new-session -d -s pai-ngrok "ngrok http 3001"

# Attach to view
tmux attach -t pai-api
tmux attach -t pai-ngrok

# List sessions
tmux ls

# Kill sessions
tmux kill-session -t pai-api
tmux kill-session -t pai-ngrok
```

### Option 4: VPS with Persistent Domain

**Best for production use**:

1. **Set up reverse SSH tunnel** from your Mac to VPS:
```bash
# On your Mac - run in background
ssh -N -R 3001:localhost:3001 your-vps-user@your-vps-ip &

# Or use autossh for auto-reconnect
autossh -M 0 -N -R 3001:localhost:3001 your-vps-user@your-vps-ip
```

2. **Configure Traefik on VPS** (you already have this):

Create `docker-compose.yml` for Telegram webhook receiver:

```yaml
version: '3.8'

services:
  telegram-webhook:
    image: nginx:alpine
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.telegram.rule=Host(`telegram.yourdomain.com`)"
      - "traefik.http.routers.telegram.entrypoints=websecure"
      - "traefik.http.routers.telegram.tls.certresolver=letsencrypt"
      - "traefik.http.services.telegram.loadbalancer.server.port=80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
```

Create `nginx.conf`:

```nginx
events {}
http {
  server {
    listen 80;
    location / {
      proxy_pass http://localhost:3001;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
    }
  }
}
```

3. **Set webhook to your domain**:
```bash
curl -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
  -d "url=https://telegram.yourdomain.com/v1/messages"
```

## Session Management

### Session Storage

All conversations are stored in:
```
~/.claude/api-sessions/
├── telegram-123456789.txt     # User ID-based session
├── session-1234567890.txt     # Timestamp-based session
└── agent-1234567890.txt       # Agent execution session
```

### Session Formats

Each message creates/updates a session file with Claude's response.

### Managing Sessions

```bash
# List all sessions
curl -H "x-api-key: YOUR_API_KEY" http://localhost:3001/v1/sessions

# View session content
cat ~/.claude/api-sessions/telegram-123456789.txt

# Clear old sessions (7+ days old)
find ~/.claude/api-sessions -name "*.txt" -mtime +7 -delete

# Backup sessions
tar -czf sessions-backup-$(date +%Y%m%d).tar.gz ~/.claude/api-sessions/
```

## Advanced Usage

### Using Skills via Telegram

Send messages that trigger specific skills:

```
You: "Do research on best static site generators"
→ Research skill activates automatically
→ Launches parallel agents
→ Returns comprehensive analysis

You: "Create a CLI tool for managing my blog"
→ CreateCLI skill activates
→ Generates TypeScript CLI
→ Provides code via Telegram
```

### Using Agents via Telegram

PAI includes 9 specialized AI agents you can invoke for specific tasks. Use the `/agent` command or natural language.

#### Agent Command Syntax

```
/agent <name> <task>
```

#### Available Agents

| Agent | Invoke As | Purpose | Best For |
|-------|-----------|---------|----------|
| **Grok** | `grok-researcher` | Research synthesis & content ideation | Combining research, generating blog/video ideas |
| **Architect** | `architect` | System design & PRDs | Planning features, architecture decisions |
| **Engineer** | `engineer` | Code implementation | Writing code, debugging, TDD |
| **Designer** | `designer` | UX/UI design | Visual design, design systems |
| **Pentester** | `pentester` | Security testing | Vulnerability assessment, security audits |
| **Researcher** | `researcher` | General research | Information gathering, fact verification |
| **Claude Researcher** | `claude-researcher` | Web search research | Current events, quick lookups |
| **Perplexity Researcher** | `perplexity-researcher` | Deep search with citations | Academic research, sourced answers |
| **Gemini Researcher** | `gemini-researcher` | Multi-perspective research | Technical deep dives |

#### Agent Examples

**Grok Research Synthesis (combines all research agents):**
```
/agent grok-researcher AI agents in cybersecurity
```
→ Orchestrates Claude, Perplexity, Gemini researchers in parallel
→ Synthesizes all results into unified insights
→ Generates blog post, training, and YouTube video ideas

**Architecture Planning:**
```
/agent architect Design a user authentication system
```
→ Creates comprehensive PRD
→ Defines technical requirements
→ Provides implementation checklist

**Code Implementation:**
```
/agent engineer Implement JWT authentication in TypeScript
```
→ TDD approach with tests first
→ Production-ready code
→ Security best practices

**Security Assessment:**
```
/agent pentester Review authentication flow for vulnerabilities
```
→ OWASP Top 10 analysis
→ Specific vulnerability identification
→ Remediation recommendations

**Quick Research:**
```
/agent claude-researcher Latest React 19 features
```
→ Fast web search
→ Current information
→ Concise summary

**Deep Research with Citations:**
```
/agent perplexity-researcher Zero trust architecture best practices
```
→ Academic-quality research
→ Source citations included
→ Comprehensive coverage

#### Natural Language Invocation

You can also invoke agents naturally without the `/agent` command:

```
"Use the architect agent to plan a blog platform"
"Have the engineer implement user signup"
"Ask grok to research and create content ideas for AI security"
"Get the pentester to review our API security"
```

#### Grok Content Ideation

The Grok agent is unique - it not only synthesizes research but generates content ideas:

**Output includes:**
- **Blog Post Ideas** - Long-form educational content, how-to guides
- **Training Material Ideas** - Workshop outlines, course modules, lab exercises
- **YouTube Video Ideas** - Tutorial concepts, explainer scripts, demo ideas

Example:
```
/agent grok-researcher Kubernetes security best practices
```

Returns research synthesis PLUS:
- 3-5 blog post titles with outlines
- 2-3 training workshop concepts
- 3-5 YouTube video ideas with hooks

### API Direct Access

You can also call the API directly:

**Chat Completion**:
```bash
curl -X POST http://localhost:3001/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "messages": [
      {"role": "user", "content": "What is PAI?"}
    ],
    "system": "You are chatting via Telegram integration.",
    "session_id": "telegram-123456789"
  }'
```

**Skill Execution**:
```bash
curl -X POST http://localhost:3001/v1/skills \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "skill": "Research",
    "prompt": "Research VitePress alternatives",
    "session_id": "api-test-123"
  }'
```

**Agent Execution**:
```bash
curl -X POST http://localhost:3001/v1/agents \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "agent": "engineer",
    "task": "Create a TypeScript function to parse Markdown",
    "session_id": "agent-test-123"
  }'
```

## Troubleshooting

### Server Won't Start

**Check Bun Installation**:
```bash
bun --version
# If not found, reinstall
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

**Check Port Availability**:
```bash
# See if port 3001 is in use
lsof -i :3001

# If in use, kill the process or change port
export CLAUDE_API_PORT=3002
```

**Check Environment**:
```bash
# Verify .env exists and has API key
cat ~/.claude/.env | grep CLAUDE_API_KEY

# If missing, regenerate
bash ~/.claude/tools/setup-telegram-api.sh
```

### Webhook Not Receiving Messages

**Verify Webhook URL**:
```bash
curl "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo"
```

Should show:
```json
{
  "ok": true,
  "result": {
    "url": "https://abc123.ngrok.io/v1/messages",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

**Check ngrok Status**:
```bash
# ngrok provides web interface at:
http://localhost:4040

# Shows all requests and responses
```

**Test Webhook Directly**:
```bash
curl -X POST https://your-ngrok-url.ngrok.io/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "messages": [{"role": "user", "content": "test"}]
  }'
```

### Bot Not Responding

**Check Server Logs**:
```bash
# If running in terminal, logs appear there

# If running as systemd service:
sudo journalctl -u pai-api-server -f

# Look for errors or connection issues
```

**Verify API Key**:
```bash
# Test with correct key
curl -H "x-api-key: $(grep CLAUDE_API_KEY ~/.claude/.env | cut -d= -f2)" \
  http://localhost:3001/health

# Should return: {"status":"ok",...}

# Test with wrong key (should fail)
curl -H "x-api-key: wrong" http://localhost:3001/health
# Should return: {"error":"Unauthorized"}
```

**Check Claude Code CLI**:
```bash
# Verify Claude Code works directly
claude -p "Hello, what's 2+2?"

# If this fails, fix Claude Code first
```

### Slow Responses

**Check Timeout Settings**:
```typescript
// In claude-code-api-server.ts
timeout 180 "$CLAUDE_CMD" ...  // 180s = 3 minutes

// Increase if needed for long operations
timeout 300 "$CLAUDE_CMD" ...  // 5 minutes
```

**Use Faster Models for Simple Tasks**:
```typescript
// Modify executeClaudeCode to add model hints
claude -p "... Use haiku model for simple responses ..."
```

### Session Issues

**Clear Corrupted Sessions**:
```bash
# Remove all sessions
rm -rf ~/.claude/api-sessions/*

# Or just specific session
rm ~/.claude/api-sessions/telegram-123456789.txt
```

**Check Session Permissions**:
```bash
# Ensure directory is writable
ls -ld ~/.claude/api-sessions
# Should show: drwxr-xr-x

# Fix if needed
chmod 755 ~/.claude/api-sessions
```

## Security Considerations

### API Key Security

- ✅ **Generated automatically** - 64-character random hex
- ✅ **Stored in .env** - Never committed to Git
- ✅ **Required for all requests** - No unauthenticated access
- ⚠️ **Protect your .env file** - Contains sensitive keys

### Tunnel Security

**ngrok**:
- Free URLs are public (anyone who knows URL can access)
- Consider ngrok auth: `ngrok http 3001 --basic-auth="username:password"`
- Use IP restrictions on paid plans

**SSH Tunnel**:
- More secure - only accessible via your VPS
- Use SSH key authentication
- Configure VPS firewall rules

**Cloudflare Tunnel**:
- Built-in DDoS protection
- Access controls available
- Integrates with Cloudflare Access

### Telegram Bot Security

- ✅ **Bot token is secret** - Never share or commit
- ✅ **Webhook validates source** - Telegram servers only
- ⚠️ **Consider user whitelist** - Only allow specific Telegram user IDs
- ⚠️ **Rate limiting** - Prevent abuse

**Add User Whitelist** (modify `claude-code-api-server.ts`):

```typescript
// Add allowed users
const ALLOWED_TELEGRAM_IDS = [123456789, 987654321]; // Your Telegram user ID

// In webhook handler, check user ID
if (!ALLOWED_TELEGRAM_IDS.includes(telegram_user_id)) {
  return new Response(JSON.stringify({ error: "Unauthorized user" }), {
    status: 403
  });
}
```

### Local System Security

- Your API server has **full access to Claude Code**
- Claude Code has **full access to your PAI directory**
- PAI has access to **all your files and history**

**Best Practices**:
- Don't expose API publicly without authentication
- Use firewall rules on VPS
- Monitor session logs for suspicious activity
- Rotate API keys periodically

## Monitoring and Logging

### Server Logs

**Terminal Output**:
```
[DEBUG] Incoming request: POST /v1/messages
[DEBUG] User message: Hello, what can you do?
[DEBUG] Calling executeClaudeCode...
[DEBUG] Got response from executeClaudeCode
```

**systemd Journal**:
```bash
# Follow logs
sudo journalctl -u pai-api-server -f

# Filter by time
sudo journalctl -u pai-api-server --since "1 hour ago"

# Search for errors
sudo journalctl -u pai-api-server | grep ERROR
```

### Telegram Bot Logs

**Webhook Info**:
```bash
# Check webhook status
curl "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo"
```

**ngrok Logs**:
```bash
# Web interface (while ngrok running)
open http://localhost:4040

# Shows all HTTP requests/responses
```

### Session Logs

```bash
# Watch sessions being created
watch -n 1 'ls -lt ~/.claude/api-sessions | head'

# Monitor session file size
du -h ~/.claude/api-sessions/*

# Count sessions per day
ls ~/.claude/api-sessions/*.txt -lt | awk '{print $6}' | sort | uniq -c
```

## Performance Optimization

### Reduce Latency

1. **Use Haiku for simple responses** (10-20x faster than Opus)
2. **Keep sessions small** - Clear old messages periodically
3. **Run server on fast machine** - SSD, good CPU
4. **Use local tunnel if possible** - Avoid ngrok latency

### Scale for Multiple Users

**Current Design**: Single-user, one session per Telegram user ID

**Multi-User Scaling**:
- Each user gets isolated session file
- Sessions are independent
- API server handles concurrent requests
- Consider resource limits per user

**Resource Limits** (add to server):
```typescript
// Max concurrent requests
const MAX_CONCURRENT = 5;
let activeRequests = 0;

// Request queue
const requestQueue: Array<() => void> = [];
```

## Backup and Recovery

### Backup Sessions

```bash
# Create backup script
cat > ~/.claude/tools/backup-sessions.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="$HOME/pai-backups"
DATE=$(date +%Y%m%d-%H%M%S)

mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/api-sessions-$DATE.tar.gz" \
  ~/.claude/api-sessions/

# Keep only last 30 days
find "$BACKUP_DIR" -name "api-sessions-*.tar.gz" -mtime +30 -delete

echo "Backup created: api-sessions-$DATE.tar.gz"
EOF

chmod +x ~/.claude/tools/backup-sessions.sh

# Run daily via cron
crontab -e
# Add: 0 2 * * * /home/username/.claude/tools/backup-sessions.sh
```

### Restore Sessions

```bash
# List backups
ls -lh ~/pai-backups/

# Restore from backup
tar -xzf ~/pai-backups/api-sessions-20251213-020000.tar.gz -C ~/
```

## Future Enhancements

### Planned Features

- [ ] **Message formatting** - Markdown support in Telegram
- [ ] **Image support** - Send/receive images
- [ ] **File attachments** - Share documents
- [ ] **Voice messages** - Audio input/output
- [ ] **User authentication** - Multi-user support
- [ ] **Rate limiting** - Prevent abuse
- [ ] **Conversation history** - Full context across sessions
- [ ] **Web dashboard** - Manage bot via web interface
- [ ] **Analytics** - Usage statistics and insights

### Community Contributions

Want to improve the Telegram integration? See [CONTRIBUTING.md](../CONTRIBUTING.md)

## References

- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [ngrok Documentation](https://ngrok.com/docs)
- [Bun Documentation](https://bun.sh/docs)
- [Claude Code Documentation](https://docs.anthropic.com/claude-code)
- [PAI Architecture Documentation](../.claude/skills/CORE/Architecture.md)

## Support

- **Issues**: [GitHub Issues](https://github.com/danielmiessler/PAI/issues)
- **Discussions**: [GitHub Discussions](https://github.com/danielmiessler/PAI/discussions)
- **Security**: Report vulnerabilities privately to [security@danielmiessler.com]

---

**Created**: 2025-12-13
**Last Updated**: 2025-12-13
**Version**: 1.0.0
**Status**: Production Ready ✅
