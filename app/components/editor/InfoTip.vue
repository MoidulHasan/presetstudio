<script setup lang="ts">
// An explanation on demand, next to a title: panels stay quiet (titles and controls), and the
// why is one hover or focus away. Screen readers get it as the button's name.
defineProps<{ text: string, subject: string }>()
</script>

<template>
  <Button
    v-tooltip.bottom="text"
    icon="pi pi-info-circle"
    severity="secondary"
    size="small"
    text
    rounded
    :aria-label="`${subject}: ${text}`"
    class="!size-6 shrink-0 !p-0 text-surface-400 [&_.p-button-icon]:!text-xs"
  />
</template>
