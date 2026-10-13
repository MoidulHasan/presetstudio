<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import { parseColor, rgbToOklch } from '~/utils/theme/color'
import { normalizeHex } from '~/utils/theme/palette'
import { BASE_PRESET_LABELS, PRIMITIVE_COLORS, type PaletteAlgorithm, type PrimaryDesign, type Shade } from '~/utils/theme/types'

const store = useEditorStore()
const primary = computed(() => store.theme.design.primary)
const baseLabel = computed(() => BASE_PRESET_LABELS[store.theme.basePreset])

const modeOptions = [
  { value: 'base', label: 'Preset' },
  { value: 'palette', label: 'Built-in' },
  { value: 'custom', label: 'Custom' },
] as const

function setPrimary(value: PrimaryDesign, key: string | null = null) {
  store.update((d) => {
    d.design.primary = value
  }, key)
}

function setMode(kind: PrimaryDesign['kind']) {
  if (kind === primary.value.kind) return
  if (kind === 'base') return setPrimary({ kind: 'base' })
  if (kind === 'palette') return setPrimary({ kind: 'palette', name: 'indigo' })
  // Start the custom color from whatever primary-500 currently is.
  const current = normalizeHex(store.resolvedScale('primary', 'light')?.['500'] ?? '') ?? '#6366f1'
  setPrimary({ kind: 'custom', color: current, algorithm: 'oklch', shades: {} })
}

// --- Built-in palettes -------------------------------------------------------------
const swatch = (name: string) => store.resolvers?.light.resolve(`${name}-500`)?.value ?? 'transparent'

// --- Custom color --------------------------------------------------------------------
const custom = computed(() => (primary.value.kind === 'custom' ? primary.value : null))

function setColor(value: string, key = 'primary.color') {
  const hex = normalizeHex(value)
  const c = custom.value
  if (!hex || !c) return
  setPrimary({ ...c, color: hex }, key)
}

function setAlgorithm(algorithm: PaletteAlgorithm) {
  const c = custom.value
  if (c && c.algorithm !== algorithm) setPrimary({ ...c, algorithm })
}

const lightnessWarning = computed(() => {
  const rgb = custom.value ? parseColor(custom.value.color) : null
  if (!rgb) return null
  const { l } = rgbToOklch(rgb)
  if (l > 0.88) return 'This color is very light, so the lighter shades will be nearly identical and white text on it will be hard to read.'
  if (l < 0.3) return 'This color is very dark, so the darker shades will be nearly identical.'
  return null
})

// --- Per-shade tweaks ------------------------------------------------------------------
const selectedShade = ref<Shade | null>(null)
const editedShades = computed(() => Object.keys(custom.value?.shades ?? {}) as Shade[])
const palette = computed(() => store.resolvedScale('primary', 'light'))

const shadeColor = computed({
  get: () => (selectedShade.value && palette.value ? palette.value[selectedShade.value].replace('#', '') : '000000'),
  set: (value: string) => {
    const c = custom.value
    const shade = selectedShade.value
    const hex = normalizeHex(value)
    if (!c || !shade || !hex) return
    setPrimary({ ...c, shades: { ...c.shades, [shade]: hex } }, `primary.shade.${shade}`)
  },
})

function resetShade(shade: Shade) {
  const c = custom.value
  if (!c) return
  const shades = Object.fromEntries(Object.entries(c.shades).filter(([key]) => key !== shade))
  setPrimary({ ...c, shades })
}

watch(() => primary.value.kind, () => {
  selectedShade.value = null
})

// Which shade each scheme uses as "the" primary color, e.g. {primary.500} / {primary.400}.
const usage = computed(() => {
  const r = store.resolvers
  if (!r) return null
  const shadeOf = (raw: string | number | undefined) => /\{primary\.(\d+)\}/.exec(String(raw ?? ''))?.[1] ?? '?'
  return {
    light: shadeOf(r.light.entries.get('primary-color')?.raw),
    dark: shadeOf(r.dark.entries.get('primary-color')?.raw),
  }
})
</script>

<template>
  <div class="flex flex-col gap-8">
    <EditorInspectorGroup title="Source">
      <SelectButton
        :model-value="primary.kind"
        :options="[...modeOptions]"
        option-label="label"
        option-value="value"
        :allow-empty="false"
        aria-label="Primary color source"
        class="w-full"
        :pt="{ pcToggleButton: { root: { class: 'flex-1' } } }"
        @update:model-value="setMode"
      />
      <p
        v-if="primary.kind === 'base'"
        class="text-xs text-surface-500 dark:text-surface-400"
      >
        Using {{ baseLabel }}'s default primary palette.
      </p>
    </EditorInspectorGroup>

    <EditorInspectorGroup
      v-if="primary.kind === 'palette'"
      title="Built-in palette"
      description="Palettes that ship with every base preset. The export references them, e.g. {indigo.500}."
    >
      <div
        class="grid grid-cols-6 gap-x-2 gap-y-3"
        role="group"
        aria-label="Built-in palettes"
      >
        <div
          v-for="name in PRIMITIVE_COLORS"
          :key="name"
          class="flex flex-col items-center gap-1 text-[10px] capitalize text-surface-600 dark:text-surface-300"
        >
          <EditorColorSwatch
            :color="swatch(name)"
            :label="name"
            :selected="primary.kind === 'palette' && primary.name === name"
            class="size-8"
            @click="setPrimary({ kind: 'palette', name })"
          />
          <span aria-hidden="true">{{ name }}</span>
        </div>
      </div>
    </EditorInspectorGroup>

    <template v-if="custom">
      <EditorInspectorGroup
        title="Brand color"
        description="Becomes shade 500. The other shades are generated from it."
      >
        <EditorBrandColorField
          :model-value="custom.color"
          show-picker
          @update:model-value="color => setColor(color)"
        />
        <Message
          v-if="lightnessWarning"
          severity="warn"
          size="small"
          variant="simple"
        >
          {{ lightnessWarning }}
        </Message>
      </EditorInspectorGroup>

      <EditorInspectorGroup
        title="Generation"
        :description="custom.algorithm === 'oklch'
          ? 'Perceptual: evenly spaced lightness in OKLCH. Hue stays stable and mid-tones stay vivid.'
          : 'Classic: mixes the color with white and black (PrimeTek\'s palette()).'"
      >
        <SelectButton
          :model-value="custom.algorithm"
          :options="[{ value: 'oklch', label: 'Perceptual' }, { value: 'classic', label: 'Classic' }]"
          option-label="label"
          option-value="value"
          :allow-empty="false"
          aria-label="Palette generation algorithm"
          class="w-full"
          :pt="{ pcToggleButton: { root: { class: 'flex-1' } } }"
          @update:model-value="setAlgorithm"
        />
      </EditorInspectorGroup>
    </template>

    <EditorInspectorGroup
      title="Palette"
      :description="custom ? 'Select a shade to fine-tune it.' : undefined"
    >
      <EditorPaletteStrip
        label="Primary palette"
        :palette="palette"
        :selectable="!!custom"
        :selected="selectedShade"
        :edited="editedShades"
        @select="shade => (selectedShade = selectedShade === shade ? null : shade)"
      />
      <div
        v-if="custom && selectedShade"
        class="flex items-center gap-2 rounded-lg border border-surface-200 p-2 dark:border-surface-700"
      >
        <ColorPicker
          v-model="shadeColor"
          :aria-label="`Pick color for shade ${selectedShade}`"
        />
        <span class="flex-1 font-mono text-sm">{{ selectedShade }} · {{ palette?.[selectedShade] }}</span>
        <Button
          v-if="editedShades.includes(selectedShade)"
          label="Reset"
          icon="pi pi-undo"
          size="small"
          text
          @click="resetShade(selectedShade)"
        />
      </div>
      <p
        v-if="usage"
        class="text-xs text-surface-500 dark:text-surface-400"
      >
        {{ baseLabel }} uses shade {{ usage.light }} as the primary color in light mode and {{ usage.dark }} in dark mode.
      </p>
    </EditorInspectorGroup>

    <EditorStudioLink
      component="button"
      text="Fine-tune how buttons use the primary color"
    />
  </div>
</template>
