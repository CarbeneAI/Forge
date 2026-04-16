---
name: OllamaResearcher
description: Local AI research using private Ollama server for sensitive data and offline tasks. USE WHEN user says 'use ollama', 'ollama research', 'private research', 'local AI', 'sensitive information', OR when working with financial data, medical information, or personal sensitive content that should stay local.
---

# OllamaResearcher - Private Local AI Research

**Local, private AI research using your self-hosted Ollama server for sensitive information and offline tasks.**

## Why Use Ollama?

Use Ollama for:
- **Sensitive Information**: Financial records, medical data, personal information
- **Offline Work**: No internet required, works on local network
- **Privacy**: Data never leaves your local network
- **No API Costs**: Free to use, no quota limits
- **Older Knowledge**: Tasks that don't require up-to-date information

**Don't use Ollama for:**
- Current events or recent information (use Perplexity/Claude instead)
- Web research requiring internet access
- Tasks requiring latest model capabilities

---

## Configuration

**Ollama Server Details:**
- **URL**: http://localhost:11434/ (your local machine)
- **Model**: gemma4:31b (default), dolphin3:8b-llama3.1-fp16 (fast)
- **Location**: localhost (your local machine running Ollama)

**No API keys required** - runs on your local network.

---

## Workflow Routing

| Workflow | Trigger | Behavior |
|----------|---------|----------|
| **Ollama Query** | "use ollama to...", "ollama research", "ask ollama", "private AI" | Use Ollama for question/research |
| **Sensitive Data Analysis** | Working with financial/medical data | Automatically suggest Ollama |
| **Offline Work** | When internet access limited | Fall back to Ollama |

---

## Examples

**Example 1: Financial Analysis**
```
User: "Analyze my investment portfolio using ollama"
→ Routes to Ollama server (keeps financial data local)
→ Uses dolphin3:8b-llama3.1-fp16 model
→ Returns analysis without sending data to cloud
```

**Example 2: Medical Information**
```
User: "Help me understand my medical test results using local AI"
→ Automatically uses Ollama for privacy
→ Processes sensitive health data locally
→ Returns explanation without cloud services
```

**Example 3: General Query with Privacy**
```
User: "Use ollama to explain quantum computing"
→ Sends query to local Ollama server
→ Gets response from dolphin3 model
→ Works offline, no external API calls
```

---

## Tools

### `ollama-query.ts`

Query the Ollama server with a prompt.

```bash
bun ${PAI_DIR}/skills/OllamaResearcher/tools/ollama-query.ts "your question here"
```

**Features:**
- Direct connection to local Ollama server
- Streaming responses for real-time output
- Automatic error handling and retries
- Privacy-focused (no external API calls)

---

## Technical Details

**Model Information:**
- **Name**: dolphin3:8b-llama3.1-fp16
- **Size**: 8 billion parameters
- **Precision**: FP16 (full precision)
- **Base**: Llama 3.1
- **Specialization**: General-purpose reasoning and analysis

**API Endpoint:**
```
POST http://localhost:11434/api/generate
```

**Capabilities:**
- Text generation and completion
- Question answering
- Analysis and reasoning
- Code generation
- Creative writing

**Limitations:**
- No internet access (knowledge cutoff from training)
- Slower than cloud APIs
- Limited to model's training knowledge
- No real-time information

---

## Privacy & Security

✅ **Data stays local** - Never sent to external services
✅ **No logging** - Queries not tracked by third parties
✅ **HIPAA/PCI friendly** - Suitable for sensitive data
✅ **Network isolated** - Only accessible on local network
✅ **No API keys** - No credentials to leak

**Use Ollama for sensitive data processing without privacy concerns.**

---

## Performance

**Expected Response Times:**
- Simple queries: 1-3 seconds
- Complex analysis: 5-15 seconds
- Long-form generation: 15-30 seconds

**Depends on:**
- Server hardware specs
- Model size and complexity
- Length of input/output
- Network latency (local network)

---

## Troubleshooting

**Server not responding:**
```bash
# Check if server is accessible
curl http://localhost:11434/api/tags

# Test model availability
curl http://localhost:11434/api/show -d '{"name":"dolphin3:8b-llama3.1-fp16"}'
```

**Model not found:**
- Verify model name is exactly: `dolphin3:8b-llama3.1-fp16`
- Check available models: `curl http://localhost:11434/api/tags`

**Network issues:**
- Ensure you're on the same network as the server
- VPN may block access to local IPs
- Firewall rules may need adjustment

---

**This completes the OllamaResearcher skill documentation.**
