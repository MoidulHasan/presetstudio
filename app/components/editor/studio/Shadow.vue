<script setup lang="ts">
import { useWorkspaceStore } from '~/stores/workspace'
import { usePresetStore } from '~/stores/preset'
import type { TokenDescriptor } from '~/utils/theme/schema'
import { tokenSource } from '~/utils/theme/semantic'

// A shadow token as presets (the preset's own value shows as "Preset" when it's not one of them).
const props = defineProps<{ token: TokenDescriptor, label: string, hint?: string }>()

const workspace = useWorkspaceStore()
const preset = usePresetStore()
const id = useId()

interface ShadowPreset { value: string, label: string }

const SHADOWS: ShadowPreset[] = [
  { value: 'none', label: 'None' },
  { value: '0 1px 2px 0 rgba(0, 0, 0, 0.08)', label: 'Subtle' },
  { value: '0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12)', label: 'Medium' },
  { value: '0 4px 12px -2px rgba(0, 0, 0, 0.25)', label: 'Strong' },
]

const raw = computed(() => String(preset.resolvers?.light.resolve(props.token.name)?.raw ?? ''))
const custom = computed(() => tokenSource(props.token, workspace.theme.overrides, preset.designTokens) === 'custom')
const options = computed(() => {
  if (SHADOWS.some(s => s.value === raw.value)) return SHADOWS
  return [{ value: raw.value, label: custom.value ? 'Custom' : 'Preset' }, ...SHADOWS]
})
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
        :model-value="raw"
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
