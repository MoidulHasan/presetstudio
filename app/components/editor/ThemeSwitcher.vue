<script setup lang="ts">
import type { FileUploadUploaderEvent } from 'primevue/fileupload'
import type { MenuItem } from 'primevue/menuitem'
import { useWorkspaceStore } from '~/stores/workspace'
import { usePresetStore } from '~/stores/preset'
import { MAX_THEME_SIZE, parseThemeFile } from '~/utils/theme/share'

const workspace = useWorkspaceStore()
const preset = usePresetStore()
const toast = useToast()
const undoHint = import.meta.client && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘Z' : 'Ctrl+Z'

const menu = ref<{ toggle: (event: Event) => void } | null>(null)

type DialogMode = 'create' | 'duplicate' | 'rename'
const dialog = ref<DialogMode | null>(null)
const nameInput = ref('')
const deleteVisible = ref(false)

const dialogTitle = computed(() => ({ create: 'New theme', duplicate: 'Duplicate theme', rename: 'Rename theme' })[dialog.value ?? 'create'])

function openDialog(mode: DialogMode) {
  nameInput.value = mode === 'rename' ? workspace.activeDoc.name : mode === 'duplicate' ? `${workspace.activeDoc.name} copy` : 'New theme'
  dialog.value = mode
}

function submitDialog() {
  const name = nameInput.value.trim()
  if (!name || !dialog.value) return
  if (dialog.value === 'rename') workspace.renameTheme(workspace.activeDoc.id, name)
  else {
    workspace.createTheme(name, dialog.value === 'duplicate' ? 'duplicate' : 'blank')
    toast.add({ severity: 'success', summary: `Created “${workspace.activeDoc.name}”`, life: 2500 })
  }
  dialog.value = null
}

const items = computed<MenuItem[]>(() => [
  { label: 'New theme', icon: 'pi pi-plus', command: () => openDialog('create') },
  { label: 'Duplicate', icon: 'pi pi-copy', command: () => openDialog('duplicate') },
  { label: 'Rename', icon: 'pi pi-pencil', command: () => openDialog('rename') },
  { label: 'Import theme file…', icon: 'pi pi-upload', command: () => (importVisible.value = true) },
  { separator: true },
  { label: 'Reset to base preset', icon: 'pi pi-refresh', command: () => {
    preset.resetTheme()
    toast.add({ severity: 'secondary', summary: 'Theme reset to the base preset', detail: `Press ${undoHint} to undo.`, life: 3000 })
  } },
  {
    label: 'Delete',
    icon: 'pi pi-trash',
    disabled: workspace.state.themes.length <= 1,
    command: () => (deleteVisible.value = true),
  },
])

// --- Import a theme file (read locally, validated, added as a new theme) ------------------
const importVisible = ref(false)

async function importFile(event: FileUploadUploaderEvent) {
  const file = Array.isArray(event.files) ? event.files[0] : event.files
  if (!file) return
  const shared = file.size <= MAX_THEME_SIZE ? parseThemeFile(await file.text()) : null
  if (!shared) {
    toast.add({ severity: 'error', summary: 'Not a theme file', detail: `“${file.name}” isn't a Preset Studio theme file, or it's damaged.`, life: 5000 })
    return
  }
  const doc = workspace.importTheme(shared.name, shared.theme)
  importVisible.value = false
  toast.add({ severity: 'success', summary: `Imported “${doc.name}”`, detail: 'Added as a new theme.', life: 3000 })
}

function confirmDelete() {
  const name = workspace.activeDoc.name
  workspace.deleteTheme(workspace.activeDoc.id)
  toast.add({ severity: 'secondary', summary: `Deleted “${name}”`, life: 2500 })
  deleteVisible.value = false
}
</script>

<template>
  <div class="flex items-center gap-1">
    <Select
      :model-value="workspace.state.activeId"
      :options="workspace.state.themes"
      option-label="name"
      option-value="id"
      aria-label="Active theme"
      size="small"
      class="w-32 min-w-0 sm:w-48"
      @update:model-value="workspace.switchTheme"
    />
    <Button
      v-tooltip.bottom="'Theme actions'"
      icon="pi pi-ellipsis-v"
      severity="secondary"
      size="small"
      text
      rounded
      aria-label="Theme actions"
      aria-haspopup="true"
      aria-controls="theme-actions"
      @click="menu?.toggle($event)"
    />
    <Menu
      id="theme-actions"
      ref="menu"
      :model="items"
      popup
    />

    <Dialog
      :visible="dialog !== null"
      :header="dialogTitle"
      modal
      :style="{ width: '24rem' }"
      @update:visible="v => !v && (dialog = null)"
    >
      <form
        class="flex flex-col gap-4"
        @submit.prevent="submitDialog"
      >
        <div class="flex flex-col gap-2">
          <label
            for="theme-name"
            class="text-sm font-medium"
          >Name</label>
          <InputText
            id="theme-name"
            v-model="nameInput"
            maxlength="60"
            autofocus
            autocomplete="off"
          />
        </div>
        <div class="flex justify-end gap-2">
          <Button
            label="Cancel"
            severity="secondary"
            text
            @click="dialog = null"
          />
          <Button
            type="submit"
            :label="dialog === 'rename' ? 'Rename' : 'Create'"
            :disabled="!nameInput.trim()"
          />
        </div>
      </form>
    </Dialog>

    <Dialog
      v-model:visible="importVisible"
      header="Import theme file"
      modal
      :style="{ width: '26rem' }"
    >
      <div class="flex flex-col gap-4">
        <p class="text-sm">
          Choose a <code class="font-mono text-xs">.json</code> theme file saved from Preset Studio
          (Export → Share). It's added as a new theme; your themes stay as they are.
        </p>
        <FileUpload
          mode="basic"
          accept="application/json,.json"
          :max-file-size="MAX_THEME_SIZE"
          choose-label="Choose file"
          choose-icon="pi pi-upload"
          custom-upload
          auto
          @uploader="importFile"
        />
      </div>
    </Dialog>

    <Dialog
      v-model:visible="deleteVisible"
      header="Delete theme?"
      modal
      :style="{ width: '24rem' }"
    >
      <p class="mb-4 text-sm">
        "{{ workspace.activeDoc.name }}" will be removed from this browser. This can't be undone.
      </p>
      <div class="flex justify-end gap-2">
        <Button
          label="Cancel"
          severity="secondary"
          text
          @click="deleteVisible = false"
        />
        <Button
          label="Delete"
          severity="danger"
          @click="confirmDelete"
        />
      </div>
    </Dialog>
  </div>
</template>
