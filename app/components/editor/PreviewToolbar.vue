<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import type { PreviewViewport } from '~/utils/editor-sections'
import { CATEGORY_META } from '~/utils/preview-categories'
import { PREVIEW_CATEGORIES, type PreviewTemplate } from '~/utils/theme/messages'
import type { ColorScheme } from '~/utils/theme/types'

const editor = useEditorStore()

const templates: Array<{ value: PreviewTemplate, label: string, icon: string }> = [
  { value: 'components', label: 'Components', icon: 'pi pi-th-large' },
  { value: 'dashboard', label: 'Dashboard', icon: 'pi pi-chart-bar' },
  { value: 'form', label: 'Form', icon: 'pi pi-pen-to-square' },
  { value: 'settings', label: 'Settings', icon: 'pi pi-cog' },
]

type PreviewMode = ColorScheme | 'split'

const modeOptions: Array<{ value: PreviewMode, label: string, icon: string }> = [
  { value: 'light', label: 'Light', icon: 'pi pi-sun' },
  { value: 'dark', label: 'Dark', icon: 'pi pi-moon' },
  { value: 'split', label: 'Side by side', icon: 'pi pi-objects-column' },
]

// One control for what the preview shows. In side-by-side mode the edited scheme
// (prefs.colorScheme) is kept and can be switched from the pane headers.
const mode = computed<PreviewMode>({
  get: () => (editor.prefs.split ? 'split' : editor.prefs.colorScheme),
  set: (value) => {
    editor.prefs.split = value === 'split'
    if (value !== 'split') editor.prefs.colorScheme = value
  },
})

const viewportOptions: Array<{ value: PreviewViewport, label: string, icon: string }> = [
  { value: 'full', label: 'Full width', icon: 'pi pi-desktop' },
  { value: 'tablet', label: 'Tablet (768px)', icon: 'pi pi-tablet' },
  { value: 'mobile', label: 'Mobile (390px)', icon: 'pi pi-mobile' },
]

const categoryOptions = PREVIEW_CATEGORIES.map(value => ({ value, ...CATEGORY_META[value] }))

const stageMeta = computed(() => (editor.stageName ? { label: editor.stageLabel } : null))
const stageOptions = computed(() => [
  { value: true, label: 'Stage', icon: 'pi pi-th-large', hint: `What ${stageMeta.value?.label ?? 'this'} affects, every state, light and dark` },
  { value: false, label: 'In context', icon: 'pi pi-window-maximize', hint: 'The usual preview pages' },
])

const currentTemplate = computed(() => templates.find(t => t.value === editor.prefs.template)!)
</script>

<template>
  <div class="flex flex-wrap items-center gap-2 border-b border-surface-200 bg-surface-0 px-3 py-2 dark:border-surface-800 dark:bg-surface-900">
    <!-- With a visual editor open, the preview shows its stage or the usual pages. -->
    <SelectButton
      v-if="stageMeta"
      v-model="editor.prefs.stage"
      :options="stageOptions"
      option-label="label"
      option-value="value"
      :allow-empty="false"
      aria-label="What the preview shows"
      size="small"
    >
      <template #option="{ option }">
        <span
          v-tooltip.bottom="option.hint"
          class="flex items-center gap-2"
        >
          <i
            :class="option.icon"
            aria-hidden="true"
          />
          {{ option.label }}
        </span>
      </template>
    </SelectButton>
    <template v-if="!editor.activeStage">
      <Select
        v-model="editor.prefs.template"
        :options="templates"
        option-label="label"
        option-value="value"
        aria-label="Preview page"
        size="small"
        class="w-40 sm:w-44"
      >
        <template #value>
          <span class="flex items-center gap-2">
            <i
              :class="currentTemplate.icon"
              aria-hidden="true"
            />
            {{ currentTemplate.label }}
          </span>
        </template>
        <template #option="{ option }">
          <span class="flex items-center gap-2">
            <i
              :class="option.icon"
              aria-hidden="true"
            />
            {{ option.label }}
          </span>
        </template>
      </Select>

      <Select
        v-if="editor.prefs.template === 'components'"
        v-model="editor.prefs.category"
        :options="categoryOptions"
        option-label="label"
        option-value="value"
        aria-label="Component category"
        size="small"
        class="w-36 sm:w-40"
      >
        <template #value>
          <span class="flex items-center gap-2">
            <i
              :class="CATEGORY_META[editor.prefs.category].icon"
              aria-hidden="true"
            />
            {{ CATEGORY_META[editor.prefs.category].label }}
          </span>
        </template>
        <template #option="{ option }">
          <span class="flex w-full items-center gap-2">
            <i
              :class="option.icon"
              aria-hidden="true"
            />
            <span class="flex-1">{{ option.label }}</span>
            <Badge
              :value="option.count"
              severity="secondary"
              size="small"
            />
          </span>
        </template>
      </Select>

      <!-- Phones are already narrow; the width presets only matter on larger screens. -->
      <SelectButton
        v-model="editor.prefs.viewport"
        :options="viewportOptions"
        option-label="label"
        option-value="value"
        :allow-empty="false"
        aria-label="Preview width"
        size="small"
        class="!hidden md:!inline-flex"
      >
        <template #option="{ option }">
          <i
            v-tooltip.bottom="option.label"
            :class="option.icon"
            :aria-label="option.label"
          />
        </template>
      </SelectButton>
    </template>

    <div class="ml-auto flex items-center gap-2">
      <ToggleButton
        v-model="editor.prefs.inspect"
        v-tooltip.bottom="editor.prefs.inspect ? 'Click a component in the preview to edit its tokens' : 'Pick a component in the preview to edit its tokens'"
        on-label="Inspect"
        off-label="Inspect"
        on-icon="pi pi-search"
        off-icon="pi pi-search"
        size="small"
        aria-label="Inspect components"
      />
      <ToggleButton
        v-model="editor.prefs.showFocus"
        v-tooltip.bottom="editor.prefs.showFocus ? 'Showing every component focused' : 'Show every component focused (focus rings)'"
        on-label="Focus"
        off-label="Focus"
        on-icon="pi pi-bullseye"
        off-icon="pi pi-bullseye"
        size="small"
        aria-label="Show focus states"
      />
      <SelectButton
        v-if="!editor.activeStage"
        v-model="mode"
        :options="modeOptions"
        option-label="label"
        option-value="value"
        :allow-empty="false"
        aria-label="Preview mode"
        size="small"
      >
        <template #option="{ option }">
          <i
            v-tooltip.bottom="option.label"
            :class="option.icon"
            aria-hidden="true"
          />
          <span class="hidden 2xl:inline">{{ option.label }}</span>
        </template>
      </SelectButton>
    </div>
  </div>
</template>
