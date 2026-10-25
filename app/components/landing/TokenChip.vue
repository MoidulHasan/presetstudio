<script setup lang="ts">
import type { ChainStep } from '~/utils/theme/specimen'

// One token in a reference chain: its value as a swatch and its name as a preset writes it.
defineProps<{ step: ChainStep }>()
</script>

<template>
  <span
    class="inline-flex min-w-0 max-w-full items-center gap-2 rounded-md border border-surface-200 bg-surface-0 py-1 pl-1.5 pr-2 font-mono text-[0.78rem] text-surface-800"
    :title="`--p-${step.name}: ${step.value}`"
  >
    <span
      class="size-4 shrink-0 rounded-sm ring-1 ring-inset ring-black/10 transition-colors duration-500 motion-reduce:transition-none"
      :style="{ backgroundColor: step.value }"
      aria-hidden="true"
    />
    <span class="truncate">{{ step.reference }}</span>
  </span>
</template>
