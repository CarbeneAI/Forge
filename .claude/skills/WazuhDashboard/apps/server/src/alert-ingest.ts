#!/usr/bin/env bun
/**
 * Alert Ingestion Service
 * Polls Wazuh Indexer for alerts and streams to WebSocket clients
 * Also supports JSONL file watching and HTTP POST ingest as fallbacks
 */

import { watch, existsSync } from 'fs';
import { readFileSync } from 'fs';
import { homedir } from 'os';
import type { WazuhAlert, AlertStats } from './types';
import { getSeverityLevel } from './types';

// In-memory alert store (last N alerts only)
const MAX_ALERTS = 500;
const alerts: WazuhAlert[] = [];

// Track file position for incremental reading
const filePositions = new Map<string, number>();

// Track watched files
const watchedFiles = new Set<string>();

// Callback for new alerts
let onAlertsReceived: ((alerts: WazuhAlert[]) => void) | null = null;

// Wazuh Dashboard API configuration (proxies to Indexer on port 443)
// Note: Indexer port 9200 is localhost-only, so we use the Dashboard API proxy
const WAZUH_DASHBOARD_URL = process.env.WAZUH_DASHBOARD_URL || 'https://10.0.0.60';
const WAZUH_DASHBOARD_USER = process.env.WAZUH_DASHBOARD_USER || 'admin';
const WAZUH_DASHBOARD_PASSWORD = process.env.WAZUH_DASHBOARD_PASSWORD || '';
const POLL_INTERVAL_MS = parseInt(process.env.WAZUH_POLL_INTERVAL || '30000'); // 30 seconds

// Track last poll timestamp to only fetch new alerts
let lastPollTimestamp: string | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Poll Wazuh Indexer for new alerts
 */
async function pollWazuhIndexer(): Promise<void> {
  try {
    const query: any = {
      size: 100,
      sort: [{ timestamp: { order: 'desc' } }],
      query: {
        bool: {
          must: [
            { exists: { field: 'rule.level' } },
          ],
        },
      },
    };

    // Only fetch alerts newer than our last poll
    if (lastPollTimestamp) {
      query.query.bool.must.push({
        range: { timestamp: { gt: lastPollTimestamp } },
      });
    }

    // Use Dashboard API proxy (port 443) since Indexer port 9200 is localhost-only
    const searchPath = encodeURIComponent('wazuh-alerts-*/_search');
    const response = await fetch(
      `${WAZUH_DASHBOARD_URL}/api/console/proxy?path=${searchPath}&method=POST`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${WAZUH_DASHBOARD_USER}:${WAZUH_DASHBOARD_PASSWORD}`)}`,
          'osd-xsrf': 'true',
        },
        body: JSON.stringify(query),
        // @ts-ignore - Bun supports this for self-signed certs
        tls: { rejectUnauthorized: false },
      },
    );

    if (!response.ok) {
      console.error(`Wazuh Indexer poll failed: ${response.status} ${response.statusText}`);
      return;
    }

    const data = await response.json();
    const hits = data.hits?.hits || [];

    if (hits.length === 0) return;

    // Convert Wazuh Indexer format to our WazuhAlert format
    const newAlerts: WazuhAlert[] = hits
      .map((hit: any) => {
        const src = hit._source;
        return {
          timestamp: src.timestamp,
          rule: {
            level: parseInt(src.rule?.level || '0'),
            description: src.rule?.description || 'Unknown',
            id: src.rule?.id || '0',
            mitre: src.rule?.mitre,
            groups: src.rule?.groups,
            pci_dss: src.rule?.pci_dss,
            gdpr: src.rule?.gdpr,
            hipaa: src.rule?.hipaa,
            nist_800_53: src.rule?.nist_800_53,
          },
          agent: {
            id: src.agent?.id || '000',
            name: src.agent?.name || 'Unknown',
            ip: src.agent?.ip,
          },
          manager: src.manager,
          full_log: src.full_log,
          data: src.data,
          location: src.location,
          decoder: src.decoder,
          srcip: src.data?.src_ip || src.srcip,
          dstip: src.data?.dest_ip || src.dstip,
          dstport: src.data?.dest_port || src.dstport,
          protocol: src.data?.proto || src.protocol,
        } as WazuhAlert;
      })
      .reverse(); // oldest first for chronological storage

    // Update last poll timestamp to the newest alert
    lastPollTimestamp = hits[0]._source.timestamp;

    // Assign IDs and store
    const alertsWithIds = newAlerts.map((alert, index) => ({
      ...alert,
      id: alerts.length + index + 1,
    }));

    storeAlerts(alertsWithIds);
  } catch (error) {
    console.error('Wazuh Indexer poll error:', error);
  }
}

/**
 * Start polling Wazuh Indexer
 */
function startIndexerPolling(): void {
  console.log(`Starting Wazuh Indexer polling (${POLL_INTERVAL_MS / 1000}s interval)`);
  console.log(`Dashboard API: ${WAZUH_DASHBOARD_URL}`);

  // Initial poll - fetch recent alerts to populate the dashboard
  pollWazuhIndexer().then(() => {
    console.log(`Initial poll complete (${alerts.length} alerts loaded)`);
  });

  // Continue polling at interval
  pollTimer = setInterval(pollWazuhIndexer, POLL_INTERVAL_MS);
}

/**
 * Get alerts file path from environment or default
 */
function getAlertsFilePath(): string {
  return process.env.WAZUH_ALERTS_PATH || `${homedir()}/wazuh-alerts/alerts.jsonl`;
}

/**
 * Read new alerts from JSONL file starting from last position
 */
function readNewAlerts(filePath: string): WazuhAlert[] {
  if (!existsSync(filePath)) {
    return [];
  }

  const lastPosition = filePositions.get(filePath) || 0;

  try {
    const content = readFileSync(filePath, 'utf-8');
    const newContent = content.slice(lastPosition);

    // Update position to end of file
    filePositions.set(filePath, content.length);

    if (!newContent.trim()) {
      return [];
    }

    // Parse JSONL - one JSON object per line
    const lines = newContent.trim().split('\n');
    const newAlerts: WazuhAlert[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const alert = JSON.parse(line) as WazuhAlert;
        // Add auto-incrementing ID
        alert.id = alerts.length + newAlerts.length + 1;
        newAlerts.push(alert);
      } catch (error) {
        console.error(`Failed to parse alert: ${line.slice(0, 100)}...`, error);
      }
    }

    return newAlerts;
  } catch (error) {
    console.error(`Error reading alerts file:`, error);
    return [];
  }
}

/**
 * Store alerts in memory (keeping last MAX_ALERTS)
 */
function storeAlerts(newAlerts: WazuhAlert[]): void {
  if (newAlerts.length === 0) return;

  alerts.push(...newAlerts);

  // Keep only last MAX_ALERTS
  if (alerts.length > MAX_ALERTS) {
    alerts.splice(0, alerts.length - MAX_ALERTS);
  }

  console.log(`Received ${newAlerts.length} alert(s) (${alerts.length} in memory)`);

  // Notify subscribers
  if (onAlertsReceived) {
    onAlertsReceived(newAlerts);
  }
}

/**
 * Watch alerts file for changes (fallback mode)
 */
function watchFile(filePath: string): void {
  if (watchedFiles.has(filePath)) {
    return;
  }

  // Check if file exists and has content
  if (!existsSync(filePath)) {
    console.log(`JSONL file not found: ${filePath} (skipping file watcher)`);
    return;
  }

  const content = readFileSync(filePath, 'utf-8');
  if (content.trim().length === 0) {
    console.log(`JSONL file is empty: ${filePath} (skipping file watcher)`);
    return;
  }

  console.log(`Watching: ${filePath}`);
  watchedFiles.add(filePath);

  // Position at end - only read new alerts
  filePositions.set(filePath, content.length);
  console.log(`Positioned at end of file - only new alerts will be captured`);

  // Watch for changes
  const watcher = watch(filePath, (eventType) => {
    if (eventType === 'change') {
      const newAlerts = readNewAlerts(filePath);
      storeAlerts(newAlerts);
    }
  });

  watcher.on('error', (error) => {
    console.error(`Error watching ${filePath}:`, error);
    watchedFiles.delete(filePath);
  });
}

/**
 * Start alert ingestion
 * Primary: polls Wazuh Indexer API
 * Fallback: watches JSONL file and accepts HTTP POST
 * @param callback Callback when new alerts arrive
 */
export function startAlertIngestion(callback?: (alerts: WazuhAlert[]) => void): void {
  console.log('Starting alert ingestion service');

  if (callback) {
    onAlertsReceived = callback;
  }

  // Primary: Poll Wazuh Indexer
  startIndexerPolling();

  // Fallback: Also watch JSONL file if it has content
  const alertsFile = getAlertsFilePath();
  watchFile(alertsFile);

  console.log('Alert ingestion started (Wazuh Indexer polling + JSONL fallback)');
}

/**
 * Get recent alerts from memory
 */
export function getRecentAlerts(limit: number = 100): WazuhAlert[] {
  return alerts.slice(-limit).reverse();
}

/**
 * Get alert statistics
 */
export function getAlertStats(): AlertStats {
  const stats: AlertStats = {
    total: alerts.length,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const alert of alerts) {
    const severity = getSeverityLevel(alert.rule.level);
    stats[severity]++;
  }

  return stats;
}

/**
 * Add alerts directly (for HTTP ingest endpoint)
 * Returns the stored alerts with IDs assigned
 */
export function addAlerts(newAlerts: WazuhAlert[]): WazuhAlert[] {
  if (newAlerts.length === 0) return [];

  // Assign IDs to new alerts
  const alertsWithIds = newAlerts.map((alert, index) => ({
    ...alert,
    id: alerts.length + index + 1,
  }));

  // Store them
  storeAlerts(alertsWithIds);

  return alertsWithIds;
}

/**
 * Get filter options from current alerts
 */
export function getFilterOptions() {
  const agents = new Set<string>();
  const ruleGroups = new Set<string>();

  for (const alert of alerts) {
    if (alert.agent?.name) agents.add(alert.agent.name);
    if (alert.rule?.groups) {
      alert.rule.groups.forEach(g => ruleGroups.add(g));
    }
  }

  return {
    agents: Array.from(agents).sort(),
    ruleGroups: Array.from(ruleGroups).sort(),
  };
}

/**
 * Filter alerts by criteria
 */
export function filterAlerts(
  severities?: string[],
  agentNames?: string[],
  groups?: string[],
  limit: number = 100
): WazuhAlert[] {
  let filtered = [...alerts];

  if (severities && severities.length > 0) {
    filtered = filtered.filter(a => {
      const severity = getSeverityLevel(a.rule.level);
      return severities.includes(severity);
    });
  }

  if (agentNames && agentNames.length > 0) {
    filtered = filtered.filter(a => agentNames.includes(a.agent?.name));
  }

  if (groups && groups.length > 0) {
    filtered = filtered.filter(a =>
      a.rule?.groups?.some(g => groups.includes(g))
    );
  }

  return filtered.slice(-limit).reverse();
}

// For testing - can be run directly
if (import.meta.main) {
  startAlertIngestion();

  console.log('Press Ctrl+C to stop');

  process.on('SIGINT', () => {
    console.log('\nShutting down...');
    process.exit(0);
  });
}
