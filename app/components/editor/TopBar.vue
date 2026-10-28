<script setup lang="ts">
import type { MenuItem } from 'primevue/menuitem'
import { useEditorStore } from '~/stores/editor'
import { useWorkspaceStore } from '~/stores/workspace'
import type { UiTheme } from '~/utils/editor-sections'

// The theme (switch, rename, import, reset…), whether it's saved, search (⌘K), undo/redo, and the
// one way out: Export (code for your app, a share link or the theme file). The base preset is
// chosen in the setup and Overview, resets live in the theme menu and panels; the editor's own
// appearance and layout are in the settings menu.
// Failing contrast checks show on the navigation's Review entry.
const emit = defineEmits<{ export: [tab: 'app' | 'share'] }>()

const editor = useEditorStore()
const workspace = useWorkspaceStore()
const isMac = import.meta.client && /Mac|iPhone|iPad/.test(navigator.platform)
const mod = isMac ? '⌘' : 'Ctrl+'

const APPEARANCES: Array<{ value: UiTheme, label: string, icon: string }> = [
  { value: 'system', label: 'System', icon: 'pi pi-desktop' },
  { value: 'light', label: 'Light', icon: 'pi pi-sun' },
  { value: 'dark', label: 'Dark', icon: 'pi pi-moon' },
]

// Search: a box from md up, a button opening it in a dialog below. ⌘K / Ctrl+K opens whichever shows.
const search = ref<{ focus: () => void } | null>(null)
const searchBox = ref<HTMLElement | null>(null)
const searchDialog = ref(false)
const dialogSearch = ref<{ focus: () => void } | null>(null)

function openSearch() {
  if (searchBox.value?.offsetParent) search.value?.focus()
  else searchDialog.value = true
}

function onKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && !event.shiftKey && !event.altKey && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    openSearch()
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

function exportFrom(tab: 'app' | 'share') {
  searchDialog.value = false
  emit('export', tab)
}

const settingsMenu = ref<{ toggle: (event: Event) => void } | null>(null)
const settingsItems = computed<MenuItem[]>(() => [
  {
    label: 'Editor appearance',
    items: APPEARANCES.map(a => ({ label: a.label, icon: a.icon, checked: editor.prefs.uiTheme === a.value, command: () => (editor.prefs.uiTheme = a.value) })),
  },
])
</script>

<template>
  <header class="flex h-12 shrink-0 items-center gap-2 border-b border-surface-200 px-3 sm:gap-3 dark:border-surface-800">
    <div class="hidden h-full shrink-0 items-center lg:flex">
      <AppLogo class="whitespace-nowrap" />
    </div>
    <Divider
      layout="vertical"
      class="!mx-1 hidden lg:block"
    />
    <EditorThemeSwitcher class="min-w-0" />

    <!-- Whether the theme is saved: quietly yes, or not (the way to keep it). -->
    <div class="flex shrink-0 items-center">
      <span
        v-if="workspace.saved"
        v-tooltip.bottom="'Saved in this browser. Export a share link or the theme file to keep a copy elsewhere.'"
        class="hidden items-center gap-1 text-xs text-surface-500 lg:flex dark:text-surface-400"
        role="status"
      >
        <i
          class="pi pi-check text-[10px]"
          aria-hidden="true"
        />
        Saved
      </span>
      <Button
        v-else
        v-tooltip.bottom="'This browser won’t let the editor save (private mode or full storage). Download the theme file to keep it.'"
        label="Not saved"
        icon="pi pi-exclamation-triangle"
        severity="warn"
        size="small"
        text
        class="!px-2 !py-1 !text-xs"
        @click="$emit('export', 'share')"
      />
    </div>

    <div
      ref="searchBox"
      class="hidden w-full max-w-72 min-w-0 md:block"
    >
      <EditorSearch
        ref="search"
        @export="exportFrom"
      />
    </div>

    <div class="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
      <Button
        v-tooltip.bottom="`Search (${mod}K)`"
        icon="pi pi-search"
        severity="secondary"
        size="small"
        text
        rounded
        aria-label="Search"
        class="md:!hidden"
        @click="searchDialog = true"
      />
      <Dialog
        v-model:visible="searchDialog"
        header="Search"
        modal
        dismissable-mask
        position="top"
        :style="{ width: '28rem' }"
        :breakpoints="{ '640px': 'calc(100vw - 2rem)' }"
        @show="dialogSearch?.focus()"
      >
        <EditorSearch
          ref="dialogSearch"
          inline
          @export="exportFrom"
          @done="searchDialog = false"
        />
      </Dialog>
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
        label="Export"
        icon="pi pi-code"
        size="small"
        aria-label="Export"
        :pt="{ label: { class: 'hidden sm:inline' } }"
        @click="$emit('export', 'app')"
      />
    </div>
  </header>
</template>
