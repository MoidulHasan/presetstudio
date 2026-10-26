<script setup lang="ts">
// The stage of a semantic group ('semantic-formfield' → form field stage).
defineProps<{ stage: string }>()
</script>

<template>
  <PreviewStageSemanticFormField
    v-if="stage === 'semantic-formfield'"
  />
  <PreviewStageSemanticList
    v-else-if="stage === 'semantic-list'"
  />
  <PreviewStageSemanticNavigation
    v-else-if="stage === 'semantic-navigation'"
  />
  <PreviewStageSemanticHighlight
    v-else-if="stage === 'semantic-highlight'"
  />
  <PreviewStageSemanticContent
    v-else-if="stage === 'semantic-content'"
  />
  <PreviewStageSemanticOverlay
    v-else-if="stage === 'semantic-overlay'"
  />
  <PreviewStageSemanticText
    v-else-if="stage === 'semantic-text'"
  />
</template>
