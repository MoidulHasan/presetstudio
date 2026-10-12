<script setup lang="ts">
import { useEditorStore, type UiTheme } from '~/stores/editor'
import { BASE_PRESETS, BASE_PRESET_LABELS, type BasePresetName } from '~/utils/theme/types'

defineEmits<{ export: [] }>()

const store = useEditorStore()
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

function setBase(value: BasePresetName) {
  store.update((d) => {
    d.basePreset = value
  })
}
</script>

<template>
  <header class="flex h-14 shrink-0 items-center gap-3 border-b border-surface-200 px-3 dark:border-surface-800">
    <AppLogo class="hidden sm:flex" />
    <Divider
      layout="vertical"
      class="!mx-1 hidden sm:block"
    />
    <EditorThemeSwitcher />

    <div class="ml-auto flex items-center gap-2">
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
      </div>
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
        class="w-32"
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
        @click="store.prefs.uiTheme = UI_THEME_NEXT[store.prefs.uiTheme] ?? 'light'"
      />
      <Button
        label="Export"
        icon="pi pi-code"
        size="small"
        @click="$emit('export')"
      />
    </div>
  </header>
</template>
