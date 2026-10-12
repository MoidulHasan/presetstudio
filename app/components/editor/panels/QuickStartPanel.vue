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
          name="start-base"
          :value="name"
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
        <EditorOptionCard
          v-for="option in corners"
          :key="option.value"
          name="start-radius"
          :value="option.value"
          :label="option.label"
          :selected="design.radius === option.value"
          layout="stacked"
          @select="setRadius(option.value)"
        >
          <template #visual>
            <span
              class="h-6 w-10 border-2 border-surface-500 bg-surface-100 dark:bg-surface-800"
              :style="{ borderRadius: cornerPreview(option.value) }"
              aria-hidden="true"
            />
          </template>
        </EditorOptionCard>
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
        <EditorOptionCard
          v-for="option in neutrals"
          :key="option.id"
          name="start-neutral"
          :value="option.id"
          :label="option.label"
          :selected="activeNeutral === option.id"
          layout="stacked"
          @select="setNeutral(option.value)"
        >
          <template #visual>
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
          </template>
        </EditorOptionCard>
      </div>
      <p
        v-if="activeNeutral === null"
        class="text-xs text-surface-500 dark:text-surface-400"
      >
        Light and dark use different neutrals. Pick one here to use it for both.
      </p>
    </EditorInspectorGroup>

    <div class="flex flex-col gap-1 rounded-lg border border-surface-200 p-3 text-sm dark:border-surface-700">
      <p class="px-3 pt-1 font-medium">
        Next steps
      </p>
      <Button
        severity="secondary"
        text
        class="!justify-start"
        @click="store.prefs.section = 'accessibility'"
      >
        <i
          class="pi pi-eye"
          aria-hidden="true"
        />
        <span class="flex-1 text-left">Check contrast</span>
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
      </Button>
      <Button
        label="Fine-tune palettes, density and focus"
        icon="pi pi-sliders-h"
        severity="secondary"
        text
        class="!justify-start"
        @click="store.prefs.section = 'primary'"
      />
    </div>
  </div>
</template>
