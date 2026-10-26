<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'

// Only while the spotlight dims part of the preview ("In an app"): a small chip over the preview
// saying why, with the way out. Nothing otherwise; the switch is also in the View menu.
const editor = useEditorStore()
const lit = useSpotlightComponents()
const shown = computed(() => !editor.activeStage && editor.prefs.spotlight && !!lit.value?.length)
</script>

<template>
  <div
    v-if="shown"
    class="absolute bottom-3 left-3 z-10 flex items-center gap-1 rounded-full border border-surface-200 bg-surface-0/95 py-0.5 pl-3 pr-1 text-xs text-surface-700 shadow-sm backdrop-blur dark:border-surface-700 dark:bg-surface-900/95 dark:text-surface-200"
    role="status"
  >
    <span>Dimmed: what {{ editor.stageLabel }} doesn't change</span>
    <Button
      label="Show all"
      severity="secondary"
      size="small"
      text
      rounded
      class="!px-2 !py-0.5 !text-xs"
      @click="editor.prefs.spotlight = false"
    />
  </div>
</template>
