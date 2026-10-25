<script setup lang="ts">
import { useWorkspaceStore } from '~/stores/workspace'
import { usePresetStore } from '~/stores/preset'
import type { TokenDescriptor } from '~/utils/theme/schema'
import { tokenSource } from '~/utils/theme/semantic'

// A font weight token as a select.
const props = defineProps<{ token: TokenDescriptor, label: string, hint?: string }>()

const workspace = useWorkspaceStore()
const preset = usePresetStore()
const id = useId()

const WEIGHTS = [
  { value: '300', label: 'Light' },
  { value: '400', label: 'Regular' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semibold' },
  { value: '700', label: 'Bold' },
  { value: '800', label: 'Extra bold' },
]

const value = computed(() => preset.resolvers?.light.resolve(props.token.name)?.value)
const options = computed(() => (WEIGHTS.some(w => w.value === value.value) || !value.value ? WEIGHTS : [...WEIGHTS, { value: value.value, label: value.value }]))
const custom = computed(() => tokenSource(props.token, workspace.theme.overrides, preset.designTokens) === 'custom')
</script>

<template>
  <div class="flex items-center justify-between gap-3">
    <label
      :for="id"
      class="flex min-w-0 items-center gap-1.5 text-xs font-medium"
    >
      {{ label }}
      <span
        v-if="hint"
        class="truncate font-normal text-surface-500"
      >· {{ hint }}</span>
      <span
        v-if="custom"
        class="size-1.5 shrink-0 rounded-full bg-surface-900 dark:bg-surface-0"
        aria-hidden="true"
      />
    </label>
    <div class="flex shrink-0 items-center gap-1">
      <Select
        :input-id="id"
        :model-value="value"
        :options="options"
        option-label="label"
        option-value="value"
        size="small"
        class="w-36"
        @update:model-value="(v: string) => preset.setToken(token.path, v)"
      />
      <Button
        v-if="custom"
        v-tooltip.left="'Back to the preset value'"
        icon="pi pi-undo"
        severity="secondary"
        size="small"
        text
        rounded
        class="!size-6"
        :aria-label="`Reset ${label}`"
        @click="preset.resetToken(token.path)"
      />
    </div>
  </div>
</template>
