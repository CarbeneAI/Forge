/**
 * PAI API Client
 * Sends chat messages to PAI for security alert analysis
 * Includes Wazuh Indexer search tool for Claude to query historical alerts
 */

import { homedir } from 'os';
import type { WazuhAlert, PAIChatMessage, PAIChatResponse } from './types';

// PAI API configuration
const PAI_API_URL = process.env.PAI_API_URL || 'http://localhost:3001/v1/messages';

// Wazuh Dashboard API configuration (same as alert-ingest.ts)
const WAZUH_DASHBOARD_URL = process.env.WAZUH_DASHBOARD_URL || 'https://10.0.0.60';
const WAZUH_DASHBOARD_USER = process.env.WAZUH_DASHBOARD_USER || 'admin';
const WAZUH_DASHBOARD_PASSWORD = process.env.WAZUH_DASHBOARD_PASSWORD || '';

// Tool definition for Anthropic API
const SEARCH_TOOL = {
  name: 'search_wazuh_alerts',
  description: 'Search Wazuh Indexer for security alerts by IP, rule, severity, time range, or keyword. Use this to find historical alerts, correlate events across time, or investigate specific IPs/rules.',
  input_schema: {
    type: 'object' as const,
    properties: {
      query: { type: 'string', description: 'Free text search across rule descriptions and logs' },
      src_ip: { type: 'string', description: 'Source IP address to filter by' },
      dest_ip: { type: 'string', description: 'Destination IP address to filter by' },
      rule_id: { type: 'string', description: 'Wazuh rule ID or Suricata SID' },
      severity_min: { type: 'number', description: 'Minimum rule level (0-15)' },
      time_range: { type: 'string', description: 'Time range: 1h, 6h, 12h, 24h, 3d, 7d, 30d' },
      limit: { type: 'number', description: 'Max results (default 20, max 100)' },
    },
  },
};

const MAX_TOOL_CALLS = 3;

/**
 * Load API key from environment file
 */
async function getApiKey(): Promise<string> {
  // First check environment variable
  if (process.env.WAZUH_PAI_API_KEY) {
    return process.env.WAZUH_PAI_API_KEY;
  }

  // Fall back to loading from .env file
  const envPath = `${homedir()}/.claude/.env`;

  try {
    const envFile = await Bun.file(envPath).text();
    const match = envFile.match(/(?:ANTHROPIC_API_KEY|WAZUH_PAI_API_KEY)=(.+)/);
    if (match) {
      return match[1].trim();
    }
  } catch (err) {
    console.error('Failed to read API key from .env:', err);
  }

  throw new Error('No API key found - set WAZUH_PAI_API_KEY or ANTHROPIC_API_KEY');
}

/**
 * Format alerts as context for PAI
 */
function formatAlertContext(alerts: WazuhAlert[]): string {
  if (!alerts || alerts.length === 0) {
    return '';
  }

  const lines = ['## Selected Security Alerts\n'];

  for (const alert of alerts) {
    lines.push(`### Alert: ${alert.rule.description}`);
    lines.push(`- **Severity**: Level ${alert.rule.level} (${getSeverityLabel(alert.rule.level)})`);
    lines.push(`- **Rule ID**: ${alert.rule.id}`);
    lines.push(`- **Agent**: ${alert.agent?.name || 'Unknown'} (${alert.agent?.ip || 'N/A'})`);
    lines.push(`- **Timestamp**: ${alert.timestamp}`);

    if (alert.rule.mitre) {
      lines.push(`- **MITRE ATT&CK**: ${alert.rule.mitre.id?.join(', ') || 'N/A'}`);
      if (alert.rule.mitre.tactic?.length) {
        lines.push(`  - Tactics: ${alert.rule.mitre.tactic.join(', ')}`);
      }
      if (alert.rule.mitre.technique?.length) {
        lines.push(`  - Techniques: ${alert.rule.mitre.technique.join(', ')}`);
      }
    }

    if (alert.srcip) lines.push(`- **Source IP**: ${alert.srcip}`);
    if (alert.srcuser) lines.push(`- **Source User**: ${alert.srcuser}`);
    if (alert.dstip) lines.push(`- **Destination IP**: ${alert.dstip}`);
    if (alert.dstport) lines.push(`- **Destination Port**: ${alert.dstport}`);

    // Include Suricata signature ID if present
    if (alert.data?.alert?.signature_id) {
      lines.push(`- **Suricata SID**: ${alert.data.alert.signature_id}`);
    }

    if (alert.full_log) {
      lines.push(`- **Log**: \`${alert.full_log.slice(0, 200)}${alert.full_log.length > 200 ? '...' : ''}\``);
    }

    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Get severity label from level
 */
function getSeverityLabel(level: number): string {
  if (level >= 12) return 'CRITICAL';
  if (level >= 7) return 'HIGH';
  if (level >= 3) return 'MEDIUM';
  return 'LOW';
}

/**
 * Parse time range string to milliseconds offset from now
 */
function parseTimeRange(timeRange: string): number {
  const match = timeRange.match(/^(\d+)(h|d)$/);
  if (!match) return 24 * 60 * 60 * 1000; // default 24h

  const value = parseInt(match[1]);
  const unit = match[2];

  if (unit === 'h') return value * 60 * 60 * 1000;
  if (unit === 'd') return value * 24 * 60 * 60 * 1000;
  return 24 * 60 * 60 * 1000;
}

/**
 * Search Wazuh Indexer for alerts matching the given parameters
 */
export async function searchWazuhAlerts(params: {
  query?: string;
  src_ip?: string;
  dest_ip?: string;
  rule_id?: string;
  severity_min?: number;
  time_range?: string;
  limit?: number;
}): Promise<{ results: any[]; total: number; error?: string }> {
  try {
    const limit = Math.min(params.limit || 20, 100);

    // Build OpenSearch query DSL
    const must: any[] = [];
    const filter: any[] = [];

    // Free text search across descriptions and logs
    if (params.query) {
      must.push({
        multi_match: {
          query: params.query,
          fields: ['rule.description', 'full_log', 'data.alert.signature'],
          type: 'best_fields',
          fuzziness: 'AUTO',
        },
      });
    }

    // IP filters
    if (params.src_ip) {
      filter.push({
        bool: {
          should: [
            { term: { 'data.src_ip': params.src_ip } },
            { term: { srcip: params.src_ip } },
          ],
        },
      });
    }

    if (params.dest_ip) {
      filter.push({
        bool: {
          should: [
            { term: { 'data.dest_ip': params.dest_ip } },
            { term: { dstip: params.dest_ip } },
          ],
        },
      });
    }

    // Rule ID filter
    if (params.rule_id) {
      filter.push({
        bool: {
          should: [
            { term: { 'rule.id': params.rule_id } },
            { term: { 'data.alert.signature_id': params.rule_id } },
          ],
        },
      });
    }

    // Severity filter
    if (params.severity_min !== undefined) {
      filter.push({
        range: { 'rule.level': { gte: params.severity_min } },
      });
    }

    // Time range filter
    const timeRangeMs = parseTimeRange(params.time_range || '24h');
    const fromTime = new Date(Date.now() - timeRangeMs).toISOString();
    filter.push({
      range: { timestamp: { gte: fromTime } },
    });

    const query: any = {
      size: limit,
      sort: [{ timestamp: { order: 'desc' } }],
      query: {
        bool: {
          must: must.length > 0 ? must : [{ match_all: {} }],
          filter,
        },
      },
    };

    // Use Dashboard API proxy (same pattern as alert-ingest.ts)
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
      const errorText = await response.text();
      console.error(`Wazuh search failed: ${response.status}`, errorText);
      return { results: [], total: 0, error: `Indexer query failed: ${response.status}` };
    }

    const data = await response.json() as any;
    const hits = data.hits?.hits || [];
    const total = data.hits?.total?.value || hits.length;

    const results = hits.map((hit: any) => {
      const src = hit._source;
      return {
        timestamp: src.timestamp,
        rule_id: src.rule?.id,
        rule_level: src.rule?.level,
        rule_description: src.rule?.description,
        agent_name: src.agent?.name,
        src_ip: src.data?.src_ip || src.srcip,
        dest_ip: src.data?.dest_ip || src.dstip,
        dest_port: src.data?.dest_port || src.dstport,
        protocol: src.data?.proto || src.protocol,
        suricata_sid: src.data?.alert?.signature_id,
        suricata_signature: src.data?.alert?.signature,
        mitre_ids: src.rule?.mitre?.id,
        full_log: src.full_log?.slice(0, 300),
      };
    });

    return { results, total };
  } catch (error) {
    console.error('Wazuh search error:', error);
    return {
      results: [],
      total: 0,
      error: error instanceof Error ? error.message : 'Search failed',
    };
  }
}

/**
 * Format search results as text for Claude tool_result
 */
function formatSearchResults(searchResult: { results: any[]; total: number; error?: string }): string {
  if (searchResult.error) {
    return `Search error: ${searchResult.error}`;
  }

  if (searchResult.results.length === 0) {
    return 'No alerts found matching the search criteria.';
  }

  const lines = [`Found ${searchResult.total} total alerts (showing ${searchResult.results.length}):\n`];

  for (const r of searchResult.results) {
    lines.push(`- [${r.timestamp}] Level ${r.rule_level} | Rule ${r.rule_id}${r.suricata_sid ? ` (SID ${r.suricata_sid})` : ''}`);
    lines.push(`  ${r.rule_description}`);
    if (r.src_ip) lines.push(`  Src: ${r.src_ip} → Dst: ${r.dest_ip || 'N/A'}:${r.dest_port || 'N/A'}`);
    if (r.agent_name) lines.push(`  Agent: ${r.agent_name}`);
    if (r.mitre_ids?.length) lines.push(`  MITRE: ${r.mitre_ids.join(', ')}`);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Send a chat message to PAI with optional alert context
 * Supports tool use loop for Wazuh Indexer search
 */
export async function sendChatMessage(
  userMessage: string,
  chatHistory: PAIChatMessage[],
  alertContext?: WazuhAlert[],
  sessionId: string = 'wazuh-dashboard'
): Promise<PAIChatResponse> {
  try {
    const apiKey = await getApiKey();

    // Build system prompt with security context
    const systemPrompt = `You are a security analyst assistant helping analyze Wazuh SIEM alerts.
You have expertise in:
- Threat detection and incident response
- MITRE ATT&CK framework
- Network security and log analysis
- Compliance frameworks (PCI DSS, HIPAA, GDPR, NIST)
- Remediation recommendations

When analyzing alerts:
1. Explain what the alert means in plain language
2. Assess the potential impact and risk
3. Provide actionable remediation steps
4. Identify related indicators of compromise (IOCs)
5. Suggest relevant MITRE ATT&CK techniques

You have a search tool to query the Wazuh Indexer for historical alerts. Use it when you need to:
- Find related alerts from the same IP address
- Look up alert frequency or patterns over time
- Correlate events across different time periods
- Investigate whether an IP or rule has been seen before

Be concise but thorough. If multiple alerts are provided, look for patterns or correlations.

${alertContext ? formatAlertContext(alertContext) : ''}`;

    // Build messages array - must handle tool_use history correctly
    const messages: any[] = [
      ...chatHistory.map(m => ({
        role: m.role,
        content: m.content,
      })),
      { role: 'user', content: userMessage },
    ];

    // Tool use loop - max MAX_TOOL_CALLS iterations
    let toolCallCount = 0;

    while (toolCallCount <= MAX_TOOL_CALLS) {
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
          tools: [SEARCH_TOOL],
          messages,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('PAI API error:', response.status, error);
        return {
          success: false,
          error: `API error: ${response.status}`,
        };
      }

      const data = await response.json() as any;

      // Check if Claude wants to use a tool
      if (data.stop_reason === 'tool_use') {
        toolCallCount++;

        // Extract tool use blocks
        const toolUseBlocks = (data.content as any[]).filter((block: any) => block.type === 'tool_use');
        const toolResults: any[] = [];

        for (const toolUse of toolUseBlocks) {
          if (toolUse.name === 'search_wazuh_alerts') {
            console.log(`[PAI Chat] Tool call #${toolCallCount}: search_wazuh_alerts`, toolUse.input);
            const searchResult = await searchWazuhAlerts(toolUse.input);
            const resultText = formatSearchResults(searchResult);

            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: resultText,
            });
          }
        }

        // Add assistant response and tool results to messages
        messages.push({ role: 'assistant', content: data.content });
        messages.push({ role: 'user', content: toolResults });

        // Continue the loop to get Claude's final response
        continue;
      }

      // No tool use - extract final text response
      const textBlocks = (data.content as any[]).filter((block: any) => block.type === 'text');
      const content = textBlocks.map((block: any) => block.text).join('\n');

      return {
        success: true,
        content,
      };
    }

    // Hit max tool calls - return what we have
    return {
      success: true,
      content: 'I performed multiple searches but reached the analysis limit. Please refine your question for more targeted results.',
    };
  } catch (error) {
    console.error('Error calling PAI:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Quick analysis prompts
 */
export const QUICK_PROMPTS = {
  analyze: 'Analyze this security alert. Search the Wazuh Indexer for historical alerts from the same source IP and rule ID over the last 7 days to understand frequency and patterns. Then explain what the alert means, how serious it is, and whether the historical context changes your assessment.',
  remediation: 'What are the recommended remediation steps for this alert?',
  related: 'What other types of attacks or alerts might be related to this? What should I look for?',
  ioc: 'What are the key indicators of compromise (IOCs) from this alert that I should add to my blocklist or monitoring?',
  mitre: 'Map this alert to the MITRE ATT&CK framework. What tactics and techniques are involved?',
};
