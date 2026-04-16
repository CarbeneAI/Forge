/**
 * Wazuh Security Dashboard Server
 * HTTP API + WebSocket server for real-time alert streaming
 */

import type { WazuhAlert } from './types';
import {
  startAlertIngestion,
  getRecentAlerts,
  getAlertStats,
  getFilterOptions,
  filterAlerts,
  addAlerts,
} from './alert-ingest';
import { sendChatMessage, searchWazuhAlerts, QUICK_PROMPTS } from './pai-client';
import { suppressSuricataRule, getSuppressedSIDs } from './suricata-suppression';

// Store WebSocket clients
const wsClients = new Set<any>();

// Start alert ingestion with WebSocket broadcast callback
startAlertIngestion((alerts) => {
  // Broadcast each alert to connected WebSocket clients
  alerts.forEach((alert) => {
    const message = JSON.stringify({ type: 'alert', data: alert });
    wsClients.forEach((client) => {
      try {
        client.send(message);
      } catch (err) {
        wsClients.delete(client);
      }
    });
  });

  // Also broadcast updated stats
  const stats = getAlertStats();
  const statsMessage = JSON.stringify({ type: 'stats', data: stats });
  wsClients.forEach((client) => {
    try {
      client.send(statsMessage);
    } catch (err) {
      wsClients.delete(client);
    }
  });
});

// Create Bun server with HTTP and WebSocket support
const server = Bun.serve({
  port: 4001,

  async fetch(req: Request) {
    const url = new URL(req.url);

    // CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    // Health check
    if (url.pathname === '/health' && req.method === 'GET') {
      return new Response(JSON.stringify({ status: 'ok', timestamp: Date.now() }), {
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // GET /alerts/recent - Get recent alerts
    if (url.pathname === '/alerts/recent' && req.method === 'GET') {
      const limit = parseInt(url.searchParams.get('limit') || '100');
      const alerts = getRecentAlerts(limit);
      return new Response(JSON.stringify(alerts), {
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // GET /alerts/stats - Get alert statistics
    if (url.pathname === '/alerts/stats' && req.method === 'GET') {
      const stats = getAlertStats();
      return new Response(JSON.stringify(stats), {
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // GET /alerts/filter-options - Get available filter options
    if (url.pathname === '/alerts/filter-options' && req.method === 'GET') {
      const options = getFilterOptions();
      return new Response(JSON.stringify(options), {
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // GET /alerts/filter - Filter alerts
    if (url.pathname === '/alerts/filter' && req.method === 'GET') {
      const severities = url.searchParams.get('severities')?.split(',').filter(Boolean);
      const agents = url.searchParams.get('agents')?.split(',').filter(Boolean);
      const groups = url.searchParams.get('groups')?.split(',').filter(Boolean);
      const limit = parseInt(url.searchParams.get('limit') || '100');

      const alerts = filterAlerts(severities, agents, groups, limit);
      return new Response(JSON.stringify(alerts), {
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // POST /alerts/ingest - Receive alerts from n8n webhook
    if (url.pathname === '/alerts/ingest' && req.method === 'POST') {
      try {
        const body = await req.json();

        // Handle both single alert and array of alerts
        const alertsToAdd = Array.isArray(body) ? body : [body];

        if (alertsToAdd.length === 0) {
          return new Response(
            JSON.stringify({ success: false, error: 'No alerts provided' }),
            { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } }
          );
        }

        const storedAlerts = addAlerts(alertsToAdd);
        console.log(`Ingested ${storedAlerts.length} alert(s) via HTTP`);

        return new Response(
          JSON.stringify({ success: true, count: storedAlerts.length }),
          { headers: { ...headers, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Ingest error:', error);
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid JSON' }),
          { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } }
        );
      }
    }

    // POST /chat - Send message to PAI
    if (url.pathname === '/chat' && req.method === 'POST') {
      try {
        const body = await req.json();
        const { message, history = [], alertContext, sessionId } = body;

        if (!message) {
          return new Response(
            JSON.stringify({ success: false, error: 'Message required' }),
            { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } }
          );
        }

        const response = await sendChatMessage(message, history, alertContext, sessionId);
        return new Response(JSON.stringify(response), {
          headers: { ...headers, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Chat error:', error);
        return new Response(
          JSON.stringify({ success: false, error: 'Internal error' }),
          { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } }
        );
      }
    }

    // GET /chat/prompts - Get quick prompt templates
    if (url.pathname === '/chat/prompts' && req.method === 'GET') {
      return new Response(JSON.stringify(QUICK_PROMPTS), {
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // POST /alerts/search - Search Wazuh Indexer
    if (url.pathname === '/alerts/search' && req.method === 'POST') {
      try {
        const body = await req.json() as Record<string, unknown>;
        const result = await searchWazuhAlerts(body as any);
        return new Response(JSON.stringify(result), {
          headers: { ...headers, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Search error:', error);
        return new Response(
          JSON.stringify({ results: [], total: 0, error: 'Invalid request' }),
          { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } }
        );
      }
    }

    // POST /alerts/suppress - Suppress an alert rule (Suricata SID or Wazuh rule)
    if (url.pathname === '/alerts/suppress' && req.method === 'POST') {
      try {
        const body = await req.json() as Record<string, unknown>;
        const ruleId = body.ruleId;
        const reason = body.reason;
        const description = body.description;
        const suricataSid = body.suricataSid;

        if (!ruleId) {
          return new Response(
            JSON.stringify({ success: false, error: 'ruleId is required' }),
            { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } }
          );
        }

        const result = await suppressSuricataRule(
          String(ruleId),
          String(reason || ''),
          String(description || ''),
          suricataSid ? String(suricataSid) : undefined,
        );
        const status = result.success ? 200 : 400;
        return new Response(JSON.stringify(result), {
          status,
          headers: { ...headers, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Suppress error:', error);
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid request' }),
          { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } }
        );
      }
    }

    // GET /alerts/suppressed - Get list of suppressed SIDs
    if (url.pathname === '/alerts/suppressed' && req.method === 'GET') {
      const result = await getSuppressedSIDs();
      return new Response(JSON.stringify(result), {
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // WebSocket upgrade
    if (url.pathname === '/stream') {
      const success = server.upgrade(req);
      if (success) {
        return undefined;
      }
    }

    // Default response
    return new Response('Wazuh Security Dashboard Server', {
      headers: { ...headers, 'Content-Type': 'text/plain' },
    });
  },

  websocket: {
    open(ws) {
      console.log('WebSocket client connected');
      wsClients.add(ws);

      // Send recent alerts on connection
      const alerts = getRecentAlerts(50);
      const stats = getAlertStats();

      ws.send(JSON.stringify({ type: 'initial', data: alerts }));
      ws.send(JSON.stringify({ type: 'stats', data: stats }));
    },

    message(ws, message) {
      // Handle ping/pong or filter requests
      try {
        const data = JSON.parse(String(message));
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        } else if (data.type === 'filter') {
          const { severities, agents, groups, limit } = data;
          const alerts = filterAlerts(severities, agents, groups, limit);
          ws.send(JSON.stringify({ type: 'filtered', data: alerts }));
        }
      } catch (err) {
        console.error('Invalid WebSocket message:', err);
      }
    },

    close(ws) {
      console.log('WebSocket client disconnected');
      wsClients.delete(ws);
    },

    error(ws, error) {
      console.error('WebSocket error:', error);
      wsClients.delete(ws);
    },
  },
});

console.log(`Wazuh Dashboard Server running on http://localhost:${server.port}`);
console.log(`WebSocket endpoint: ws://localhost:${server.port}/stream`);
console.log(`Health check: http://localhost:${server.port}/health`);
