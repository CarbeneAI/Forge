<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import AlertStats from './components/AlertStats.vue';
import AlertFeed from './components/AlertFeed.vue';
import ChatPanel from './components/ChatPanel.vue';
import ToastContainer from './components/Toast.vue';
import { useWebSocket } from './composables/useWebSocket';
import { usePAIChat } from './composables/usePAIChat';
import { useToast } from './composables/useToast';
import type { WazuhAlert, AlertStats as AlertStatsType, SeverityLevel, QuickPrompts } from './types';

// WebSocket connection for alerts
const { alerts, stats, isConnected, requestFilter } = useWebSocket();

// Toast notifications
const toast = useToast();

// API URL for suppress calls
function getApiUrl(): string {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:4001';
  }
  return 'https://wazuh-dashboard-api.home.carbeneai.com';
}
const API_URL = getApiUrl();

// Suppressed rule IDs - fetched on mount, updated after each suppress
const suppressedWazuhIds = ref<Set<string>>(new Set());
const suppressedSuricataIds = ref<Set<string>>(new Set());

// Fetch suppressed rules from server
async function fetchSuppressedRules() {
  try {
    const response = await fetch(`${API_URL}/alerts/suppressed`);
    const data = await response.json();
    if (data.sids) {
      const wazuh = new Set<string>();
      const suricata = new Set<string>();
      for (const entry of data.sids) {
        if (entry.type === 'suricata') {
          suricata.add(entry.id);
        } else {
          wazuh.add(entry.id);
        }
      }
      suppressedWazuhIds.value = wazuh;
      suppressedSuricataIds.value = suricata;
    }
  } catch {
    // Silently fail - alerts just won't be filtered
  }
}

onMounted(fetchSuppressedRules);

// Dismissed individual alert IDs (client-side only, resets on refresh)
const dismissedAlertIds = ref<Set<number>>(new Set());

// Filter out suppressed and dismissed alerts
const visibleAlerts = computed(() => {
  return alerts.value.filter(a => {
    // Check individually dismissed
    if (a.id !== undefined && dismissedAlertIds.value.has(a.id)) return false;
    // Check Wazuh rule ID suppression
    if (suppressedWazuhIds.value.has(a.rule.id)) return false;
    // Check Suricata SID suppression
    const sid = a.data?.alert?.signature_id;
    if (sid && suppressedSuricataIds.value.has(String(sid))) return false;
    return true;
  });
});

// Count of alerts hidden by suppression rules (not including dismissed)
const suppressedCount = computed(() => {
  let count = 0;
  for (const a of alerts.value) {
    if (a.id !== undefined && dismissedAlertIds.value.has(a.id)) continue;
    if (suppressedWazuhIds.value.has(a.rule.id)) { count++; continue; }
    const sid = a.data?.alert?.signature_id;
    if (sid && suppressedSuricataIds.value.has(String(sid))) { count++; }
  }
  return count;
});

// Count of individually dismissed alerts
const dismissedCount = computed(() => dismissedAlertIds.value.size);

// Recompute stats from visible alerts so counts match the filtered feed
const visibleStats = computed<AlertStatsType>(() => {
  const s: AlertStatsType = { total: 0, critical: 0, high: 0, medium: 0, low: 0 };
  for (const a of visibleAlerts.value) {
    s.total++;
    const level = a.rule.level;
    if (level >= 12) s.critical++;
    else if (level >= 7) s.high++;
    else if (level >= 3) s.medium++;
    else s.low++;
  }
  return s;
});

// PAI chat
const {
  messages,
  isLoading,
  error,
  quickPrompts,
  sendMessage,
  quickAction,
  clearChat
} = usePAIChat();

// Selected alert for context
const selectedAlert = ref<WazuhAlert | null>(null);

// Severity filter from stats bar (single-select toggle)
const activeSeverityFilter = ref<SeverityLevel | null>(null);

// Resizable panel - left panel width percentage (30-80%)
const leftPanelPercent = ref(60);
const isResizing = ref(false);

const leftPanelStyle = computed(() => ({ width: `${leftPanelPercent.value}%` }));
const rightPanelStyle = computed(() => ({ width: `${100 - leftPanelPercent.value}%` }));

const startResize = (e: MouseEvent) => {
  isResizing.value = true;
  const container = (e.target as HTMLElement).parentElement!;

  const onMouseMove = (moveEvent: MouseEvent) => {
    const rect = container.getBoundingClientRect();
    const percent = ((moveEvent.clientX - rect.left) / rect.width) * 100;
    leftPanelPercent.value = Math.min(80, Math.max(30, percent));
  };

  const onMouseUp = () => {
    isResizing.value = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
};

// Computed selected alerts array (for chat context)
const selectedAlerts = computed(() =>
  selectedAlert.value ? [selectedAlert.value] : []
);

// Handle alert selection
const handleSelectAlert = (alert: WazuhAlert) => {
  selectedAlert.value = alert;
};

// Handle severity toggle from stats bar badges
const handleToggleSeverity = (severity: SeverityLevel) => {
  if (activeSeverityFilter.value === severity) {
    // Same badge clicked again — clear filter
    activeSeverityFilter.value = null;
  } else {
    activeSeverityFilter.value = severity;
  }
};

// Handle filter change from filter panel
const handleFilter = (severities: SeverityLevel[], agents: string[], groups: string[]) => {
  // Sync: if filter panel changes severity, clear the stats bar toggle
  if (severities.length !== 1 || severities[0] !== activeSeverityFilter.value) {
    activeSeverityFilter.value = severities.length === 1 ? severities[0] : null;
  }
  requestFilter(severities, agents, groups);
};

// Handle chat send
const handleSendMessage = (message: string) => {
  sendMessage(message, selectedAlerts.value);
};

// Handle quick action
const handleQuickAction = (action: keyof QuickPrompts) => {
  quickAction(action, selectedAlerts.value);
};

// Handle individual alert dismissal
const handleDismiss = (alert: WazuhAlert) => {
  if (alert.id !== undefined) {
    dismissedAlertIds.value = new Set([...dismissedAlertIds.value, alert.id]);
    // Clear selection if dismissed alert was selected
    if (selectedAlert.value?.id === alert.id) {
      selectedAlert.value = null;
    }
  }
};

// Handle alert suppression
const handleSuppress = async (ruleId: string, reason: string, description: string, suricataSid?: string) => {
  try {
    const response = await fetch(`${API_URL}/alerts/suppress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ruleId, reason, description, suricataSid }),
    });

    const data = await response.json();

    if (data.success) {
      const label = suricataSid ? `Suricata SID ${suricataSid}` : `Rule ${ruleId}`;
      toast.success(`${label} suppressed successfully`);
      // Immediately hide suppressed alerts from feed
      if (suricataSid) {
        suppressedSuricataIds.value = new Set([...suppressedSuricataIds.value, suricataSid]);
      } else {
        suppressedWazuhIds.value = new Set([...suppressedWazuhIds.value, ruleId]);
      }
    } else {
      toast.error(data.error || 'Failed to suppress rule');
    }
  } catch (err) {
    toast.error('Failed to connect to server');
  }
};
</script>

<template>
  <div class="h-screen flex flex-col bg-bg-primary">
    <!-- Top stats bar -->
    <AlertStats
      :stats="visibleStats"
      :is-connected="isConnected"
      :active-severity="activeSeverityFilter"
      :suppressed-count="suppressedCount"
      :dismissed-count="dismissedCount"
      @toggle-severity="handleToggleSeverity"
    />

    <!-- Main content area - split screen -->
    <div class="flex-1 flex overflow-hidden" :class="{ 'select-none': isResizing }">
      <!-- Left panel - Alert feed (resizable) -->
      <div class="overflow-hidden" :style="leftPanelStyle">
        <AlertFeed
          :alerts="visibleAlerts"
          :selected-alert="selectedAlert"
          :severity-filter="activeSeverityFilter"
          @select="handleSelectAlert"
          @filter="handleFilter"
          @suppress="handleSuppress"
          @dismiss="handleDismiss"
        />
      </div>

      <!-- Resize handle -->
      <div
        class="w-1 flex-shrink-0 bg-border-primary hover:bg-accent-blue cursor-col-resize transition-colors relative group"
        :class="{ 'bg-accent-blue': isResizing }"
        @mousedown="startResize"
      >
        <div class="absolute inset-y-0 -left-1 -right-1" />
      </div>

      <!-- Right panel - PAI Chat -->
      <div class="overflow-hidden" :style="rightPanelStyle">
        <ChatPanel
          :messages="messages"
          :is-loading="isLoading"
          :error="error"
          :quick-prompts="quickPrompts"
          :selected-alerts="selectedAlerts"
          @send="handleSendMessage"
          @quick-action="handleQuickAction"
          @clear="clearChat"
        />
      </div>
    </div>

    <!-- Toast notifications -->
    <ToastContainer />
  </div>
</template>
