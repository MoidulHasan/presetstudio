<script setup lang="ts">
import { usePresetStore } from '~/stores/preset'
import { normalizeHex } from '~/utils/theme/palette'
import type { PaletteChoice } from '~/utils/theme/recolor'
import { PRIMITIVE_COLORS } from '~/utils/theme/types'

// Picks the palette a group of tokens is recolored with: the preset's own, the theme's primary
// or surface, any built-in color, or a custom color (generated into a full palette).
const props = defineProps<{ modelValue: PaletteChoice | null, label: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: PaletteChoice | null] }>()

const preset = usePresetStore()

type Option = { value: string, label: string, swatch: string | null }

const swatch = (name: string) => preset.resolvers?.light.resolve(`${name}-500`)?.value ?? 'transparent'

const options = computed<Option[]>(() => [
  { value: 'base', label: 'Preset', swatch: null },
  { value: 'primary', label: 'Primary', swatch: swatch('primary') },
  { value: 'surface', label: 'Surface', swatch: swatch('surface') },
  ...PRIMITIVE_COLORS.map(name => ({ value: name, label: name.charAt(0).toUpperCase() + name.slice(1), swatch: swatch(name) })),
  { value: 'custom', label: 'Custom color…', swatch: null },
])

const selected = computed(() => (props.modelValue ? (props.modelValue.kind === 'custom' ? 'custom' : props.modelValue.name) : 'base'))

function select(value: string) {
  if (value === selected.value) return
  if (value === 'base') emit('update:modelValue', null)
  else if (value === 'custom') emit('update:modelValue', { kind: 'custom', color: '#6366f1' })
  else emit('update:modelValue', { kind: 'palette', name: value })
}

const customColor = computed({
  get: () => (props.modelValue?.kind === 'custom' ? props.modelValue.color.slice(1) : '6366f1'),
  set: (value: string) => {
    const hex = normalizeHex(value)
    if (hex) emit('update:modelValue', { kind: 'custom', color: hex })
  },
})

const current = computed(() => options.value.find(o => o.value === selected.value))
</script>

<template>
  <div class="flex min-w-0 items-center gap-1.5">
    <ColorPicker
      v-if="modelValue?.kind === 'custom'"
      v-model="customColor"
      :aria-label="`${label} custom color`"
      class="shrink-0"
    />
    <Select
      :model-value="selected"
      :options="options"
      option-label="label"
      option-value="value"
      :aria-label="`${label} palette`"
      size="small"
      scroll-height="18rem"
      class="min-w-0 flex-1"
      @update:model-value="select"
    >
      <template #value>
        <span class="flex min-w-0 items-center gap-1.5">
          <span
            v-if="current?.swatch"
            class="size-3 shrink-0 rounded-full"
            :style="{ background: current.swatch }"
            aria-hidden="true"
          />
          <span class="truncate">{{ current?.label }}</span>
        </span>
      </template>
      <template #option="{ option }">
        <span class="flex items-center gap-2">
          <span
            v-if="option.swatch"
            class="size-3 shrink-0 rounded-full"
            :style="{ background: option.swatch }"
            aria-hidden="true"
          />
          <i
            v-else
            :class="option.value === 'custom' ? 'pi pi-palette' : 'pi pi-replay'"
            class="text-xs"
            aria-hidden="true"
          />
          {{ option.label }}
        </span>
      </template>
    </Select>
  </div>
</template>
