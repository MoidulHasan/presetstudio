<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'

// Compare: while held, the preview shows the open editor without this theme's edits to it.
// Every way a press can end (release, leaving, a cancelled touch, losing focus) ends it.
const props = defineProps<{ subject: string }>()

const editor = useEditorStore()

function compare(on: boolean) {
  editor.prefs.compare = on
}
onBeforeUnmount(() => compare(false))
</script>

<template>
  <Button
    v-tooltip.bottom="`Hold to see the preset without your ${props.subject} changes`"
    label="Compare"
    icon="pi pi-clone"
    severity="secondary"
    size="small"
    outlined
    :class="editor.prefs.compare ? '!bg-surface-200 dark:!bg-surface-700' : ''"
    @pointerdown="compare(true)"
    @pointerup="compare(false)"
    @pointerleave="compare(false)"
    @pointercancel="compare(false)"
    @blur="compare(false)"
    @keydown.space.prevent="compare(true)"
    @keyup.space="compare(false)"
  />
</template>
