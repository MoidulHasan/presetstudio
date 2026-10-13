<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'

definePageMeta({ layout: 'editor' })
useSeoMeta({ title: 'Editor · Preset Studio', robots: 'noindex' })

const store = useEditorStore()
const exportVisible = ref(false)

// Below lg there's room for one pane at a time.
type Pane = 'edit' | 'preview'
const pane = ref<Pane>('edit')
const paneOptions: Array<{ value: Pane, label: string, icon: string }> = [
  { value: 'edit', label: 'Edit', icon: 'pi pi-sliders-h' },
  { value: 'preview', label: 'Preview', icon: 'pi pi-eye' },
]

// Focus rings only show on keyboard focus; while editing them, show every component focused.
let autoFocusStates = false
watch(() => store.prefs.section, (section, previous) => {
  if (section === 'focus' && !store.prefs.showFocus) {
    store.prefs.showFocus = true
    autoFocusStates = true
  }
  else if (previous === 'focus' && autoFocusStates) {
    store.prefs.showFocus = false
    autoFocusStates = false
  }
}, { immediate: true })

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

    <div class="border-b border-surface-200 px-3 py-2 lg:hidden dark:border-surface-800">
      <SelectButton
        v-model="pane"
        :options="paneOptions"
        option-label="label"
        option-value="value"
        :allow-empty="false"
        aria-label="Show editor or preview"
        size="small"
        class="w-full"
        :pt="{ pcToggleButton: { root: { class: 'flex-1' } } }"
      >
        <template #option="{ option }">
          <i
            :class="option.icon"
            aria-hidden="true"
          />
          <span>{{ option.label }}</span>
        </template>
      </SelectButton>
    </div>

    <div class="flex min-h-0 flex-1">
      <aside
        class="hidden w-56 shrink-0 overflow-y-auto border-r border-surface-200 xl:block dark:border-surface-800"
        aria-label="Sections"
      >
        <EditorSectionNav />
      </aside>

      <section
        class="min-w-0 flex-1 flex-col bg-surface-50 lg:flex dark:bg-surface-950"
        :class="pane === 'preview' ? 'flex' : 'hidden'"
        aria-label="Preview"
      >
        <EditorPreviewToolbar />
        <EditorPreviewStage />
      </section>

      <aside
        class="w-full min-w-0 shrink-0 overflow-y-auto overflow-x-hidden border-surface-200 lg:block lg:w-[22rem] lg:border-l xl:w-[24rem] dark:border-surface-800"
        :class="pane === 'edit' ? 'block' : 'hidden'"
        aria-label="Inspector"
      >
        <EditorInspector />
      </aside>

      <EditorExportPanel v-model:visible="exportVisible" />
      <Toast position="bottom-right" />
    </div>
  </div>
</template>
