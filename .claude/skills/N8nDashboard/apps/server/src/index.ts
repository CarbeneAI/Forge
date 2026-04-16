/**
 * N8n Dashboard Server
 * Proxies n8n API calls and serves workflow/execution data
 */

const PORT = 4002;
const N8N_API_URL = process.env.N8N_API_URL || 'https://n8n.home.yourdomain.com';
const N8N_API_KEY = process.env.N8N_API_KEY || '';

interface Workflow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  tags?: { id: string; name: string }[];
}

interface Execution {
  id: string;
  workflowId: string;
  status: 'success' | 'error' | 'waiting' | 'canceled' | 'running';
  startedAt: string;
  finishedAt?: string;
  mode: string;
  workflowName?: string;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Helper to make n8n API requests
async function n8nRequest(endpoint: string): Promise<any> {
  if (!N8N_API_KEY) {
    throw new Error('N8N_API_KEY not configured');
  }

  const response = await fetch(`${N8N_API_URL}/api/v1${endpoint}`, {
    headers: {
      'X-N8N-API-KEY': N8N_API_KEY,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`n8n API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Fetch all workflows
async function getWorkflows(): Promise<Workflow[]> {
  const data = await n8nRequest('/workflows?limit=100');
  return data.data || [];
}

// Fetch recent executions
async function getExecutions(workflowId?: string): Promise<Execution[]> {
  let endpoint = '/executions?limit=50';
  if (workflowId) {
    endpoint += `&workflowId=${workflowId}`;
  }
  const data = await n8nRequest(endpoint);
  return data.data || [];
}

// Fetch single workflow
async function getWorkflow(id: string): Promise<Workflow | null> {
  try {
    const data = await n8nRequest(`/workflows/${id}`);
    return data;
  } catch {
    return null;
  }
}

// HTTP Server
const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check
    if (path === '/health') {
      return Response.json(
        {
          status: 'ok',
          timestamp: Date.now(),
          n8nConfigured: !!N8N_API_KEY,
          n8nUrl: N8N_API_URL
        },
        { headers: corsHeaders }
      );
    }

    // Get all workflows
    if (path === '/workflows' && req.method === 'GET') {
      try {
        const workflows = await getWorkflows();
        return Response.json({ workflows }, { headers: corsHeaders });
      } catch (error) {
        return Response.json(
          { error: error instanceof Error ? error.message : 'Failed to fetch workflows' },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    // Get single workflow
    const workflowMatch = path.match(/^\/workflows\/(\d+)$/);
    if (workflowMatch && req.method === 'GET') {
      try {
        const workflow = await getWorkflow(workflowMatch[1]);
        if (!workflow) {
          return Response.json(
            { error: 'Workflow not found' },
            { status: 404, headers: corsHeaders }
          );
        }
        return Response.json({ workflow }, { headers: corsHeaders });
      } catch (error) {
        return Response.json(
          { error: error instanceof Error ? error.message : 'Failed to fetch workflow' },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    // Get executions
    if (path === '/executions' && req.method === 'GET') {
      try {
        const workflowId = url.searchParams.get('workflowId') || undefined;
        const executions = await getExecutions(workflowId);

        // Enrich with workflow names if we have them
        const workflows = await getWorkflows();
        const workflowMap = new Map(workflows.map(w => [w.id, w.name]));

        const enrichedExecutions = executions.map(exec => ({
          ...exec,
          workflowName: workflowMap.get(exec.workflowId) || 'Unknown',
        }));

        return Response.json({ executions: enrichedExecutions }, { headers: corsHeaders });
      } catch (error) {
        return Response.json(
          { error: error instanceof Error ? error.message : 'Failed to fetch executions' },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    // Combined dashboard data
    if (path === '/dashboard' && req.method === 'GET') {
      try {
        const [workflows, executions] = await Promise.all([
          getWorkflows(),
          getExecutions(),
        ]);

        // Create workflow map for enrichment
        const workflowMap = new Map(workflows.map(w => [w.id, w.name]));

        // Enrich executions
        const enrichedExecutions = executions.map(exec => ({
          ...exec,
          workflowName: workflowMap.get(exec.workflowId) || 'Unknown',
        }));

        // Calculate stats
        const stats = {
          totalWorkflows: workflows.length,
          activeWorkflows: workflows.filter(w => w.active).length,
          recentExecutions: executions.length,
          successfulExecutions: executions.filter(e => e.status === 'success').length,
          failedExecutions: executions.filter(e => e.status === 'error').length,
        };

        return Response.json(
          { workflows, executions: enrichedExecutions, stats },
          { headers: corsHeaders }
        );
      } catch (error) {
        return Response.json(
          { error: error instanceof Error ? error.message : 'Failed to fetch dashboard data' },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    // 404 for unknown routes
    return Response.json(
      { error: 'Not found' },
      { status: 404, headers: corsHeaders }
    );
  },
});

console.log(`N8n Dashboard Server running on http://localhost:${PORT}`);
console.log(`n8n API URL: ${N8N_API_URL}`);
console.log(`n8n API Key configured: ${!!N8N_API_KEY}`);
