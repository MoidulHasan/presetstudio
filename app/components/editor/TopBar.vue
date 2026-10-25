<script setup lang="ts">
import type { MenuItem } from 'primevue/menuitem'
import { useEditorStore } from '~/stores/editor'
import { useWorkspaceStore } from '~/stores/workspace'
import type { EditorLayout, UiTheme } from '~/utils/editor-sections'

// The theme (switch, rename, import, reset…), undo/redo, and the two ways out: Share and
// Export. The base preset is chosen in Quick start, resets live in the theme menu and panels;
// the editor's own appearance and layout are in the settings menu.
defineEmits<{ export: [tab: 'preset' | 'share'] }>()

const editor = useEditorStore()
const workspace = useWorkspaceStore()
const isMac = import.meta.client && /Mac|iPhone|iPad/.test(navigator.platform)
const mod = isMac ? '⌘' : 'Ctrl+'

const APPEARANCES: Array<{ value: UiTheme, label: string, icon: string }> = [
  { value: 'system', label: 'System', icon: 'pi pi-desktop' },
  { value: 'light', label: 'Light', icon: 'pi pi-sun' },
  { value: 'dark', label: 'Dark', icon: 'pi pi-moon' },
]
const LAYOUTS: Array<{ value: EditorLayout, label: string, icon: string }> = [
  { value: 'panels', label: 'Two panes', icon: 'pi pi-window-maximize' },
  { value: 'classic', label: 'Classic (three panes)', icon: 'pi pi-objects-column' },
]

const settingsMenu = ref<{ toggle: (event: Event) => void } | null>(null)
const settingsItems = computed<MenuItem[]>(() => [
  {
    label: 'Editor appearance',
    items: APPEARANCES.map(a => ({ label: a.label, icon: a.icon, checked: editor.prefs.uiTheme === a.value, command: () => (editor.prefs.uiTheme = a.value) })),
  },
  {
    label: 'Layout',
    items: LAYOUTS.map(l => ({ label: l.label, icon: l.icon, checked: editor.prefs.layout === l.value, command: () => (editor.prefs.layout = l.value) })),
  },
])
</script>

<template>
  <header class="flex h-14 shrink-0 items-center gap-2 border-b border-surface-200 px-3 sm:gap-3 dark:border-surface-800">
    <!-- Classic layout: from xl the logo cell is exactly as wide as the section nav below it, so their borders line up. -->
    <div
      class="hidden h-full shrink-0 items-center border-surface-200 lg:flex dark:border-surface-800"
      :class="editor.prefs.layout === 'classic' ? 'xl:-ml-3 xl:w-56 xl:border-r xl:px-4' : ''"
    >
      <AppLogo class="whitespace-nowrap" />
    </div>
    <Divider
      layout="vertical"
      class="!mx-1 hidden lg:block"
      :class="editor.prefs.layout === 'classic' ? 'xl:!hidden' : ''"
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
        v-tooltip.bottom="'Editor settings'"
        icon="pi pi-cog"
        severity="secondary"
        size="small"
        text
        rounded
        aria-label="Editor settings"
        aria-haspopup="true"
        aria-controls="editor-settings"
        @click="settingsMenu?.toggle($event)"
      />
      <Menu
        id="editor-settings"
        ref="settingsMenu"
        :model="settingsItems"
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
