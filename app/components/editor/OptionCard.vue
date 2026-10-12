<script setup lang="ts">
// A selectable card used for radio-style choices in the inspector.
defineProps<{ selected: boolean, label: string, hint?: string }>()
defineEmits<{ select: [] }>()
</script>

<template>
  <button
    type="button"
    role="radio"
    :aria-checked="selected"
    class="flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    :class="selected
      ? 'border-primary bg-primary-50 dark:bg-primary-950'
      : 'border-surface-200 hover:border-surface-400 dark:border-surface-700 dark:hover:border-surface-500'"
    @click="$emit('select')"
  >
    <slot name="visual" />
    <span class="flex min-w-0 flex-1 flex-col">
      <span class="font-medium">{{ label }}</span>
      <span
        v-if="hint"
        class="text-xs text-surface-500 dark:text-surface-400"
      >{{ hint }}</span>
    </span>
    <i
      v-if="selected"
      class="pi pi-check text-primary"
      aria-hidden="true"
    />
  </button>
</template>
