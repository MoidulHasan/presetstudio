<script setup lang="ts">
const toast = useToast()

const severities = ['primary', 'secondary', 'success', 'info', 'warn', 'help', 'danger', 'contrast'] as const
const severity = (s: (typeof severities)[number]) => (s === 'primary' ? undefined : s)

const actions = [
  { label: 'Update', icon: 'pi pi-refresh', command: () => toast.add({ severity: 'success', summary: 'Updated', life: 2000 }) },
  { label: 'Delete', icon: 'pi pi-trash', command: () => toast.add({ severity: 'warn', summary: 'Deleted', life: 2000 }) },
  { separator: true },
  { label: 'Share', icon: 'pi pi-share-alt' },
]

const speedDial = [
  { label: 'Add', icon: 'pi pi-pencil' },
  { label: 'Update', icon: 'pi pi-refresh' },
  { label: 'Delete', icon: 'pi pi-trash' },
  { label: 'Upload', icon: 'pi pi-upload' },
]
</script>

<template>
  <div class="grid gap-4 md:grid-cols-2">
    <PreviewDemo
      title="Button · severities"
      wide
    >
      <div class="flex flex-wrap gap-2">
        <Button
          v-for="s in severities"
          :key="s"
          :label="s"
          :severity="severity(s)"
          class="capitalize"
        />
      </div>
      <div class="flex flex-wrap gap-2">
        <Button
          v-for="s in severities"
          :key="s"
          :label="s"
          :severity="severity(s)"
          class="capitalize"
          outlined
        />
      </div>
      <div class="flex flex-wrap gap-2">
        <Button
          v-for="s in severities"
          :key="s"
          :label="s"
          :severity="severity(s)"
          class="capitalize"
          text
        />
      </div>
    </PreviewDemo>

    <PreviewDemo title="Button · variants">
      <div class="flex flex-wrap items-center gap-2">
        <Button
          label="Icon"
          icon="pi pi-check"
        />
        <Button
          icon="pi pi-heart"
          rounded
          aria-label="Like"
        />
        <Button
          icon="pi pi-bookmark"
          severity="secondary"
          rounded
          outlined
          aria-label="Bookmark"
        />
        <Button
          label="Rounded"
          rounded
        />
        <Button
          label="Raised"
          raised
        />
        <Button
          label="Link"
          link
        />
        <Button
          label="Badge"
          badge="8"
          badge-severity="contrast"
          outlined
        />
      </div>
    </PreviewDemo>

    <PreviewDemo title="Button · states and sizes">
      <div class="flex flex-wrap items-center gap-2">
        <Button
          label="Loading"
          loading
        />
        <Button
          label="Disabled"
          disabled
        />
        <Button
          label="Small"
          size="small"
        />
        <Button label="Normal" />
        <Button
          label="Large"
          size="large"
        />
      </div>
    </PreviewDemo>

    <PreviewDemo title="ButtonGroup">
      <ButtonGroup>
        <Button
          label="Save"
          icon="pi pi-check"
        />
        <Button
          label="Delete"
          icon="pi pi-trash"
        />
        <Button
          label="Cancel"
          icon="pi pi-times"
        />
      </ButtonGroup>
    </PreviewDemo>

    <PreviewDemo title="SplitButton">
      <div class="flex flex-wrap gap-2">
        <SplitButton
          label="Save"
          :model="actions"
          @click="toast.add({ severity: 'success', summary: 'Saved', life: 2000 })"
        />
        <SplitButton
          label="Save"
          :model="actions"
          severity="secondary"
          outlined
        />
      </div>
    </PreviewDemo>

    <PreviewDemo title="SpeedDial">
      <div class="relative h-20">
        <SpeedDial
          :model="speedDial"
          direction="right"
          :style="{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)' }"
          :tooltip-options="{ position: 'top', event: 'hover' }"
        />
      </div>
    </PreviewDemo>
  </div>
</template>
