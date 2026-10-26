<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'

// One line under the preview: what it shows for the open section and how it connects to the
// panel. "In an app" it also switches the spotlight (dimming what the section doesn't change).
const editor = useEditorStore()
const lit = useSpotlightComponents()

// Sections whose changes reach every component (nothing to single out).
const EVERYWHERE = new Set(['surface', 'text', 'shape', 'density', 'focus'])

const line = computed(() => {
  const label = editor.stageLabel
  if (editor.activeStage) return `${label}: every variant and state. Point at a control to find it here; click anything here to edit it.`
  const count = lit.value?.length ?? 0
  if (count) {
    const what = `${count} component${count === 1 ? '' : 's'}`
    return editor.prefs.spotlight ? `${label} reaches ${what}: those on this page stay lit, the rest is dimmed.` : `${label} reaches ${what}.`
  }
  if (EVERYWHERE.has(editor.prefs.section)) return `${label} reaches every component.`
  return 'Use Pick to edit anything you see.'
})
</script>

<template>
  <div
    class="flex min-h-10 shrink-0 items-center gap-3 border-t border-surface-200 bg-surface-0 px-3 py-1.5 text-xs text-surface-600 dark:border-surface-800 dark:bg-surface-900 dark:text-surface-300"
    role="status"
  >
    <i
      :class="editor.activeStage ? 'pi pi-th-large' : lit?.length ? 'pi pi-lightbulb' : 'pi pi-window-maximize'"
      class="shrink-0 text-surface-400"
      aria-hidden="true"
    />
    <span class="min-w-0 flex-1 truncate">{{ line }}</span>
    <Button
      v-if="!editor.activeStage && lit?.length"
      :label="editor.prefs.spotlight ? 'Show everything' : 'Dim the rest'"
      severity="secondary"
      size="small"
      text
      class="shrink-0 !py-1"
      @click="editor.prefs.spotlight = !editor.prefs.spotlight"
    />
  </div>
</template>
