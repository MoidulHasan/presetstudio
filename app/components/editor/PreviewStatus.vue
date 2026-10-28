<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import { COMPONENT_META } from '~/utils/theme/components'

// Only while the spotlight dims part of the preview ("In an app"): a small chip over the preview
// saying what stays bright, with the way out. Nothing otherwise; the switch is also in the View menu.
const editor = useEditorStore()
const lit = useSpotlightComponents()
const shown = computed(() => !editor.activeStage && editor.prefs.spotlight && !!lit.value?.length)
// The open component (also one without a stage, which stageLabel doesn't name), else the section.
const subject = computed(() => {
  const component = editor.prefs.section === 'components' ? editor.prefs.component : null
  return component ? COMPONENT_META[component]?.label ?? component : editor.stageLabel
})
</script>

<template>
  <div
    v-if="shown"
    class="absolute bottom-3 left-3 z-10 flex items-center gap-1 rounded-full border border-surface-200 bg-surface-0/95 py-0.5 pl-3 pr-1 text-xs text-surface-700 shadow-sm backdrop-blur dark:border-surface-700 dark:bg-surface-900/95 dark:text-surface-200"
    role="status"
  >
    <span>Highlighting what {{ subject }} changes</span>
    <Button
      label="Turn off"
      severity="secondary"
      size="small"
      text
      rounded
      class="!px-2 !py-0.5 !text-xs"
      @click="editor.prefs.spotlight = false"
    />
  </div>
</template>
