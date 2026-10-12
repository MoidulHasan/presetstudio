<script setup lang="ts">
import { useThemeStore } from '~/stores/theme'
import type { ColorScheme } from '~/utils/theme/types'

definePageMeta({ layout: 'editor' })
useSeoMeta({ title: 'Editor · Preset Studio', robots: 'noindex' })

const store = useThemeStore()
const exportVisible = ref(false)

const schemeOptions: Array<{ value: ColorScheme, label: string, icon: string }> = [
  { value: 'light', label: 'Light', icon: 'pi pi-sun' },
  { value: 'dark', label: 'Dark', icon: 'pi pi-moon' },
]
</script>

<template>
  <div class="flex min-h-0 w-full flex-col md:flex-row">
    <aside
      class="w-full shrink-0 overflow-y-auto border-surface-200 p-5 md:w-[22rem] md:border-r dark:border-surface-800"
      aria-label="Theme controls"
    >
      <EditorThemeControls />
    </aside>

    <section
      class="flex min-h-0 min-w-0 flex-1 flex-col bg-surface-50 dark:bg-surface-950"
      aria-label="Preview"
    >
      <div class="flex items-center justify-between gap-3 border-b border-surface-200 bg-surface-0 px-4 py-2 dark:border-surface-800 dark:bg-surface-900">
        <SelectButton
          :model-value="store.state.colorScheme"
          :options="schemeOptions"
          option-value="value"
          :allow-empty="false"
          aria-label="Preview color scheme"
          size="small"
          @update:model-value="store.setColorScheme"
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
          label="Export code"
          icon="pi pi-code"
          size="small"
          @click="exportVisible = true"
        />
      </div>
      <div class="min-h-[32rem] flex-1">
        <EditorPreviewFrame />
      </div>
    </section>

    <EditorExportPanel v-model:visible="exportVisible" />
    <Toast position="bottom-right" />
  </div>
</template>
