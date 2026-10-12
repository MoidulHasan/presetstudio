<script setup lang="ts">
import type { MenuItem } from 'primevue/menuitem'
import { useEditorStore } from '~/stores/editor'

const store = useEditorStore()

const menu = ref<{ toggle: (event: Event) => void } | null>(null)

type DialogMode = 'create' | 'duplicate' | 'rename'
const dialog = ref<DialogMode | null>(null)
const nameInput = ref('')
const deleteVisible = ref(false)

const dialogTitle = computed(() => ({ create: 'New theme', duplicate: 'Duplicate theme', rename: 'Rename theme' })[dialog.value ?? 'create'])

function openDialog(mode: DialogMode) {
  nameInput.value = mode === 'rename' ? store.activeDoc.name : mode === 'duplicate' ? `${store.activeDoc.name} copy` : 'New theme'
  dialog.value = mode
}

function submitDialog() {
  const name = nameInput.value.trim()
  if (!name || !dialog.value) return
  if (dialog.value === 'rename') store.renameTheme(store.activeDoc.id, name)
  else store.createTheme(name, dialog.value === 'duplicate' ? 'duplicate' : 'blank')
  dialog.value = null
}

const items = computed<MenuItem[]>(() => [
  { label: 'New theme', icon: 'pi pi-plus', command: () => openDialog('create') },
  { label: 'Duplicate', icon: 'pi pi-copy', command: () => openDialog('duplicate') },
  { label: 'Rename', icon: 'pi pi-pencil', command: () => openDialog('rename') },
  { separator: true },
  { label: 'Reset to base preset', icon: 'pi pi-refresh', command: () => store.resetTheme() },
  {
    label: 'Delete',
    icon: 'pi pi-trash',
    disabled: store.workspace.themes.length <= 1,
    command: () => (deleteVisible.value = true),
  },
])

function confirmDelete() {
  store.deleteTheme(store.activeDoc.id)
  deleteVisible.value = false
}
</script>

<template>
  <div class="flex items-center gap-1">
    <Select
      :model-value="store.workspace.activeId"
      :options="store.workspace.themes"
      option-label="name"
      option-value="id"
      aria-label="Active theme"
      size="small"
      class="w-48"
      @update:model-value="store.switchTheme"
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
      v-model:visible="deleteVisible"
      header="Delete theme?"
      modal
      :style="{ width: '24rem' }"
    >
      <p class="mb-4 text-sm">
        "{{ store.activeDoc.name }}" will be removed from this browser. This can't be undone.
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
