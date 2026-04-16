<script setup lang="ts">
import { ShieldAlert, ShieldCheck, AlertTriangle, Info, EyeOff, XCircle } from 'lucide-vue-next';
import type { AlertStats, SeverityLevel } from '../types';

defineProps<{
  stats: AlertStats;
  isConnected: boolean;
  activeSeverity: SeverityLevel | null;
  suppressedCount: number;
  dismissedCount: number;
}>();

const emit = defineEmits<{
  (e: 'toggle-severity', severity: SeverityLevel): void;
}>();
</script>

<template>
  <div class="flex items-center justify-between px-4 py-3 bg-bg-secondary border-b border-border-primary">
    <!-- Left: Title and connection status -->
    <div class="flex items-center gap-3">
      <h1 class="text-lg font-semibold text-text-primary">Wazuh Security Dashboard</h1>
      <div class="flex items-center gap-1.5">
        <span
          class="w-2 h-2 rounded-full"
          :class="isConnected ? 'bg-severity-low pulse' : 'bg-severity-critical'"
        ></span>
        <span class="text-xs text-text-tertiary">
          {{ isConnected ? 'Live' : 'Disconnected' }}
        </span>
      </div>
    </div>

    <!-- Right: Stats badges (clickable to filter) -->
    <div class="flex items-center gap-4">
      <!-- Critical -->
      <button
        class="flex items-center gap-1.5 px-2 py-1 rounded transition-all"
        :class="activeSeverity === 'critical'
          ? 'bg-severity-critical/20 ring-1 ring-severity-critical'
          : 'hover:bg-bg-tertiary/40 cursor-pointer'"
        @click="emit('toggle-severity', 'critical')"
      >
        <ShieldAlert class="w-4 h-4 text-severity-critical" />
        <span class="text-sm font-medium text-severity-critical">{{ stats.critical }}</span>
        <span class="text-xs text-text-tertiary">Critical</span>
      </button>

      <!-- High -->
      <button
        class="flex items-center gap-1.5 px-2 py-1 rounded transition-all"
        :class="activeSeverity === 'high'
          ? 'bg-severity-high/20 ring-1 ring-severity-high'
          : 'hover:bg-bg-tertiary/40 cursor-pointer'"
        @click="emit('toggle-severity', 'high')"
      >
        <AlertTriangle class="w-4 h-4 text-severity-high" />
        <span class="text-sm font-medium text-severity-high">{{ stats.high }}</span>
        <span class="text-xs text-text-tertiary">High</span>
      </button>

      <!-- Medium -->
      <button
        class="flex items-center gap-1.5 px-2 py-1 rounded transition-all"
        :class="activeSeverity === 'medium'
          ? 'bg-severity-medium/20 ring-1 ring-severity-medium'
          : 'hover:bg-bg-tertiary/40 cursor-pointer'"
        @click="emit('toggle-severity', 'medium')"
      >
        <Info class="w-4 h-4 text-severity-medium" />
        <span class="text-sm font-medium text-severity-medium">{{ stats.medium }}</span>
        <span class="text-xs text-text-tertiary">Medium</span>
      </button>

      <!-- Low -->
      <button
        class="flex items-center gap-1.5 px-2 py-1 rounded transition-all"
        :class="activeSeverity === 'low'
          ? 'bg-severity-low/20 ring-1 ring-severity-low'
          : 'hover:bg-bg-tertiary/40 cursor-pointer'"
        @click="emit('toggle-severity', 'low')"
      >
        <ShieldCheck class="w-4 h-4 text-severity-low" />
        <span class="text-sm font-medium text-severity-low">{{ stats.low }}</span>
        <span class="text-xs text-text-tertiary">Low</span>
      </button>

      <!-- Total (click to clear filter) -->
      <button
        class="pl-4 border-l border-border-primary transition-all"
        :class="activeSeverity === null
          ? ''
          : 'hover:bg-bg-tertiary/40 cursor-pointer rounded px-2 py-1'"
        @click="activeSeverity !== null && emit('toggle-severity', activeSeverity)"
      >
        <span class="text-sm font-medium text-text-primary">{{ stats.total }}</span>
        <span class="text-xs text-text-tertiary ml-1">{{ activeSeverity ? 'Clear' : 'Total' }}</span>
      </button>

      <!-- Suppressed count -->
      <div
        v-if="suppressedCount > 0"
        class="flex items-center gap-1.5 px-2 py-1 rounded opacity-60"
        :title="`${suppressedCount} alerts hidden by suppression rules`"
      >
        <EyeOff class="w-3.5 h-3.5 text-text-tertiary" />
        <span class="text-sm font-medium text-text-tertiary">{{ suppressedCount }}</span>
        <span class="text-xs text-text-tertiary">Suppressed</span>
      </div>

      <!-- Dismissed count -->
      <div
        v-if="dismissedCount > 0"
        class="flex items-center gap-1.5 px-2 py-1 rounded opacity-60"
        :title="`${dismissedCount} individual alerts dismissed this session`"
      >
        <XCircle class="w-3.5 h-3.5 text-text-tertiary" />
        <span class="text-sm font-medium text-text-tertiary">{{ dismissedCount }}</span>
        <span class="text-xs text-text-tertiary">Dismissed</span>
      </div>
    </div>
  </div>
</template>
