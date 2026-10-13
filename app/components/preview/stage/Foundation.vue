<script setup lang="ts">
// The stage of a foundation section ('foundation-shape' → shape stage).
defineProps<{ stage: string }>()
const emit = defineEmits<{ pick: [target: string] }>()
const pick = (target: string) => emit('pick', target)
</script>

<template>
  <PreviewStageFoundationPrimary
    v-if="stage === 'foundation-primary'"
    @pick="pick"
  />
  <PreviewStageFoundationSurface v-else-if="stage === 'foundation-surface'" />
  <PreviewStageFoundationStatus
    v-else-if="stage === 'foundation-status'"
    @pick="pick"
  />
  <PreviewStageFoundationShape v-else-if="stage === 'foundation-shape'" />
  <PreviewStageFoundationDensity v-else-if="stage === 'foundation-density'" />
  <PreviewStageFoundationFocus v-else-if="stage === 'foundation-focus'" />
</template>
