<script setup lang="ts">
import type { MenuItem } from 'primevue/menuitem'
import { useEditorStore } from '~/stores/editor'
import type { PreviewPage, PreviewViewport } from '~/utils/editor-sections'
import { CATEGORY_META } from '~/utils/preview-categories'
import { PREVIEW_CATEGORIES } from '~/utils/theme/messages'
import type { ColorScheme } from '~/utils/theme/types'

// One row that never changes shape, so its controls are always where they were: what the
// preview shows (all states, or a page "In an app"), which page, the mode, Pick, and the View
// menu (width, forced focus states). What doesn't apply is disabled, not hidden.
const editor = useEditorStore()

// --- What the preview shows ---------------------------------------------------------------
const lens = computed({
  get: () => !!editor.stageName && editor.prefs.stage,
  set: (value: boolean) => {
    editor.prefs.stage = value
  },
})
const lensOptions = computed(() => [
  { value: true, label: 'All states', icon: 'pi pi-th-large', disabled: !editor.stageName },
  { value: false, label: 'In an app', icon: 'pi pi-window-maximize', disabled: false },
])
const lensHint = computed(() => (editor.stageName
  ? `${editor.stageLabel}: every variant and state`
  : 'This section has no states view; it shows in an app'))

// Sample app pages and the component gallery in one select ('page:dashboard', 'gallery:form').
const PAGES: Array<{ value: PreviewPage, label: string, icon: string }> = [
  { value: 'page:dashboard', label: 'Dashboard', icon: 'pi pi-chart-bar' },
  { value: 'page:form', label: 'Sign-up form', icon: 'pi pi-pen-to-square' },
  { value: 'page:settings', label: 'Settings', icon: 'pi pi-cog' },
]
const pageGroups = [
  { label: 'Sample app', items: PAGES.map(p => ({ ...p, count: null as number | null })) },
  {
    label: 'Component gallery',
    items: PREVIEW_CATEGORIES.map(c => ({ value: `gallery:${c}` as PreviewPage, label: CATEGORY_META[c].label, icon: CATEGORY_META[c].icon, count: CATEGORY_META[c].count as number | null })),
  },
]
const pageOptions = pageGroups.flatMap(g => g.items)
const page = computed({
  get: () => editor.currentPage,
  set: (value: PreviewPage) => editor.choosePage(value),
})
const currentPage = computed(() => pageOptions.find(o => o.value === page.value) ?? pageOptions[0]!)
const pageHint = computed(() => (editor.activeStage ? 'Pages show with "In an app"' : 'The page the preview shows'))

// --- How it shows it ------------------------------------------------------------------------
// The one Light | Dark | Both switch: it decides what the preview (and the stages) show, and which
// mode panels with per-mode values edit. "Both" keeps the mode being edited.
type PreviewMode = ColorScheme | 'split'
const modeOptions: Array<{ value: PreviewMode, label: string, icon: string, hint: string }> = [
  { value: 'light', label: 'Light', icon: 'pi pi-sun', hint: 'Light mode' },
  { value: 'dark', label: 'Dark', icon: 'pi pi-moon', hint: 'Dark mode' },
  { value: 'split', label: 'Both', icon: 'pi pi-objects-column', hint: 'Light and dark together' },
]
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

const lit = useSpotlightComponents()

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
    label: 'Show',
    items: [
      {
        label: 'Focus states',
        icon: 'pi pi-eye',
        checked: editor.prefs.showFocus,
        command: () => (editor.prefs.showFocus = !editor.prefs.showFocus),
      },
      {
        label: 'Dim what this section doesn’t change',
        icon: 'pi pi-lightbulb',
        checked: editor.prefs.spotlight,
        disabled: !lit.value?.length || !!editor.activeStage,
        command: () => (editor.prefs.spotlight = !editor.prefs.spotlight),
      },
    ],
  },
])
</script>

<template>
  <div class="@container border-b border-surface-200 bg-surface-0 dark:border-surface-800 dark:bg-surface-900">
    <div class="flex items-center gap-2 px-3 py-1.5">
      <SelectButton
        v-model="lens"
        v-tooltip.bottom="lensHint"
        :options="lensOptions"
        option-label="label"
        option-value="value"
        option-disabled="disabled"
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
          <span class="hidden @2xl:inline">{{ option.label }}</span>
        </template>
      </SelectButton>

      <Select
        v-model="page"
        v-tooltip.bottom="pageHint"
        :options="pageGroups"
        option-group-label="label"
        option-group-children="items"
        option-label="label"
        option-value="value"
        :disabled="!!editor.activeStage"
        aria-label="Page shown in an app"
        size="small"
        scroll-height="24rem"
        class="w-40 min-w-0 @2xl:w-52"
      >
        <template #value>
          <span class="flex min-w-0 items-center gap-2">
            <i
              :class="currentPage.icon"
              aria-hidden="true"
            />
            <span class="truncate">{{ currentPage.label }}</span>
          </span>
        </template>
        <template #optiongroup="{ option }">
          <span class="text-xs font-medium text-surface-500">{{ option.label }}</span>
        </template>
        <template #option="{ option }">
          <span class="flex w-full items-center gap-2">
            <i
              :class="option.icon"
              aria-hidden="true"
            />
            <span class="flex-1">{{ option.label }}</span>
            <Tag
              v-if="option.value === editor.suggestedPage"
              value="Suggested"
              severity="secondary"
              class="!px-1.5 !py-0 !text-[10px]"
            />
            <span
              v-else-if="option.count"
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
          v-model="mode"
          :options="modeOptions"
          option-label="label"
          option-value="value"
          :allow-empty="false"
          aria-label="Light, dark or both"
          size="small"
        >
          <template #option="{ option }">
            <i
              v-tooltip.bottom="option.hint"
              :class="option.icon"
              aria-hidden="true"
            />
            <span class="hidden @3xl:inline">{{ option.label }}</span>
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
  </div>
</template>
