<script setup lang="ts">
import { normalizeHex } from '~/utils/theme/palette'

// Brand color input: suggested colors, an inline picker and a hex field.
const props = defineProps<{ modelValue: string | null, showPicker?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

// Mid-dark suggestions so white button text passes contrast out of the box.
const SUGGESTIONS = [
  { name: 'Indigo', value: '#4f46e5' },
  { name: 'Blue', value: '#2563eb' },
  { name: 'Sky', value: '#0284c7' },
  { name: 'Teal', value: '#0d9488' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Green', value: '#16a34a' },
  { name: 'Amber', value: '#d97706' },
  { name: 'Orange', value: '#ea580c' },
  { name: 'Red', value: '#dc2626' },
  { name: 'Rose', value: '#e11d48' },
  { name: 'Pink', value: '#db2777' },
  { name: 'Violet', value: '#7c3aed' },
]

const hexInput = ref(props.modelValue ?? '')
watch(() => props.modelValue, (value) => {
  if (value && normalizeHex(hexInput.value) !== value) hexInput.value = value
})
const hexInvalid = computed(() => !!hexInput.value && normalizeHex(hexInput.value) === null)

function emitHex(value: string) {
  const hex = normalizeHex(value)
  if (hex) emit('update:modelValue', hex)
}

function onHexInput(value: string | undefined) {
  hexInput.value = value ?? ''
  if (/^#?[0-9a-f]{6}$/i.test(hexInput.value)) emitHex(hexInput.value)
}

function commitHexInput() {
  if (hexInvalid.value) hexInput.value = props.modelValue ?? ''
  else emitHex(hexInput.value)
}

const pickerColor = computed({
  get: () => (props.modelValue ?? '#000000').slice(1),
  set: (value: string) => emitHex(value),
})
</script>

<template>
  <div class="flex flex-col gap-3">
    <div
      class="flex flex-wrap gap-2"
      role="radiogroup"
      aria-label="Suggested brand colors"
    >
      <button
        v-for="color in SUGGESTIONS"
        :key="color.value"
        v-tooltip.top="color.name"
        type="button"
        role="radio"
        :aria-checked="props.modelValue === color.value"
        :aria-label="color.name"
        class="size-7 rounded-full ring-offset-2 ring-offset-surface-0 transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface-900 dark:ring-offset-surface-900"
        :class="{ 'ring-2 ring-surface-900 dark:ring-surface-0': props.modelValue === color.value }"
        :style="{ backgroundColor: color.value }"
        @click="emitHex(color.value)"
      />
    </div>

    <div class="flex items-start gap-3">
      <ColorPicker
        v-if="props.showPicker"
        v-model="pickerColor"
        inline
        aria-label="Pick brand color"
      />
      <div class="flex flex-1 flex-col gap-2">
        <label
          for="brand-hex"
          class="text-xs font-medium"
        >Hex</label>
        <div class="flex items-center gap-2">
          <span
            class="size-8 shrink-0 rounded-md border border-surface-200 dark:border-surface-700"
            :style="{ backgroundColor: props.modelValue ?? 'transparent' }"
            aria-hidden="true"
          />
          <InputText
            id="brand-hex"
            :model-value="hexInput"
            :invalid="hexInvalid"
            placeholder="#4f46e5"
            class="w-full font-mono"
            maxlength="7"
            @update:model-value="onHexInput"
            @blur="commitHexInput"
            @keydown.enter="commitHexInput"
          />
        </div>
      </div>
    </div>
  </div>
</template>
