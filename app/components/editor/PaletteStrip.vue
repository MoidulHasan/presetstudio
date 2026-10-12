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
      <component
        :is="props.selectable ? 'button' : 'div'"
        :type="props.selectable ? 'button' : undefined"
        class="relative flex h-12 flex-col items-center justify-end pb-1 text-[10px] font-medium leading-none outline-none transition"
        :class="[
          props.palette ? textClass(props.palette[shade]) : '',
          props.selectable ? 'cursor-pointer hover:brightness-95 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary' : '',
          props.selected === shade ? 'z-10 ring-2 ring-inset ring-surface-900 dark:ring-surface-0' : '',
        ]"
        :style="{ backgroundColor: props.palette?.[shade] ?? 'transparent' }"
        :title="props.palette ? `${shade}: ${props.palette[shade]}` : shade"
        :aria-label="props.selectable ? `Edit shade ${shade}` : undefined"
        :aria-pressed="props.selectable ? props.selected === shade : undefined"
        @click="props.selectable && emit('select', shade)"
      >
        <span
          v-if="props.edited?.includes(shade)"
          class="absolute top-1 size-1.5 rounded-full bg-current"
          aria-hidden="true"
        />
        {{ shade }}
      </component>
    </template>
  </div>
</template>
