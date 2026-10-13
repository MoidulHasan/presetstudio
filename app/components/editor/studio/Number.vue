<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import type { TokenDescriptor } from '~/utils/theme/schema'
import { tokenSource } from '~/utils/theme/semantic'

// A unitless number (opacity) or a duration ('0.2s', '150ms') as a slider.
const props = defineProps<{ token: TokenDescriptor, label: string, hint?: string }>()

const store = useEditorStore()

const resolved = computed(() => store.resolvers?.light.resolve(props.token.name)?.value ?? '')
const source = computed(() => tokenSource(props.token, store.theme.overrides, store.designTokens))
const duration = computed(() => /^\d*\.?\d+m?s$/.test(resolved.value.trim()))

/** Opacity as 0–1, durations in ms. */
const value = computed(() => {
  const v = resolved.value.trim()
  if (duration.value) return v.endsWith('ms') ? Number.parseFloat(v) : Number.parseFloat(v) * 1000
  const n = Number.parseFloat(v)
  return Number.isFinite(n) ? n : null
})

const range = computed(() => (duration.value ? { min: 0, max: 1000, step: 10 } : { min: 0, max: 1, step: 0.05 }))
const display = computed(() => (value.value === null ? resolved.value : duration.value ? `${Math.round(value.value)}ms` : `${Math.round(value.value * 100)}%`))

function set(v: number | number[]) {
  const n = Array.isArray(v) ? v[0]! : v
  store.setToken(props.token.path, duration.value ? `${Math.round(n)}ms` : String(Math.round(n * 100) / 100))
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <div class="flex items-center justify-between gap-2 text-xs">
      <span class="flex min-w-0 items-center gap-1.5 font-medium">
        {{ label }}
        <span
          v-if="hint"
          class="truncate font-normal text-surface-500"
        >· {{ hint }}</span>
        <span
          v-if="source === 'custom'"
          class="size-1.5 shrink-0 rounded-full bg-surface-900 dark:bg-surface-0"
          aria-hidden="true"
        />
      </span>
      <span class="flex shrink-0 items-center gap-1">
        <span class="font-mono text-surface-500">{{ display }}</span>
        <Button
          v-if="source === 'custom'"
          v-tooltip.left="'Back to the preset value'"
          icon="pi pi-undo"
          severity="secondary"
          size="small"
          text
          rounded
          class="!size-6"
          :aria-label="`Reset ${label}`"
          @click="store.resetToken(token.path)"
        />
      </span>
    </div>
    <Slider
      v-if="value !== null"
      :model-value="value"
      :min="range.min"
      :max="Math.max(range.max, value)"
      :step="range.step"
      :aria-label="label"
      @update:model-value="set"
    />
  </div>
</template>
