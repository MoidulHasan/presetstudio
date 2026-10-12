<script setup lang="ts">
import { parseColor, relativeLuminance } from '~/utils/theme/color'
import { SHADES, type ColorPalette, type Shade } from '~/utils/theme/types'

const props = defineProps<{
  palette: ColorPalette | null
  /** Shades rendered as buttons that emit `select`. */
  selectable?: boolean
  selected?: Shade | null
  /** Shades marked as manually edited. */
  edited?: readonly Shade[]
  label: string
}>()

const emit = defineEmits<{ select: [shade: Shade] }>()

function textClass(color: string): string {
  const rgb = parseColor(color)
  return rgb && relativeLuminance(rgb) < 0.35 ? 'text-white' : 'text-black'
}
</script>

<template>
  <div
    class="grid grid-cols-11 overflow-hidden rounded-lg border border-surface-200 dark:border-surface-700"
    role="group"
    :aria-label="label"
  >
    <template
      v-for="shade in SHADES"
      :key="shade"
    >
      <Button
        v-if="props.selectable"
        v-tooltip.top="props.palette ? `${shade}: ${props.palette[shade]}` : shade"
        :aria-label="`Edit shade ${shade}`"
        :aria-pressed="props.selected === shade"
        class="relative !h-12 !flex-col !justify-end !gap-0 !rounded-none !border-0 !px-0 !pb-1 !text-[10px] !font-medium !leading-none hover:brightness-95"
        :class="[
          props.palette ? textClass(props.palette[shade]) : '',
          props.selected === shade ? 'z-10 ring-2 ring-inset ring-surface-900 dark:ring-surface-0' : '',
        ]"
        :style="{ backgroundColor: props.palette?.[shade] ?? 'transparent' }"
        @click="emit('select', shade)"
      >
        <span
          v-if="props.edited?.includes(shade)"
          class="absolute top-1 size-1.5 rounded-full bg-current"
          aria-hidden="true"
        />
        {{ shade }}
      </Button>
      <div
        v-else
        class="flex h-12 flex-col items-center justify-end pb-1 text-[10px] font-medium leading-none"
        :class="props.palette ? textClass(props.palette[shade]) : ''"
        :style="{ backgroundColor: props.palette?.[shade] ?? 'transparent' }"
        :title="props.palette ? `${shade}: ${props.palette[shade]}` : shade"
      >
        {{ shade }}
      </div>
    </template>
  </div>
</template>
