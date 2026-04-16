#!/usr/bin/env bun
/**
 * Private Query Tool - Route prompts to local Ollama for privacy
 *
 * Usage:
 *   bun private-query.ts "your private prompt"
 *   bun private-query.ts --model dolphin3:8b "your prompt"
 *   bun private-query.ts --system "You are a CFO" "analyze this data"
 */

interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  total_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const DEFAULT_MODEL = 'gemma4:31b';

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.error(`
Private Query - Local Ollama Privacy Router

Usage:
  bun private-query.ts "your question here"
  bun private-query.ts --model <model> "your question"
  bun private-query.ts --system "custom system prompt" "your question"
  bun private-query.ts --temperature 0.3 "your question"

Options:
  --model <name>        Model (default: ${DEFAULT_MODEL})
  --system <text>       System prompt
  --temperature <num>   Temperature (default: 0.7)
  --no-stream           Disable streaming
  --help, -h            Show help

Available models: gemma4:31b, dolphin3:8b-llama3.1-fp16, dolphin3:8b, llama3.1:latest
`);
  process.exit(args.includes('--help') || args.includes('-h') ? 0 : 1);
}

// Parse args
let model = DEFAULT_MODEL;
let systemPrompt: string | undefined;
let temperature = 0.7;
let stream = true;
const promptParts: string[] = [];

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--model':
      model = args[++i];
      break;
    case '--system':
      systemPrompt = args[++i];
      break;
    case '--temperature':
      temperature = parseFloat(args[++i]);
      break;
    case '--no-stream':
      stream = false;
      break;
    default:
      if (!args[i].startsWith('--')) {
        promptParts.push(args[i]);
      }
  }
}

const prompt = promptParts.join(' ');
if (!prompt) {
  console.error('Error: No prompt provided');
  process.exit(1);
}

async function query(): Promise<void> {
  const startTime = Date.now();

  console.error(`[Private Mode] Model: ${model} | Server: ${OLLAMA_URL}`);
  console.error(`[Private Mode] Data stays local - never sent to cloud\n`);

  const body: Record<string, unknown> = {
    model,
    prompt,
    stream,
    options: { temperature },
  };
  if (systemPrompt) body.system = systemPrompt;

  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error(`Error: Ollama returned ${response.status} - ${err}`);

    if (response.status === 404 || err.includes('not found')) {
      console.error(`\nModel "${model}" not found. Available models:`);
      const tags = await fetch(`${OLLAMA_URL}/api/tags`).then(r => r.json());
      for (const m of tags.models) {
        console.error(`  - ${m.name}`);
      }
    }
    process.exit(1);
  }

  if (stream) {
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const data: OllamaResponse = JSON.parse(line);
          if (data.response) {
            process.stdout.write(data.response);
            fullResponse += data.response;
          }
          if (data.done) {
            console.log('\n');
            const duration = ((data.total_duration || 0) / 1e9).toFixed(2);
            const tps = data.eval_count && data.eval_duration
              ? (data.eval_count / (data.eval_duration / 1e9)).toFixed(1)
              : 'N/A';
            console.error(`[Private Mode] Done: ${duration}s | ${data.eval_count || '?'} tokens (${tps}/s)`);
          }
        } catch {
          // skip malformed lines
        }
      }
    }
  } else {
    const data: OllamaResponse = await response.json();
    console.log(data.response);
    const duration = ((data.total_duration || 0) / 1e9).toFixed(2);
    console.error(`\n[Private Mode] Done: ${duration}s`);
  }

  const total = ((Date.now() - startTime) / 1000).toFixed(2);
  console.error(`[Private Mode] Total: ${total}s`);
}

query().catch(err => {
  console.error(`Error: ${err.message}`);
  if (err.message.includes('fetch failed') || err.message.includes('ECONNREFUSED')) {
    console.error('\nOllama not reachable. Check:');
    console.error(`  curl ${OLLAMA_URL}/api/tags`);
    console.error('  systemctl status ollama');
  }
  process.exit(1);
});
