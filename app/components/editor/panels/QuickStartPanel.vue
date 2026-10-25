<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import { useWorkspaceStore } from '~/stores/workspace'
import { usePresetStore } from '~/stores/preset'
import { RADIUS_VALUES, primaryHue } from '~/utils/theme/design'
import { generateNeutralPalette, normalizeHex } from '~/utils/theme/palette'
import { BASE_PRESETS, BASE_PRESET_LABELS, type BasePresetName, type RadiusScale, type SurfaceDesign } from '~/utils/theme/types'

// Also the body of the first-run setup, which has its own way forward instead of next steps.
withDefaults(defineProps<{ showNextSteps?: boolean }>(), { showNextSteps: true })

const editor = useEditorStore()
const workspace = useWorkspaceStore()
const preset = usePresetStore()
const design = computed(() => workspace.theme.design)

const presetHints: Record<BasePresetName, string> = {
  aura: 'Clean and modern, subtle borders',
  lara: 'Classic, with soft focus glows',
  nora: 'Bold, solid selections',
  material: 'Inspired by Material Design',
}

function setBase(value: BasePresetName) {
  workspace.update((d) => {
    d.basePreset = value
  })
}

// The custom brand color, or the color the theme uses now (the preset's or a built-in palette's
// 500), so the field never shows a color the theme doesn't have.
const brandColor = computed(() => (design.value.primary.kind === 'custom'
  ? design.value.primary.color
  : normalizeHex(preset.resolvedScale('primary', 'light')?.['500'] ?? '')))

function setBrand(color: string) {
  const current = design.value.primary
  workspace.update((d) => {
    d.design.primary = { kind: 'custom', color, algorithm: current.kind === 'custom' ? current.algorithm : 'oklch', shades: {} }
  }, 'start.brand')
}

const corners: Array<{ value: Exclude<RadiusScale, 'custom'>, label: string }> = [
  { value: 'none', label: 'Square' },
  { value: 'base', label: 'Default' },
  { value: 'large', label: 'Rounded' },
  { value: 'xlarge', label: 'Soft' },
]

function cornerPreview(value: Exclude<RadiusScale, 'custom'>): string {
  return value === 'base' ? (preset.resolvers?.light.entries.get('border-radius-md')?.raw.toString() ?? '6px') : RADIUS_VALUES[value].md!
}

function setRadius(value: RadiusScale) {
  workspace.update((d) => {
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
  workspace.update((d) => {
    d.design.surface = { light: { ...value }, dark: { ...value } }
  })
}

const tintedPreview = computed(() =>
  preset.basePreset ? generateNeutralPalette(primaryHue(design.value.primary, preset.basePreset), 0.014) : null)

// "Preset" shows the base preset's own neutrals, not whatever surface is set now.
const baseResolver = computed(() => preset.baseResolvers?.light ?? null)

function neutralSwatch(option: (typeof neutrals)[number], shade: string): string {
  const r = option.id === 'base' ? baseResolver.value : preset.resolvers?.light
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
          :selected="workspace.theme.basePreset === name"
          :label="BASE_PRESET_LABELS[name]"
          :hint="presetHints[name]"
          layout="stacked"
          class="h-full"
          @select="setBase(name)"
        >
          <template #visual>
            <EditorLookThumb :name="name" />
          </template>
        </EditorOptionCard>
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

    <div
      v-if="showNextSteps"
      class="flex flex-col gap-1 rounded-lg border border-surface-200 p-3 text-sm dark:border-surface-700"
    >
      <p class="px-3 pt-1 font-medium">
        Next steps
      </p>
      <Button
        severity="secondary"
        text
        class="!justify-start"
        @click="editor.prefs.section = 'accessibility'"
      >
        <i
          class="pi pi-eye"
          aria-hidden="true"
        />
        <span class="flex-1 text-left">Check contrast</span>
        <Tag
          v-if="preset.contrastIssues"
          :value="`${preset.contrastIssues} issue${preset.contrastIssues === 1 ? '' : 's'}`"
          severity="danger"
        />
        <Tag
          v-else
          value="All good"
          severity="success"
        />
      </Button>
      <Button
        severity="secondary"
        text
        class="!justify-start"
        @click="editor.prefs.section = 'primary'"
      >
        <i
          class="pi pi-sliders-h"
          aria-hidden="true"
        />
        <span class="flex-1 text-left">Fine-tune colors, shape, density and focus</span>
      </Button>
      <Button
        severity="secondary"
        text
        class="!justify-start"
        @click="editor.openComponentList()"
      >
        <i
          class="pi pi-th-large"
          aria-hidden="true"
        />
        <span class="flex-1 text-left">Customize components</span>
      </Button>
    </div>
  </div>
</template>
