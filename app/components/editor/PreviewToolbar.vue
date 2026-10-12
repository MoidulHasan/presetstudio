<script setup lang="ts">
import { useEditorStore, type PreviewViewport } from '~/stores/editor'
import type { PreviewTemplate } from '~/utils/theme/messages'
import type { ColorScheme } from '~/utils/theme/types'

const store = useEditorStore()

const templates: Array<{ value: PreviewTemplate, label: string, icon: string }> = [
  { value: 'components', label: 'All components', icon: 'pi pi-th-large' },
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
  get: () => (store.prefs.split ? 'split' : store.prefs.colorScheme),
  set: (value) => {
    store.prefs.split = value === 'split'
    if (value !== 'split') store.prefs.colorScheme = value
  },
})

const viewportOptions: Array<{ value: PreviewViewport, label: string, icon: string }> = [
  { value: 'full', label: 'Full width', icon: 'pi pi-desktop' },
  { value: 'tablet', label: 'Tablet (768px)', icon: 'pi pi-tablet' },
  { value: 'mobile', label: 'Mobile (390px)', icon: 'pi pi-mobile' },
]

const currentTemplate = computed(() => templates.find(t => t.value === store.prefs.template)!)
</script>

<template>
  <div class="flex flex-wrap items-center gap-2 border-b border-surface-200 bg-surface-0 px-3 py-2 dark:border-surface-800 dark:bg-surface-900">
    <Select
      v-model="store.prefs.template"
      :options="templates"
      option-label="label"
      option-value="value"
      aria-label="Preview page"
      size="small"
      class="w-44"
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

    <SelectButton
      v-model="store.prefs.viewport"
      :options="viewportOptions"
      option-label="label"
      option-value="value"
      :allow-empty="false"
      aria-label="Preview width"
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

    <SelectButton
      v-model="mode"
      :options="modeOptions"
      option-label="label"
      option-value="value"
      :allow-empty="false"
      aria-label="Preview mode"
      size="small"
      class="ml-auto"
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
</template>
