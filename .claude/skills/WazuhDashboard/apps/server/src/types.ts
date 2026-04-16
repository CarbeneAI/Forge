/**
 * Wazuh Alert Types
 * Based on Wazuh alert JSON format
 */

export interface WazuhAlert {
  id?: number;                    // Auto-incrementing ID for UI
  timestamp: string;              // ISO timestamp
  rule: {
    level: number;                // 0-15 severity
    description: string;          // Human-readable description
    id: string;                   // Rule ID
    mitre?: {
      id: string[];               // MITRE ATT&CK IDs
      tactic: string[];           // MITRE tactics
      technique: string[];        // MITRE techniques
    };
    groups?: string[];            // Rule groups
    pci_dss?: string[];          // PCI DSS compliance tags
    gdpr?: string[];             // GDPR compliance tags
    hipaa?: string[];            // HIPAA compliance tags
    nist_800_53?: string[];      // NIST 800-53 compliance tags
  };
  agent: {
    id: string;                   // Agent ID
    name: string;                 // Agent hostname
    ip?: string;                  // Agent IP
  };
  manager?: {
    name: string;                 // Manager hostname
  };
  full_log?: string;              // Full log message
  data?: Record<string, any>;     // Additional data fields
  location?: string;              // Log source location
  decoder?: {
    name: string;                 // Decoder used
  };
  syscheck?: {                    // File integrity monitoring data
    path?: string;
    event?: string;
    mode?: string;
    size_after?: string;
    size_before?: string;
    md5_after?: string;
    md5_before?: string;
    sha1_after?: string;
    sha1_before?: string;
    sha256_after?: string;
    sha256_before?: string;
    uname_after?: string;
    gname_after?: string;
    mtime_after?: string;
    inode_after?: string;
  };
  srcip?: string;                 // Source IP
  srcuser?: string;               // Source user
  dstip?: string;                 // Destination IP
  dstuser?: string;               // Destination user
  dstport?: string;               // Destination port
  protocol?: string;              // Network protocol
  action?: string;                // Action taken
}

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';

export interface AlertStats {
  total: number;
  critical: number;    // Level 12+
  high: number;        // Level 7-11
  medium: number;      // Level 3-6
  low: number;         // Level 0-2
}

export interface FilterOptions {
  severity: SeverityLevel[];
  agents: string[];
  ruleGroups: string[];
}

export interface WebSocketMessage {
  type: 'initial' | 'alert' | 'stats';
  data: WazuhAlert | WazuhAlert[] | AlertStats;
}

export interface PAIChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface PAIChatRequest {
  messages: PAIChatMessage[];
  session_id: string;
  system?: string;
  alertContext?: WazuhAlert[];   // Alerts to include as context
}

export interface PAIChatResponse {
  success: boolean;
  content?: string;
  error?: string;
}

/**
 * Get severity level from Wazuh rule level
 */
export function getSeverityLevel(level: number): SeverityLevel {
  if (level >= 12) return 'critical';
  if (level >= 7) return 'high';
  if (level >= 3) return 'medium';
  return 'low';
}

/**
 * Get severity color from level
 */
export function getSeverityColor(level: number): string {
  const severity = getSeverityLevel(level);
  switch (severity) {
    case 'critical': return '#f7768e';
    case 'high': return '#e0af68';
    case 'medium': return '#bb9af7';
    case 'low': return '#9ece6a';
  }
}
