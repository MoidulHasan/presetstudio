<script setup lang="ts">
import { SCHEME_CLASS } from '~/composables/usePreviewForcedStyles'

// Light and dark side by side for a component stage; the slot renders one scheme.
// `stacked`: light above dark, for wide grids that need the full width.
// `single`: light only, for things that look the same in both modes (shape, density).
const props = withDefaults(defineProps<{ intro: string, stacked?: boolean, single?: boolean }>(), { stacked: false, single: false })

const ALL_SCHEMES = [
  { key: 'light', label: 'Light', icon: 'pi pi-sun', cls: SCHEME_CLASS },
  { key: 'dark', label: 'Dark', icon: 'pi pi-moon', cls: `${SCHEME_CLASS} ps-dark` },
] as const
const SCHEMES = computed(() => (props.single ? ALL_SCHEMES.slice(0, 1) : ALL_SCHEMES))
</script>

<template>
  <div class="mx-auto flex max-w-7xl flex-col gap-4">
    <p class="text-xs text-muted-color">
      {{ intro }}
    </p>
    <div
      class="grid gap-4"
      :class="stacked || single ? '' : 'xl:grid-cols-2'"
    >
      <section
        v-for="scheme in SCHEMES"
        :key="scheme.key"
        :class="scheme.cls"
        class="flex min-w-0 flex-col gap-8 rounded-xl border border-surface bg-surface-0 p-5 text-color dark:bg-surface-900"
        :aria-label="`${scheme.label} mode`"
      >
        <h2 class="flex items-center gap-2 text-sm font-semibold">
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
