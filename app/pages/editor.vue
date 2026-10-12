<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import type { ColorScheme } from '~/utils/theme/types'

definePageMeta({ layout: 'editor' })
useSeoMeta({ title: 'Editor · Preset Studio', robots: 'noindex' })

const store = useEditorStore()
const exportVisible = ref(false)

const schemeOptions: Array<{ value: ColorScheme, label: string, icon: string }> = [
  { value: 'light', label: 'Light', icon: 'pi pi-sun' },
  { value: 'dark', label: 'Dark', icon: 'pi pi-moon' },
]

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  return !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))
}

// Undo: Cmd/Ctrl+Z. Redo: Shift+Cmd/Ctrl+Z or Ctrl+Y. Text fields keep their native undo.
function onKeydown(event: KeyboardEvent) {
  if (!(event.metaKey || event.ctrlKey) || isTyping(event.target)) return
  const key = event.key.toLowerCase()
  if (key === 'z' && !event.shiftKey) {
    event.preventDefault()
    store.undo()
  }
  else if ((key === 'z' && event.shiftKey) || key === 'y') {
    event.preventDefault()
    store.redo()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <EditorTopBar @export="exportVisible = true" />

    <div class="flex min-h-0 flex-1 flex-col md:flex-row">
      <aside
        class="hidden w-56 shrink-0 overflow-y-auto border-r border-surface-200 lg:block dark:border-surface-800"
        aria-label="Sections"
      >
        <EditorSectionNav />
      </aside>

      <section
        class="flex min-h-[28rem] min-w-0 flex-1 flex-col bg-surface-50 dark:bg-surface-950"
        aria-label="Preview"
      >
        <div class="flex items-center justify-between gap-3 border-b border-surface-200 bg-surface-0 px-4 py-2 dark:border-surface-800 dark:bg-surface-900">
          <SelectButton
            v-model="store.prefs.colorScheme"
            :options="schemeOptions"
            option-value="value"
            :allow-empty="false"
            aria-label="Preview color scheme"
            size="small"
          >
            <template #option="{ option }">
              <i
                :class="option.icon"
                aria-hidden="true"
              />
              <span>{{ option.label }}</span>
            </template>
          </SelectButton>
          <span class="hidden text-xs text-surface-500 xl:inline">
            Preview of “{{ store.activeDoc.name }}”
          </span>
        </div>
        <div class="min-h-0 flex-1">
          <EditorPreviewFrame />
        </div>
      </section>

      <aside
        class="w-full shrink-0 overflow-y-auto border-surface-200 md:w-[24rem] md:border-l dark:border-surface-800"
        aria-label="Inspector"
      >
        <EditorInspector />
      </aside>

      <EditorExportPanel v-model:visible="exportVisible" />
      <Toast position="bottom-right" />
    </div>
  </div>
</template>
