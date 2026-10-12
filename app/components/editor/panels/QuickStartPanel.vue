<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import { RADIUS_VALUES, primaryHue } from '~/utils/theme/design'
import { generateNeutralPalette } from '~/utils/theme/palette'
import { BASE_PRESETS, BASE_PRESET_LABELS, type BasePresetName, type RadiusScale, type SurfaceDesign } from '~/utils/theme/types'

const store = useEditorStore()
const design = computed(() => store.theme.design)

const presetHints: Record<BasePresetName, string> = {
  aura: 'Clean and modern, subtle borders',
  lara: 'Classic, with soft focus glows',
  nora: 'Bold, solid selections',
  material: 'Inspired by Material Design',
}

function setBase(value: BasePresetName) {
  store.update((d) => {
    d.basePreset = value
  })
}

const brandColor = computed(() => (design.value.primary.kind === 'custom' ? design.value.primary.color : null))

function setBrand(color: string) {
  const current = design.value.primary
  store.update((d) => {
    d.design.primary = { kind: 'custom', color, algorithm: current.kind === 'custom' ? current.algorithm : 'oklch', shades: {} }
  }, 'start.brand')
}

const corners: Array<{ value: RadiusScale, label: string }> = [
  { value: 'none', label: 'Square' },
  { value: 'base', label: 'Default' },
  { value: 'large', label: 'Rounded' },
  { value: 'xlarge', label: 'Soft' },
]

function cornerPreview(value: RadiusScale): string {
  return value === 'base' ? (store.resolvers?.light.entries.get('border-radius-md')?.raw.toString() ?? '6px') : RADIUS_VALUES[value].md!
}

function setRadius(value: RadiusScale) {
  store.update((d) => {
    d.design.radius = value
  })
}

const neutrals: Array<{ id: string, label: string, value: SurfaceDesign, swatch: string }> = [
  { id: 'base', label: 'Preset', value: { kind: 'base' }, swatch: 'surface' },
  { id: 'slate', label: 'Cool', value: { kind: 'palette', name: 'slate' }, swatch: 'slate' },
  { id: 'neutral', label: 'Neutral', value: { kind: 'palette', name: 'neutral' }, swatch: 'neutral' },
  { id: 'stone', label: 'Warm', value: { kind: 'palette', name: 'stone' }, swatch: 'stone' },
  { id: 'tinted', label: 'Tinted', value: { kind: 'tinted', chroma: 0.014 }, swatch: '' },
]

function neutralId(s: SurfaceDesign): string {
  return s.kind === 'palette' ? s.name : s.kind
}

const activeNeutral = computed(() => {
  const { light, dark } = design.value.surface
  return neutralId(light) === neutralId(dark) ? neutralId(light) : null
})

function setNeutral(value: SurfaceDesign) {
  store.update((d) => {
    d.design.surface = { light: { ...value }, dark: { ...value } }
  })
}

const tintedPreview = computed(() =>
  store.basePreset ? generateNeutralPalette(primaryHue(design.value.primary, store.basePreset), 0.014) : null)

function neutralSwatch(option: (typeof neutrals)[number], shade: string): string {
  const r = store.resolvers?.light
  if (!r) return 'transparent'
  if (option.id === 'tinted') return tintedPreview.value?.[shade as '500'] ?? 'transparent'
  return r.resolve(`${option.swatch}-${shade}`)?.value ?? 'transparent'
}
</script>

<template>
  <div class="flex flex-col gap-8">
    <EditorInspectorGroup
      title="1. Base style"
      description="Each base preset has its own shape, borders and states."
    >
      <div
        class="grid grid-cols-2 gap-2"
        role="radiogroup"
        aria-label="Base preset"
      >
        <EditorOptionCard
          v-for="name in BASE_PRESETS"
          :key="name"
          :selected="store.theme.basePreset === name"
          :label="BASE_PRESET_LABELS[name]"
          :hint="presetHints[name]"
          class="h-full"
          @select="setBase(name)"
        />
      </div>
    </EditorInspectorGroup>

    <EditorInspectorGroup
      title="2. Brand color"
      description="Generates the full primary palette. Pick a suggestion or enter your own."
    >
      <EditorBrandColorField
        :model-value="brandColor"
        @update:model-value="setBrand"
      />
    </EditorInspectorGroup>

    <EditorInspectorGroup title="3. Corners">
      <div
        class="grid grid-cols-4 gap-2"
        role="radiogroup"
        aria-label="Corner style"
      >
        <button
          v-for="option in corners"
          :key="option.value"
          type="button"
          role="radio"
          :aria-checked="design.radius === option.value"
          class="flex flex-col items-center gap-2 rounded-lg border p-2 text-xs transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          :class="design.radius === option.value
            ? 'border-surface-900 bg-surface-50 dark:border-surface-0 dark:bg-surface-800'
            : 'border-surface-200 hover:border-surface-400 dark:border-surface-700'"
          @click="setRadius(option.value)"
        >
          <span
            class="h-6 w-10 border-2 border-surface-500 bg-surface-100 dark:bg-surface-800"
            :style="{ borderRadius: cornerPreview(option.value) }"
          />
          {{ option.label }}
        </button>
      </div>
    </EditorInspectorGroup>

    <EditorInspectorGroup
      title="4. Neutrals"
      description="The gray scale for backgrounds, borders and text, in light and dark mode."
    >
      <div
        class="grid grid-cols-5 gap-2"
        role="radiogroup"
        aria-label="Neutral palette"
      >
        <button
          v-for="option in neutrals"
          :key="option.id"
          type="button"
          role="radio"
          :aria-checked="activeNeutral === option.id"
          class="flex flex-col items-center gap-2 rounded-lg border p-2 text-xs transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          :class="activeNeutral === option.id
            ? 'border-surface-900 bg-surface-50 dark:border-surface-0 dark:bg-surface-800'
            : 'border-surface-200 hover:border-surface-400 dark:border-surface-700'"
          @click="setNeutral(option.value)"
        >
          <span
            class="flex overflow-hidden rounded"
            aria-hidden="true"
          >
            <span
              v-for="shade in ['200', '500', '800']"
              :key="shade"
              class="h-6 w-2"
              :style="{ backgroundColor: neutralSwatch(option, shade) }"
            />
          </span>
          {{ option.label }}
        </button>
      </div>
      <p
        v-if="activeNeutral === null"
        class="text-xs text-surface-500 dark:text-surface-400"
      >
        Light and dark use different neutrals. Pick one here to use it for both.
      </p>
    </EditorInspectorGroup>

    <div class="flex flex-col gap-2 rounded-lg border border-surface-200 p-4 text-sm dark:border-surface-700">
      <p class="font-medium">
        Next steps
      </p>
      <button
        type="button"
        class="flex items-center gap-2 text-left text-surface-600 hover:text-surface-900 dark:text-surface-300 dark:hover:text-surface-0"
        @click="store.prefs.section = 'accessibility'"
      >
        <i
          class="pi pi-eye"
          aria-hidden="true"
        />
        <span class="flex-1">Check contrast</span>
        <Tag
          v-if="store.contrastIssues"
          :value="`${store.contrastIssues} issue${store.contrastIssues === 1 ? '' : 's'}`"
          severity="danger"
        />
        <Tag
          v-else
          value="All good"
          severity="success"
        />
      </button>
      <button
        type="button"
        class="flex items-center gap-2 text-left text-surface-600 hover:text-surface-900 dark:text-surface-300 dark:hover:text-surface-0"
        @click="store.prefs.section = 'primary'"
      >
        <i
          class="pi pi-sliders-h"
          aria-hidden="true"
        />
        Fine-tune palettes, density and focus
      </button>
    </div>
  </div>
</template>
