<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import type { TokenDescriptor } from '~/utils/theme/schema'
import { tokenSource } from '~/utils/theme/semantic'

// A color token pair: the light and dark value side by side (☀ | ☾). Opens an editor for both.
const props = defineProps<{ light?: TokenDescriptor, dark?: TokenDescriptor, label: string, highlight?: boolean }>()

const store = useEditorStore()
const popover = ref<{ toggle: (event: Event) => void } | null>(null)

const value = (token: TokenDescriptor | undefined, scheme: 'light' | 'dark') =>
  token ? store.resolvers?.[scheme].resolve(token.name)?.value ?? null : null

const lightValue = computed(() => value(props.light, 'light'))
const darkValue = computed(() => value(props.dark, 'dark'))
const custom = computed(() => [props.light, props.dark].some(t => t && tokenSource(t, store.theme.overrides, store.designTokens) === 'custom'))

const EMPTY = 'repeating-linear-gradient(45deg, transparent 0 3px, rgba(127,127,127,.25) 3px 6px)'
</script>

<template>
  <Button
    v-tooltip.top="`${label}: ${lightValue ?? '—'} / ${darkValue ?? '—'}`"
    severity="secondary"
    text
    class="!relative !h-8 !w-full !min-w-0 !overflow-hidden !rounded-md !border !p-0"
    :class="highlight ? '!border-primary !ring-2 !ring-primary/40' : '!border-surface-300 dark:!border-surface-600'"
    :aria-label="`Edit ${label}`"
    @click="popover?.toggle($event)"
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
  <Popover ref="popover">
    <div class="flex w-[22rem] flex-col gap-3">
      <p class="text-sm font-semibold">
        {{ label }}
      </p>
      <div
        v-for="item in [{ token: light, scheme: 'light' as const, label: 'Light mode' }, { token: dark, scheme: 'dark' as const, label: 'Dark mode' }]"
        :key="item.scheme"
      >
        <EditorTokenRow
          v-if="item.token"
          :token="item.token"
          :scheme="item.scheme"
          :label="item.label"
          :expanded="true"
        />
        <p
          v-else
          class="px-2 text-xs text-surface-500"
        >
          {{ item.label }}: not set.
        </p>
      </div>
    </div>
  </Popover>
</template>
