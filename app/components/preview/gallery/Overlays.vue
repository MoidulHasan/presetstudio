<script setup lang="ts">
const toast = useToast()
const confirm = useConfirm()

const dialogVisible = ref(false)
const drawerVisible = ref(false)
const popover = ref<{ toggle: (event: Event) => void } | null>(null)

function confirmDialog() {
  confirm.require({
    group: 'gallery-dialog',
    header: 'Delete project?',
    message: 'This removes the project and all its files.',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: { label: 'Cancel', severity: 'secondary', outlined: true },
    acceptProps: { label: 'Delete', severity: 'danger' },
    accept: () => toast.add({ severity: 'info', summary: 'Deleted', life: 2000 }),
  })
}

function confirmPopup(event: Event) {
  confirm.require({
    group: 'gallery-popup',
    target: event.currentTarget as HTMLElement,
    message: 'Publish this version?',
    icon: 'pi pi-info-circle',
    rejectProps: { label: 'No', severity: 'secondary', outlined: true, size: 'small' },
    acceptProps: { label: 'Yes', size: 'small' },
    accept: () => toast.add({ severity: 'success', summary: 'Published', life: 2000 }),
  })
}
</script>

<template>
  <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    <PreviewDemo title="Dialog">
      <Button
        label="Open dialog"
        icon="pi pi-external-link"
        class="w-fit"
        @click="dialogVisible = true"
      />
    </PreviewDemo>

    <PreviewDemo title="Drawer">
      <Button
        label="Open drawer"
        icon="pi pi-arrow-left"
        class="w-fit"
        @click="drawerVisible = true"
      />
    </PreviewDemo>

    <PreviewDemo title="Popover">
      <Button
        label="Show popover"
        icon="pi pi-users"
        severity="secondary"
        class="w-fit"
        @click="popover?.toggle($event)"
      />
    </PreviewDemo>

    <PreviewDemo title="ConfirmDialog">
      <Button
        label="Delete project"
        severity="danger"
        outlined
        class="w-fit"
        @click="confirmDialog"
      />
    </PreviewDemo>

    <PreviewDemo title="ConfirmPopup">
      <Button
        label="Publish"
        class="w-fit"
        @click="confirmPopup($event)"
      />
    </PreviewDemo>

    <PreviewDemo title="Tooltip">
      <div class="flex gap-2">
        <InputText
          v-tooltip.top="'Enter your username'"
          placeholder="Hover me"
        />
        <Button
          v-tooltip.bottom="'Settings'"
          icon="pi pi-cog"
          severity="secondary"
          aria-label="Settings"
        />
      </div>
    </PreviewDemo>

    <Dialog
      v-model:visible="dialogVisible"
      header="Edit profile"
      modal
      :style="{ width: '26rem' }"
    >
      <p class="mb-4 text-muted-color">
        Update your information.
      </p>
      <div class="mb-6 flex flex-col gap-2">
        <label
          for="ov-username"
          class="text-sm font-medium"
        >Username</label>
        <InputText
          id="ov-username"
          autocomplete="off"
        />
      </div>
      <div class="flex justify-end gap-2">
        <Button
          label="Cancel"
          severity="secondary"
          @click="dialogVisible = false"
        />
        <Button
          label="Save"
          @click="dialogVisible = false"
        />
      </div>
    </Dialog>

    <Drawer
      v-model:visible="drawerVisible"
      header="Filters"
      position="right"
    >
      <p class="text-muted-color">
        Drawers slide in from any edge.
      </p>
    </Drawer>

    <Popover ref="popover">
      <div class="flex w-64 flex-col gap-3">
        <span class="font-medium">Team members</span>
        <div
          v-for="name in ['Lena Park', 'Omar Aziz', 'Mia Chen']"
          :key="name"
          class="flex items-center gap-2"
        >
          <Avatar
            :label="name[0]"
            shape="circle"
          />
          <span class="flex-1 text-sm">{{ name }}</span>
          <Tag
            value="Editor"
            severity="secondary"
          />
        </div>
      </div>
    </Popover>

    <ConfirmDialog group="gallery-dialog" />
    <ConfirmPopup group="gallery-popup" />
  </div>
</template>
