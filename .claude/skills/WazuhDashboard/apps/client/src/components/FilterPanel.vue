<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Filter, X, ChevronDown } from 'lucide-vue-next';
import type { SeverityLevel } from '../types';

const props = defineProps<{
  agents: string[];
  ruleGroups: string[];
  severityFilter?: SeverityLevel | null;
}>();

const emit = defineEmits<{
  (e: 'filter', severities: SeverityLevel[], agents: string[], groups: string[]): void;
  (e: 'clear'): void;
}>();

const selectedSeverities = ref<SeverityLevel[]>([]);
const selectedAgents = ref<string[]>([]);
const selectedGroups = ref<string[]>([]);

// Sync severity filter from stats bar badges
watch(() => props.severityFilter, (newFilter) => {
  if (newFilter === null || newFilter === undefined) {
    selectedSeverities.value = [];
  } else {
    selectedSeverities.value = [newFilter];
  }
});
const isExpanded = ref(false);

const severityOptions: { value: SeverityLevel; label: string; color: string }[] = [
  { value: 'critical', label: 'Critical (12+)', color: 'text-severity-critical' },
  { value: 'high', label: 'High (7-11)', color: 'text-severity-high' },
  { value: 'medium', label: 'Medium (3-6)', color: 'text-severity-medium' },
  { value: 'low', label: 'Low (0-2)', color: 'text-severity-low' },
];

const hasFilters = computed(() =>
  selectedSeverities.value.length > 0 ||
  selectedAgents.value.length > 0 ||
  selectedGroups.value.length > 0
);

const filterCount = computed(() =>
  selectedSeverities.value.length +
  selectedAgents.value.length +
  selectedGroups.value.length
);

const toggleSeverity = (severity: SeverityLevel) => {
  const index = selectedSeverities.value.indexOf(severity);
  if (index === -1) {
    selectedSeverities.value.push(severity);
  } else {
    selectedSeverities.value.splice(index, 1);
  }
  applyFilters();
};

const toggleAgent = (agent: string) => {
  const index = selectedAgents.value.indexOf(agent);
  if (index === -1) {
    selectedAgents.value.push(agent);
  } else {
    selectedAgents.value.splice(index, 1);
  }
  applyFilters();
};

const toggleGroup = (group: string) => {
  const index = selectedGroups.value.indexOf(group);
  if (index === -1) {
    selectedGroups.value.push(group);
  } else {
    selectedGroups.value.splice(index, 1);
  }
  applyFilters();
};

const applyFilters = () => {
  emit('filter',
    selectedSeverities.value,
    selectedAgents.value,
    selectedGroups.value
  );
};

const clearFilters = () => {
  selectedSeverities.value = [];
  selectedAgents.value = [];
  selectedGroups.value = [];
  emit('clear');
};
</script>

<template>
  <div class="border-b border-border-primary">
    <!-- Filter toggle button -->
    <button
      class="w-full flex items-center justify-between px-4 py-2 hover:bg-bg-tertiary/30 transition-colors"
      @click="isExpanded = !isExpanded"
    >
      <div class="flex items-center gap-2">
        <Filter class="w-4 h-4 text-text-secondary" />
        <span class="text-sm text-text-secondary">Filters</span>
        <span
          v-if="filterCount > 0"
          class="px-1.5 py-0.5 text-xs font-medium bg-accent-blue/20 text-accent-blue rounded"
        >
          {{ filterCount }}
        </span>
      </div>
      <ChevronDown
        class="w-4 h-4 text-text-tertiary transition-transform"
        :class="{ 'rotate-180': isExpanded }"
      />
    </button>

    <!-- Filter options (expandable) -->
    <div v-if="isExpanded" class="px-4 py-3 space-y-4 bg-bg-primary/50">
      <!-- Severity filters -->
      <div>
        <h3 class="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">Severity</h3>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="option in severityOptions"
            :key="option.value"
            class="px-2 py-1 text-xs rounded border transition-colors"
            :class="selectedSeverities.includes(option.value)
              ? 'border-accent-blue bg-accent-blue/20 text-accent-blue'
              : 'border-border-primary text-text-secondary hover:border-border-secondary'"
            @click="toggleSeverity(option.value)"
          >
            <span :class="option.color">{{ option.label }}</span>
          </button>
        </div>
      </div>

      <!-- Agent filters -->
      <div v-if="agents.length > 0">
        <h3 class="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">Agents</h3>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="agent in agents.slice(0, 10)"
            :key="agent"
            class="px-2 py-1 text-xs rounded border transition-colors"
            :class="selectedAgents.includes(agent)
              ? 'border-accent-blue bg-accent-blue/20 text-accent-blue'
              : 'border-border-primary text-text-secondary hover:border-border-secondary'"
            @click="toggleAgent(agent)"
          >
            {{ agent }}
          </button>
        </div>
      </div>

      <!-- Rule group filters -->
      <div v-if="ruleGroups.length > 0">
        <h3 class="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">Rule Groups</h3>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="group in ruleGroups.slice(0, 10)"
            :key="group"
            class="px-2 py-1 text-xs rounded border transition-colors"
            :class="selectedGroups.includes(group)
              ? 'border-accent-blue bg-accent-blue/20 text-accent-blue'
              : 'border-border-primary text-text-secondary hover:border-border-secondary'"
            @click="toggleGroup(group)"
          >
            {{ group }}
          </button>
        </div>
      </div>

      <!-- Clear button -->
      <button
        v-if="hasFilters"
        class="flex items-center gap-1 text-xs text-text-tertiary hover:text-text-secondary"
        @click="clearFilters"
      >
        <X class="w-3 h-3" />
        Clear all filters
      </button>
    </div>
  </div>
</template>
