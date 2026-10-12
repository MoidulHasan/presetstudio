<script setup lang="ts">
import { useThemeStore } from '~/stores/theme'
import { normalizeHex } from '~/utils/theme/palette'
import { BASE_PRESETS, BASE_PRESET_LABELS, SHADES } from '~/utils/theme/types'

const store = useThemeStore()

const presetOptions = BASE_PRESETS.map(value => ({ value, label: BASE_PRESET_LABELS[value] }))

const quickColors = [
  { name: 'Emerald', value: '#10b981' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Slate', value: '#64748b' },
]

// ColorPicker works with hex strings without '#'.
const pickerColor = computed({
  get: () => store.state.primaryColor.slice(1),
  set: (value: string) => store.setPrimaryColor(value),
})

const hexInput = ref(store.state.primaryColor)
watch(() => store.state.primaryColor, (value) => {
  hexInput.value = value
})
const hexInvalid = computed(() => normalizeHex(hexInput.value) === null)

function commitHexInput() {
  if (hexInvalid.value) hexInput.value = store.state.primaryColor
  else store.setPrimaryColor(hexInput.value)
}

function onHexInput(value: string | undefined) {
  hexInput.value = value ?? ''
  // Apply live as soon as the input is a complete 6-digit color.
  if (/^#?[0-9a-f]{6}$/i.test(hexInput.value)) store.setPrimaryColor(hexInput.value)
}
</script>

<template>
  <div class="flex flex-col gap-8">
    <section class="flex flex-col gap-3">
      <h2 class="text-sm font-semibold">
        Base preset
      </h2>
      <SelectButton
        :model-value="store.state.basePreset"
        :options="presetOptions"
        option-label="label"
        option-value="value"
        :allow-empty="false"
        aria-label="Base preset"
        class="w-full"
        :pt="{ pcToggleButton: { root: { class: 'flex-1' } } }"
        @update:model-value="store.setBasePreset"
      />
    </section>

    <section class="flex flex-col gap-3">
      <h2 class="text-sm font-semibold">
        Primary color
      </h2>
      <div class="flex items-center gap-2">
        <ColorPicker
          v-model="pickerColor"
          aria-label="Pick primary color"
        />
        <InputText
          :model-value="hexInput"
          :invalid="hexInvalid"
          aria-label="Primary color hex value"
          class="w-32 font-mono"
          maxlength="7"
          @update:model-value="onHexInput"
          @blur="commitHexInput"
          @keydown.enter="commitHexInput"
        />
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="color in quickColors"
          :key="color.value"
          type="button"
          :title="color.name"
          :aria-label="`Use ${color.name}`"
          :aria-pressed="store.state.primaryColor === color.value"
          class="size-7 rounded-full ring-offset-2 ring-offset-surface-0 transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:ring-offset-surface-900"
          :class="{ 'ring-2 ring-surface-900 dark:ring-surface-0': store.state.primaryColor === color.value }"
          :style="{ backgroundColor: color.value }"
          @click="store.setPrimaryColor(color.value)"
        />
      </div>

      <ol
        class="mt-2 grid grid-cols-11 overflow-hidden rounded-lg border border-surface-200 dark:border-surface-700"
        aria-label="Generated primary palette"
      >
        <li
          v-for="shade in SHADES"
          :key="shade"
          class="flex h-14 flex-col justify-end p-1"
          :style="{ backgroundColor: store.primaryPalette[shade] }"
          :title="`${shade}: ${store.primaryPalette[shade]}`"
        >
          <span
            class="text-[10px] font-medium leading-none"
            :class="Number(shade) >= 500 ? 'text-white' : 'text-black'"
          >{{ shade }}</span>
        </li>
      </ol>
    </section>

    <section>
      <Button
        label="Reset theme"
        icon="pi pi-refresh"
        severity="secondary"
        size="small"
        text
        @click="store.reset()"
      />
    </section>
  </div>
</template>
