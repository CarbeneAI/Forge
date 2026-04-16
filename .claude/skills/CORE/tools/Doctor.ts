#!/usr/bin/env bun
/**
 * PAI Doctor - Comprehensive System Health Checker
 *
 * Performs diagnostic checks across PAI infrastructure:
 * - Core infrastructure (directories, settings, contract)
 * - Skills health (count, orphans, Fabric patterns)
 * - Hooks health (critical hooks, settings.json references)
 * - Agent health (count, key agents)
 * - Services (voice, observability, memory, trading)
 * - Disk & resources (history size, scratchpad cleanup, disk space)
 *
 * Usage:
 *   bun Doctor.ts            # Basic check
 *   bun Doctor.ts --fix      # Auto-fix issues
 *   bun Doctor.ts --json     # JSON output
 *   bun Doctor.ts --deep     # Include remote service checks
 *
 * Auto-fix capabilities:
 *   - Create missing directories
 *   - Clean stale scratchpad files (>7 days)
 */

import { existsSync, readFileSync, statSync, readdirSync, mkdirSync, unlinkSync } from 'fs';
import { join, resolve } from 'path';
import { execSync } from 'child_process';

// ─── Path Resolution ────────────────────────────────────────────────────────

const SCRIPT_DIR = import.meta.dir;
// tools/ -> CORE/ -> skills/ -> .claude/
const PAI_DIR = resolve(SCRIPT_DIR, '..', '..', '..');
const REPO_ROOT = resolve(PAI_DIR, '..');
const HOME = process.env.HOME || '/home/youruser';

// ─── Types ──────────────────────────────────────────────────────────────────

interface HealthResult {
  category: string;
  name: string;
  severity: 'pass' | 'crit' | 'warn' | 'info';
  message: string;
  fix?: string;
  autoFix?: () => void;
}

interface HealthOptions {
  deep: boolean;
  fix: boolean;
  json: boolean;
}

// ─── ANSI Colors ────────────────────────────────────────────────────────────

const C = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  reset: '\x1b[0m',
};

// ─── Argument Parsing ───────────────────────────────────────────────────────

function parseArgs(): HealthOptions {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
PAI Doctor - Comprehensive System Health Checker

Usage:
  bun Doctor.ts [options]

Options:
  --fix       Auto-fix issues (create directories, clean scratchpad)
  --json      Output results as JSON
  --deep      Include remote service checks (trading dashboard on configured host)
  --help, -h  Show this help message

Categories:
  Core Infrastructure  - PAI_DIR, directories, settings.json, CONTRACT
  Skills Health        - Skill count, SKILL.md presence, orphans, Fabric
  Hooks Health         - Critical hooks, pai-paths.ts, settings.json refs
  Agent Health         - Agent count, key agents (Bezalel, Hiram, Nehemiah)
  Services             - Voice server, Observability, Memory, Trading
  Disk & Resources     - History size, scratchpad cleanup, disk space
`);
    process.exit(0);
  }

  return {
    deep: args.includes('--deep'),
    fix: args.includes('--fix'),
    json: args.includes('--json'),
  };
}

// ─── Utility Helpers ────────────────────────────────────────────────────────

function shellExec(cmd: string): string | null {
  try {
    return execSync(cmd, { encoding: 'utf-8', timeout: 10000 }).trim();
  } catch {
    return null;
  }
}

function getDirSize(dir: string): number {
  if (!existsSync(dir)) return 0;
  const du = shellExec(`du -sb "${dir}" 2>/dev/null | cut -f1`);
  return du ? parseInt(du, 10) : 0;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function getFilesOlderThan(dir: string, days: number): string[] {
  if (!existsSync(dir)) return [];
  const now = Date.now();
  const cutoff = now - (days * 24 * 60 * 60 * 1000);
  const files: string[] = [];

  function walk(d: string) {
    try {
      for (const entry of readdirSync(d, { withFileTypes: true })) {
        const full = join(d, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else {
          const stat = statSync(full);
          if (stat.mtimeMs < cutoff) {
            files.push(full);
          }
        }
      }
    } catch {
      // Permission denied or similar - skip
    }
  }

  walk(dir);
  return files;
}

// ─── Category: Core Infrastructure ──────────────────────────────────────────

function checkCoreInfrastructure(): HealthResult[] {
  const results: HealthResult[] = [];

  // [CRIT] PAI_DIR resolves correctly
  results.push({
    category: 'Core Infrastructure',
    name: 'PAI_DIR resolution',
    severity: 'pass',
    message: `PAI_DIR resolves: ${PAI_DIR}`,
  });

  // [CRIT] Core directories exist
  const coreDirectories = [
    { path: join(PAI_DIR, 'hooks'), name: 'hooks' },
    { path: join(PAI_DIR, 'skills'), name: 'skills' },
    { path: join(PAI_DIR, 'agents'), name: 'agents' },
    { path: join(PAI_DIR, 'history'), name: 'history' },
  ];

  for (const { path, name } of coreDirectories) {
    if (existsSync(path)) {
      results.push({
        category: 'Core Infrastructure',
        name: `${name} directory`,
        severity: 'pass',
        message: `${name}/ exists`,
      });
    } else {
      results.push({
        category: 'Core Infrastructure',
        name: `${name} directory`,
        severity: 'crit',
        message: `${name}/ missing`,
        fix: `mkdir -p ${path}`,
        autoFix: () => mkdirSync(path, { recursive: true }),
      });
    }
  }

  // [CRIT] settings.json is valid JSON with required fields
  const settingsPath = join(PAI_DIR, 'settings.json');
  if (existsSync(settingsPath)) {
    try {
      const settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));
      const hasEnv = settings.env && typeof settings.env === 'object';
      const hasPermissions = settings.permissions && typeof settings.permissions === 'object';
      const hasHooks = settings.hooks && typeof settings.hooks === 'object';

      if (hasEnv && hasPermissions && hasHooks) {
        results.push({
          category: 'Core Infrastructure',
          name: 'settings.json validity',
          severity: 'pass',
          message: 'settings.json valid with required fields (env, permissions, hooks)',
        });
      } else {
        const missing: string[] = [];
        if (!hasEnv) missing.push('env');
        if (!hasPermissions) missing.push('permissions');
        if (!hasHooks) missing.push('hooks');
        results.push({
          category: 'Core Infrastructure',
          name: 'settings.json validity',
          severity: 'crit',
          message: `settings.json missing fields: ${missing.join(', ')}`,
        });
      }
    } catch (e) {
      results.push({
        category: 'Core Infrastructure',
        name: 'settings.json validity',
        severity: 'crit',
        message: `settings.json parse error: ${e instanceof Error ? e.message : String(e)}`,
      });
    }
  } else {
    results.push({
      category: 'Core Infrastructure',
      name: 'settings.json validity',
      severity: 'crit',
      message: 'settings.json missing',
    });
  }

  // [WARN] CORE skill loads (SKILL.md exists and has content)
  const coreSkillPath = join(PAI_DIR, 'skills', 'CORE', 'SKILL.md');
  if (existsSync(coreSkillPath)) {
    const content = readFileSync(coreSkillPath, 'utf-8').trim();
    if (content.length > 100) {
      results.push({
        category: 'Core Infrastructure',
        name: 'CORE skill',
        severity: 'pass',
        message: `CORE SKILL.md exists (${content.length} bytes)`,
      });
    } else {
      results.push({
        category: 'Core Infrastructure',
        name: 'CORE skill',
        severity: 'warn',
        message: 'CORE SKILL.md exists but is suspiciously small',
      });
    }
  } else {
    results.push({
      category: 'Core Infrastructure',
      name: 'CORE skill',
      severity: 'crit',
      message: 'CORE SKILL.md missing',
    });
  }

  // [WARN] PAI_CONTRACT.md exists in REPO_ROOT
  const contractPath = join(REPO_ROOT, 'PAI_CONTRACT.md');
  if (existsSync(contractPath)) {
    results.push({
      category: 'Core Infrastructure',
      name: 'PAI_CONTRACT.md',
      severity: 'pass',
      message: 'PAI_CONTRACT.md exists',
    });
  } else {
    results.push({
      category: 'Core Infrastructure',
      name: 'PAI_CONTRACT.md',
      severity: 'warn',
      message: 'PAI_CONTRACT.md missing (should be at repository root)',
    });
  }

  return results;
}

// ─── Category: Skills Health ────────────────────────────────────────────────

function checkSkillsHealth(): HealthResult[] {
  const results: HealthResult[] = [];
  const skillsDir = join(PAI_DIR, 'skills');

  if (!existsSync(skillsDir)) {
    results.push({
      category: 'Skills Health',
      name: 'Skills directory',
      severity: 'crit',
      message: 'skills/ directory missing',
    });
    return results;
  }

  // Count skills and verify SKILL.md
  let skillCount = 0;
  const orphans: string[] = [];

  try {
    for (const entry of readdirSync(skillsDir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        const skillMd = join(skillsDir, entry.name, 'SKILL.md');
        if (existsSync(skillMd)) {
          skillCount++;
        } else {
          orphans.push(entry.name);
        }
      }
    }
  } catch (e) {
    results.push({
      category: 'Skills Health',
      name: 'Skills scan',
      severity: 'crit',
      message: `Cannot read skills directory: ${e instanceof Error ? e.message : String(e)}`,
    });
    return results;
  }

  results.push({
    category: 'Skills Health',
    name: 'Skill count',
    severity: 'info',
    message: `${skillCount} skills found`,
  });

  if (orphans.length === 0) {
    results.push({
      category: 'Skills Health',
      name: 'Orphaned skill dirs',
      severity: 'pass',
      message: 'No orphaned skill directories (all have SKILL.md)',
    });
  } else {
    results.push({
      category: 'Skills Health',
      name: 'Orphaned skill dirs',
      severity: 'warn',
      message: `${orphans.length} skill directory(s) missing SKILL.md: ${orphans.join(', ')}`,
      fix: 'Add SKILL.md to each directory or remove orphaned directories',
    });
  }

  // [INFO] Fabric patterns directory exists
  const fabricPatternsDir = join(PAI_DIR, 'skills', 'Fabric', 'patterns');
  if (existsSync(fabricPatternsDir)) {
    const patterns = readdirSync(fabricPatternsDir).filter(f => {
      const fullPath = join(fabricPatternsDir, f);
      return statSync(fullPath).isDirectory();
    });
    results.push({
      category: 'Skills Health',
      name: 'Fabric patterns',
      severity: 'pass',
      message: `Fabric patterns directory exists (${patterns.length} patterns)`,
    });
  } else {
    results.push({
      category: 'Skills Health',
      name: 'Fabric patterns',
      severity: 'warn',
      message: 'Fabric patterns directory missing',
      fix: 'Run ~/.claude/skills/Fabric/tools/update-patterns.sh',
    });
  }

  return results;
}

// ─── Category: Hooks Health ─────────────────────────────────────────────────

function checkHooksHealth(): HealthResult[] {
  const results: HealthResult[] = [];
  const hooksDir = join(PAI_DIR, 'hooks');

  if (!existsSync(hooksDir)) {
    results.push({
      category: 'Hooks Health',
      name: 'Hooks directory',
      severity: 'crit',
      message: 'hooks/ directory missing',
    });
    return results;
  }

  // [CRIT] Critical hooks exist and are readable
  const criticalHooks = [
    'load-core-context.ts',
    'capture-all-events.ts',
    'initialize-session.ts',
    'capture-session-summary.ts',
  ];

  for (const hook of criticalHooks) {
    const hookPath = join(hooksDir, hook);
    if (existsSync(hookPath)) {
      try {
        readFileSync(hookPath, 'utf-8');
        results.push({
          category: 'Hooks Health',
          name: `${hook}`,
          severity: 'pass',
          message: `${hook} exists and is readable`,
        });
      } catch {
        results.push({
          category: 'Hooks Health',
          name: `${hook}`,
          severity: 'crit',
          message: `${hook} exists but is not readable`,
        });
      }
    } else {
      results.push({
        category: 'Hooks Health',
        name: `${hook}`,
        severity: 'crit',
        message: `${hook} missing`,
      });
    }
  }

  // [WARN] pai-paths.ts library exists
  const paiPathsLib = join(hooksDir, 'lib', 'pai-paths.ts');
  if (existsSync(paiPathsLib)) {
    results.push({
      category: 'Hooks Health',
      name: 'pai-paths.ts library',
      severity: 'pass',
      message: 'pai-paths.ts library exists',
    });
  } else {
    results.push({
      category: 'Hooks Health',
      name: 'pai-paths.ts library',
      severity: 'warn',
      message: 'pai-paths.ts library missing',
      fix: 'Recreate hooks/lib/pai-paths.ts',
    });
  }

  // [WARN] Hooks referenced in settings.json actually exist
  const settingsPath = join(PAI_DIR, 'settings.json');
  if (existsSync(settingsPath)) {
    try {
      const settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));
      const hooks = settings.hooks || {};
      const referencedHooks = new Set<string>();

      for (const hookType of Object.values(hooks)) {
        if (Array.isArray(hookType)) {
          for (const hookConfig of hookType) {
            if (hookConfig.hooks) {
              for (const h of hookConfig.hooks) {
                if (h.command && h.command.includes('.ts')) {
                  // Extract filename from command
                  const match = h.command.match(/([^/]+\.ts)/);
                  if (match) {
                    referencedHooks.add(match[1]);
                  }
                }
              }
            }
          }
        }
      }

      const missingHooks: string[] = [];
      for (const hook of referencedHooks) {
        const hookPath = join(hooksDir, hook);
        if (!existsSync(hookPath)) {
          missingHooks.push(hook);
        }
      }

      if (missingHooks.length === 0) {
        results.push({
          category: 'Hooks Health',
          name: 'settings.json hook references',
          severity: 'pass',
          message: `All ${referencedHooks.size} hooks referenced in settings.json exist`,
        });
      } else {
        results.push({
          category: 'Hooks Health',
          name: 'settings.json hook references',
          severity: 'warn',
          message: `${missingHooks.length} hook(s) referenced but missing: ${missingHooks.join(', ')}`,
        });
      }
    } catch {
      // Already caught in Core Infrastructure
    }
  }

  return results;
}

// ─── Category: Agent Health ─────────────────────────────────────────────────

function checkAgentHealth(): HealthResult[] {
  const results: HealthResult[] = [];
  const agentsDir = join(PAI_DIR, 'agents');

  if (!existsSync(agentsDir)) {
    results.push({
      category: 'Agent Health',
      name: 'Agents directory',
      severity: 'warn',
      message: 'agents/ directory missing',
      fix: `mkdir -p ${agentsDir}`,
      autoFix: () => mkdirSync(agentsDir, { recursive: true }),
    });
    return results;
  }

  // Count agent .md files
  let agentCount = 0;
  try {
    agentCount = readdirSync(agentsDir).filter(f => f.endsWith('.md')).length;
    results.push({
      category: 'Agent Health',
      name: 'Agent count',
      severity: 'info',
      message: `${agentCount} agent(s) found`,
    });
  } catch {
    results.push({
      category: 'Agent Health',
      name: 'Agent count',
      severity: 'warn',
      message: 'Cannot read agents directory',
    });
    return results;
  }

  // [WARN] Verify key agents exist
  const keyAgents = ['Bezalel.md', 'Hiram.md', 'Nehemiah.md'];
  const missingAgents: string[] = [];

  for (const agent of keyAgents) {
    const agentPath = join(agentsDir, agent);
    if (!existsSync(agentPath)) {
      missingAgents.push(agent);
    }
  }

  if (missingAgents.length === 0) {
    results.push({
      category: 'Agent Health',
      name: 'Key agents',
      severity: 'pass',
      message: 'All key agents present (Bezalel, Hiram, Nehemiah)',
    });
  } else {
    results.push({
      category: 'Agent Health',
      name: 'Key agents',
      severity: 'warn',
      message: `Missing key agent(s): ${missingAgents.join(', ')}`,
    });
  }

  return results;
}

// ─── Category: Services ─────────────────────────────────────────────────────

async function checkServices(deep: boolean): Promise<HealthResult[]> {
  const results: HealthResult[] = [];

  // Services to probe (local)
  const localServices = [
    { port: 5172, url: 'http://localhost:5172', name: 'Observability Client' },
    { port: 4000, url: 'http://localhost:4000/health', name: 'Observability Server' },
    { port: 8084, url: 'http://localhost:8084/stats', name: 'Memory Stats' },
  ];

  for (const { port, url, name } of localServices) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
      results.push({
        category: 'Services',
        name,
        severity: response.ok ? 'pass' : 'warn',
        message: response.ok
          ? `${name} responding (HTTP ${response.status})`
          : `${name} returned HTTP ${response.status}`,
      });
    } catch {
      results.push({
        category: 'Services',
        name,
        severity: 'info',
        message: `${name} not reachable (service may not be running)`,
      });
    }
  }

  // Deep: Check remote trading dashboard (configure via TRADING_DASHBOARD_URL env var)
  const tradingDashboardUrl = process.env.TRADING_DASHBOARD_URL || 'http://localhost:8083';
  if (deep) {
    try {
      const response = await fetch(tradingDashboardUrl, { signal: AbortSignal.timeout(3000) });
      results.push({
        category: 'Services',
        name: `Trading Dashboard (${tradingDashboardUrl})`,
        severity: response.ok ? 'pass' : 'warn',
        message: response.ok
          ? 'Trading Dashboard responding'
          : `Trading Dashboard returned HTTP ${response.status}`,
      });
    } catch {
      results.push({
        category: 'Services',
        name: `Trading Dashboard (${tradingDashboardUrl})`,
        severity: 'info',
        message: 'Trading Dashboard not reachable (service may not be running)',
      });
    }
  }

  return results;
}

// ─── Category: Disk & Resources ─────────────────────────────────────────────

function checkDiskResources(): HealthResult[] {
  const results: HealthResult[] = [];
  const historyDir = join(PAI_DIR, 'history');

  // [INFO] History directory size
  if (existsSync(historyDir)) {
    const historySize = getDirSize(historyDir);
    results.push({
      category: 'Disk & Resources',
      name: 'History directory size',
      severity: 'info',
      message: `History directory: ${formatBytes(historySize)}`,
    });
  } else {
    results.push({
      category: 'Disk & Resources',
      name: 'History directory size',
      severity: 'warn',
      message: 'History directory missing',
      fix: `mkdir -p ${historyDir}`,
      autoFix: () => mkdirSync(historyDir, { recursive: true }),
    });
  }

  // [WARN] Scratchpad cleanup check (files older than 7 days)
  const scratchpadDir = join(PAI_DIR, 'scratchpad');
  if (existsSync(scratchpadDir)) {
    const oldFiles = getFilesOlderThan(scratchpadDir, 7);
    if (oldFiles.length === 0) {
      results.push({
        category: 'Disk & Resources',
        name: 'Scratchpad cleanup',
        severity: 'pass',
        message: 'No stale scratchpad files (>7 days old)',
      });
    } else {
      results.push({
        category: 'Disk & Resources',
        name: 'Scratchpad cleanup',
        severity: 'warn',
        message: `${oldFiles.length} file(s) older than 7 days in scratchpad`,
        fix: 'Run with --fix to clean stale files',
        autoFix: () => {
          for (const file of oldFiles) {
            unlinkSync(file);
          }
        },
      });
    }
  } else {
    results.push({
      category: 'Disk & Resources',
      name: 'Scratchpad cleanup',
      severity: 'info',
      message: 'No scratchpad directory',
    });
  }

  // [INFO] Available disk space on /home
  const dfOutput = shellExec('df -h /home | tail -1');
  if (dfOutput) {
    const parts = dfOutput.split(/\s+/);
    const available = parts[3] || 'unknown';
    const usePercent = parts[4] || 'unknown';
    const severity = usePercent.replace('%', '') > '90' ? 'warn' : 'pass';

    results.push({
      category: 'Disk & Resources',
      name: 'Disk space (/home)',
      severity,
      message: `${available} available (${usePercent} used)`,
    });
  } else {
    results.push({
      category: 'Disk & Resources',
      name: 'Disk space (/home)',
      severity: 'info',
      message: 'Could not check disk space',
    });
  }

  return results;
}

// ─── Output Formatting ──────────────────────────────────────────────────────

function printResults(results: HealthResult[], options: HealthOptions): void {
  if (options.json) {
    const summary = {
      timestamp: new Date().toISOString(),
      paiDir: PAI_DIR,
      deep: options.deep,
      results,
      counts: {
        pass: results.filter(r => r.severity === 'pass').length,
        crit: results.filter(r => r.severity === 'crit').length,
        warn: results.filter(r => r.severity === 'warn').length,
        info: results.filter(r => r.severity === 'info').length,
      },
    };
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  console.log(`\n${C.bold}PAI Doctor${C.reset}`);
  console.log('='.repeat(60));
  if (options.deep) {
    console.log(`${C.cyan}Mode: Deep scan (includes remote service checks)${C.reset}`);
  }
  console.log(`${C.dim}PAI_DIR: ${PAI_DIR}${C.reset}`);
  console.log('');

  // Group by category
  const categories = new Map<string, HealthResult[]>();
  for (const result of results) {
    const cat = categories.get(result.category) || [];
    cat.push(result);
    categories.set(result.category, cat);
  }

  for (const [category, catResults] of categories) {
    console.log(`${C.bold}[${category}]${C.reset}`);
    for (const r of catResults) {
      const icon = r.severity === 'pass' ? `${C.green}PASS${C.reset}`
        : r.severity === 'crit' ? `${C.red}CRIT${C.reset}`
        : r.severity === 'warn' ? `${C.yellow}WARN${C.reset}`
        : `${C.dim}INFO${C.reset}`;

      console.log(`  ${icon}  ${r.message}`);
      if (r.fix && r.severity !== 'pass') {
        console.log(`        ${C.dim}Fix: ${r.fix}${C.reset}`);
      }
    }
    console.log('');
  }

  // Summary
  const passCount = results.filter(r => r.severity === 'pass').length;
  const critCount = results.filter(r => r.severity === 'crit').length;
  const warnCount = results.filter(r => r.severity === 'warn').length;
  const infoCount = results.filter(r => r.severity === 'info').length;

  console.log('='.repeat(60));
  const parts: string[] = [];
  parts.push(`${C.green}${passCount} passed${C.reset}`);
  if (critCount > 0) parts.push(`${C.red}${critCount} critical${C.reset}`);
  if (warnCount > 0) parts.push(`${C.yellow}${warnCount} warnings${C.reset}`);
  if (infoCount > 0) parts.push(`${C.dim}${infoCount} info${C.reset}`);
  console.log(`\nResults: ${parts.join(', ')}\n`);

  if (critCount === 0 && warnCount === 0) {
    console.log(`${C.green}PAI system health is excellent.${C.reset}\n`);
  } else if (critCount > 0) {
    console.log(`${C.red}Critical issues found. Run with --fix to auto-remediate where possible.${C.reset}\n`);
  } else {
    console.log(`${C.yellow}Minor issues found. Review warnings above.${C.reset}\n`);
  }
}

// ─── Auto-Fix ───────────────────────────────────────────────────────────────

function applyFixes(results: HealthResult[], options: HealthOptions): void {
  if (!options.fix) return;

  const fixable = results.filter(r => r.autoFix && (r.severity === 'crit' || r.severity === 'warn'));
  if (fixable.length === 0) {
    if (!options.json) {
      console.log(`${C.green}No auto-fixable issues found.${C.reset}\n`);
    }
    return;
  }

  if (!options.json) {
    console.log(`${C.bold}Applying ${fixable.length} auto-fix(es)...${C.reset}\n`);
  }

  for (const r of fixable) {
    try {
      r.autoFix!();
      r.severity = 'pass';
      r.message = `[FIXED] ${r.message}`;
      if (!options.json) {
        console.log(`  ${C.green}FIXED${C.reset}  ${r.name}: ${r.fix}`);
      }
    } catch (e) {
      if (!options.json) {
        console.log(`  ${C.red}FAIL${C.reset}  ${r.name}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  if (!options.json) console.log('');
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const options = parseArgs();
  let allResults: HealthResult[] = [];

  // Run all checks
  allResults.push(...checkCoreInfrastructure());
  allResults.push(...checkSkillsHealth());
  allResults.push(...checkHooksHealth());
  allResults.push(...checkAgentHealth());
  allResults.push(...await checkServices(options.deep));
  allResults.push(...checkDiskResources());

  // Apply fixes before printing (so output shows fixed state)
  if (options.fix) {
    applyFixes(allResults, options);
  }

  printResults(allResults, options);

  // Exit code based on severity
  const critCount = allResults.filter(r => r.severity === 'crit').length;
  process.exit(critCount > 0 ? 1 : 0);
}

main().catch(e => {
  console.error(`Doctor check failed: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(2);
});
