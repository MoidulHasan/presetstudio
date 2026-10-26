<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import type { ColorScheme } from '~/utils/theme/types'

// For panels with separate light and dark values: which mode they edit. That's the mode the
// preview shows (its Light | Dark | Both switch); the button switches the preview, so there's
// one switch, not one per panel. With "Both", the mode chosen last is the one edited.
const editor = useEditorStore()
const scheme = computed(() => editor.prefs.colorScheme)
const other = computed<ColorScheme>(() => (scheme.value === 'light' ? 'dark' : 'light'))

function editOther() {
  editor.prefs.colorScheme = other.value
}
</script>

<template>
  <div
    class="flex items-center justify-between gap-2 rounded-lg bg-surface-100 py-1 pl-3 pr-1 text-sm dark:bg-surface-800"
    role="status"
  >
    <span class="flex min-w-0 items-center gap-2">
      <i
        :class="scheme === 'light' ? 'pi pi-sun' : 'pi pi-moon'"
        aria-hidden="true"
      />
      <span class="truncate">Editing {{ scheme }} mode</span>
    </span>
    <Button
      :label="`Edit ${other}`"
      :icon="other === 'light' ? 'pi pi-sun' : 'pi pi-moon'"
      severity="secondary"
      size="small"
      text
      class="shrink-0"
      @click="editOther"
    />
  </div>
</template>
