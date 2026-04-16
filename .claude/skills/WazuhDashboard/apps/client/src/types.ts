/**
 * Wazuh Dashboard Client Types
 */

export interface WazuhAlert {
  id?: number;
  timestamp: string;
  rule: {
    level: number;
    description: string;
    id: string;
    mitre?: {
      id: string[];
      tactic: string[];
      technique: string[];
    };
    groups?: string[];
    pci_dss?: string[];
    gdpr?: string[];
    hipaa?: string[];
    nist_800_53?: string[];
  };
  agent: {
    id: string;
    name: string;
    ip?: string;
  };
  manager?: {
    name: string;
  };
  full_log?: string;
  data?: Record<string, any>;
  location?: string;
  decoder?: {
    name: string;
  };
  syscheck?: {
    path?: string;
    event?: string;
    mode?: string;
  };
  srcip?: string;
  srcuser?: string;
  dstip?: string;
  dstuser?: string;
  dstport?: string;
  protocol?: string;
  action?: string;
}

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';

export interface AlertStats {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface FilterOptions {
  agents: string[];
  ruleGroups: string[];
}

export interface WebSocketMessage {
  type: 'initial' | 'alert' | 'stats' | 'filtered' | 'pong';
  data: WazuhAlert | WazuhAlert[] | AlertStats;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatResponse {
  success: boolean;
  content?: string;
  error?: string;
}

export interface QuickPrompts {
  analyze: string;
  remediation: string;
  related: string;
  ioc: string;
  mitre: string;
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
 * Get severity label
 */
export function getSeverityLabel(level: number): string {
  if (level >= 12) return 'Critical';
  if (level >= 7) return 'High';
  if (level >= 3) return 'Medium';
  return 'Low';
}
