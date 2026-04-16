#!/usr/bin/env bun
/**
 * gamma-client.ts - Gamma.app API client for presentation generation
 *
 * Usage:
 *   bun gamma-client.ts --outline outline.md --brand carbeneai --output presentation.pptx
 *   bun gamma-client.ts --check-credits
 *   bun gamma-client.ts --help
 */

import { writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

// ============================================================================
// TYPES
// ============================================================================

interface GammaCredits {
  remaining: number;
  total: number;
  plan: string;
}

interface GenOptions {
  brand?: 'carbeneai' | 'professional';
  theme?: string;
  customBrandContext?: string;
}

interface PresentationStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  error?: string;
  downloadUrl?: string;
}

interface UsageLogEntry {
  timestamp: string;
  action: string;
  creditsRemaining: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const GAMMA_API_BASE = 'https://api.gamma.app/v1';
const PAI_DIR = process.env.PAI_DIR || `${process.env.HOME}/.claude`;
const USAGE_LOG_PATH = join(PAI_DIR, 'history', 'gamma-usage.log');
const POLLING_INTERVAL_MS = 5000; // 5 seconds
const POLLING_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const MAX_RETRIES = 3;
const RETRY_BACKOFF_BASE_MS = 1000;

const BRAND_CONTEXTS = {
  carbeneai: 'Dark theme with #0a0a12 background, #00d4ff cyan primary, #a855f7 purple accent, modern tech aesthetic',
  professional: 'Clean white theme with #1e3a8a navy primary, #3b82f6 blue accent, minimal corporate style'
};

// ============================================================================
// ENVIRONMENT LOADING
// ============================================================================

function loadEnv(): Record<string, string> {
  const envPath = join(PAI_DIR, '.env');
  const env: Record<string, string> = {};

  if (!existsSync(envPath)) {
    return env;
  }

  try {
    const content = readFileSync(envPath, 'utf-8');
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const equalIndex = trimmed.indexOf('=');
      if (equalIndex === -1) continue;

      const key = trimmed.substring(0, equalIndex).trim();
      const value = trimmed.substring(equalIndex + 1).trim();

      env[key] = value;
    }
  } catch (error: any) {
    console.error(`Warning: Could not read .env file: ${error.message}`);
  }

  return env;
}

function getApiKey(): string {
  // First try environment variable
  let apiKey = process.env.GAMMA_API_KEY;

  // Then try loading from .env file
  if (!apiKey) {
    const env = loadEnv();
    apiKey = env.GAMMA_API_KEY;
  }

  if (!apiKey) {
    console.error('\n❌ Error: GAMMA_API_KEY not found');
    console.error('\nPlease set your Gamma API key in one of these ways:');
    console.error('  1. Add to ~/.claude/.env:');
    console.error('     GAMMA_API_KEY=your_api_key_here');
    console.error('  2. Export as environment variable:');
    console.error('     export GAMMA_API_KEY=your_api_key_here');
    console.error('\nGet your API key from: https://gamma.app/settings/api\n');
    process.exit(1);
  }

  return apiKey;
}

// ============================================================================
// HTTP HELPERS WITH RETRY
// ============================================================================

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error: any) {
      lastError = error;

      if (attempt < retries - 1) {
        const backoff = RETRY_BACKOFF_BASE_MS * Math.pow(2, attempt);
        console.error(`⚠️  Network error (attempt ${attempt + 1}/${retries}), retrying in ${backoff}ms...`);
        await sleep(backoff);
      }
    }
  }

  throw new Error(`Network request failed after ${retries} attempts: ${lastError?.message}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// USAGE LOGGING
// ============================================================================

function logUsage(action: string, creditsRemaining: number): void {
  try {
    const entry: UsageLogEntry = {
      timestamp: new Date().toISOString(),
      action,
      creditsRemaining
    };

    const logLine = `${entry.timestamp} | ${entry.action} | Credits: ${entry.creditsRemaining}\n`;

    // Append to log file
    const fs = require('fs');
    fs.appendFileSync(USAGE_LOG_PATH, logLine);
  } catch (error: any) {
    console.error(`Warning: Could not write to usage log: ${error.message}`);
  }
}

// ============================================================================
// GAMMA API FUNCTIONS
// ============================================================================

async function checkCredits(): Promise<GammaCredits> {
  const apiKey = getApiKey();

  const response = await fetchWithRetry(
    `${GAMMA_API_BASE}/credits`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gamma API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data as GammaCredits;
}

async function generatePresentation(
  outline: string,
  options: GenOptions = {}
): Promise<string> {
  const apiKey = getApiKey();

  // Get brand context
  const brand = options.brand || 'professional';
  const brandContext = options.customBrandContext || BRAND_CONTEXTS[brand];

  // Check credits first
  const credits = await checkCredits();
  if (credits.remaining < 10) {
    console.warn(`\n⚠️  Warning: Low credits remaining (${credits.remaining}/${credits.total})`);
  }
  if (credits.remaining === 0) {
    throw new Error('No Gamma credits remaining. Consider falling back to pptx engine.');
  }

  // Generate presentation
  const response = await fetchWithRetry(
    `${GAMMA_API_BASE}/presentations/generate`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        outline,
        brandContext,
        theme: options.theme
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gamma API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  // Log usage
  logUsage('generate_presentation', credits.remaining - 1);

  return data.id;
}

async function pollStatus(id: string): Promise<PresentationStatus> {
  const apiKey = getApiKey();
  const startTime = Date.now();

  while (true) {
    const elapsed = Date.now() - startTime;

    if (elapsed > POLLING_TIMEOUT_MS) {
      throw new Error('Polling timeout exceeded (5 minutes). Generation may still be in progress.');
    }

    const response = await fetchWithRetry(
      `${GAMMA_API_BASE}/presentations/${id}/status`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gamma API error (${response.status}): ${errorText}`);
    }

    const status = await response.json() as PresentationStatus;

    if (status.status === 'completed') {
      return status;
    }

    if (status.status === 'failed') {
      throw new Error(`Presentation generation failed: ${status.error || 'Unknown error'}`);
    }

    // Show progress if available
    if (status.progress !== undefined) {
      console.error(`⏳ Generating presentation... ${status.progress}%`);
    }

    await sleep(POLLING_INTERVAL_MS);
  }
}

async function downloadPptx(id: string, outputPath: string): Promise<void> {
  const apiKey = getApiKey();

  const response = await fetchWithRetry(
    `${GAMMA_API_BASE}/presentations/${id}/export?format=pptx`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gamma API error (${response.status}): ${errorText}`);
  }

  const buffer = await response.arrayBuffer();
  writeFileSync(outputPath, new Uint8Array(buffer));
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

function showHelp(): void {
  console.log(`
Gamma.app API Client - Generate presentations from markdown outlines

USAGE:
  bun gamma-client.ts --outline <file> [options]
  bun gamma-client.ts --check-credits
  bun gamma-client.ts --help

OPTIONS:
  --outline <file>        Path to markdown outline file (required unless --check-credits)
  --brand <type>          Brand theme: "carbeneai" or "professional" (default: professional)
  --output <file>         Output PPTX path (default: presentation.pptx)
  --check-credits         Show remaining Gamma credits and exit
  --help                  Show this help message

EXAMPLES:
  # Generate presentation with CarbeneAI branding
  bun gamma-client.ts --outline deck-outline.md --brand carbeneai --output deck.pptx

  # Check available credits
  bun gamma-client.ts --check-credits

ENVIRONMENT:
  GAMMA_API_KEY          Your Gamma API key (required)
                         Set in ~/.claude/.env or export as environment variable

BRAND THEMES:
  carbeneai     Dark theme with cyan (#00d4ff) primary, purple (#a855f7) accent
  professional  Clean white theme with navy (#1e3a8a) primary, blue accent

CREDITS:
  - Usage logged to: ${USAGE_LOG_PATH}
  - Warns when credits < 10
  - Fails with fallback suggestion when credits = 0

API REFERENCE:
  Base URL: ${GAMMA_API_BASE}
  Get your API key: https://gamma.app/settings/api
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Parse arguments
  const options: {
    outline?: string;
    brand?: 'carbeneai' | 'professional';
    output?: string;
    checkCredits?: boolean;
    help?: boolean;
  } = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--outline':
        options.outline = args[++i];
        break;
      case '--brand':
        const brand = args[++i];
        if (brand !== 'carbeneai' && brand !== 'professional') {
          console.error(`❌ Error: Invalid brand "${brand}". Must be "carbeneai" or "professional".`);
          process.exit(1);
        }
        options.brand = brand;
        break;
      case '--output':
        options.output = args[++i];
        break;
      case '--check-credits':
        options.checkCredits = true;
        break;
      case '--help':
        options.help = true;
        break;
      default:
        console.error(`❌ Error: Unknown option "${arg}"`);
        showHelp();
        process.exit(1);
    }
  }

  // Show help
  if (options.help) {
    showHelp();
    return;
  }

  // Check credits only
  if (options.checkCredits) {
    try {
      const credits = await checkCredits();
      console.log(`\n✅ Gamma Credits: ${credits.remaining}/${credits.total} remaining (Plan: ${credits.plan})\n`);
      logUsage('check_credits', credits.remaining);
    } catch (error: any) {
      console.error(`\n❌ Error checking credits: ${error.message}\n`);
      process.exit(1);
    }
    return;
  }

  // Generate presentation
  if (!options.outline) {
    console.error('\n❌ Error: --outline is required\n');
    showHelp();
    process.exit(1);
  }

  if (!existsSync(options.outline)) {
    console.error(`\n❌ Error: Outline file not found: ${options.outline}\n`);
    process.exit(1);
  }

  const outputPath = options.output || 'presentation.pptx';
  const brand = options.brand || 'professional';

  try {
    console.log(`\n🚀 Generating presentation with Gamma.app...`);
    console.log(`   Outline: ${options.outline}`);
    console.log(`   Brand: ${brand}`);
    console.log(`   Output: ${outputPath}\n`);

    // Read outline
    const outline = readFileSync(options.outline, 'utf-8');

    // Generate
    const presentationId = await generatePresentation(outline, { brand });
    console.log(`✅ Generation started (ID: ${presentationId})`);

    // Poll for completion
    const status = await pollStatus(presentationId);
    console.log(`✅ Generation completed`);

    // Download PPTX
    await downloadPptx(presentationId, outputPath);

    // Get final credits
    const credits = await checkCredits();

    console.log(`\n✅ Generated presentation → ${outputPath} (${credits.remaining} credits remaining)\n`);
  } catch (error: any) {
    console.error(`\n❌ Error: ${error.message}\n`);

    if (error.message.includes('credits')) {
      console.error('💡 Suggestion: Fall back to pptx engine for offline generation\n');
    }

    process.exit(1);
  }
}

// Run CLI
if (import.meta.main) {
  main();
}
