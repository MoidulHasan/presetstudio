<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'

definePageMeta({ layout: 'editor' })
useSeoMeta({ title: 'Editor · Preset Studio', robots: 'noindex' })

const store = useEditorStore()
const exportVisible = ref(false)

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
        <EditorPreviewToolbar />
        <div
          v-if="store.prefs.split"
          class="grid min-h-0 flex-1 grid-cols-1 gap-px bg-surface-200 xl:grid-cols-2 dark:bg-surface-800"
        >
          <div
            v-for="scheme in (['light', 'dark'] as const)"
            :key="scheme"
            class="flex min-h-0 flex-col bg-surface-0 dark:bg-surface-900"
          >
            <Button
              :icon="scheme === 'light' ? 'pi pi-sun' : 'pi pi-moon'"
              :label="scheme === 'light' ? 'Light' : 'Dark'"
              :badge="store.prefs.colorScheme === scheme ? 'editing' : undefined"
              badge-severity="secondary"
              severity="secondary"
              size="small"
              text
              class="!h-8 !justify-start !rounded-none !px-3"
              :class="store.prefs.colorScheme === scheme ? '!font-semibold' : ''"
              :aria-pressed="store.prefs.colorScheme === scheme"
              :aria-label="`Edit ${scheme} mode`"
              @click="store.prefs.colorScheme = scheme"
            />
            <div class="min-h-0 flex-1">
              <EditorPreviewFrame
                :color-scheme="scheme"
                :label="`${scheme} mode preview`"
              />
            </div>
          </div>
        </div>
        <div
          v-else
          class="min-h-0 flex-1"
        >
          <EditorPreviewFrame
            :color-scheme="store.prefs.colorScheme"
            label="Theme preview"
          />
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
