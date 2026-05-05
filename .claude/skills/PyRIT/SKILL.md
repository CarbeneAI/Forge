---
name: PyRIT
description: AI red-teaming framework for testing LLMs and generative AI systems for jailbreaks, prompt injection, harmful content, data leakage, and multi-turn attacks. USE WHEN user mentions AI red team, LLM jailbreak, prompt injection test, AI risk assessment, AI security testing, GenAI red teaming, NIST AI RMF MEASURE, ISO 42001 testing evidence, or wants to stress-test an AI system. Wraps Microsoft's open-source PyRIT (Python Risk Identification Tool) v0.13+.
---

# PyRIT — AI Red-Teaming Framework

Microsoft AI Red Team's open-source framework for proactively identifying risks in generative AI systems. Used here for offensive AI engagements (Ehud) and AI governance testing evidence (Daniel CCO — NIST AI RMF MEASURE function, ISO 42001 testing requirements).

## Authorized Use Only

PyRIT is for testing AI systems you own or have explicit written permission to test. Engagement scope MUST be defined before running any attack orchestrator. Generated harmful content stays inside the engagement memory store and is purged after report delivery.

## Capabilities

- **Single-turn attacks** — direct prompts, converters (Base64, ROT13, leetspeak, translation, role-play wrappers, etc.)
- **Multi-turn attacks** — Crescendo, TAP (Tree of Attacks with Pruning), Skeleton Key, custom orchestrators
- **Targets** — Anthropic Claude, OpenAI, Azure OpenAI, Google, HuggingFace, Ollama (local), custom HTTP/WebSocket endpoints, Playwright-driven web apps
- **Scorers** — true/false, Likert, classification, Azure AI Content Safety, custom LLM-as-judge
- **Datasets** — content harms, psychosocial risks, data leakage, prompt injection corpora
- **Memory** — SQLite (default) for engagement audit trail; Azure SQL optional
- **CLI** — `pyrit_scan` (automated), `pyrit_shell` (interactive)

## Workflow Routing

| Action | Trigger | Behavior |
|--------|---------|----------|
| **Quick Scan** | "AI red team scan", "test this LLM" | Run `pyrit_scan` with default scenarios against target |
| **Jailbreak Test** | "jailbreak test", "test guardrails" | Crescendo or Skeleton Key orchestrator |
| **Prompt Injection** | "prompt injection test", "test for injection" | Single-turn injection corpus + scorer |
| **Multi-turn TAP** | "tree of attacks", "TAP attack", "deep red team" | TAP orchestrator with adversarial LLM |
| **Custom Engagement** | "custom AI red team", "build PyRIT scenario" | Drop into Python with `tools/run-pyrit.sh` |
| **Governance Evidence** | "AI risk assessment", "NIST AI RMF MEASURE", "ISO 42001 testing" | Run scoped scan, output to Obsidian for audit binder |

## Quick Usage

All commands run inside the skill's venv via the wrapper script.

```bash
# Activate venv shell for interactive PyRIT work
~/.claude/skills/PyRIT/tools/run-pyrit.sh shell

# Run automated scan against a target (config file or env-defined)
~/.claude/skills/PyRIT/tools/run-pyrit.sh scan --config /path/to/scan.yaml

# Drop into Python REPL with PyRIT loaded
~/.claude/skills/PyRIT/tools/run-pyrit.sh python

# List installed PyRIT version
~/.claude/skills/PyRIT/tools/run-pyrit.sh version
```

## Examples

**Example 1: Jailbreak test against Claude (authorized self-test)**
```
User: "Run a Crescendo jailbreak test against my Claude deployment"
→ Define target (Anthropic API endpoint + ANTHROPIC_API_KEY)
→ Load Crescendo orchestrator with content-harm scorer
→ Execute multi-turn campaign
→ Export results + scored conversations to Obsidian engagement folder
```

**Example 2: Prompt injection corpus run**
```
User: "Test our customer-support chatbot for prompt injection"
→ Define target as custom HTTP endpoint with auth
→ Load prompt-injection dataset
→ Single-turn attack with classification scorer
→ Report: pass/fail rate per injection class, raw conversations for triage
```

**Example 3: AI governance evidence (Daniel CCO)**
```
User: "I need NIST AI RMF MEASURE testing evidence for our LLM feature"
→ Daniel scopes: which AI system, which risks, which thresholds
→ Run targeted PyRIT scan (jailbreak + injection + harm scorers)
→ Export structured report: scenarios run, pass rates, sample failures, dates
→ File into Obsidian audit binder under CarbeneAI/Compliance/AI-Testing-Evidence/
```

## Engagement Hygiene

1. **Scope written first** — target system, attack types in scope, attack types out of scope, data handling, report recipient
2. **Memory isolated per engagement** — set `PYRIT_DB_PATH` to engagement-specific SQLite file
3. **Credentials via env, not files** — never commit API keys; use `~/.env` or engagement-scoped envs
4. **Output to Obsidian** — engagement reports filed under `CarbeneAI/Engagements/<client>/<date>/PyRIT/`
5. **Purge raw harmful outputs** post-delivery per scope agreement (keep scored summaries only)

## CLI Reference (key flags)

```bash
pyrit_scan --help              # All scan options
pyrit_scan --config <yaml>     # YAML-defined scan (target + orchestrator + scorer)
pyrit_scan --output <dir>      # Where to write report artifacts
pyrit_shell                    # Interactive REPL with PyRIT preloaded
```

Full PyRIT reference: https://microsoft.github.io/PyRIT/

## Requirements

- Python 3.10–3.13 (this skill ships its own venv via uv at `venv/` using Python 3.13)
- API keys in `~/.env` for any cloud target (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `AZURE_OPENAI_KEY`, etc.)
- Optional: Ollama running locally for offline target testing
- Optional: Azure AI Content Safety key for production-grade harm scoring

## Update

```bash
cd ~/.claude/skills/PyRIT && source venv/bin/activate && uv pip install --upgrade pyrit
```

## License

PyRIT is MIT-licensed (Microsoft). This skill wraps the upstream package without modification.
