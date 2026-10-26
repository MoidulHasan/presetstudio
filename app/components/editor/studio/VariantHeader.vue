<script setup lang="ts">
import type { PaletteChoice } from '~/utils/theme/recolor'

// One variant's row in VariantColors: open/close, its color (in the previewed mode, or light|dark
// with "Both"), its palette.
// Props are primitives, so recoloring one variant doesn't re-render the others' rows.
const props = defineProps<{
  label: string
  open: boolean
  light: string
  dark: string
  changed: boolean
  /** The palette choice as primitives: 'base' (preset's own), a palette name, or a custom color. */
  choiceKind: 'base' | 'palette' | 'custom'
  choiceValue: string
}>()

const emit = defineEmits<{ toggle: [], recolor: [choice: PaletteChoice | null] }>()
const { both, scheme } = useShownScheme()

const choice = computed<PaletteChoice | null>(() => {
  if (props.choiceKind === 'palette') return { kind: 'palette', name: props.choiceValue }
  if (props.choiceKind === 'custom') return { kind: 'custom', color: props.choiceValue }
  return null
})
</script>

<template>
  <div class="flex items-center gap-2 px-2 py-1.5">
    <Button
      severity="secondary"
      text
      class="!min-w-0 !flex-1 !justify-start !gap-2 !px-1 !py-1"
      :aria-expanded="open"
      :aria-label="`${label} colors`"
      @click="emit('toggle')"
    >
      <i
        class="pi text-xs text-surface-400"
        :class="open ? 'pi-chevron-down' : 'pi-chevron-right'"
        aria-hidden="true"
      />
      <span
        class="flex h-5 w-8 shrink-0 overflow-hidden rounded border border-surface-300 dark:border-surface-600"
        aria-hidden="true"
      >
        <span
          v-if="both || scheme === 'light'"
          class="flex-1"
          :style="{ background: light }"
        />
        <span
          v-if="both || scheme === 'dark'"
          class="flex-1"
          :style="{ background: dark }"
        />
      </span>
      <span class="truncate text-sm text-surface-900 dark:text-surface-0">{{ label }}</span>
      <span
        v-if="changed"
        v-tooltip.top="'Changed'"
        class="size-1.5 shrink-0 rounded-full bg-surface-900 dark:bg-surface-0"
        aria-hidden="true"
      />
    </Button>
    <EditorStudioPalettePicker
      class="w-36 shrink-0"
      :model-value="choice"
      :label="label"
      @update:model-value="value => emit('recolor', value)"
    />
  </div>
</template>
