---
name: Private
description: Route prompts to the configured Ollama endpoint, defaulting to localhost. USE WHEN the user requests '/private' or an Ollama query. Explain the session and endpoint data flow before treating this route as private; it does not isolate content already supplied to Claude Code.
---

# Private - Local AI Privacy Router

**Route queries to the configured Ollama server.** The tool defaults to Gemma4 31B at `http://localhost:11434`; `OLLAMA_URL` can point to another server. This skill does not create an isolated session or guarantee that data stays on one machine.

## How It Works

When invoked, this skill:
1. Takes your prompt
2. Passes it as a command-line argument to the query tool, which sends it to the configured Ollama endpoint
3. Returns the response inline in the same Claude Code session

The prompt and response are visible in that session. Sending a prompt to Ollama does not remove content already entered into Claude Code.

## Usage

```
/private Explain this synthetic financial example
/private Summarize this public document
/private Review these fictional meeting notes
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

## Data Flow and Privacy

- Inspect `OLLAMA_URL` before use. Localhost is the fallback, not an enforced restriction; the tool can send requests to a remote server.
- The surrounding Claude Code session can contain both the input and returned output. This skill does not change that session's processing, retention, or logging settings.
- The query tool receives prompt text through command-line arguments. Review local process visibility, shell history, and tool logging for the environment where it runs.
- A local endpoint alone does not establish HIPAA, PCI, or other compliance. Use synthetic or public inputs until the complete data flow and applicable controls have been reviewed.
- The query tool's console message that data stays local is not an endpoint check or a privacy guarantee.

## When to Use

| Scenario | Use /private? |
|----------|--------------|
| Synthetic or public examples | Yes, after checking the endpoint and model |
| Confidential or regulated material | Only after reviewing the complete session, process, endpoint, and logging data flow |
| A strict requirement that content never enters Claude Code | No; this skill operates inside the existing session |
| General coding questions | Optional; select the model appropriate for the task |
| Web research needed | No web-research tool is provided by this query tool |
| Latest information needed | The query tool does not retrieve current sources |

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
