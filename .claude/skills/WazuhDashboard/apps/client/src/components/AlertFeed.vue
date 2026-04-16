<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ShieldOff } from 'lucide-vue-next';
import AlertRow from './AlertRow.vue';
import FilterPanel from './FilterPanel.vue';
import type { WazuhAlert, SeverityLevel } from '../types';

const props = defineProps<{
  alerts: WazuhAlert[];
  selectedAlert: WazuhAlert | null;
  severityFilter: SeverityLevel | null;
}>();

const emit = defineEmits<{
  (e: 'select', alert: WazuhAlert): void;
  (e: 'filter', severities: SeverityLevel[], agents: string[], groups: string[]): void;
  (e: 'suppress', ruleId: string, reason: string, description: string, suricataSid?: string): void;
  (e: 'dismiss', alert: WazuhAlert): void;
}>();

// Extract filter options from alerts
const agents = computed(() => {
  const agentSet = new Set<string>();
  props.alerts.forEach(a => {
    if (a.agent?.name) agentSet.add(a.agent.name);
  });
  return Array.from(agentSet).sort();
});

const ruleGroups = computed(() => {
  const groupSet = new Set<string>();
  props.alerts.forEach(a => {
    a.rule.groups?.forEach(g => groupSet.add(g));
  });
  return Array.from(groupSet).sort();
});

// Filter state
const activeSeverities = ref<SeverityLevel[]>([]);
const activeAgents = ref<string[]>([]);
const activeGroups = ref<string[]>([]);

// Sync severity filter from stats bar badges
watch(() => props.severityFilter, (newFilter) => {
  if (newFilter === null) {
    activeSeverities.value = [];
  } else {
    activeSeverities.value = [newFilter];
  }
});

// Filtered alerts
const filteredAlerts = computed(() => {
  let filtered = props.alerts;

  if (activeSeverities.value.length > 0) {
    filtered = filtered.filter(a => {
      const level = a.rule.level;
      if (level >= 12) return activeSeverities.value.includes('critical');
      if (level >= 7) return activeSeverities.value.includes('high');
      if (level >= 3) return activeSeverities.value.includes('medium');
      return activeSeverities.value.includes('low');
    });
  }

  if (activeAgents.value.length > 0) {
    filtered = filtered.filter(a => activeAgents.value.includes(a.agent?.name));
  }

  if (activeGroups.value.length > 0) {
    filtered = filtered.filter(a =>
      a.rule.groups?.some(g => activeGroups.value.includes(g))
    );
  }

  return filtered;
});

const handleFilter = (severities: SeverityLevel[], agents: string[], groups: string[]) => {
  activeSeverities.value = severities;
  activeAgents.value = agents;
  activeGroups.value = groups;
  emit('filter', severities, agents, groups);
};

const handleClearFilters = () => {
  activeSeverities.value = [];
  activeAgents.value = [];
  activeGroups.value = [];
};
</script>

<template>
  <div class="h-full flex flex-col bg-bg-secondary">
    <!-- Filter panel -->
    <FilterPanel
      :agents="agents"
      :rule-groups="ruleGroups"
      :severity-filter="severityFilter"
      @filter="handleFilter"
      @clear="handleClearFilters"
    />

    <!-- Alert list -->
    <div class="flex-1 overflow-y-auto">
      <template v-if="filteredAlerts.length > 0">
        <AlertRow
          v-for="alert in filteredAlerts"
          :key="alert.id"
          :alert="alert"
          :is-selected="selectedAlert?.id === alert.id"
          @select="emit('select', $event)"
          @suppress="(ruleId: string, reason: string, description: string, suricataSid?: string) => emit('suppress', ruleId, reason, description, suricataSid)"
          @dismiss="emit('dismiss', $event)"
        />
      </template>
      <div v-else class="flex flex-col items-center justify-center h-full text-text-tertiary">
        <ShieldOff class="w-12 h-12 mb-3 opacity-50" />
        <p class="text-sm">No alerts to display</p>
        <p class="text-xs mt-1">Waiting for security events...</p>
      </div>
    </div>
  </div>
</template>
