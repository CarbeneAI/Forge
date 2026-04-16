---
name: Private
description: Route prompts to local Gemma4 31B on Ollama for privacy-sensitive queries. USE WHEN user says '/private', 'private mode', 'local only', 'keep this local', 'don't send this to the cloud', OR when handling sensitive data (financial, medical, personal, client) that should never leave the local network.
---

# Private - Local AI Privacy Router

**Route queries to Gemma4 31B on your local Ollama server. Data never leaves your local machine.**

## How It Works

When invoked, this skill:
1. Takes your prompt
2. Sends it to Gemma4 31B via Ollama on `localhost:11434`
3. Returns the response inline — Claude orchestrates, but **never sees your prompt content**

## Usage

```
/private What are the financial projections for client XYZ?
/private Analyze this medical report: [paste]
/private Review these employee performance notes
```

## Workflow

When the user invokes `/private`:

1. Extract the user's prompt (everything after `/private`)
2. Run the query tool:

```bash
bun ${PAI_DIR}/skills/Private/tools/private-query.ts "<prompt>"
```

3. Return the Ollama response to the user verbatim — do NOT summarize or rephrase it

## Available Models

| Model | Size | Best For |
|-------|------|----------|
| `gemma4:31b` (default) | 31.3B | General intelligence, reasoning, analysis |
| `dolphin3:8b-llama3.1-fp16` | 8.0B | Fast responses, uncensored |
| `dolphin3:8b` | 8.0B | Fast responses, lower VRAM |
| `llama3.1:latest` | 8.0B | General purpose |

## Options

```
/private <prompt>                          # Default: gemma4:31b
/private --model dolphin3:8b <prompt>      # Use specific model
/private --system "You are a CFO" <prompt> # Custom system prompt
/private --temperature 0.3 <prompt>        # Lower temp for precision
```

## Privacy Guarantees

- Data stays on your local machine — never sent to Anthropic, OpenAI, or any cloud
- No logging by third parties
- No API keys transmitted
- Suitable for HIPAA/PCI-sensitive data
- Ollama runs on localhost:11434 (not exposed externally by default)

## When to Use

| Scenario | Use /private? |
|----------|--------------|
| Client financial data | Yes |
| Medical/health information | Yes |
| Employee reviews or HR data | Yes |
| Proprietary business strategy | Yes |
| Code with trade secrets | Yes |
| General coding questions | No — use Claude |
| Web research needed | No — use Claude/Research |
| Latest information needed | No — Ollama has training cutoff |

## Limitations

- No internet access (knowledge limited to training data)
- Slower than Claude API (~5-30s depending on prompt length)
- No tool use or file access — text in, text out
- 31B model uses significant VRAM — may slow other GPU tasks

## Troubleshooting

```bash
# Check Ollama is running
curl http://localhost:11434/api/tags

# Test Gemma4 directly
curl http://localhost:11434/api/generate -d '{"model":"gemma4:31b","prompt":"hello","stream":false}'

# Check GPU usage
nvidia-smi
```
