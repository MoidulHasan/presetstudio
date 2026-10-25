<script setup lang="ts">
import { BRAND_SUGGESTIONS as SUGGESTIONS } from '~/utils/theme/brand-suggestions'
import { normalizeHex } from '~/utils/theme/palette'

// Brand color input: suggested colors (mid-dark, so white button text passes contrast out of
// the box), an inline picker and a hex field.
const props = defineProps<{ modelValue: string | null, showPicker?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

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
      class="grid grid-cols-12 gap-1.5"
      role="group"
      aria-label="Suggested brand colors"
    >
      <EditorColorSwatch
        v-for="color in SUGGESTIONS"
        :key="color.value"
        :color="color.value"
        :label="color.name"
        :selected="props.modelValue === color.value"
        class="aspect-square !h-auto !w-full"
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
