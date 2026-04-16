import { ref, onMounted, onUnmounted } from 'vue';
import type { WazuhAlert, AlertStats, WebSocketMessage } from '../types';

function getWsUrl(): string {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'ws://localhost:4001/stream';
  }
  return 'wss://wazuh-dashboard-api.home.yourdomain.com/stream';
}

const WS_URL = getWsUrl();

export function useWebSocket() {
  const alerts = ref<WazuhAlert[]>([]);
  const stats = ref<AlertStats>({ total: 0, critical: 0, high: 0, medium: 0, low: 0 });
  const isConnected = ref(false);
  const error = ref<string | null>(null);

  let ws: WebSocket | null = null;
  let reconnectTimeout: number | null = null;
  let pingInterval: number | null = null;

  const maxAlerts = 200;

  const connect = () => {
    try {
      ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log('WebSocket connected');
        isConnected.value = true;
        error.value = null;

        // Start ping interval to keep connection alive
        pingInterval = window.setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          if (message.type === 'initial') {
            const initialAlerts = Array.isArray(message.data) ? message.data : [];
            alerts.value = initialAlerts.slice(-maxAlerts) as WazuhAlert[];
          } else if (message.type === 'alert') {
            const newAlert = message.data as WazuhAlert;
            alerts.value.unshift(newAlert);

            // Keep only recent alerts
            if (alerts.value.length > maxAlerts) {
              alerts.value = alerts.value.slice(0, maxAlerts);
            }
          } else if (message.type === 'stats') {
            stats.value = message.data as AlertStats;
          } else if (message.type === 'filtered') {
            alerts.value = (message.data as WazuhAlert[]).slice(-maxAlerts);
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        error.value = 'Connection error';
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        isConnected.value = false;

        if (pingInterval) {
          clearInterval(pingInterval);
          pingInterval = null;
        }

        // Attempt to reconnect after 3 seconds
        reconnectTimeout = window.setTimeout(() => {
          console.log('Attempting to reconnect...');
          connect();
        }, 3000);
      };
    } catch (err) {
      console.error('Failed to connect:', err);
      error.value = 'Failed to connect to server';
    }
  };

  const disconnect = () => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }

    if (pingInterval) {
      clearInterval(pingInterval);
      pingInterval = null;
    }

    if (ws) {
      ws.close();
      ws = null;
    }
  };

  const requestFilter = (severities?: string[], agents?: string[], groups?: string[]) => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'filter',
        severities,
        agents,
        groups,
        limit: maxAlerts,
      }));
    }
  };

  const clearAlerts = () => {
    alerts.value = [];
  };

  onMounted(() => {
    connect();
  });

  onUnmounted(() => {
    disconnect();
  });

  return {
    alerts,
    stats,
    isConnected,
    error,
    requestFilter,
    clearAlerts,
  };
}
