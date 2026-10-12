<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import type { PreviewTemplate } from '~/utils/theme/messages'
import type { ColorScheme } from '~/utils/theme/types'

const store = useEditorStore()

const templates: Array<{ value: PreviewTemplate, label: string, icon: string }> = [
  { value: 'components', label: 'Components', icon: 'pi pi-th-large' },
  { value: 'dashboard', label: 'Dashboard', icon: 'pi pi-chart-bar' },
  { value: 'form', label: 'Form', icon: 'pi pi-pen-to-square' },
  { value: 'settings', label: 'Settings', icon: 'pi pi-cog' },
]

const schemeOptions: Array<{ value: ColorScheme, label: string, icon: string }> = [
  { value: 'light', label: 'Light', icon: 'pi pi-sun' },
  { value: 'dark', label: 'Dark', icon: 'pi pi-moon' },
]
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
      class="w-40"
    >
      <template #value="{ value }">
        <span class="flex items-center gap-2">
          <i
            :class="templates.find(t => t.value === value)?.icon"
            aria-hidden="true"
          />
          {{ templates.find(t => t.value === value)?.label }}
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

    <div class="ml-auto flex items-center gap-2">
      <SelectButton
        v-model="store.prefs.colorScheme"
        :options="schemeOptions"
        option-value="value"
        :allow-empty="false"
        :aria-label="store.prefs.split ? 'Color scheme being edited' : 'Preview color scheme'"
        size="small"
      >
        <template #option="{ option }">
          <i
            :class="option.icon"
            aria-hidden="true"
          />
          <span>{{ option.label }}</span>
        </template>
      </SelectButton>
      <ToggleButton
        v-model="store.prefs.split"
        v-tooltip.bottom="'Show light and dark side by side'"
        on-label="Side by side"
        off-label="Side by side"
        on-icon="pi pi-objects-column"
        off-icon="pi pi-objects-column"
        size="small"
        aria-label="Show light and dark side by side"
      />
    </div>
  </div>
</template>
