<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import type { TokenDescriptor } from '~/utils/theme/schema'
import { tokenSource } from '~/utils/theme/semantic'

// A padding token ('0.5rem 0.75rem') as vertical and horizontal sliders in px.
const props = withDefaults(defineProps<{ token: TokenDescriptor, label: string, hint?: string, max?: number }>(), { hint: undefined, max: 40 })

const store = useEditorStore()

const resolved = computed(() => store.resolvers?.light.resolve(props.token.name) ?? null)
const source = computed(() => tokenSource(props.token, store.theme.overrides, store.designTokens))

const LENGTH_RE = /^(-?\d*\.?\d+)(px|rem|em)?$/
const toPx = (part: string) => {
  const m = LENGTH_RE.exec(part)
  if (!m) return null
  return m[2] === 'rem' || m[2] === 'em' ? Number(m[1]) * 16 : Number(m[1])
}

/** [vertical, horizontal] in px, or null for values that aren't one or two lengths. */
const parts = computed<[number, number] | null>(() => {
  const values = (resolved.value?.value ?? '').trim().split(/\s+/).map(toPx)
  if (values.some(v => v === null) || !values.length || values.length > 2) return null
  return [values[0]!, values[values.length - 1]!]
})

const usesRem = computed(() => /rem/.test(resolved.value?.value ?? '') || !/px/.test(resolved.value?.value ?? ''))
const format = (px: number) => (px === 0 ? '0' : usesRem.value ? `${Math.round((px / 16) * 1000) / 1000}rem` : `${px}px`)

function set(axis: 0 | 1, value: number | number[]) {
  const n = Array.isArray(value) ? value[0]! : value
  if (!parts.value) return
  const next: [number, number] = [...parts.value]
  next[axis] = n
  store.setToken(props.token.path, `${format(next[0])} ${format(next[1])}`)
}

const follows = computed(() => {
  const single = /^\{([^{}]+)\}$/.exec(String(resolved.value?.raw ?? '').trim())
  return source.value !== 'custom' && single ? single[1]!.replace(/\./g, ' ') : null
})
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
        <span class="font-mono text-surface-500">{{ parts ? `${parts[0]} / ${parts[1]}px` : resolved?.value }}</span>
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
    <template v-if="parts">
      <div
        v-for="axis in [0, 1] as const"
        :key="axis"
        class="flex items-center gap-3"
      >
        <span class="w-16 shrink-0 text-[11px] text-surface-500">{{ axis === 0 ? 'Vertical' : 'Horizontal' }}</span>
        <Slider
          :model-value="parts[axis]"
          :min="0"
          :max="Math.max(max, parts[axis])"
          :step="1"
          class="flex-1"
          :aria-label="`${label} ${axis === 0 ? 'vertical' : 'horizontal'}`"
          @update:model-value="v => set(axis, v)"
        />
      </div>
    </template>
    <p
      v-if="follows"
      class="truncate text-[11px] text-surface-500"
    >
      Follows {{ follows }}
    </p>
  </div>
</template>
