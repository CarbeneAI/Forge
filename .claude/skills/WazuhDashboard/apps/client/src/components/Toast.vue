<script setup lang="ts">
import { useToast } from '../composables/useToast';
import { CheckCircle, XCircle } from 'lucide-vue-next';

const { toasts } = useToast();
</script>

<template>
  <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium min-w-[280px] max-w-[400px]"
        :class="{
          'bg-green-900/90 text-green-100 border border-green-700/50': toast.type === 'success',
          'bg-red-900/90 text-red-100 border border-red-700/50': toast.type === 'error',
        }"
      >
        <CheckCircle v-if="toast.type === 'success'" class="w-4 h-4 flex-shrink-0 text-green-400" />
        <XCircle v-else class="w-4 h-4 flex-shrink-0 text-red-400" />
        <span>{{ toast.message }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active {
  transition: all 0.3s ease-out;
}
.toast-leave-active {
  transition: all 0.2s ease-in;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
