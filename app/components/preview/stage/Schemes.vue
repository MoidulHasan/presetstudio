<script setup lang="ts">
import { PREVIEW_BOTH, PREVIEW_SCHEME, SCHEME_CLASS } from '~/composables/usePreviewForcedStyles'
import type { ColorScheme } from '~/utils/theme/types'

// Light and dark for a component stage, following the editor's one Light | Dark | Both switch:
// the chosen mode, or both ("Both"), side by side when there's room, otherwise light above dark.
// `stacked`: always light above dark, for wide grids that need the full width.
// `single`: one mode only, for things that look the same in both (shape, density); "Both"
// shows light. The mode is named only when both show; `intro` is for screen readers (what to do
// with the stage shows itself: clickable parts point and outline on hover).
const props = withDefaults(defineProps<{ intro: string, stacked?: boolean, single?: boolean }>(), { stacked: false, single: false })

const ALL_SCHEMES = [
  { key: 'light', label: 'Light', icon: 'pi pi-sun', cls: SCHEME_CLASS },
  { key: 'dark', label: 'Dark', icon: 'pi pi-moon', cls: `${SCHEME_CLASS} ps-dark` },
] as const

const editorScheme = inject(PREVIEW_SCHEME, ref<ColorScheme>('light'))
const both = inject(PREVIEW_BOTH, ref(false))

const schemes = computed(() => {
  if (both.value) return props.single ? ALL_SCHEMES.slice(0, 1) : ALL_SCHEMES
  return ALL_SCHEMES.filter(s => s.key === editorScheme.value)
})
</script>

<template>
  <div class="mx-auto flex max-w-7xl flex-col">
    <p class="sr-only">
      {{ intro }}
    </p>
    <div
      class="grid gap-3"
      :class="schemes.length > 1 && !stacked ? 'xl:grid-cols-2' : ''"
    >
      <section
        v-for="scheme in schemes"
        :key="scheme.key"
        :class="scheme.cls"
        class="flex min-w-0 flex-col gap-6 rounded-xl border border-surface bg-surface-0 p-4 text-color dark:bg-surface-900"
        :aria-label="`${scheme.label} mode`"
      >
        <h2
          v-if="schemes.length > 1"
          class="flex items-center gap-2 text-sm font-semibold"
        >
          <i
            :class="scheme.icon"
            aria-hidden="true"
          />
          {{ scheme.label }}
        </h2>
        <slot :scheme="scheme.key" />
      </section>
    </div>
  </div>
</template>
