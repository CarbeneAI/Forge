#!/usr/bin/env bun
/**
 * PAI Security Audit CLI
 *
 * Comprehensive security audit for PAI infrastructure.
 * Scans for secrets, permission issues, git security, config validation,
 * network exposure, and dependency vulnerabilities.
 *
 * Usage:
 *   bun ~/.claude/skills/CORE/tools/SecurityAudit.ts            # Basic audit
 *   bun ~/.claude/skills/CORE/tools/SecurityAudit.ts --deep      # Include live service probing
 *   bun ~/.claude/skills/CORE/tools/SecurityAudit.ts --fix       # Auto-fix critical issues
 *   bun ~/.claude/skills/CORE/tools/SecurityAudit.ts --json      # JSON output
 *   bun ~/.claude/skills/CORE/tools/SecurityAudit.ts --category secrets  # Single category
 */

import { existsSync, readFileSync, statSync, readdirSync, chmodSync } from 'fs';
import { join, resolve } from 'path';
import { execSync } from 'child_process';

// ─── Path Resolution ────────────────────────────────────────────────────────

const SCRIPT_DIR = import.meta.dir;
// tools/ -> CORE/ -> skills/ -> .claude/
const PAI_DIR = resolve(SCRIPT_DIR, '..', '..', '..');
const REPO_ROOT = resolve(PAI_DIR, '..');
const HOME = process.env.HOME || '/home/youruser';

// ─── Types ──────────────────────────────────────────────────────────────────

interface AuditResult {
  category: string;
  name: string;
  severity: 'pass' | 'crit' | 'warn' | 'info';
  message: string;
  fix?: string;
  autoFix?: () => void;
}

interface AuditOptions {
  deep: boolean;
  fix: boolean;
  json: boolean;
  category?: string;
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

function parseArgs(): AuditOptions {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
PAI Security Audit

Usage:
  bun SecurityAudit.ts [options]

Options:
  --deep              Include live service probing and network checks
  --fix               Auto-fix critical issues where possible
  --json              Output results as JSON
  --category <name>   Run only a specific category
                      (secrets, git, permissions, config, network, deps)
  --help, -h          Show this help message
`);
    process.exit(0);
  }

  const categoryIdx = args.indexOf('--category');
  const category = categoryIdx !== -1 ? args[categoryIdx + 1] : undefined;

  return {
    deep: args.includes('--deep'),
    fix: args.includes('--fix'),
    json: args.includes('--json'),
    category,
  };
}

// ─── Utility Helpers ────────────────────────────────────────────────────────

function getFilePerms(filePath: string): string | null {
  try {
    const stat = statSync(filePath);
    return (stat.mode & 0o777).toString(8);
  } catch {
    return null;
  }
}

function shellExec(cmd: string): string | null {
  try {
    return execSync(cmd, { encoding: 'utf-8', timeout: 10000 }).trim();
  } catch {
    return null;
  }
}

function globFiles(dir: string, extensions: string[]): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;

  function walk(d: string) {
    try {
      for (const entry of readdirSync(d, { withFileTypes: true })) {
        const full = join(d, entry.name);
        if (entry.isDirectory()) {
          // Skip node_modules, .git, and data directories
          if (['node_modules', '.git', 'raw-outputs', 'semantic-memory-db'].includes(entry.name)) continue;
          walk(full);
        } else if (extensions.some(ext => entry.name.endsWith(ext))) {
          results.push(full);
        }
      }
    } catch {
      // Permission denied or similar - skip
    }
  }

  walk(dir);
  return results;
}

// ─── Category: Secrets & Credentials ────────────────────────────────────────

function checkSecrets(): AuditResult[] {
  const results: AuditResult[] = [];

  // [CRIT] Hardcoded secrets in source files
  const secretPatterns = [
    { pattern: /sk-ant-[a-zA-Z0-9_-]{20,}/, name: 'Anthropic API key', docSafe: false },
    { pattern: /sk-proj-[a-zA-Z0-9_-]{20,}/, name: 'OpenAI project key', docSafe: false },
    { pattern: /sk-[a-zA-Z0-9]{40,}/, name: 'OpenAI API key', docSafe: false },
    { pattern: /Bearer\s+[a-zA-Z0-9._-]{30,}/, name: 'Bearer token', docSafe: true },
    { pattern: /password\s*=\s*["'][^"']{8,}["']/, name: 'Hardcoded password', docSafe: true },
    { pattern: /AKIA[0-9A-Z]{16}/, name: 'AWS Access Key', docSafe: false },
    { pattern: /ghp_[a-zA-Z0-9]{36}/, name: 'GitHub PAT', docSafe: false },
    { pattern: /xoxb-[0-9]{10,}-[a-zA-Z0-9-]+/, name: 'Slack Bot Token', docSafe: false },
  ];

  const sourceFiles = globFiles(PAI_DIR, ['.ts', '.js', '.md']);
  const violations: string[] = [];

  // Files that are documentation/reference - only flag non-docSafe patterns in these
  const isDocFile = (f: string) =>
    f.includes('/resources/') || f.includes('/reference/') ||
    f.endsWith('SKILL.md') || f.includes('STANDARD_LIBRARY') ||
    f.includes('REQUEST_TEMPLATES') || f.includes('encoding-') ||
    f.includes('-report.md') || f.includes('-summary.md');

  for (const file of sourceFiles) {
    // Skip .env.example - it's supposed to have placeholder patterns
    if (file.endsWith('.env.example')) continue;
    // Skip this audit file itself
    if (file.includes('SecurityAudit.ts')) continue;
    // Skip validate-protected.ts - it contains patterns for detection
    if (file.includes('validate-protected.ts')) continue;
    // Skip .pai-protected.json - it contains detection patterns
    if (file.includes('.pai-protected.json')) continue;

    const isDoc = isDocFile(file);

    try {
      const content = readFileSync(file, 'utf-8');
      for (const { pattern, name, docSafe } of secretPatterns) {
        // Skip doc-safe patterns in documentation files (example Bearer tokens, etc.)
        if (isDoc && docSafe) continue;
        if (pattern.test(content)) {
          violations.push(`${name} found in ${file}`);
        }
      }
    } catch {
      // Can't read file, skip
    }
  }

  if (violations.length === 0) {
    results.push({
      category: 'Secrets & Credentials',
      name: 'Hardcoded secrets scan',
      severity: 'pass',
      message: `No hardcoded API keys found in ${sourceFiles.length} source files`,
    });
  } else {
    for (const v of violations) {
      results.push({
        category: 'Secrets & Credentials',
        name: 'Hardcoded secrets scan',
        severity: 'crit',
        message: v,
        fix: 'Move secret to .env file and reference via process.env',
      });
    }
  }

  // [CRIT] .env file permissions
  const envPath = join(PAI_DIR, '.env');
  if (existsSync(envPath)) {
    const perms = getFilePerms(envPath);
    if (perms && perms !== '600') {
      results.push({
        category: 'Secrets & Credentials',
        name: '.env file permissions',
        severity: 'crit',
        message: `.env file permissions are ${perms} (should be 600)`,
        fix: `chmod 600 ${envPath}`,
        autoFix: () => chmodSync(envPath, 0o600),
      });
    } else if (perms === '600') {
      results.push({
        category: 'Secrets & Credentials',
        name: '.env file permissions',
        severity: 'pass',
        message: '.env file permissions are 600 (correct)',
      });
    }
  } else {
    results.push({
      category: 'Secrets & Credentials',
      name: '.env file permissions',
      severity: 'info',
      message: 'No .env file found (using .env.example only)',
    });
  }

  // [WARN] .env vs .env.example drift
  const envExamplePath = join(PAI_DIR, '.env.example');
  if (existsSync(envPath) && existsSync(envExamplePath)) {
    const envContent = readFileSync(envPath, 'utf-8');
    const exampleContent = readFileSync(envExamplePath, 'utf-8');

    const extractKeys = (content: string) =>
      content.split('\n')
        .filter(l => /^[A-Z_]+=/.test(l.trim()))
        .map(l => l.split('=')[0].trim());

    const exampleKeys = extractKeys(exampleContent);
    const envKeys = extractKeys(envContent);
    const missing = exampleKeys.filter(k => !envKeys.includes(k));

    if (missing.length === 0) {
      results.push({
        category: 'Secrets & Credentials',
        name: '.env/.env.example sync',
        severity: 'pass',
        message: '.env matches .env.example structure',
      });
    } else {
      results.push({
        category: 'Secrets & Credentials',
        name: '.env/.env.example sync',
        severity: 'warn',
        message: `Missing keys in .env: ${missing.join(', ')}`,
        fix: 'Add missing keys to .env (can be empty values)',
      });
    }
  }

  return results;
}

// ─── Category: Git Security ─────────────────────────────────────────────────

function checkGit(): AuditResult[] {
  const results: AuditResult[] = [];
  const gitDir = join(REPO_ROOT, '.git');

  if (!existsSync(gitDir)) {
    results.push({
      category: 'Git Security',
      name: 'Git repository',
      severity: 'info',
      message: 'Not a git repository - skipping git checks',
    });
    return results;
  }

  // [CRIT] Sensitive files tracked in git
  const sensitiveFiles = ['.claude/.env', '.claude/mcp.json'];
  for (const file of sensitiveFiles) {
    const tracked = shellExec(`git -C "${REPO_ROOT}" ls-files "${file}"`);
    if (tracked && tracked.length > 0) {
      results.push({
        category: 'Git Security',
        name: `${file} in git`,
        severity: 'crit',
        message: `${file} is tracked in git`,
        fix: `git rm --cached "${file}" && echo "${file}" >> .gitignore`,
      });
    } else {
      results.push({
        category: 'Git Security',
        name: `${file} in git`,
        severity: 'pass',
        message: `${file} not tracked in git`,
      });
    }
  }

  // [CRIT] Check settings.json isn't tracked (contains PAI_DIR)
  const settingsTracked = shellExec(`git -C "${REPO_ROOT}" ls-files ".claude/settings.json"`);
  // settings.json may be tracked intentionally for PAI distribution - check if it has real secrets
  if (settingsTracked && settingsTracked.length > 0) {
    const settingsContent = readFileSync(join(PAI_DIR, 'settings.json'), 'utf-8');
    const hasSecrets = /api_key|password|token.*=.*[A-Za-z0-9]{20}/i.test(settingsContent);
    if (hasSecrets) {
      results.push({
        category: 'Git Security',
        name: 'settings.json secrets',
        severity: 'crit',
        message: 'settings.json contains potential secrets and is tracked in git',
        fix: 'Remove secrets from settings.json or untrack it',
      });
    } else {
      results.push({
        category: 'Git Security',
        name: 'settings.json in git',
        severity: 'pass',
        message: 'settings.json tracked but contains no secrets',
      });
    }
  } else {
    results.push({
      category: 'Git Security',
      name: 'settings.json in git',
      severity: 'pass',
      message: 'settings.json not tracked in git',
    });
  }

  // [CRIT] Pre-commit hook installed
  const preCommitPath = join(REPO_ROOT, '.git', 'hooks', 'pre-commit');
  if (existsSync(preCommitPath)) {
    const perms = getFilePerms(preCommitPath);
    const isExecutable = perms ? (parseInt(perms, 8) & 0o111) !== 0 : false;
    if (isExecutable) {
      results.push({
        category: 'Git Security',
        name: 'Pre-commit hook',
        severity: 'pass',
        message: 'Pre-commit hook installed and executable',
      });
    } else {
      results.push({
        category: 'Git Security',
        name: 'Pre-commit hook',
        severity: 'warn',
        message: 'Pre-commit hook exists but is not executable',
        fix: `chmod +x ${preCommitPath}`,
        autoFix: () => chmodSync(preCommitPath, 0o755),
      });
    }
  } else {
    results.push({
      category: 'Git Security',
      name: 'Pre-commit hook',
      severity: 'crit',
      message: 'Pre-commit hook not installed',
      fix: 'Create a pre-commit hook that runs validate-protected.ts',
    });
  }

  // [WARN] Git remote verification
  const remoteUrl = shellExec(`git -C "${REPO_ROOT}" remote get-url origin 2>/dev/null`);
  if (remoteUrl) {
    const isPrivate = remoteUrl.includes('.pai') || remoteUrl.includes('private');
    results.push({
      category: 'Git Security',
      name: 'Git remote',
      severity: isPrivate ? 'pass' : 'warn',
      message: `Remote: ${remoteUrl}${isPrivate ? ' (private)' : ' (verify this is intended)'}`,
    });
  } else {
    results.push({
      category: 'Git Security',
      name: 'Git remote',
      severity: 'info',
      message: 'No git remote configured',
    });
  }

  // [WARN] .gitignore includes sensitive patterns
  const gitignorePath = join(REPO_ROOT, '.gitignore');
  if (existsSync(gitignorePath)) {
    const gitignore = readFileSync(gitignorePath, 'utf-8');
    const requiredPatterns = ['.env', '*.pem', '*.key'];
    const missing = requiredPatterns.filter(p => !gitignore.includes(p));
    if (missing.length === 0) {
      results.push({
        category: 'Git Security',
        name: '.gitignore coverage',
        severity: 'pass',
        message: '.gitignore covers sensitive file patterns',
      });
    } else {
      results.push({
        category: 'Git Security',
        name: '.gitignore coverage',
        severity: 'warn',
        message: `.gitignore missing patterns: ${missing.join(', ')}`,
        fix: `Add missing patterns to ${gitignorePath}`,
      });
    }
  }

  return results;
}

// ─── Category: File Permissions ─────────────────────────────────────────────

function checkPermissions(): AuditResult[] {
  const results: AuditResult[] = [];

  // [CRIT] SSH key permissions
  const sshDir = join(HOME, '.ssh');
  if (existsSync(sshDir)) {
    const sshDirPerms = getFilePerms(sshDir);
    if (sshDirPerms && sshDirPerms !== '700') {
      results.push({
        category: 'File Permissions',
        name: '.ssh directory',
        severity: 'crit',
        message: `~/.ssh permissions are ${sshDirPerms} (should be 700)`,
        fix: `chmod 700 ${sshDir}`,
        autoFix: () => chmodSync(sshDir, 0o700),
      });
    } else {
      results.push({
        category: 'File Permissions',
        name: '.ssh directory',
        severity: 'pass',
        message: '~/.ssh permissions are 700 (correct)',
      });
    }

    // Check individual key files
    const keyIssues: string[] = [];
    try {
      for (const entry of readdirSync(sshDir)) {
        const fullPath = join(sshDir, entry);
        const stat = statSync(fullPath);
        if (!stat.isFile()) continue;

        // Private keys should be 600
        const nonKeyFiles = ['known_hosts', 'known_hosts.old', 'authorized_keys', 'config', 'backup_known_hosts'];
        if (!entry.endsWith('.pub') && !nonKeyFiles.includes(entry)) {
          const perms = getFilePerms(fullPath);
          if (perms && perms !== '600') {
            keyIssues.push(`${entry} is ${perms}`);
          }
        }
      }
    } catch { /* skip */ }

    if (keyIssues.length === 0) {
      results.push({
        category: 'File Permissions',
        name: 'SSH key permissions',
        severity: 'pass',
        message: 'All SSH private keys have correct permissions (600)',
      });
    } else {
      results.push({
        category: 'File Permissions',
        name: 'SSH key permissions',
        severity: 'crit',
        message: `SSH keys with wrong permissions: ${keyIssues.join(', ')}`,
        fix: `chmod 600 ~/.ssh/<key_name> for each affected key`,
        autoFix: () => {
          for (const entry of readdirSync(sshDir)) {
            const fullPath = join(sshDir, entry);
            const stat = statSync(fullPath);
            if (!stat.isFile()) continue;
            const nonKeyFiles2 = ['known_hosts', 'known_hosts.old', 'authorized_keys', 'config', 'backup_known_hosts'];
            if (!entry.endsWith('.pub') && !nonKeyFiles2.includes(entry)) {
              chmodSync(fullPath, 0o600);
            }
          }
        },
      });
    }
  } else {
    results.push({
      category: 'File Permissions',
      name: 'SSH directory',
      severity: 'info',
      message: 'No ~/.ssh directory found',
    });
  }

  // [WARN] Hook accessibility
  const hooksDir = join(PAI_DIR, 'hooks');
  if (existsSync(hooksDir)) {
    const hooks = readdirSync(hooksDir).filter(f => f.endsWith('.ts'));
    let unreadable = 0;
    for (const hook of hooks) {
      const perms = getFilePerms(join(hooksDir, hook));
      if (perms) {
        const readable = (parseInt(perms, 8) & 0o444) !== 0;
        if (!readable) unreadable++;
      }
    }

    results.push({
      category: 'File Permissions',
      name: 'Hook accessibility',
      severity: unreadable > 0 ? 'warn' : 'pass',
      message: unreadable > 0
        ? `${unreadable} hook(s) not readable`
        : `All ${hooks.length} hooks are accessible`,
    });
  }

  // [WARN] Data directory permissions
  const dataDirs = [
    { path: join(PAI_DIR, 'history'), name: 'history' },
    { path: join(PAI_DIR, 'skills', 'SemanticMemory'), name: 'SemanticMemory' },
  ];

  for (const { path, name } of dataDirs) {
    if (!existsSync(path)) continue;
    const perms = getFilePerms(path);
    if (perms) {
      const worldReadable = (parseInt(perms, 8) & 0o007) !== 0;
      if (worldReadable) {
        results.push({
          category: 'File Permissions',
          name: `${name} directory`,
          severity: 'warn',
          message: `${name} directory is world-readable (${perms})`,
          fix: `chmod 700 ${path}`,
          autoFix: () => chmodSync(path, 0o700),
        });
      } else {
        results.push({
          category: 'File Permissions',
          name: `${name} directory`,
          severity: 'pass',
          message: `${name} directory permissions are ${perms} (not world-readable)`,
        });
      }
    }
  }

  return results;
}

// ─── Category: Configuration Validation ─────────────────────────────────────

function checkConfig(): AuditResult[] {
  const results: AuditResult[] = [];

  // [CRIT] PAI_DIR resolution
  const settingsPath = join(PAI_DIR, 'settings.json');
  if (existsSync(settingsPath)) {
    try {
      const settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));
      const configuredDir = settings.env?.PAI_DIR;

      if (configuredDir === PAI_DIR) {
        results.push({
          category: 'Configuration',
          name: 'PAI_DIR resolution',
          severity: 'pass',
          message: `PAI_DIR resolves correctly: ${PAI_DIR}`,
        });
      } else if (configuredDir) {
        // Check if the configured dir actually exists
        if (existsSync(configuredDir)) {
          results.push({
            category: 'Configuration',
            name: 'PAI_DIR resolution',
            severity: 'pass',
            message: `PAI_DIR configured as ${configuredDir} (exists)`,
          });
        } else {
          results.push({
            category: 'Configuration',
            name: 'PAI_DIR resolution',
            severity: 'crit',
            message: `PAI_DIR points to non-existent directory: ${configuredDir}`,
            fix: 'Run bash ~/.claude/setup.sh to reconfigure PAI_DIR',
          });
        }
      } else {
        results.push({
          category: 'Configuration',
          name: 'PAI_DIR resolution',
          severity: 'crit',
          message: 'PAI_DIR not set in settings.json',
          fix: 'Run bash ~/.claude/setup.sh',
        });
      }
    } catch (e) {
      results.push({
        category: 'Configuration',
        name: 'PAI_DIR resolution',
        severity: 'crit',
        message: `settings.json parse error: ${e instanceof Error ? e.message : String(e)}`,
      });
    }
  }

  // [WARN] Destructive command deny list
  if (existsSync(settingsPath)) {
    try {
      const settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));
      const denyList = settings.permissions?.deny || [];
      if (denyList.length >= 10) {
        results.push({
          category: 'Configuration',
          name: 'Destructive command deny list',
          severity: 'pass',
          message: `Deny list present with ${denyList.length} entries`,
        });
      } else if (denyList.length > 0) {
        results.push({
          category: 'Configuration',
          name: 'Destructive command deny list',
          severity: 'warn',
          message: `Deny list has only ${denyList.length} entries (recommend 10+)`,
        });
      } else {
        results.push({
          category: 'Configuration',
          name: 'Destructive command deny list',
          severity: 'crit',
          message: 'No destructive command deny list configured',
          fix: 'Add deny list to permissions in settings.json',
        });
      }
    } catch { /* already caught above */ }
  }

  // [WARN] MCP server configuration
  const mcpPath = join(PAI_DIR, 'mcp.json');
  if (existsSync(mcpPath)) {
    try {
      const mcp = JSON.parse(readFileSync(mcpPath, 'utf-8'));
      const servers = Object.keys(mcp.mcpServers || {});

      // Check for hardcoded secrets in MCP config
      const mcpContent = readFileSync(mcpPath, 'utf-8');
      const hasHardcodedKeys = /["'][a-zA-Z0-9]{32,}["']/.test(mcpContent) &&
        !mcpContent.includes('${');

      if (hasHardcodedKeys) {
        results.push({
          category: 'Configuration',
          name: 'MCP server secrets',
          severity: 'crit',
          message: 'MCP config may contain hardcoded API keys',
          fix: 'Use ${ENV_VAR} references instead of hardcoded keys in mcp.json',
        });
      } else {
        results.push({
          category: 'Configuration',
          name: 'MCP server config',
          severity: 'pass',
          message: `${servers.length} MCP server(s) configured with env var references`,
        });
      }
    } catch {
      results.push({
        category: 'Configuration',
        name: 'MCP server config',
        severity: 'warn',
        message: 'Failed to parse mcp.json',
      });
    }
  }

  return results;
}

// ─── Category: Network Exposure (--deep only) ───────────────────────────────

async function checkNetwork(): Promise<AuditResult[]> {
  const results: AuditResult[] = [];

  // [CRIT] Check for exposed ports
  const portsToCheck = [
    { port: 8083, name: 'Trading Dashboard' },
    { port: 8084, name: 'Memory Stats' },
    { port: 4000, name: 'Observability Server' },
    { port: 5172, name: 'Observability Client' },
    { port: 3000, name: 'Voice Server' },
    { port: 8888, name: 'Voice Server (alt)' },
  ];

  // Use ss to check binding
  const ssOutput = shellExec('ss -tlnp 2>/dev/null');
  if (ssOutput) {
    for (const { port, name } of portsToCheck) {
      const lines = ssOutput.split('\n').filter(l => l.includes(`:${port}`));
      if (lines.length === 0) {
        results.push({
          category: 'Network Exposure',
          name: `${name} (${port})`,
          severity: 'info',
          message: `Port ${port} not listening`,
        });
        continue;
      }

      const boundToAll = lines.some(l => l.includes('0.0.0.0:') || l.includes('*:') || l.includes(':::'));
      const boundToLocalhost = lines.some(l => l.includes('127.0.0.1:'));

      if (boundToAll) {
        results.push({
          category: 'Network Exposure',
          name: `${name} (${port})`,
          severity: 'warn',
          message: `Port ${port} bound to 0.0.0.0 (LAN-accessible)`,
          fix: `Bind to 127.0.0.1 if local-only access is needed`,
        });
      } else if (boundToLocalhost) {
        results.push({
          category: 'Network Exposure',
          name: `${name} (${port})`,
          severity: 'pass',
          message: `Port ${port} bound to localhost only`,
        });
      }
    }
  } else {
    results.push({
      category: 'Network Exposure',
      name: 'Port scan',
      severity: 'info',
      message: 'Could not run ss command - port check skipped',
    });
  }

  // [WARN] Service health probes
  const servicesToProbe = [
    { url: 'http://localhost:8084/stats', name: 'Memory Stats API' },
    { url: 'http://localhost:4000/health', name: 'Observability Server' },
    { url: 'http://localhost:3000/health', name: 'Voice Server' },
  ];

  for (const { url, name } of servicesToProbe) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
      results.push({
        category: 'Network Exposure',
        name: `${name} health`,
        severity: response.ok ? 'pass' : 'warn',
        message: response.ok
          ? `${name} responding (HTTP ${response.status})`
          : `${name} returned HTTP ${response.status}`,
      });
    } catch {
      results.push({
        category: 'Network Exposure',
        name: `${name} health`,
        severity: 'info',
        message: `${name} not reachable (service may not be running)`,
      });
    }
  }

  return results;
}

// ─── Category: Dependency Security ──────────────────────────────────────────

function checkDeps(): AuditResult[] {
  const results: AuditResult[] = [];

  // Look for lockfiles in PAI_DIR and REPO_ROOT
  const lockLocations = [
    join(PAI_DIR, 'bun.lockb'),
    join(REPO_ROOT, 'bun.lockb'),
    join(PAI_DIR, 'package-lock.json'),
    join(REPO_ROOT, 'package-lock.json'),
  ];

  const lockfile = lockLocations.find(p => existsSync(p));

  if (!lockfile) {
    results.push({
      category: 'Dependency Security',
      name: 'Lockfile present',
      severity: 'info',
      message: 'No lockfile found (no dependency management detected)',
    });
    return results;
  }

  results.push({
    category: 'Dependency Security',
    name: 'Lockfile present',
    severity: 'pass',
    message: `Lockfile found: ${lockfile}`,
  });

  // Try bun audit if package.json exists
  const packageJsonDir = lockfile.includes(PAI_DIR) ? PAI_DIR : REPO_ROOT;
  const packageJsonPath = join(packageJsonDir, 'package.json');

  if (existsSync(packageJsonPath)) {
    // bun doesn't have a built-in audit command yet, so check for outdated
    const outdated = shellExec(`cd "${packageJsonDir}" && bun outdated 2>/dev/null`);
    if (outdated && outdated.trim().length > 0 && !outdated.includes('All packages are up to date')) {
      const lines = outdated.split('\n').filter(l => l.trim().length > 0);
      results.push({
        category: 'Dependency Security',
        name: 'Outdated packages',
        severity: 'warn',
        message: `${lines.length - 1} outdated package(s) detected`,
        fix: `cd ${packageJsonDir} && bun update`,
      });
    } else {
      results.push({
        category: 'Dependency Security',
        name: 'Outdated packages',
        severity: 'pass',
        message: 'All packages are up to date',
      });
    }
  }

  return results;
}

// ─── Output Formatting ──────────────────────────────────────────────────────

function printResults(results: AuditResult[], options: AuditOptions): void {
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

  console.log(`\n${C.bold}PAI Security Audit${C.reset}`);
  console.log('='.repeat(60));
  if (options.deep) {
    console.log(`${C.cyan}Mode: Deep scan (includes live service probing)${C.reset}`);
  }
  console.log(`${C.dim}PAI_DIR: ${PAI_DIR}${C.reset}`);
  console.log('');

  // Group by category
  const categories = new Map<string, AuditResult[]>();
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
    console.log(`${C.green}PAI security posture is clean.${C.reset}\n`);
  } else if (critCount > 0) {
    console.log(`${C.red}Critical issues found. Run with --fix to auto-remediate where possible.${C.reset}\n`);
  }
}

// ─── Auto-Fix ───────────────────────────────────────────────────────────────

function applyFixes(results: AuditResult[], options: AuditOptions): void {
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

  const categoryMap: Record<string, () => AuditResult[] | Promise<AuditResult[]>> = {
    secrets: checkSecrets,
    git: checkGit,
    permissions: checkPermissions,
    config: checkConfig,
    network: () => checkNetwork(),
    deps: checkDeps,
  };

  let allResults: AuditResult[] = [];

  if (options.category) {
    const checker = categoryMap[options.category];
    if (!checker) {
      console.error(`Unknown category: ${options.category}`);
      console.error(`Available: ${Object.keys(categoryMap).join(', ')}`);
      process.exit(1);
    }
    // Network is always deep-only
    if (options.category === 'network' && !options.deep) {
      if (!options.json) {
        console.log(`${C.yellow}Network checks require --deep flag${C.reset}`);
      }
      process.exit(0);
    }
    allResults = await Promise.resolve(checker());
  } else {
    // Run all categories
    allResults.push(...checkSecrets());
    allResults.push(...checkGit());
    allResults.push(...checkPermissions());
    allResults.push(...checkConfig());

    if (options.deep) {
      allResults.push(...await checkNetwork());
    }

    allResults.push(...checkDeps());
  }

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
  console.error(`Audit failed: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(2);
});
