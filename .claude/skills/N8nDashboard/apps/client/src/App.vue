<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import {
  RefreshCw,
  Zap,
  ZapOff,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  Activity,
  Workflow
} from 'lucide-vue-next';
import type { DashboardData, Execution } from './types';

// Use external API URL if accessed via external hostname, otherwise localhost
const API_URL = window.location.hostname === 'n8n-dashboard.home.yourdomain.com'
  ? 'https://n8n-dashboard-api.home.yourdomain.com'
  : 'http://localhost:4002';
const REFRESH_INTERVAL = 30000; // 30 seconds

const data = ref<DashboardData | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const lastUpdated = ref<Date | null>(null);

let refreshTimer: ReturnType<typeof setInterval> | null = null;

const fetchData = async () => {
  try {
    error.value = null;
    const response = await fetch(`${API_URL}/dashboard`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch data');
    }
    data.value = await response.json();
    lastUpdated.value = new Date();
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to fetch data';
  } finally {
    loading.value = false;
  }
};

const refresh = () => {
  loading.value = true;
  fetchData();
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatRelativeTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

const getStatusIcon = (status: Execution['status']) => {
  switch (status) {
    case 'success': return CheckCircle;
    case 'error': return XCircle;
    case 'waiting': return Clock;
    case 'canceled': return AlertCircle;
    default: return Loader2;
  }
};

const getStatusClass = (status: Execution['status']) => {
  switch (status) {
    case 'success': return 'text-status-success';
    case 'error': return 'text-status-error';
    case 'waiting': return 'text-status-waiting';
    case 'canceled': return 'text-status-canceled';
    default: return 'text-text-tertiary';
  }
};

const successRate = computed(() => {
  if (!data.value || data.value.stats.recentExecutions === 0) return 0;
  return Math.round(
    (data.value.stats.successfulExecutions / data.value.stats.recentExecutions) * 100
  );
});

onMounted(() => {
  fetchData();
  refreshTimer = setInterval(fetchData, REFRESH_INTERVAL);
});

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
});
</script>

<template>
  <div class="min-h-screen bg-bg-primary">
    <!-- Header -->
    <header class="border-b border-border-primary bg-bg-secondary">
      <div class="max-w-7xl mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-accent-blue/20 flex items-center justify-center">
              <Workflow class="w-5 h-5 text-accent-blue" />
            </div>
            <div>
              <h1 class="text-xl font-bold text-text-primary">n8n Dashboard</h1>
              <p class="text-sm text-text-tertiary">Workflow Automation Status</p>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <span v-if="lastUpdated" class="text-xs text-text-tertiary">
              Updated {{ formatRelativeTime(lastUpdated.toISOString()) }}
            </span>
            <button
              class="btn btn-ghost flex items-center gap-2"
              :disabled="loading"
              @click="refresh"
            >
              <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
              Refresh
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-6">
      <!-- Error State -->
      <div v-if="error" class="card bg-status-error/10 border-status-error/30 mb-6">
        <div class="flex items-center gap-3">
          <AlertCircle class="w-5 h-5 text-status-error" />
          <div>
            <p class="font-medium text-status-error">Error loading dashboard</p>
            <p class="text-sm text-text-secondary">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading && !data" class="flex items-center justify-center py-20">
        <Loader2 class="w-8 h-8 text-accent-blue animate-spin" />
      </div>

      <!-- Dashboard Content -->
      <div v-if="data" class="space-y-6">
        <!-- Stats Grid -->
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div class="stat-card">
            <div class="stat-value">{{ data.stats.totalWorkflows }}</div>
            <div class="stat-label">Total Workflows</div>
          </div>
          <div class="stat-card">
            <div class="stat-value text-status-active">{{ data.stats.activeWorkflows }}</div>
            <div class="stat-label">Active</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ data.stats.recentExecutions }}</div>
            <div class="stat-label">Recent Executions</div>
          </div>
          <div class="stat-card">
            <div class="stat-value text-status-success">{{ data.stats.successfulExecutions }}</div>
            <div class="stat-label">Successful</div>
          </div>
          <div class="stat-card">
            <div class="stat-value text-status-error">{{ data.stats.failedExecutions }}</div>
            <div class="stat-label">Failed</div>
          </div>
        </div>

        <!-- Success Rate -->
        <div class="card">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-text-secondary">Success Rate</span>
            <span class="text-sm font-medium" :class="successRate >= 80 ? 'text-status-success' : successRate >= 50 ? 'text-status-waiting' : 'text-status-error'">
              {{ successRate }}%
            </span>
          </div>
          <div class="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden">
            <div
              class="h-full transition-all duration-500"
              :class="successRate >= 80 ? 'bg-status-success' : successRate >= 50 ? 'bg-status-waiting' : 'bg-status-error'"
              :style="{ width: `${successRate}%` }"
            ></div>
          </div>
        </div>

        <div class="grid md:grid-cols-2 gap-6">
          <!-- Workflows Section -->
          <div class="card">
            <h2 class="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Activity class="w-5 h-5 text-accent-blue" />
              Workflows
            </h2>
            <div class="space-y-2 max-h-96 overflow-y-auto">
              <div
                v-for="workflow in data.workflows"
                :key="workflow.id"
                class="flex items-center justify-between p-3 rounded-lg bg-bg-tertiary/30 hover:bg-bg-tertiary/50 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <component
                    :is="workflow.active ? Zap : ZapOff"
                    class="w-4 h-4"
                    :class="workflow.active ? 'text-status-active' : 'text-status-inactive'"
                  />
                  <div>
                    <p class="font-medium text-text-primary text-sm">{{ workflow.name }}</p>
                    <p class="text-xs text-text-tertiary">ID: {{ workflow.id }}</p>
                  </div>
                </div>
                <span
                  class="badge"
                  :class="workflow.active ? 'badge-active' : 'badge-inactive'"
                >
                  {{ workflow.active ? 'Active' : 'Inactive' }}
                </span>
              </div>
              <div v-if="data.workflows.length === 0" class="text-center py-8 text-text-tertiary">
                No workflows found
              </div>
            </div>
          </div>

          <!-- Executions Section -->
          <div class="card">
            <h2 class="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Clock class="w-5 h-5 text-accent-purple" />
              Recent Executions
            </h2>
            <div class="space-y-2 max-h-96 overflow-y-auto">
              <div
                v-for="execution in data.executions"
                :key="execution.id"
                class="flex items-center justify-between p-3 rounded-lg bg-bg-tertiary/30 hover:bg-bg-tertiary/50 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <component
                    :is="getStatusIcon(execution.status)"
                    class="w-4 h-4"
                    :class="getStatusClass(execution.status)"
                  />
                  <div>
                    <p class="font-medium text-text-primary text-sm">{{ execution.workflowName }}</p>
                    <p class="text-xs text-text-tertiary">{{ formatDate(execution.startedAt) }}</p>
                  </div>
                </div>
                <span
                  class="badge"
                  :class="`badge-${execution.status}`"
                >
                  {{ execution.status }}
                </span>
              </div>
              <div v-if="data.executions.length === 0" class="text-center py-8 text-text-tertiary">
                No executions yet
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="border-t border-border-primary mt-8">
      <div class="max-w-7xl mx-auto px-4 py-4">
        <p class="text-center text-xs text-text-tertiary">
          n8n Dashboard &bull; Auto-refreshes every 30 seconds &bull; CarbeneAI Homelab
        </p>
      </div>
    </footer>
  </div>
</template>
