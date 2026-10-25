<script setup lang="ts">
import type { MenuItem } from 'primevue/menuitem'
import { useEditorStore } from '~/stores/editor'
import type { PreviewViewport } from '~/utils/editor-sections'
import { CATEGORY_META } from '~/utils/preview-categories'
import { PREVIEW_CATEGORIES, type PreviewCategory, type PreviewTemplate } from '~/utils/theme/messages'
import type { ColorScheme } from '~/utils/theme/types'

// One row: what the preview shows on the left, how it shows it on the right. Rarely used
// settings (width, forced focus states) live in the View menu.
const editor = useEditorStore()

// --- What the preview shows ---------------------------------------------------------------
// With a stage available: every state of what's being edited, or the same in a sample app.
const stageOptions = [
  { value: true, label: 'All states', icon: 'pi pi-th-large' },
  { value: false, label: 'In an app', icon: 'pi pi-window-maximize' },
]
const stageHint = computed(() => `${editor.stageLabel}: every variant and state, light and dark`)

// Sample app pages and the component gallery in one select ('page:dashboard', 'gallery:form').
const PAGES: Array<{ value: Exclude<PreviewTemplate, 'components'>, label: string, icon: string }> = [
  { value: 'dashboard', label: 'Dashboard', icon: 'pi pi-chart-bar' },
  { value: 'form', label: 'Sign-up form', icon: 'pi pi-pen-to-square' },
  { value: 'settings', label: 'Settings', icon: 'pi pi-cog' },
]
const previewGroups = [
  { label: 'Sample app', items: PAGES.map(p => ({ value: `page:${p.value}`, label: p.label, icon: p.icon, count: null as number | null })) },
  {
    label: 'Component gallery',
    items: PREVIEW_CATEGORIES.map(c => ({ value: `gallery:${c}`, label: CATEGORY_META[c].label, icon: CATEGORY_META[c].icon, count: CATEGORY_META[c].count as number | null })),
  },
]
const previewOptions = previewGroups.flatMap(g => g.items)

const preview = computed({
  get: () => (editor.prefs.template === 'components' ? `gallery:${editor.prefs.category}` : `page:${editor.prefs.template}`),
  set: (value: string) => {
    const [kind, name] = value.split(':') as [string, string]
    if (kind === 'gallery') {
      editor.prefs.template = 'components'
      editor.prefs.category = name as PreviewCategory
    }
    else editor.prefs.template = name as PreviewTemplate
  },
})
const currentPreview = computed(() => previewOptions.find(o => o.value === preview.value) ?? previewOptions[0]!)

// --- How it shows it ------------------------------------------------------------------------
type PreviewMode = ColorScheme | 'split'
const modeOptions: Array<{ value: PreviewMode, label: string, icon: string }> = [
  { value: 'light', label: 'Light', icon: 'pi pi-sun' },
  { value: 'dark', label: 'Dark', icon: 'pi pi-moon' },
  { value: 'split', label: 'Light and dark side by side', icon: 'pi pi-objects-column' },
]
// In side-by-side mode the edited scheme (prefs.colorScheme) is kept and can be switched from the pane headers.
const mode = computed<PreviewMode>({
  get: () => (editor.prefs.split ? 'split' : editor.prefs.colorScheme),
  set: (value) => {
    editor.prefs.split = value === 'split'
    if (value !== 'split') editor.prefs.colorScheme = value
  },
})

const VIEWPORTS: Array<{ value: PreviewViewport, label: string, icon: string }> = [
  { value: 'full', label: 'Full width', icon: 'pi pi-desktop' },
  { value: 'tablet', label: 'Tablet (768 px)', icon: 'pi pi-tablet' },
  { value: 'mobile', label: 'Phone (390 px)', icon: 'pi pi-mobile' },
]

const viewMenu = ref<{ toggle: (event: Event) => void } | null>(null)
const viewItems = computed<MenuItem[]>(() => [
  {
    label: 'Width',
    items: VIEWPORTS.map(v => ({
      label: v.label,
      icon: v.icon,
      checked: editor.prefs.viewport === v.value,
      command: () => (editor.prefs.viewport = v.value),
    })),
  },
  {
    label: 'States',
    items: [{
      label: editor.prefs.showFocus ? 'Hide focus states' : 'Show focus states',
      icon: 'pi pi-eye',
      command: () => (editor.prefs.showFocus = !editor.prefs.showFocus),
    }],
  },
])
</script>

<template>
  <div class="flex items-center gap-2 border-b border-surface-200 bg-surface-0 px-3 py-2 dark:border-surface-800 dark:bg-surface-900">
    <SelectButton
      v-if="editor.stageName"
      v-model="editor.prefs.stage"
      v-tooltip.bottom="stageHint"
      :options="stageOptions"
      option-label="label"
      option-value="value"
      :allow-empty="false"
      aria-label="What the preview shows"
      size="small"
      class="shrink-0"
    >
      <template #option="{ option }">
        <i
          :class="option.icon"
          aria-hidden="true"
        />
        <span class="hidden sm:inline">{{ option.label }}</span>
      </template>
    </SelectButton>

    <Select
      v-if="!editor.activeStage"
      v-model="preview"
      :options="previewGroups"
      option-group-label="label"
      option-group-children="items"
      option-label="label"
      option-value="value"
      aria-label="Preview"
      size="small"
      scroll-height="24rem"
      class="w-44 min-w-0 sm:w-52"
    >
      <template #value>
        <span class="flex min-w-0 items-center gap-2">
          <i
            :class="currentPreview.icon"
            aria-hidden="true"
          />
          <span class="truncate">{{ currentPreview.label }}</span>
        </span>
      </template>
      <template #optiongroup="{ option }">
        <span class="text-[11px] font-semibold uppercase tracking-wider text-surface-500">{{ option.label }}</span>
      </template>
      <template #option="{ option }">
        <span class="flex w-full items-center gap-2">
          <i
            :class="option.icon"
            aria-hidden="true"
          />
          <span class="flex-1">{{ option.label }}</span>
          <span
            v-if="option.count"
            class="text-xs text-surface-500"
          >{{ option.count }}</span>
        </span>
      </template>
    </Select>

    <div class="ml-auto flex shrink-0 items-center gap-2">
      <ToggleButton
        v-model="editor.prefs.inspect"
        v-tooltip.bottom="editor.prefs.inspect ? 'Click a component in the preview to edit it' : 'Pick a component in the preview to edit it'"
        on-label="Pick"
        off-label="Pick"
        on-icon="pi pi-bullseye"
        off-icon="pi pi-bullseye"
        size="small"
        aria-label="Pick a component to edit"
      />
      <SelectButton
        v-if="!editor.activeStage"
        v-model="mode"
        :options="modeOptions"
        option-label="label"
        option-value="value"
        :allow-empty="false"
        aria-label="Light or dark"
        size="small"
      >
        <template #option="{ option }">
          <i
            v-tooltip.bottom="option.label"
            :class="option.icon"
            :aria-label="option.label"
          />
        </template>
      </SelectButton>
      <Button
        v-tooltip.bottom="'View options'"
        icon="pi pi-sliders-h"
        severity="secondary"
        size="small"
        text
        rounded
        aria-label="View options"
        aria-haspopup="true"
        aria-controls="preview-view-menu"
        @click="viewMenu?.toggle($event)"
      />
      <Menu
        id="preview-view-menu"
        ref="viewMenu"
        :model="viewItems"
        popup
      >
        <template #item="{ item, props }">
          <a
            v-bind="props.action"
            class="flex items-center gap-2"
          >
            <i
              :class="item.icon"
              aria-hidden="true"
            />
            <span class="flex-1">{{ item.label }}</span>
            <i
              v-if="item.checked"
              class="pi pi-check text-xs"
              aria-label="Selected"
            />
          </a>
        </template>
      </Menu>
    </div>
  </div>
</template>
