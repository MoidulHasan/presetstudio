<script setup lang="ts">
// The stage of a semantic group ('semantic-formfield' → form field stage).
defineProps<{ stage: string }>()
const emit = defineEmits<{ pick: [target: string] }>()
const pick = (target: string) => emit('pick', target)
</script>

<template>
  <PreviewStageSemanticFormField
    v-if="stage === 'semantic-formfield'"
    @pick="pick"
  />
  <PreviewStageSemanticList
    v-else-if="stage === 'semantic-list'"
    @pick="pick"
  />
  <PreviewStageSemanticNavigation
    v-else-if="stage === 'semantic-navigation'"
    @pick="pick"
  />
  <PreviewStageSemanticHighlight
    v-else-if="stage === 'semantic-highlight'"
    @pick="pick"
  />
  <PreviewStageSemanticContent
    v-else-if="stage === 'semantic-content'"
    @pick="pick"
  />
  <PreviewStageSemanticOverlay
    v-else-if="stage === 'semantic-overlay'"
    @pick="pick"
  />
  <PreviewStageSemanticText
    v-else-if="stage === 'semantic-text'"
    @pick="pick"
  />
</template>
