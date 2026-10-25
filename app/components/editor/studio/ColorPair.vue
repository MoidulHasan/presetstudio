<script setup lang="ts">
import { useWorkspaceStore } from '~/stores/workspace'
import { usePresetStore } from '~/stores/preset'
import type { TokenDescriptor } from '~/utils/theme/schema'
import { tokenSource } from '~/utils/theme/semantic'

// A color token pair as one cell: the light and dark value side by side (☀ | ☾).
// Selecting it opens its editor in the panel (see studio/Button.vue), never a floating popup.
const props = defineProps<{ light?: TokenDescriptor, dark?: TokenDescriptor, label: string, selected?: boolean }>()
defineEmits<{ select: [] }>()

const workspace = useWorkspaceStore()
const preset = usePresetStore()

const value = (token: TokenDescriptor | undefined, scheme: 'light' | 'dark') =>
  token ? preset.resolvers?.[scheme].resolve(token.name)?.value ?? null : null

const lightValue = computed(() => value(props.light, 'light'))
const darkValue = computed(() => value(props.dark, 'dark'))
const custom = computed(() => [props.light, props.dark].some(t => t && tokenSource(t, workspace.theme.overrides, preset.designTokens) === 'custom'))

const EMPTY = 'repeating-linear-gradient(45deg, transparent 0 3px, rgba(127,127,127,.25) 3px 6px)'
</script>

<template>
  <Button
    v-tooltip.top="`${label}: ${lightValue ?? '—'} / ${darkValue ?? '—'}`"
    severity="secondary"
    text
    class="!relative !h-8 !w-full !min-w-0 !overflow-hidden !rounded-md !border !p-0"
    :class="selected ? '!border-surface-900 !ring-2 !ring-surface-900/30 dark:!border-surface-0 dark:!ring-surface-0/30' : '!border-surface-300 dark:!border-surface-600'"
    :aria-label="`Edit ${label}`"
    :aria-pressed="selected"
    @click="$emit('select')"
  >
    <span
      class="h-full flex-1"
      :style="{ background: lightValue ?? EMPTY }"
    />
    <span
      class="h-full flex-1"
      :style="{ background: darkValue ?? EMPTY }"
    />
    <span
      v-if="custom"
      class="absolute right-1 top-1 size-1.5 rounded-full bg-surface-900 ring-1 ring-white dark:bg-surface-0 dark:ring-black"
      aria-hidden="true"
    />
  </Button>
</template>
