<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import { useWorkspaceStore } from '~/stores/workspace'
import type { UiTheme } from '~/utils/editor-sections'

// The theme (switch, rename, import, reset…), undo/redo, and the two ways out: Share and
// Export. The base preset is chosen in Quick start, resets live in the theme menu and panels.
defineEmits<{ export: [tab: 'preset' | 'share'] }>()

const editor = useEditorStore()
const workspace = useWorkspaceStore()
const isMac = import.meta.client && /Mac|iPhone|iPad/.test(navigator.platform)
const mod = isMac ? '⌘' : 'Ctrl+'

const UI_THEME_NEXT: Record<UiTheme, UiTheme> = { system: 'light', light: 'dark', dark: 'system' }
const UI_THEME_META: Record<UiTheme, { icon: string, label: string }> = {
  system: { icon: 'pi pi-desktop', label: 'Editor appearance: system' },
  light: { icon: 'pi pi-sun', label: 'Editor appearance: light' },
  dark: { icon: 'pi pi-moon', label: 'Editor appearance: dark' },
}

const uiTheme = computed(() => UI_THEME_META[editor.prefs.uiTheme] ?? UI_THEME_META.system)
</script>

<template>
  <header class="flex h-14 shrink-0 items-center gap-2 border-b border-surface-200 px-3 sm:gap-3 dark:border-surface-800">
    <!-- From xl the logo cell is exactly as wide as the section nav below it, so their borders line up. -->
    <div class="hidden h-full shrink-0 items-center border-surface-200 lg:flex xl:-ml-3 xl:w-56 xl:border-r xl:px-4 dark:border-surface-800">
      <AppLogo class="whitespace-nowrap" />
    </div>
    <Divider
      layout="vertical"
      class="!mx-1 hidden lg:block xl:!hidden"
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
          :disabled="!workspace.canUndo"
          @click="workspace.undo()"
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
          :disabled="!workspace.canRedo"
          @click="workspace.redo()"
        />
      </div>
      <Button
        v-tooltip.bottom="`${uiTheme.label} (click to change)`"
        :icon="uiTheme.icon"
        severity="secondary"
        size="small"
        text
        rounded
        :aria-label="uiTheme.label"
        class="!hidden sm:!inline-flex"
        @click="editor.prefs.uiTheme = UI_THEME_NEXT[editor.prefs.uiTheme] ?? 'light'"
      />
      <Button
        label="Share"
        icon="pi pi-share-alt"
        severity="secondary"
        size="small"
        outlined
        aria-label="Share"
        :pt="{ label: { class: 'hidden sm:inline' } }"
        @click="$emit('export', 'share')"
      />
      <Button
        label="Export"
        icon="pi pi-code"
        size="small"
        aria-label="Export"
        :pt="{ label: { class: 'hidden sm:inline' } }"
        @click="$emit('export', 'preset')"
      />
    </div>
  </header>
</template>
