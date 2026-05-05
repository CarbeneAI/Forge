#!/usr/bin/env bun
/**
 * PAIAudit — Read-only security audit of the PAI Claude Code surface.
 *
 * Usage:
 *   bun audit.ts              Full report → stdout + ~/.claude/audit-history/
 *   bun audit.ts --diff       Compare to previous audit, show only changes
 *   bun audit.ts --json       Emit JSON instead of markdown
 *   bun audit.ts --quiet      Suppress stdout, only write history file
 */

import { existsSync, readdirSync, readFileSync, writeFileSync, statSync, lstatSync, readlinkSync, mkdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { homedir } from 'os';
import { execSync } from 'child_process';

const HOME = homedir();
const PAI_DIR = join(HOME, '.claude');
const HISTORY_DIR = join(PAI_DIR, 'audit-history');
const OBSIDIAN_DIR = join(HOME, 'Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian_CarbeneAI/wiki/CarbeneAI/Audits');

type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

interface Finding {
  severity: Severity;
  area: string;
  message: string;
  detail?: string;
}

interface SymlinkRecord {
  path: string;
  target: string;
  repo: string | null;
  sha: string | null;
  branch: string | null;
}

interface PluginRecord {
  name: string;
  marketplace: string;
  version: string;
  installPath: string;
  gitCommitSha: string | null;
}

interface AuditReport {
  timestamp: string;
  host: string;
  findings: Finding[];
  inventory: {
    skills: { total: number; symlinks: number; native: number };
    agents: number;
    mcpServers: string[];
    symlinks: SymlinkRecord[];
    plugins: PluginRecord[];
  };
}

const SEVERITY_ORDER: Record<Severity, number> = {
  CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4,
};

function safeReadJSON(path: string): any | null {
  try {
    if (!existsSync(path)) return null;
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch (e) {
    return null;
  }
}

function safeRun(cmd: string, cwd?: string): string | null {
  try {
    return execSync(cmd, { cwd, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

// ============================================================================
// CHECK: settings.json hooks/permissions
// ============================================================================
function checkSettings(): Finding[] {
  const findings: Finding[] = [];
  const paths = [join(PAI_DIR, 'settings.json'), join(PAI_DIR, 'settings.local.json')];

  for (const path of paths) {
    const settings = safeReadJSON(path);
    if (!settings) continue;

    // Hooks: list any script-based hooks
    if (settings.hooks) {
      for (const [event, hookList] of Object.entries(settings.hooks)) {
        if (!Array.isArray(hookList)) continue;
        for (const hook of hookList as any[]) {
          if (hook?.hooks) {
            for (const h of hook.hooks) {
              if (h.type === 'command' && h.command) {
                findings.push({
                  severity: 'INFO',
                  area: 'hooks',
                  message: `${event} hook: ${h.command.slice(0, 80)}`,
                });
                // Flag scripts that fetch over network in hooks
                if (/curl|wget|nc\s/.test(h.command)) {
                  findings.push({
                    severity: 'MEDIUM',
                    area: 'hooks',
                    message: `Hook makes network call: ${event}`,
                    detail: h.command,
                  });
                }
              }
            }
          }
        }
      }
    }

    // Permissions: count allow rules
    const allowCount = settings.permissions?.allow?.length ?? 0;
    if (allowCount > 0) {
      findings.push({
        severity: 'INFO',
        area: 'permissions',
        message: `${allowCount} allow rules in ${path.split('/').pop()}`,
      });
    }

    // Wildcard or overly broad permissions
    const allowList = settings.permissions?.allow ?? [];
    for (const rule of allowList) {
      if (rule === '*' || rule === 'Bash(*)' || rule === 'Bash(*:*)') {
        findings.push({
          severity: 'HIGH',
          area: 'permissions',
          message: `Wildcard permission grants unrestricted access: "${rule}"`,
        });
      }
    }
  }

  return findings;
}

// ============================================================================
// CHECK: ~/.claude.json MCP servers + token presence
// ============================================================================
function checkMCP(): { findings: Finding[]; servers: string[] } {
  const findings: Finding[] = [];
  const path = join(HOME, '.claude.json');

  // File permissions check (file holds tokens)
  if (existsSync(path)) {
    const stat = statSync(path);
    const mode = (stat.mode & 0o777).toString(8);
    if (mode !== '600') {
      findings.push({
        severity: 'CRITICAL',
        area: 'permissions',
        message: `~/.claude.json has mode ${mode} (should be 600 — contains API tokens)`,
      });
    }
  }

  const config = safeReadJSON(path);
  if (!config) return { findings, servers: [] };

  // Walk all projects to find MCP servers configured
  const servers = new Set<string>();
  let tokenCount = 0;

  const walkObj = (obj: any) => {
    if (!obj || typeof obj !== 'object') return;
    if (obj.mcpServers && typeof obj.mcpServers === 'object') {
      for (const name of Object.keys(obj.mcpServers)) {
        servers.add(name);
        const srv = obj.mcpServers[name];
        if (srv?.env) {
          for (const k of Object.keys(srv.env)) {
            if (/token|key|secret|password|auth/i.test(k)) tokenCount++;
          }
        }
        // Flag suspicious commands
        if (srv?.command && /\.\.\//.test(srv.command)) {
          findings.push({
            severity: 'HIGH',
            area: 'mcp',
            message: `MCP server "${name}" command has parent-dir traversal: ${srv.command}`,
          });
        }
      }
    }
    for (const v of Object.values(obj)) {
      if (typeof v === 'object') walkObj(v);
    }
  };
  walkObj(config);

  findings.push({
    severity: 'INFO',
    area: 'mcp',
    message: `${servers.size} unique MCP servers configured, ${tokenCount} env-var token references (values not read)`,
  });

  return { findings, servers: [...servers].sort() };
}

// ============================================================================
// CHECK: symlinked skills supply chain (plus skill-directories that ARE git repos)
// ============================================================================
function checkSupplyChain(): { findings: Finding[]; symlinks: SymlinkRecord[] } {
  const findings: Finding[] = [];
  const symlinks: SymlinkRecord[] = [];
  const skillsDir = join(PAI_DIR, 'skills');

  if (!existsSync(skillsDir)) return { findings, symlinks };

  const entries = readdirSync(skillsDir);
  for (const name of entries) {
    const full = join(skillsDir, name);
    let lst;
    try { lst = lstatSync(full); } catch { continue; }

    let absTarget: string;
    let isSymlink: boolean;

    if (lst.isSymbolicLink()) {
      isSymlink = true;
      absTarget = resolve(dirname(full), readlinkSync(full));
    } else if (lst.isDirectory() && existsSync(join(full, '.git'))) {
      // Skill directory is itself a git repo (e.g., gstack)
      isSymlink = false;
      absTarget = full;
    } else {
      continue;
    }

    let repoRoot: string | null = null;
    let sha: string | null = null;
    let branch: string | null = null;

    let cur = absTarget;
    for (let i = 0; i < 10 && cur !== '/'; i++) {
      if (existsSync(join(cur, '.git'))) {
        repoRoot = cur;
        break;
      }
      cur = dirname(cur);
    }

    if (repoRoot) {
      sha = safeRun('git rev-parse HEAD', repoRoot);
      branch = safeRun('git symbolic-ref --short HEAD', repoRoot) || '(detached)';
    }

    symlinks.push({ path: full, target: absTarget, repo: repoRoot, sha, branch });

    if (branch && branch !== '(detached)') {
      findings.push({
        severity: 'HIGH',
        area: 'supply-chain',
        message: `External skill "${name}" tracks floating branch "${branch}" — should be pinned to commit SHA${isSymlink ? '' : ' (skill dir is a git repo)'}`,
        detail: `Target: ${absTarget}`,
      });
    }
  }

  // Group repos to summarize
  const reposSeen = new Map<string, { sha: string | null; count: number }>();
  for (const link of symlinks) {
    if (!link.repo) continue;
    const existing = reposSeen.get(link.repo);
    if (existing) existing.count++;
    else reposSeen.set(link.repo, { sha: link.sha, count: 1 });
  }
  for (const [repo, info] of reposSeen) {
    findings.push({
      severity: 'INFO',
      area: 'supply-chain',
      message: `External repo: ${repo} (SHA: ${info.sha?.slice(0, 12) ?? 'unknown'}, ${info.count} skill${info.count === 1 ? '' : 's'})`,
    });
  }

  return { findings, symlinks };
}

// ============================================================================
// CHECK: installed plugins (Notion, Playwright, etc. live here)
// ============================================================================
function checkPlugins(): { findings: Finding[]; plugins: PluginRecord[] } {
  const findings: Finding[] = [];
  const plugins: PluginRecord[] = [];
  const path = join(PAI_DIR, 'plugins/installed_plugins.json');
  const data = safeReadJSON(path);
  if (!data?.plugins) return { findings, plugins };

  const TRUSTED_MARKETPLACES = new Set(['claude-plugins-official']);

  for (const [key, instances] of Object.entries(data.plugins as Record<string, any[]>)) {
    const [name, marketplace] = key.split('@');
    for (const inst of instances) {
      plugins.push({
        name,
        marketplace,
        version: inst.version ?? 'unknown',
        installPath: inst.installPath,
        gitCommitSha: inst.gitCommitSha ?? null,
      });
      if (!TRUSTED_MARKETPLACES.has(marketplace)) {
        findings.push({
          severity: 'HIGH',
          area: 'plugins',
          message: `Plugin "${name}" from untrusted marketplace "${marketplace}"`,
          detail: `Install path: ${inst.installPath}`,
        });
      }
    }
  }

  findings.push({
    severity: 'INFO',
    area: 'plugins',
    message: `${plugins.length} plugin${plugins.length === 1 ? '' : 's'} installed across ${new Set(plugins.map(p => p.marketplace)).size} marketplace(s)`,
  });

  return { findings, plugins };
}

// ============================================================================
// CHECK: agent tool surface
// ============================================================================
function checkAgents(): { findings: Finding[]; count: number } {
  const findings: Finding[] = [];
  const agentsDir = join(PAI_DIR, 'agents');
  if (!existsSync(agentsDir)) return { findings, count: 0 };

  const files = readdirSync(agentsDir).filter(f => f.endsWith('.md'));
  let broadCount = 0;

  for (const file of files) {
    const path = join(agentsDir, file);
    let content;
    try { content = readFileSync(path, 'utf-8'); } catch { continue; }

    // Parse frontmatter tools field
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) continue;
    const fm = fmMatch[1];

    const toolsMatch = fm.match(/^tools:\s*(.+)$/m);
    if (!toolsMatch) continue;

    const tools = toolsMatch[1].trim();
    if (tools === '*' || tools === '"*"' || /All tools/i.test(tools)) {
      broadCount++;
      // Only flag NEW agents with broad access if name is unfamiliar
      // (For now, just count — tune later)
    }
  }

  findings.push({
    severity: 'INFO',
    area: 'agents',
    message: `${files.length} agents, ${broadCount} with broad tool access (* or "All tools")`,
  });

  return { findings, count: files.length };
}

// ============================================================================
// CHECK: hook script permissions
// ============================================================================
function checkHookScripts(): Finding[] {
  const findings: Finding[] = [];
  const hooksDir = join(PAI_DIR, 'hooks');
  if (!existsSync(hooksDir)) return findings;

  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      let stat;
      try { stat = statSync(full); } catch { continue; }
      if (stat.isDirectory()) { walk(full); continue; }
      if (!stat.isFile()) continue;

      const mode = stat.mode & 0o777;
      // World-writable is a red flag for executable hooks
      if (mode & 0o002) {
        findings.push({
          severity: 'CRITICAL',
          area: 'hooks',
          message: `Hook file is world-writable: ${full} (mode ${mode.toString(8)})`,
        });
      }
      // Group-writable on macOS staff is also concerning
      if ((mode & 0o020) && stat.gid !== 0) {
        findings.push({
          severity: 'MEDIUM',
          area: 'hooks',
          message: `Hook file is group-writable: ${full} (mode ${mode.toString(8)})`,
        });
      }
    }
  };
  walk(hooksDir);

  return findings;
}

// ============================================================================
// REPORT
// ============================================================================
function buildReport(report: AuditReport, mode: 'markdown' | 'json'): string {
  if (mode === 'json') return JSON.stringify(report, null, 2);

  const counts: Record<Severity, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 };
  for (const f of report.findings) counts[f.severity]++;

  let out = `# PAI Security Audit — ${report.timestamp}\n\n`;
  out += `Host: ${report.host}\n\n`;
  out += `## Summary\n\n`;
  out += `| Severity | Count |\n|---|---|\n`;
  for (const s of ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'] as Severity[]) {
    out += `| ${s} | ${counts[s]} |\n`;
  }
  out += `\n`;

  out += `## Inventory\n\n`;
  out += `- Skills: ${report.inventory.skills.total} (${report.inventory.skills.symlinks} symlinked, ${report.inventory.skills.native} native)\n`;
  out += `- Agents: ${report.inventory.agents}\n`;
  out += `- MCP servers (~/.claude.json): ${report.inventory.mcpServers.length}\n`;
  out += `- Plugins: ${report.inventory.plugins.length}\n\n`;

  // Findings by severity
  for (const sev of ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'] as Severity[]) {
    const subset = report.findings.filter(f => f.severity === sev);
    if (subset.length === 0) continue;
    out += `## ${sev} (${subset.length})\n\n`;
    for (const f of subset) {
      out += `- **${f.area}**: ${f.message}\n`;
      if (f.detail) out += `  - ${f.detail}\n`;
    }
    out += `\n`;
  }

  // Supply chain SHA table for week-over-week comparison
  out += `## Supply Chain SHAs\n\n`;
  out += `| Path | Repo | SHA | Branch |\n|---|---|---|---|\n`;
  const seenRepos = new Set<string>();
  for (const link of report.inventory.symlinks) {
    if (!link.repo || seenRepos.has(link.repo)) continue;
    seenRepos.add(link.repo);
    out += `| ${link.path.replace(HOME, '~')} | ${link.repo.replace(HOME, '~')} | \`${link.sha?.slice(0, 12) ?? 'n/a'}\` | ${link.branch ?? 'n/a'} |\n`;
  }
  out += `\n`;

  // MCP server list
  out += `## MCP Servers (~/.claude.json)\n\n`;
  for (const s of report.inventory.mcpServers) out += `- ${s}\n`;
  out += `\n`;

  // Plugins table
  if (report.inventory.plugins.length > 0) {
    out += `## Plugins\n\n`;
    out += `| Name | Marketplace | Version | SHA |\n|---|---|---|---|\n`;
    for (const p of report.inventory.plugins) {
      out += `| ${p.name} | ${p.marketplace} | ${p.version} | \`${p.gitCommitSha?.slice(0, 12) ?? 'n/a'}\` |\n`;
    }
  }

  return out;
}

// ============================================================================
// DELTA: compare to last audit
// ============================================================================
function findLastReport(): AuditReport | null {
  if (!existsSync(HISTORY_DIR)) return null;
  const files = readdirSync(HISTORY_DIR)
    .filter(f => f.endsWith('.json'))
    .sort()
    .reverse();
  if (files.length === 0) return null;
  return safeReadJSON(join(HISTORY_DIR, files[0]));
}

function buildDelta(current: AuditReport, previous: AuditReport): string {
  let out = `# PAI Audit Delta — ${current.timestamp} vs ${previous.timestamp}\n\n`;

  // SHA drift
  const prevShas = new Map(previous.inventory.symlinks.map(l => [l.repo, l.sha]));
  const drifts: string[] = [];
  for (const link of current.inventory.symlinks) {
    if (!link.repo) continue;
    const prev = prevShas.get(link.repo);
    if (prev && prev !== link.sha) {
      drifts.push(`- ${link.repo.replace(HOME, '~')}: \`${prev?.slice(0, 12)}\` → \`${link.sha?.slice(0, 12)}\``);
    }
  }
  if (drifts.length > 0) {
    out += `## SHA Drift\n\n${drifts.join('\n')}\n\n`;
  } else {
    out += `## SHA Drift\n\nNone — all external repos at same SHA as last audit.\n\n`;
  }

  // New/removed MCPs
  const prevMCP = new Set(previous.inventory.mcpServers);
  const curMCP = new Set(current.inventory.mcpServers);
  const addedMCP = [...curMCP].filter(s => !prevMCP.has(s));
  const removedMCP = [...prevMCP].filter(s => !curMCP.has(s));
  if (addedMCP.length || removedMCP.length) {
    out += `## MCP Server Changes\n\n`;
    if (addedMCP.length) out += `Added: ${addedMCP.join(', ')}\n\n`;
    if (removedMCP.length) out += `Removed: ${removedMCP.join(', ')}\n\n`;
  }

  // Skill count change
  if (current.inventory.skills.total !== previous.inventory.skills.total) {
    out += `## Skill Count\n\n${previous.inventory.skills.total} → ${current.inventory.skills.total}\n\n`;
  }

  // Severity counts diff
  const curCounts: Record<Severity, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 };
  const prevCounts: Record<Severity, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 };
  for (const f of current.findings) curCounts[f.severity]++;
  for (const f of previous.findings) prevCounts[f.severity]++;
  out += `## Severity Counts\n\n`;
  out += `| Severity | Previous | Current | Δ |\n|---|---|---|---|\n`;
  for (const s of ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'] as Severity[]) {
    const delta = curCounts[s] - prevCounts[s];
    out += `| ${s} | ${prevCounts[s]} | ${curCounts[s]} | ${delta > 0 ? '+' : ''}${delta} |\n`;
  }

  return out;
}

// ============================================================================
// MAIN
// ============================================================================
async function main() {
  const args = new Set(process.argv.slice(2));
  const wantDiff = args.has('--diff');
  const wantJSON = args.has('--json');
  const quiet = args.has('--quiet');

  const findings: Finding[] = [];
  findings.push(...checkSettings());
  const mcpResult = checkMCP();
  findings.push(...mcpResult.findings);
  const supplyResult = checkSupplyChain();
  findings.push(...supplyResult.findings);
  const agentResult = checkAgents();
  findings.push(...agentResult.findings);
  findings.push(...checkHookScripts());
  const pluginResult = checkPlugins();
  findings.push(...pluginResult.findings);

  // Skill counts
  const skillsDir = join(PAI_DIR, 'skills');
  let skillTotal = 0, skillSymlinks = 0, skillNative = 0;
  if (existsSync(skillsDir)) {
    for (const name of readdirSync(skillsDir)) {
      try {
        const lst = lstatSync(join(skillsDir, name));
        if (lst.isSymbolicLink()) { skillSymlinks++; skillTotal++; }
        else if (lst.isDirectory()) { skillNative++; skillTotal++; }
      } catch {}
    }
  }

  findings.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  const report: AuditReport = {
    timestamp: new Date().toISOString(),
    host: execSync('hostname', { encoding: 'utf-8' }).trim(),
    findings,
    inventory: {
      skills: { total: skillTotal, symlinks: skillSymlinks, native: skillNative },
      agents: agentResult.count,
      mcpServers: mcpResult.servers,
      symlinks: supplyResult.symlinks,
      plugins: pluginResult.plugins,
    },
  };

  // Save history
  if (!existsSync(HISTORY_DIR)) mkdirSync(HISTORY_DIR, { recursive: true });
  const date = new Date().toISOString().slice(0, 10);
  const jsonPath = join(HISTORY_DIR, `${date}.json`);
  const mdPath = join(HISTORY_DIR, `${date}.md`);
  writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  const markdown = buildReport(report, 'markdown');
  writeFileSync(mdPath, markdown);

  // Save to Obsidian if available
  if (existsSync(dirname(OBSIDIAN_DIR))) {
    if (!existsSync(OBSIDIAN_DIR)) mkdirSync(OBSIDIAN_DIR, { recursive: true });
    writeFileSync(join(OBSIDIAN_DIR, `PAI-Audit-${date}.md`), markdown);
  }

  // Output
  if (wantDiff) {
    const previous = findLastReport();
    if (!previous) {
      if (!quiet) console.log('No previous audit found. Run again next week to compare.');
    } else {
      const delta = buildDelta(report, previous);
      if (!quiet) console.log(delta);
    }
  } else {
    const out = buildReport(report, wantJSON ? 'json' : 'markdown');
    if (!quiet) console.log(out);
  }

  // Exit code reflects severity — 1 if any HIGH/CRITICAL
  const hasCritical = findings.some(f => f.severity === 'CRITICAL' || f.severity === 'HIGH');
  process.exit(hasCritical ? 1 : 0);
}

main();
