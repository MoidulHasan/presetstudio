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

// The editor's own light/dark mode. The preview iframe has its own document, so it's unaffected.
const systemDark = ref(false)
let media: MediaQueryList | undefined
const onMediaChange = (event: MediaQueryListEvent) => (systemDark.value = event.matches)
const uiDark = computed(() => store.prefs.uiTheme === 'dark' || (store.prefs.uiTheme === 'system' && systemDark.value))
watch(uiDark, dark => document.documentElement.classList.toggle('ps-dark', dark))

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  media = window.matchMedia('(prefers-color-scheme: dark)')
  systemDark.value = media.matches
  media.addEventListener('change', onMediaChange)
  document.documentElement.classList.toggle('ps-dark', uiDark.value)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  media?.removeEventListener('change', onMediaChange)
  document.documentElement.classList.remove('ps-dark')
})
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
        <EditorPreviewStage />
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
