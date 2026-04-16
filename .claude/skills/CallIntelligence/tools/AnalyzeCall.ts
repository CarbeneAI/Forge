#!/usr/bin/env bun
/**
 * AnalyzeCall.ts - Extract intelligence from call transcripts
 *
 * Uses Claude API with the extract_call_intelligence Fabric pattern
 * to analyze sales and customer success call transcripts.
 *
 * Usage:
 *   bun AnalyzeCall.ts --type sales --client "Acme Corp" --transcript "..."
 *   bun AnalyzeCall.ts --type customer_success --client "Beta Inc" < transcript.txt
 *   echo "transcript" | bun AnalyzeCall.ts --type sales --client "Gamma LLC"
 *
 * Environment:
 *   ANTHROPIC_API_KEY - Required for Claude API access
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const PAI_DIR = process.env.PAI_DIR || `${process.env.HOME}/.claude`;

interface CallAnalysis {
  call_type: 'sales' | 'customer_success';
  client: string;
  date: string;
  summary: string;
  competitors?: string[];
  objections?: string[];
  feature_requests: string[];
  deal_probability?: number;
  next_steps?: string[];
  recurring_issues?: string[];
  expansion_signals?: string[];
  sentiment?: number;
  follow_up_required?: string[];
}

function printHelp(): void {
  console.log(`
AnalyzeCall - Extract intelligence from call transcripts

USAGE:
  bun AnalyzeCall.ts --type <type> --client <name> [--transcript <text>]
  bun AnalyzeCall.ts --type <type> --client <name> < transcript.txt
  echo "transcript" | bun AnalyzeCall.ts --type <type> --client <name>

OPTIONS:
  --type, -t        Call type: 'sales' or 'customer_success' (required)
  --client, -c      Client/company name (required)
  --transcript, -T  Transcript text (or pipe via stdin)
  --help, -h        Show this help message

OUTPUT:
  JSON object with extracted intelligence

EXAMPLES:
  # Inline transcript
  bun AnalyzeCall.ts -t sales -c "Acme Corp" -T "Hi, thanks for joining..."

  # From file
  bun AnalyzeCall.ts -t customer_success -c "Beta Inc" < call_notes.txt

  # Piped input
  cat transcript.txt | bun AnalyzeCall.ts -t sales -c "Gamma LLC"
`);
}

function parseArgs(): { type: string; client: string; transcript: string } {
  const args = process.argv.slice(2);
  let type = '';
  let client = '';
  let transcript = '';

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }

    if ((arg === '--type' || arg === '-t') && args[i + 1]) {
      type = args[++i];
    } else if ((arg === '--client' || arg === '-c') && args[i + 1]) {
      client = args[++i];
    } else if ((arg === '--transcript' || arg === '-T') && args[i + 1]) {
      transcript = args[++i];
    }
  }

  return { type, client, transcript };
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];

  return new Promise((resolve) => {
    // Check if stdin has data (not a TTY)
    if (process.stdin.isTTY) {
      resolve('');
      return;
    }

    process.stdin.on('data', (chunk) => chunks.push(chunk));
    process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));

    // Timeout after 100ms if no data
    setTimeout(() => {
      if (chunks.length === 0) {
        resolve('');
      }
    }, 100);
  });
}

async function analyzeWithClaude(
  callType: string,
  client: string,
  transcript: string
): Promise<CallAnalysis> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }

  // Load the Fabric pattern
  const patternPath = join(PAI_DIR, 'skills/Fabric/tools/patterns/extract_call_intelligence/system.md');

  if (!existsSync(patternPath)) {
    throw new Error(`Pattern not found: ${patternPath}`);
  }

  const systemPrompt = readFileSync(patternPath, 'utf8');

  const userMessage = `Call Type: ${callType.toUpperCase()}
Client: ${client}

TRANSCRIPT:
${transcript}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userMessage }
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${error}`);
  }

  const data = await response.json() as { content: Array<{ type: string; text: string }> };
  const text = data.content[0]?.text || '';

  // Parse JSON from response (handle potential markdown code blocks)
  let jsonStr = text;
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  const analysis = JSON.parse(jsonStr.trim()) as CallAnalysis;

  // Add metadata
  analysis.client = client;
  analysis.date = new Date().toISOString().split('T')[0];

  return analysis;
}

async function main(): Promise<void> {
  const { type, client, transcript: inlineTranscript } = parseArgs();

  // Validate required args
  if (!type || !['sales', 'customer_success'].includes(type)) {
    console.error('Error: --type must be "sales" or "customer_success"');
    process.exit(1);
  }

  if (!client) {
    console.error('Error: --client is required');
    process.exit(1);
  }

  // Get transcript from args or stdin
  let transcript = inlineTranscript;
  if (!transcript) {
    transcript = await readStdin();
  }

  if (!transcript || transcript.trim().length === 0) {
    console.error('Error: No transcript provided. Use --transcript or pipe via stdin.');
    process.exit(1);
  }

  try {
    const analysis = await analyzeWithClaude(type, client, transcript);
    console.log(JSON.stringify(analysis, null, 2));
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}

main();
