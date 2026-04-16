export interface Workflow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  tags?: { id: string; name: string }[];
}

export interface Execution {
  id: string;
  workflowId: string;
  workflowName?: string;
  status: 'success' | 'error' | 'waiting' | 'canceled' | 'running';
  startedAt: string;
  finishedAt?: string;
  mode: string;
}

export interface DashboardStats {
  totalWorkflows: number;
  activeWorkflows: number;
  recentExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
}

export interface DashboardData {
  workflows: Workflow[];
  executions: Execution[];
  stats: DashboardStats;
}
