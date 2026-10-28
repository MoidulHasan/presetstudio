<script setup lang="ts">
import type { AutoCompleteCompleteEvent, AutoCompleteOptionSelectEvent } from 'primevue/autocomplete'
import { useEditorStore } from '~/stores/editor'
import { useWorkspaceStore } from '~/stores/workspace'
import { usePresetStore } from '~/stores/preset'
import { CATEGORY_META } from '~/utils/preview-categories'
import { EDITOR_SECTIONS, SECTION_META, destinationOf } from '~/utils/editor-sections'
import { searchEntries, type SearchEntry, type SearchGroup } from '~/utils/search'
import { COMPONENT_META, STUDIO_COMPONENTS, groupComponentTokens, tokenLabel } from '~/utils/theme/components'
import type { TokenDescriptor } from '~/utils/theme/schema'
import { groupSemanticTokens, semanticPath } from '~/utils/theme/semantic'

// Search (⌘K): every section, component and token, and the common actions, in one box.
// Picking a result goes there; a token opens the list that holds it, with the token expanded.
// `inline`: inside the search dialog (small screens), results open in the dialog, not over it.
const props = defineProps<{ inline?: boolean }>()
const emit = defineEmits<{ export: [tab: 'app' | 'share'], done: [] }>()

const editor = useEditorStore()
const workspace = useWorkspaceStore()
const preset = usePresetStore()
const toast = useToast()
const isMac = import.meta.client && /Mac|iPhone|iPad/.test(navigator.platform)

type Entry = SearchEntry & { run: () => void }

/** Somewhere in the editor: leaves the first-run setup and shows the panel (below lg, one pane shows). */
function go(open: () => void) {
  if (editor.setupOpen) editor.closeSetup()
  open()
  editor.prefs.pane = 'edit'
}

const sectionEntries = computed<Entry[]>(() => EDITOR_SECTIONS.map((section) => {
  const meta = SECTION_META[section]
  return {
    id: `section:${section}`,
    kind: 'section',
    label: meta.label,
    detail: destinationOf(section).label,
    keywords: meta.description,
    icon: meta.icon,
    run: () => go(() => editor.openSection(section)),
  }
}))

// Components with a visual editor first: they're the ones most people look for.
const componentEntries = computed<Entry[]>(() => Object.entries(COMPONENT_META)
  .sort(([a], [b]) => Number(STUDIO_COMPONENTS.includes(b)) - Number(STUDIO_COMPONENTS.includes(a)))
  .map(([name, meta]) => ({
    id: `component:${name}`,
    kind: 'component',
    label: meta.label,
    detail: meta.deprecated ? `Deprecated, use ${meta.deprecated}` : STUDIO_COMPONENTS.includes(name) ? 'Visual editor' : CATEGORY_META[meta.category].label,
    keywords: name,
    icon: STUDIO_COMPONENTS.includes(name) ? 'pi pi-sliders-h' : 'pi pi-box',
    run: () => go(() => editor.openComponent(name)),
  })))

function humanize(key: string): string {
  const text = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase()
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function tokenEntry(token: TokenDescriptor, label: string): Entry {
  return {
    id: `token:${token.path.join('.')}`,
    kind: 'token',
    label,
    detail: `--p-${token.name}`,
    keywords: token.name,
    icon: 'pi pi-hashtag',
    run: () => go(() => editor.openToken(token)),
  }
}

// The tokens the lists show for the previewed scheme, so a result always opens a row that's there.
const tokenEntries = computed<Entry[]>(() => {
  const scheme = editor.prefs.colorScheme
  const semantic = groupSemanticTokens(preset.descriptors, scheme).flatMap(group => group.tokens.map((token) => {
    const path = semanticPath(token)
    const rest = path[0] === group.key ? path.slice(1) : path
    return tokenEntry(token, [group.label, ...rest.map(humanize)].join(' › '))
  }))
  const components = Object.entries(COMPONENT_META).flatMap(([name, meta]) =>
    groupComponentTokens(preset.descriptors, name, scheme).flatMap(group =>
      group.tokens.map(token => tokenEntry(token, [meta.label, ...(group.key === 'root' ? [] : [group.label]), tokenLabel(token)].join(' › ')))))
  return [...semantic, ...components]
})

const undoHint = isMac ? '⌘Z' : 'Ctrl+Z'

const actionEntries = computed<Entry[]>(() => [
  { id: 'action:export', kind: 'action', label: 'Export code', keywords: 'download preset file nuxt vue install', icon: 'pi pi-code', run: () => emit('export', 'app') },
  { id: 'action:share', kind: 'action', label: 'Share a link', keywords: 'copy url theme file', icon: 'pi pi-share-alt', run: () => emit('export', 'share') },
  { id: 'action:pick', kind: 'action', label: 'Pick a component in the preview', keywords: 'inspect click select', icon: 'pi pi-bullseye', run: () => {
    if (editor.setupOpen) editor.closeSetup()
    editor.prefs.inspect = true
    editor.prefs.pane = 'preview'
  } },
  { id: 'action:light', kind: 'action', label: 'Preview in light mode', keywords: 'scheme', icon: 'pi pi-sun', run: () => {
    editor.prefs.colorScheme = 'light'
    editor.prefs.split = false
  } },
  { id: 'action:dark', kind: 'action', label: 'Preview in dark mode', keywords: 'scheme', icon: 'pi pi-moon', run: () => {
    editor.prefs.colorScheme = 'dark'
    editor.prefs.split = false
  } },
  { id: 'action:both', kind: 'action', label: 'Preview light and dark side by side', keywords: 'scheme both split', icon: 'pi pi-clone', run: () => (editor.prefs.split = true) },
  { id: 'action:focus', kind: 'action', label: editor.prefs.showFocus ? 'Hide focus states' : 'Show focus states', keywords: 'keyboard ring outline', icon: 'pi pi-bullseye', run: () => (editor.prefs.showFocus = !editor.prefs.showFocus) },
  { id: 'action:undo', kind: 'action', label: 'Undo', detail: undoHint, icon: 'pi pi-undo', run: () => workspace.undo() },
  { id: 'action:redo', kind: 'action', label: 'Redo', icon: 'pi pi-refresh', run: () => workspace.redo() },
  { id: 'action:setup', kind: 'action', label: 'Run the guided setup', keywords: 'first start wizard look brand', icon: 'pi pi-play', run: () => editor.openSetup() },
  { id: 'action:ui-dark', kind: 'action', label: 'Editor appearance: dark', keywords: 'theme mode night', icon: 'pi pi-moon', run: () => (editor.prefs.uiTheme = 'dark') },
  { id: 'action:ui-light', kind: 'action', label: 'Editor appearance: light', keywords: 'theme mode day', icon: 'pi pi-sun', run: () => (editor.prefs.uiTheme = 'light') },
  { id: 'action:ui-system', kind: 'action', label: 'Editor appearance: system', keywords: 'theme mode auto', icon: 'pi pi-desktop', run: () => (editor.prefs.uiTheme = 'system') },
  { id: 'action:reset', kind: 'action', label: 'Reset theme to the base preset', keywords: 'clear start over revert', icon: 'pi pi-replay', run: () => {
    preset.resetTheme()
    toast.add({ severity: 'secondary', summary: 'Theme reset to the base preset', detail: `Press ${undoHint} to undo.`, life: 3000 })
  } },
  ...workspace.state.themes
    .filter(doc => doc.id !== workspace.state.activeId)
    .map<Entry>(doc => ({ id: `action:theme:${doc.id}`, kind: 'action', label: `Switch to “${doc.name}”`, keywords: 'theme open', icon: 'pi pi-palette', run: () => workspace.switchTheme(doc.id) })),
])

const query = ref<string | Entry>('')
const suggestions = ref<Array<SearchGroup<Entry>>>([])

// A new array every time: the dropdown opens when suggestions arrive, also for an empty query.
function complete(event: AutoCompleteCompleteEvent) {
  suggestions.value = searchEntries([...sectionEntries.value, ...componentEntries.value, ...tokenEntries.value, ...actionEntries.value], event.query)
}

const input = ref<{ $el: HTMLElement } | null>(null)

function select(event: AutoCompleteOptionSelectEvent) {
  const entry = event.value as Entry
  query.value = ''
  ;(document.activeElement as HTMLElement | null)?.blur()
  entry.run()
  emit('done')
}

function focus() {
  input.value?.$el.querySelector('input')?.focus()
}

defineExpose({ focus })
</script>

<template>
  <AutoComplete
    ref="input"
    v-model="query"
    :suggestions="suggestions"
    option-label="label"
    option-group-label="label"
    option-group-children="items"
    complete-on-focus
    auto-option-focus
    :delay="0"
    :scroll-height="props.inline ? '60vh' : '26rem'"
    :append-to="props.inline ? 'self' : 'body'"
    :placeholder="`Search  ${isMac ? '⌘K' : 'Ctrl+K'}`"
    aria-label="Search sections, components, tokens and actions"
    size="small"
    fluid
    :pt="{
      root: { class: props.inline ? '!flex !flex-col' : '' },
      overlay: { class: props.inline ? '!static !w-full !min-w-0 !mt-2 !shadow-none' : '!min-w-[22rem] max-w-[calc(100vw-2rem)]' },
      pcInputText: { root: { autofocus: props.inline || undefined } },
    }"
    @complete="complete"
    @option-select="select"
  >
    <template #optiongroup="{ option }">
      <span class="text-xs font-medium text-surface-500 dark:text-surface-400">{{ option.label }}</span>
    </template>
    <template #option="{ option }">
      <span class="flex min-w-0 flex-1 items-center gap-3">
        <i
          :class="option.icon"
          class="shrink-0 text-surface-500 dark:text-surface-400"
          aria-hidden="true"
        />
        <span class="flex min-w-0 flex-col">
          <span class="truncate">{{ option.label }}</span>
          <span
            v-if="option.detail"
            class="truncate text-xs text-surface-500 dark:text-surface-400"
            :class="option.kind === 'token' ? 'font-mono' : ''"
          >{{ option.detail }}</span>
        </span>
      </span>
    </template>
  </AutoComplete>
</template>
