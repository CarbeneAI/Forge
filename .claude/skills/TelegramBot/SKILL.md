---
name: TelegramBot
description: Bidirectional Telegram bot for full PAI access. USE WHEN user mentions telegram bot, start telegram, stop telegram, telegram access, remote PAI, mobile PAI, OR wants to manage the telegram bot service (start/stop/restart), OR needs to save telegram results to obsidian.
---

# TelegramBot

Full PAI access via Telegram with Research, Fabric patterns, Claude chat, and Obsidian save.

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **Setup** | "setup telegram bot", "configure telegram" | `workflows/Setup.md` |
| **ManageBot** | "start telegram", "stop telegram", "restart telegram" | `workflows/ManageBot.md` |

## Commands (in Telegram)

| Command | Description | Example |
|---------|-------------|---------|
| *(plain text)* | Chat with Claude | "What's the best way to learn Rust?" |
| `/research <topic>` | Multi-source research | `/research quantum computing 2025` |
| `/agent <name> <task>` | Use specific agent | `/agent grok-researcher AI security trends` |
| `/fabric <pattern>` | Apply Fabric pattern | `/fabric extract_wisdom` (reply to content) |
| `/fabric list` | List available patterns | `/fabric list` |
| `/save [tag]` | Save last response to Obsidian | `/save research` |
| `/status` | PAI system status | `/status` |
| `/help` | Show available commands | `/help` |

## Using Agents

Invoke specialized AI agents for specific tasks. Use `/agent <name> <task>` or natural language.

### Available Agents

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

### Agent Examples

**Grok Research Synthesis:**
```
/agent grok-researcher AI agents in cybersecurity
```
→ Orchestrates Claude, Perplexity, Gemini researchers
→ Synthesizes all results
→ Generates blog post, training, and YouTube ideas

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
→ TDD approach
→ Production-ready code
→ Security best practices

**Security Assessment:**
```
/agent pentester Review authentication flow for vulnerabilities
```
→ OWASP Top 10 analysis
→ Remediation recommendations

### Natural Language Invocation

You can also invoke agents naturally:

```
"Use the architect agent to plan a blog platform"
"Have the engineer implement user signup"
"Ask grok to research and create content ideas for AI security"
```

## Tools

| Tool | Purpose |
|------|---------|
| `tools/Server.ts` | Main bot server (long polling) |
| `tools/Manage.sh` | Service management (start/stop/restart/status) |

## Configuration

**Required in `~/.claude/.env`:**
```bash
TELEGRAM_BOT_TOKEN=your_token      # From @BotFather
TELEGRAM_CHAT_ID=your_chat_id      # From @userinfobot
ANTHROPIC_API_KEY=your_key         # For Claude API access
```

**Optional:**
```bash
TELEGRAM_SAVES_PATH=/custom/path   # Default: ~/.claude/scratchpad/telegram-saves
```

## Service Management

```bash
# Start bot
~/.claude/skills/TelegramBot/tools/Manage.sh start

# Stop bot
~/.claude/skills/TelegramBot/tools/Manage.sh stop

# Check status
~/.claude/skills/TelegramBot/tools/Manage.sh status

# Enable auto-start on boot
systemctl --user enable pai-telegram-bot
systemctl --user start pai-telegram-bot
```

## Architecture

```
Telegram App
     │
     ▼ (Long Polling)
┌─────────────────┐
│   Server.ts     │ ← Main polling loop
├─────────────────┤
│ TelegramClient  │ ← Send/receive messages
│ ClaudeClient    │ ← Anthropic API with PAI context
│ ConversationState│ ← Track chat history
│ ObsidianWriter  │ ← Save as Markdown
└─────────────────┘
     │
     ▼
┌─────────────────┐
│    Handlers     │
├─────────────────┤
│ Chat.ts         │ ← Default chat mode
│ Research.ts     │ ← /research command
│ Fabric.ts       │ ← /fabric command
│ Save.ts         │ ← /save command
│ Help.ts         │ ← /help command
└─────────────────┘
```

## Examples

**Example 1: Chat**
```
You: What's the capital of France?
PAI: Paris is the capital of France...
```

**Example 2: Research**
```
You: /research AI agents in 2025
PAI: Researching... [sends comprehensive summary]
You: /save research
PAI: Saved to telegram-saves/2026-01-02_153000_research_ai-agents.md
```

**Example 3: Fabric Pattern**
```
You: [reply to a long article] /fabric extract_wisdom
PAI: [applies extract_wisdom pattern, returns key insights]
```

## Related Skills

- **TelegramStatus** - One-way status notifications (existing)
- **Research** - Multi-source research workflows
- **Fabric** - 248+ AI patterns

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-02 | Initial implementation |
