<script setup lang="ts">
import { SCHEME_CLASS } from '~/composables/usePreviewForcedStyles'
import type { ColorScheme } from '~/utils/theme/types'

// Light and dark side by side for a component stage; the slot renders one scheme.
// Below xl there's no room for two columns: a Light | Dark switch shows one at a time
// (it follows the editor's color scheme, see preview.vue).
// `stacked`: light above dark from xl up, for wide grids that need the full width.
// `single`: light only, for things that look the same in both modes (shape, density).
const props = withDefaults(defineProps<{ intro: string, stacked?: boolean, single?: boolean }>(), { stacked: false, single: false })

const ALL_SCHEMES = [
  { key: 'light', label: 'Light', icon: 'pi pi-sun', cls: SCHEME_CLASS },
  { key: 'dark', label: 'Dark', icon: 'pi pi-moon', cls: `${SCHEME_CLASS} ps-dark` },
] as const
const SCHEMES = computed(() => (props.single ? ALL_SCHEMES.slice(0, 1) : ALL_SCHEMES))

const shown = useStageScheme()
const SWITCH_OPTIONS = ALL_SCHEMES.map(s => ({ value: s.key, label: s.label, icon: s.icon }))
</script>

<template>
  <div class="mx-auto flex max-w-7xl flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <p class="min-w-0 flex-1 basis-60 text-xs text-muted-color">
        {{ intro }}
      </p>
      <SelectButton
        v-if="!single"
        v-model="shown"
        :options="SWITCH_OPTIONS"
        option-label="label"
        option-value="value"
        :allow-empty="false"
        size="small"
        class="shrink-0 xl:!hidden"
        aria-label="Mode shown"
      >
        <template #option="{ option }">
          <i
            :class="option.icon"
            aria-hidden="true"
          />
          <span>{{ option.label }}</span>
        </template>
      </SelectButton>
    </div>
    <div
      class="grid gap-4"
      :class="stacked || single ? '' : 'xl:grid-cols-2'"
    >
      <section
        v-for="scheme in SCHEMES"
        :key="scheme.key"
        :class="[scheme.cls, !single && scheme.key !== shown ? 'max-xl:hidden' : '']"
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
        <slot :scheme="scheme.key as ColorScheme" />
      </section>
    </div>
  </div>
</template>
