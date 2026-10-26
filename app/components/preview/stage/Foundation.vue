<script setup lang="ts">
// The stage of a foundation section ('foundation-shape' → shape stage).
defineProps<{ stage: string }>()
</script>

<template>
  <PreviewStageFoundationPrimary
    v-if="stage === 'foundation-primary'"
  />
  <PreviewStageFoundationSurface v-else-if="stage === 'foundation-surface'" />
  <PreviewStageFoundationStatus
    v-else-if="stage === 'foundation-status'"
  />
  <PreviewStageFoundationShape v-else-if="stage === 'foundation-shape'" />
  <PreviewStageFoundationDensity v-else-if="stage === 'foundation-density'" />
  <PreviewStageFoundationFocus v-else-if="stage === 'foundation-focus'" />
</template>
