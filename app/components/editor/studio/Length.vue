<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import type { TokenDescriptor } from '~/utils/theme/schema'
import { tokenSource } from '~/utils/theme/semantic'

// A length token (padding, radius, size) as a slider in px. Shows what the token follows
// (e.g. "form field padding x") until it's given its own value.
const props = withDefaults(defineProps<{ token?: TokenDescriptor, label: string, hint?: string, max?: number, min?: number, step?: number }>(), { token: undefined, hint: undefined, max: 40, min: 0, step: 1 })

const store = useEditorStore()

const resolved = computed(() => (props.token ? store.resolvers?.light.resolve(props.token.name) ?? null : null))
const source = computed(() => (props.token ? tokenSource(props.token, store.theme.overrides, store.designTokens) : 'base'))

/** Value in px, or null when it isn't a single length (e.g. '0 1rem'). */
const px = computed(() => {
  const m = /^(-?\d*\.?\d+)(px|rem|em)?$/.exec(resolved.value?.value.trim() ?? '')
  if (!m) return null
  const n = Number(m[1])
  return m[2] === 'rem' || m[2] === 'em' ? n * 16 : n
})

/** Keep the unit the preset uses. */
const usesRem = computed(() => /rem/.test(resolved.value?.value ?? ''))

const follows = computed(() => {
  const raw = String(resolved.value?.raw ?? '')
  const single = /^\{([^{}]+)\}$/.exec(raw.trim())
  return source.value !== 'custom' && single ? single[1]!.replace(/\./g, ' ') : null
})

function set(value: number | number[]) {
  const n = Array.isArray(value) ? value[0]! : value
  if (!props.token) return
  const text = usesRem.value ? `${Math.round((n / 16) * 1000) / 1000}rem` : `${n}px`
  store.setToken(props.token.path, n === 0 ? '0' : text)
}

const display = computed(() => (px.value === null ? resolved.value?.value ?? '—' : `${Math.round(px.value * 10) / 10}px`))
</script>

<template>
  <div
    v-if="token"
    class="flex flex-col gap-1.5"
  >
    <div class="flex items-center justify-between gap-2 text-xs">
      <span class="flex min-w-0 items-center gap-1.5 font-medium">
        {{ label }}
        <span
          v-if="hint"
          class="truncate font-normal text-surface-500"
        >· {{ hint }}</span>
        <span
          v-if="source === 'custom'"
          v-tooltip.top="'Custom value'"
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
      v-if="px !== null"
      :model-value="px"
      :min="min"
      :max="Math.max(max, px)"
      :step="step"
      :aria-label="label"
      @update:model-value="set"
    />
    <p
      v-if="follows"
      class="truncate text-[11px] text-surface-500"
    >
      Follows {{ follows }}
    </p>
  </div>
</template>
