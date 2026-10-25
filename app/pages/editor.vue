<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import { useWorkspaceStore } from '~/stores/workspace'
import { usePresetStore } from '~/stores/preset'
import { BASE_PRESET_LABELS } from '~/utils/theme/types'

definePageMeta({ layout: 'editor' })
useSeoMeta({ title: 'Editor · Preset Studio', robots: 'noindex' })

const editor = useEditorStore()
const workspace = useWorkspaceStore()
const preset = usePresetStore()
const exportVisible = ref(false)
const exportTab = ref('app')
function openExport(tab: 'app' | 'share') {
  exportTab.value = tab
  exportVisible.value = true
}

function reload() {
  window.location.reload()
}

// Themes are shared between tabs; say when another tab changed the open one.
const toast = useToast()
watch(() => workspace.externalChange, (change) => {
  if (!change) return
  toast.add(change.kind === 'updated'
    ? { severity: 'info', summary: 'Changed in another tab', detail: `"${change.name}" was edited in another tab. Undo to go back to the version you had.`, life: 6000 }
    : { severity: 'warn', summary: 'Deleted in another tab', detail: `"${change.name}" was deleted in another tab.`, life: 6000 })
})

// Below lg there's room for one pane at a time.
type Pane = 'edit' | 'preview'
const pane = computed<Pane>({
  get: () => editor.prefs.pane,
  set: (value) => {
    editor.prefs.pane = value
  },
})
const paneOptions: Array<{ value: Pane, label: string, icon: string }> = [
  { value: 'edit', label: 'Edit', icon: 'pi pi-sliders-h' },
  { value: 'preview', label: 'Preview', icon: 'pi pi-eye' },
]

// Below lg the panes stack: while editing, the preview stays visible as a strip above the
// controls (unless hidden), so a change is seen as it's made; Preview shows it full screen.
// From lg up these classes give way to the side-by-side layout.
const previewClass = computed(() => {
  if (pane.value === 'preview') return 'flex flex-1'
  return editor.prefs.previewStrip ? 'flex h-[38vh] shrink-0 border-b border-surface-200 dark:border-surface-800' : 'hidden'
})
const editClass = computed(() => (pane.value === 'edit' ? 'block min-h-0 flex-1' : 'hidden'))
/** The preview toolbar only in the full preview (the strip is for watching changes). */
const toolbarClass = computed(() => (pane.value === 'edit' ? 'max-lg:hidden' : ''))

// Focus rings only show on keyboard focus; while editing them, show every component focused.
let autoFocusStates = false
watch(() => editor.prefs.section, (section, previous) => {
  if (section === 'focus' && !editor.prefs.showFocus) {
    editor.prefs.showFocus = true
    autoFocusStates = true
  }
  else if (previous === 'focus' && autoFocusStates) {
    editor.prefs.showFocus = false
    autoFocusStates = false
  }
}, { immediate: true })

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  return !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))
}

// Undo: Cmd/Ctrl+Z. Redo: Shift+Cmd/Ctrl+Z or Ctrl+Y. Text fields keep their native undo.
// Search (Cmd/Ctrl+K) is the top bar's.
function onKeydown(event: KeyboardEvent) {
  // Escape stops Pick (also pressed in the preview, which passes it on).
  if (event.key === 'Escape' && editor.prefs.inspect) {
    editor.prefs.inspect = false
    return
  }
  if (!(event.metaKey || event.ctrlKey) || isTyping(event.target)) return
  const key = event.key.toLowerCase()
  if (key === 'z' && !event.shiftKey) {
    event.preventDefault()
    workspace.undo()
  }
  else if ((key === 'z' && event.shiftKey) || key === 'y') {
    event.preventDefault()
    workspace.redo()
  }
}

// The editor's own light/dark mode. The preview iframe has its own document, so it's unaffected.
const systemDark = ref(false)
let media: MediaQueryList | undefined
const onMediaChange = (event: MediaQueryListEvent) => (systemDark.value = event.matches)
const uiDark = computed(() => editor.prefs.uiTheme === 'dark' || (editor.prefs.uiTheme === 'system' && systemDark.value))
watch(uiDark, dark => document.documentElement.classList.toggle('ps-dark', dark))

onMounted(() => {
  // First visit: a guided setup instead of the full editor.
  if (!editor.prefs.setupDone && preset.pristine && workspace.state.themes.length === 1) editor.openSetup()
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
    <EditorTopBar @export="openExport" />

    <Message
      v-if="preset.basePresetError"
      severity="error"
      class="m-3"
    >
      <div class="flex flex-wrap items-center justify-between gap-3">
        <span>The {{ BASE_PRESET_LABELS[preset.basePresetError] }} preset couldn't be loaded. Your work is saved; reloading usually fixes this.</span>
        <Button
          label="Reload"
          icon="pi pi-refresh"
          size="small"
          severity="danger"
          @click="reload"
        />
      </div>
    </Message>

    <div class="flex items-center gap-2 border-b border-surface-200 px-3 py-2 lg:hidden dark:border-surface-800">
      <SelectButton
        v-model="pane"
        :options="paneOptions"
        option-label="label"
        option-value="value"
        :allow-empty="false"
        aria-label="Show editor or preview"
        size="small"
        class="flex-1"
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
      <Button
        v-if="pane === 'edit'"
        v-tooltip.bottom="editor.prefs.previewStrip ? 'Hide the preview above the controls' : 'Show the preview above the controls'"
        :icon="editor.prefs.previewStrip ? 'pi pi-eye-slash' : 'pi pi-eye'"
        severity="secondary"
        size="small"
        text
        rounded
        :aria-label="editor.prefs.previewStrip ? 'Hide preview strip' : 'Show preview strip'"
        :aria-pressed="editor.prefs.previewStrip"
        @click="editor.prefs.previewStrip = !editor.prefs.previewStrip"
      />
    </div>

    <div class="flex min-h-0 flex-1 flex-col lg:flex-row">
      <!-- First-run setup (either layout): the setup panel, with the sample app beside it. -->
      <template v-if="editor.setupOpen">
        <aside
          class="ps-pane-scroll w-full min-w-0 shrink-0 overflow-y-auto overflow-x-hidden border-surface-200 lg:block lg:flex-none lg:w-[26rem] lg:border-r xl:w-[28rem] dark:border-surface-800"
          :class="editClass"
          aria-label="Set up your theme"
        >
          <EditorSetup />
        </aside>
        <section
          class="order-first min-w-0 flex-col bg-surface-50 lg:order-none lg:flex lg:h-auto lg:flex-1 lg:border-b-0 dark:bg-surface-950"
          :class="previewClass"
          aria-label="Preview"
        >
          <EditorPreviewStage />
        </section>
      </template>

      <!-- Two panes: destination rail and one panel on the left, the preview takes the rest. -->
      <template v-else-if="editor.prefs.layout === 'panels'">
        <aside
          class="ps-pane-scroll hidden w-[5.75rem] shrink-0 overflow-y-auto border-r border-surface-200 lg:block dark:border-surface-800"
          aria-label="Destinations"
        >
          <EditorDestinationNav />
        </aside>
        <aside
          class="ps-pane-scroll w-full min-w-0 shrink-0 overflow-y-auto overflow-x-hidden border-surface-200 lg:block lg:flex-none lg:w-[24rem] lg:border-r xl:w-[26rem] dark:border-surface-800"
          :class="editClass"
          aria-label="Inspector"
        >
          <EditorDestinationNav
            orientation="horizontal"
            class="border-b border-surface-200 lg:!hidden dark:border-surface-800"
          />
          <EditorInspector>
            <template #nav>
              <EditorSectionTabs />
            </template>
          </EditorInspector>
        </aside>
        <section
          class="order-first min-w-0 flex-col bg-surface-50 lg:order-none lg:flex lg:h-auto lg:flex-1 lg:border-b-0 dark:bg-surface-950"
          :class="previewClass"
          aria-label="Preview"
        >
          <EditorPreviewToolbar :class="toolbarClass" />
          <EditorPreviewStage />
        </section>
      </template>

      <!-- Classic: section nav · preview · inspector. -->
      <template v-else>
        <aside
          class="ps-pane-scroll hidden w-56 shrink-0 overflow-y-auto border-r border-surface-200 xl:block dark:border-surface-800"
          aria-label="Sections"
        >
          <EditorSectionNav />
        </aside>

        <section
          class="order-first min-w-0 flex-col bg-surface-50 lg:order-none lg:flex lg:h-auto lg:flex-1 lg:border-b-0 dark:bg-surface-950"
          :class="previewClass"
          aria-label="Preview"
        >
          <EditorPreviewToolbar :class="toolbarClass" />
          <EditorPreviewStage />
        </section>

        <aside
          class="ps-pane-scroll w-full min-w-0 shrink-0 overflow-y-auto overflow-x-hidden border-surface-200 lg:block lg:flex-none lg:w-[22rem] lg:border-l xl:w-[24rem] dark:border-surface-800"
          :class="editClass"
          aria-label="Inspector"
        >
          <EditorInspector />
        </aside>
      </template>

      <EditorExportPanel
        v-model:visible="exportVisible"
        v-model:tab="exportTab"
      />
      <EditorSharedThemeDialog />
      <Toast position="bottom-right" />
    </div>
  </div>
</template>
