#!/usr/bin/env bun
/**
 * Ollama Query Tool - Query local Ollama server for private AI research
 *
 * Usage:
 *   bun ollama-query.ts "your question here"
 *   bun ollama-query.ts "analyze this financial data" --system "You are a financial analyst"
 *
 * Features:
 *   - Connects to local Ollama server (http://localhost:11434)
 *   - Uses dolphin3:8b-llama3.1-fp16 model
 *   - Streaming responses for real-time output
 *   - Privacy-focused (no external API calls)
 */

interface OllamaRequest {
  model: string;
  prompt: string;
  system?: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
  };
}

interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
  eval_duration?: number;
}

// Configuration
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gemma4:31b';

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.error(`
Ollama Query Tool - Local Private AI Research

Usage:
  bun ollama-query.ts "your question here"
  bun ollama-query.ts "question" --system "custom system prompt"
  bun ollama-query.ts "question" --temperature 0.7

Options:
  --system <text>       Custom system prompt
  --temperature <num>   Temperature (0.0-2.0, default: 0.7)
  --top-p <num>         Top-p sampling (0.0-1.0, default: 0.9)
  --top-k <num>         Top-k sampling (default: 40)
  --stream              Enable streaming output (default: true)
  --no-stream           Disable streaming output
  --help, -h            Show this help message

Environment Variables:
  OLLAMA_URL            Ollama server URL (default: http://localhost:11434)
  OLLAMA_MODEL          Model to use (default: dolphin3:8b-llama3.1-fp16)

Examples:
  # Simple query
  bun ollama-query.ts "What is quantum computing?"

  # Financial analysis with custom system prompt
  bun ollama-query.ts "Analyze this portfolio" --system "You are a financial advisor"

  # Medical question with lower temperature for accuracy
  bun ollama-query.ts "Explain lab results" --temperature 0.3

Server: ${OLLAMA_URL}
Model: ${OLLAMA_MODEL}
`);
  process.exit(args.includes('--help') || args.includes('-h') ? 0 : 1);
}

// Extract prompt (everything before first -- flag)
const promptParts: string[] = [];
let i = 0;
while (i < args.length && !args[i].startsWith('--')) {
  promptParts.push(args[i]);
  i++;
}
const prompt = promptParts.join(' ');

if (!prompt) {
  console.error('❌ Error: No prompt provided');
  console.error('Usage: bun ollama-query.ts "your question here"');
  process.exit(1);
}

// Parse options
const options: OllamaRequest = {
  model: OLLAMA_MODEL,
  prompt: prompt,
  stream: true,
  options: {}
};

for (let j = i; j < args.length; j++) {
  const arg = args[j];
  const nextArg = args[j + 1];

  switch (arg) {
    case '--system':
      options.system = nextArg;
      j++;
      break;
    case '--temperature':
      options.options!.temperature = parseFloat(nextArg);
      j++;
      break;
    case '--top-p':
      options.options!.top_p = parseFloat(nextArg);
      j++;
      break;
    case '--top-k':
      options.options!.top_k = parseInt(nextArg);
      j++;
      break;
    case '--stream':
      options.stream = true;
      break;
    case '--no-stream':
      options.stream = false;
      break;
  }
}

// Query Ollama server
async function queryOllama(request: OllamaRequest): Promise<void> {
  const startTime = Date.now();

  console.error(`🤖 Ollama Query`);
  console.error(`📡 Server: ${OLLAMA_URL}`);
  console.error(`🧠 Model: ${request.model}`);
  console.error(`💭 Prompt: ${request.prompt.substring(0, 100)}${request.prompt.length > 100 ? '...' : ''}`);
  if (request.system) {
    console.error(`⚙️  System: ${request.system}`);
  }
  console.error('');

  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
    }

    if (request.stream) {
      // Stream mode - output as we receive
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

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
              const tokensPerSecond = data.eval_count && data.eval_duration
                ? ((data.eval_count / (data.eval_duration / 1e9))).toFixed(2)
                : 'N/A';

              console.error(`✅ Complete`);
              console.error(`⏱️  Duration: ${duration}s`);
              console.error(`📊 Tokens: ${data.eval_count || 'N/A'} (${tokensPerSecond}/s)`);
              console.error(`📏 Length: ${fullResponse.length} characters`);
            }
          } catch (e) {
            console.error(`Warning: Failed to parse JSON line: ${line}`);
          }
        }
      }
    } else {
      // Non-streaming mode - wait for full response
      const data: OllamaResponse = await response.json();
      console.log(data.response);
      console.log('');

      const duration = ((data.total_duration || 0) / 1e9).toFixed(2);
      console.error(`✅ Complete in ${duration}s`);
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`⏱️  Total time: ${totalTime}s`);

  } catch (error) {
    if (error instanceof Error) {
      console.error(`\n❌ Error: ${error.message}`);

      // Provide helpful troubleshooting
      if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
        console.error('\n💡 Troubleshooting:');
        console.error('   1. Check if Ollama server is running');
        console.error(`   2. Verify server URL: ${OLLAMA_URL}`);
        console.error('   3. Test connection: curl ' + OLLAMA_URL + '/api/tags');
        console.error('   4. Check network/firewall settings');
      } else if (error.message.includes('model not found') || error.message.includes('404')) {
        console.error('\n💡 Troubleshooting:');
        console.error('   1. Check available models: curl ' + OLLAMA_URL + '/api/tags');
        console.error(`   2. Verify model name: ${request.model}`);
        console.error('   3. Pull model: ollama pull ' + request.model);
      }
    } else {
      console.error('\n❌ Unknown error:', error);
    }
    process.exit(1);
  }
}

// Execute query
queryOllama(options);
