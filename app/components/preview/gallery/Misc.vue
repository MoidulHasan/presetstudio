<script setup lang="ts">
import TerminalService from 'primevue/terminalservice'

const toast = useToast()
const blocked = ref(false)
const chips = ref(['Design', 'Vue', 'Accessibility'])

const meter = [
  { label: 'Apps', color: 'var(--p-primary-color)', value: 34, icon: 'pi pi-table' },
  { label: 'Media', color: 'var(--p-primary-300)', value: 22, icon: 'pi pi-image' },
  { label: 'System', color: 'var(--p-surface-400)', value: 14, icon: 'pi pi-cog' },
]

function onCommand(text: string) {
  const response = text === 'date' ? new Date().toDateString() : text === 'help' ? 'Try: date, greet' : text === 'greet' ? 'Hello from Preset Studio!' : `Unknown command: ${text}`
  TerminalService.emit('response', response)
}
onMounted(() => TerminalService.on('command', onCommand))
onBeforeUnmount(() => TerminalService.off('command', onCommand))
</script>

<template>
  <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    <PreviewDemo title="Avatar · AvatarGroup">
      <div class="flex items-center gap-2">
        <Avatar
          label="AL"
          size="large"
        />
        <Avatar
          icon="pi pi-user"
          size="large"
          shape="circle"
        />
        <Avatar
          label="P"
          class="!bg-primary !text-primary-contrast"
          size="large"
          shape="circle"
        />
      </div>
      <AvatarGroup>
        <Avatar
          v-for="initials in ['AL', 'AT', 'GH', 'KJ']"
          :key="initials"
          :label="initials"
          shape="circle"
        />
        <Avatar
          label="+5"
          shape="circle"
        />
      </AvatarGroup>
    </PreviewDemo>

    <PreviewDemo title="Badge · OverlayBadge">
      <div class="flex flex-wrap items-center gap-2">
        <Badge value="2" />
        <Badge
          value="8"
          severity="secondary"
        />
        <Badge
          value="New"
          severity="success"
        />
        <Badge
          value="!"
          severity="danger"
        />
        <Badge
          value="Pro"
          severity="contrast"
        />
      </div>
      <div class="flex items-center gap-6">
        <OverlayBadge value="4">
          <i
            class="pi pi-bell"
            style="font-size: 1.75rem"
            aria-label="4 notifications"
          />
        </OverlayBadge>
        <OverlayBadge severity="danger">
          <i
            class="pi pi-envelope"
            style="font-size: 1.75rem"
            aria-label="Unread mail"
          />
        </OverlayBadge>
      </div>
    </PreviewDemo>

    <PreviewDemo title="Tag · Chip">
      <div class="flex flex-wrap gap-2">
        <Tag value="Primary" />
        <Tag
          value="Success"
          severity="success"
          icon="pi pi-check"
        />
        <Tag
          value="Warn"
          severity="warn"
        />
        <Tag
          value="Danger"
          severity="danger"
          rounded
        />
      </div>
      <div class="flex flex-wrap gap-2">
        <Chip
          v-for="chip in chips"
          :key="chip"
          :label="chip"
          removable
          @remove="chips = chips.filter(c => c !== chip)"
        />
        <Chip
          label="With icon"
          icon="pi pi-star"
        />
      </div>
    </PreviewDemo>

    <PreviewDemo title="ProgressBar · ProgressSpinner">
      <ProgressBar :value="64" />
      <ProgressBar
        mode="indeterminate"
        style="height: 6px"
      />
      <ProgressSpinner
        style="width: 40px; height: 40px"
        stroke-width="6"
        aria-label="Loading"
      />
    </PreviewDemo>

    <PreviewDemo title="MeterGroup">
      <MeterGroup :value="meter" />
    </PreviewDemo>

    <PreviewDemo title="Skeleton">
      <div class="flex items-center gap-3">
        <Skeleton
          shape="circle"
          size="3rem"
        />
        <div class="flex flex-1 flex-col gap-2">
          <Skeleton width="60%" />
          <Skeleton width="40%" />
        </div>
      </div>
      <Skeleton height="4rem" />
    </PreviewDemo>

    <PreviewDemo title="BlockUI">
      <ToggleButton
        v-model="blocked"
        on-label="Unblock"
        off-label="Block"
        class="w-fit"
      />
      <BlockUI :blocked="blocked">
        <Panel header="Blockable panel">
          <p class="m-0">
            Content is blocked with a mask while loading.
          </p>
        </Panel>
      </BlockUI>
    </PreviewDemo>

    <PreviewDemo title="Inplace">
      <Inplace>
        <template #display>
          <span class="inline-flex items-center gap-2"><i
            class="pi pi-pencil"
            aria-hidden="true"
          />Click to edit</span>
        </template>
        <template #content="{ closeCallback }">
          <span class="inline-flex items-center gap-2">
            <InputText
              autofocus
              size="small"
              aria-label="Value"
            />
            <Button
              icon="pi pi-check"
              size="small"
              text
              aria-label="Done"
              @click="() => { closeCallback(); toast.add({ severity: 'success', summary: 'Saved', life: 1500 }) }"
            />
          </span>
        </template>
      </Inplace>
    </PreviewDemo>

    <PreviewDemo title="Terminal">
      <Terminal
        welcome-message="Type 'help'"
        prompt="preset $"
        aria-label="Terminal"
        class="h-32"
      />
    </PreviewDemo>
  </div>
</template>
