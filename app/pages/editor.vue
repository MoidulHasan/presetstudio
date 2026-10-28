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
// The logo takes the open theme's primary scale.
useLogoColors(() => preset.resolvedScale('primary', 'light'))
const exportVisible = ref(false)
const exportTab = ref('app')
function openExport(tab: 'app' | 'share') {
  exportTab.value = tab
  exportVisible.value = true
}

watch(() => editor.exportRequest, (request) => {
  if (request) openExport(request.tab)
})

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
// Below lg the panes stack: while editing, the preview stays visible as a strip above the
// controls (unless hidden), so a change is seen as it's made; the strip's own buttons show it
// full screen or hide it, and the full preview has a way back.
// From lg up these classes give way to the side-by-side layout.
const previewClass = computed(() => {
  if (pane.value === 'preview') return 'flex flex-1'
  return editor.prefs.previewStrip ? 'flex h-[30vh] shrink-0 border-b border-surface-200 dark:border-surface-800' : 'hidden'
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

// Clicks in the preview happen in its iframe and never reach this document, so a menu or dropdown
// open here wouldn't see them as a click outside. Focus moving into the preview counts as one.
function onWindowBlur() {
  requestAnimationFrame(() => {
    if (document.activeElement instanceof HTMLIFrameElement) document.body.click()
  })
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
  window.addEventListener('blur', onWindowBlur)
  media = window.matchMedia('(prefers-color-scheme: dark)')
  systemDark.value = media.matches
  media.addEventListener('change', onMediaChange)
  document.documentElement.classList.toggle('ps-dark', uiDark.value)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('blur', onWindowBlur)
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

    <!-- Phones, with the preview strip hidden: the way to bring it back. -->
    <div
      v-if="pane === 'edit' && !editor.prefs.previewStrip"
      class="flex justify-end border-b border-surface-200 px-2 py-1 lg:hidden dark:border-surface-800"
    >
      <Button
        label="Show preview"
        icon="pi pi-eye"
        severity="secondary"
        size="small"
        text
        @click="editor.prefs.previewStrip = true"
      />
    </div>

    <div class="flex min-h-0 flex-1 flex-col lg:flex-row">
      <!-- The panes beside the preview change with the layout (and the first-run setup); the
           preview itself is one element in every layout, so its iframe is never reloaded. -->
      <aside
        v-if="editor.setupOpen"
        class="ps-pane-scroll w-full min-w-0 shrink-0 overflow-y-auto overflow-x-hidden border-surface-200 lg:block lg:flex-none lg:w-[26rem] lg:border-r xl:w-[28rem] dark:border-surface-800"
        :class="editClass"
        aria-label="Set up your theme"
      >
        <EditorSetup />
      </aside>

      <!-- Two panes: destination rail and one panel on the left, the preview takes the rest. -->
      <template v-else-if="editor.prefs.layout === 'panels'">
        <aside
          class="ps-pane-scroll hidden w-24 shrink-0 overflow-y-auto border-r border-surface-200 lg:block dark:border-surface-800"
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
      </template>

      <!-- Classic: section nav · preview · inspector. -->
      <aside
        v-else
        class="ps-pane-scroll hidden w-56 shrink-0 overflow-y-auto border-r border-surface-200 xl:block dark:border-surface-800"
        aria-label="Sections"
      >
        <EditorSectionNav />
      </aside>

      <section
        key="preview"
        class="relative order-first min-w-0 flex-col bg-surface-50 lg:order-none lg:flex lg:h-auto lg:flex-1 lg:border-b-0 dark:bg-surface-950"
        :class="previewClass"
        aria-label="Preview"
      >
        <!-- The setup keeps the preview to the sample app, without the toolbar. -->
        <EditorPreviewToolbar
          v-if="!editor.setupOpen"
          :class="toolbarClass"
        />
        <EditorPreviewStage />
        <!-- Phones: the strip's own controls; the full preview's way back to the controls. -->
        <div
          v-if="pane === 'edit'"
          class="absolute right-2 top-2 z-20 flex gap-1 lg:hidden"
        >
          <Button
            icon="pi pi-window-maximize"
            severity="secondary"
            size="small"
            rounded
            aria-label="Show the preview full screen"
            class="!size-8 shadow-sm"
            @click="pane = 'preview'"
          />
          <Button
            icon="pi pi-eye-slash"
            severity="secondary"
            size="small"
            rounded
            aria-label="Hide the preview"
            class="!size-8 shadow-sm"
            @click="editor.prefs.previewStrip = false"
          />
        </div>
        <Button
          v-else
          label="Done"
          icon="pi pi-check"
          size="small"
          rounded
          class="!absolute bottom-4 right-4 z-20 shadow-md lg:!hidden"
          @click="pane = 'edit'"
        />
        <EditorPreviewStatus
          v-if="!editor.setupOpen"
          :class="toolbarClass"
        />
      </section>

      <aside
        v-if="!editor.setupOpen && editor.prefs.layout === 'classic'"
        class="ps-pane-scroll w-full min-w-0 shrink-0 overflow-y-auto overflow-x-hidden border-surface-200 lg:block lg:flex-none lg:w-[22rem] lg:border-l xl:w-[24rem] dark:border-surface-800"
        :class="editClass"
        aria-label="Inspector"
      >
        <EditorInspector />
      </aside>

      <EditorExportPanel
        v-model:visible="exportVisible"
        v-model:tab="exportTab"
      />
      <EditorSharedThemeDialog />
      <Toast position="bottom-right" />
    </div>
  </div>
</template>
