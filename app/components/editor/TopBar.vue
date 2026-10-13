<script setup lang="ts">
import { useEditorStore, type UiTheme } from '~/stores/editor'
import { BASE_PRESETS, BASE_PRESET_LABELS, type BasePresetName } from '~/utils/theme/types'

defineEmits<{ export: [] }>()

const store = useEditorStore()
const toast = useToast()
const presetOptions = BASE_PRESETS.map(value => ({ value, label: BASE_PRESET_LABELS[value] }))
const isMac = import.meta.client && /Mac|iPhone|iPad/.test(navigator.platform)
const mod = isMac ? '⌘' : 'Ctrl+'

const UI_THEME_NEXT: Record<UiTheme, UiTheme> = { system: 'light', light: 'dark', dark: 'system' }
const UI_THEME_META: Record<UiTheme, { icon: string, label: string }> = {
  system: { icon: 'pi pi-desktop', label: 'Editor appearance: system' },
  light: { icon: 'pi pi-sun', label: 'Editor appearance: light' },
  dark: { icon: 'pi pi-moon', label: 'Editor appearance: dark' },
}

const uiTheme = computed(() => UI_THEME_META[store.prefs.uiTheme] ?? UI_THEME_META.system)

function resetTheme() {
  store.resetTheme()
  toast.add({ severity: 'secondary', summary: 'Theme reset to the base preset', detail: `Press ${mod}Z to undo.`, life: 3000 })
}

function setBase(value: BasePresetName) {
  store.update((d) => {
    d.basePreset = value
  })
}
</script>

<template>
  <header class="flex h-14 shrink-0 items-center gap-2 border-b border-surface-200 px-3 sm:gap-3 dark:border-surface-800">
    <AppLogo class="hidden whitespace-nowrap lg:flex" />
    <Divider
      layout="vertical"
      class="!mx-1 hidden lg:block"
    />
    <EditorThemeSwitcher class="min-w-0" />

    <div class="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
      <div class="flex items-center">
        <Button
          v-tooltip.bottom="`Undo (${mod}Z)`"
          icon="pi pi-undo"
          severity="secondary"
          size="small"
          text
          rounded
          aria-label="Undo"
          :disabled="!store.canUndo"
          @click="store.undo()"
        />
        <Button
          v-tooltip.bottom="`Redo (${isMac ? '⇧⌘Z' : 'Ctrl+Y'})`"
          icon="pi pi-undo"
          :pt="{ icon: { class: '-scale-x-100' } }"
          severity="secondary"
          size="small"
          text
          rounded
          aria-label="Redo"
          :disabled="!store.canRedo"
          @click="store.redo()"
        />
        <Button
          v-tooltip.bottom="store.pristine ? 'Nothing to reset' : 'Reset the whole theme to the base preset'"
          icon="pi pi-refresh"
          severity="secondary"
          size="small"
          text
          rounded
          aria-label="Reset theme"
          :disabled="store.pristine"
          @click="resetTheme"
        />
      </div>
      <!-- On phones the base preset is picked in Quick start. -->
      <label
        for="base-preset"
        class="hidden text-sm text-surface-500 md:inline"
      >Base</label>
      <Select
        :model-value="store.theme.basePreset"
        :options="presetOptions"
        option-label="label"
        option-value="value"
        input-id="base-preset"
        size="small"
        class="!hidden w-28 sm:!inline-flex sm:w-32"
        @update:model-value="setBase"
      />
      <Button
        v-tooltip.bottom="`${uiTheme.label} (click to change)`"
        :icon="uiTheme.icon"
        severity="secondary"
        size="small"
        text
        rounded
        :aria-label="uiTheme.label"
        class="!hidden sm:!inline-flex"
        @click="store.prefs.uiTheme = UI_THEME_NEXT[store.prefs.uiTheme] ?? 'light'"
      />
      <Button
        label="Export"
        icon="pi pi-code"
        size="small"
        aria-label="Export"
        :pt="{ label: { class: 'hidden sm:inline' } }"
        @click="$emit('export')"
      />
    </div>
  </header>
</template>
