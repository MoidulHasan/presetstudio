<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import type { ColorScheme } from '~/utils/theme/types'

// First-run setup: the four Quick start choices in a focused panel, with the sample app live
// beside it. Shown on the first visit and for a new theme; everything stays editable later.
const editor = useEditorStore()

const SCHEMES: Array<{ value: ColorScheme, label: string, icon: string }> = [
  { value: 'light', label: 'Light', icon: 'pi pi-sun' },
  { value: 'dark', label: 'Dark', icon: 'pi pi-moon' },
]
const scheme = computed<ColorScheme>({
  get: () => editor.prefs.colorScheme,
  set: (value) => {
    editor.prefs.split = false
    editor.prefs.colorScheme = value
  },
})
</script>

<template>
  <div class="flex min-h-full flex-col">
    <header class="flex flex-col gap-1 px-5 pb-2 pt-6">
      <h2 class="text-xl font-semibold">
        Let's set up your theme
      </h2>
      <p class="text-sm text-surface-500 dark:text-surface-400">
        Four choices, live in the preview. You can change everything later.
      </p>
      <div class="mt-3 flex items-center gap-2">
        <span class="text-xs text-surface-500 dark:text-surface-400">Preview in</span>
        <SelectButton
          v-model="scheme"
          :options="SCHEMES"
          option-label="label"
          option-value="value"
          :allow-empty="false"
          aria-label="Preview in light or dark mode"
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
      </div>
    </header>

    <div class="flex-1 p-5">
      <EditorPanelsQuickStartPanel :show-next-steps="false" />
    </div>

    <footer class="sticky bottom-0 flex items-center justify-between gap-2 border-t border-surface-200 bg-surface-0 px-5 py-3 dark:border-surface-800 dark:bg-surface-900">
      <Button
        label="Skip for now"
        severity="secondary"
        text
        size="small"
        @click="editor.closeSetup()"
      />
      <Button
        label="Start designing"
        icon="pi pi-arrow-right"
        icon-pos="right"
        @click="editor.closeSetup()"
      />
    </footer>
  </div>
</template>
