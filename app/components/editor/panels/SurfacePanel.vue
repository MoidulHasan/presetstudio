<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import { useWorkspaceStore } from '~/stores/workspace'
import { usePresetStore } from '~/stores/preset'
import { primaryHue } from '~/utils/theme/design'
import { generateNeutralPalette, generateSurfacePalette, normalizeHex } from '~/utils/theme/palette'
import { BASE_PRESET_LABELS, NEUTRAL_COLORS, type ColorScheme, type SurfaceDesign } from '~/utils/theme/types'

const editor = useEditorStore()
const workspace = useWorkspaceStore()
const preset = usePresetStore()
const baseLabel = computed(() => BASE_PRESET_LABELS[workspace.theme.basePreset])

// The edited scheme is the previewed scheme (the preview's Light | Dark switch).
const scheme = computed<ColorScheme>(() => editor.prefs.colorScheme)
const other = computed<ColorScheme>(() => (scheme.value === 'light' ? 'dark' : 'light'))
const current = computed(() => workspace.theme.design.surface[scheme.value])

const surfaceId = (s: SurfaceDesign) => (s.kind === 'palette' ? s.name : s.kind)
const sameAsOther = computed(() => {
  const o = workspace.theme.design.surface[other.value]
  return JSON.stringify(current.value) === JSON.stringify(o)
})

function setSurface(value: SurfaceDesign, key: string | null = null) {
  const target = scheme.value
  workspace.update((d) => {
    d.design.surface[target] = value
  }, key)
}

// --- Custom surface color ----------------------------------------------------------------
const custom = computed(() => (current.value.kind === 'custom' ? current.value : null))
const CUSTOM_SEED = '#64748b'

function chooseCustom() {
  if (custom.value) return
  // Start from the current mid-tone, so switching to Custom changes nothing yet.
  const seed = normalizeHex(preset.resolvedScale('surface', scheme.value)?.['500'] ?? '') ?? CUSTOM_SEED
  setSurface({ kind: 'custom', color: seed, shades: {} })
}

function setCustomColor(value: string | undefined) {
  const hex = value ? normalizeHex(value) : null
  if (hex && custom.value) setSurface({ ...custom.value, color: hex }, `surface.${scheme.value}.color`)
}

const customPreview = computed(() => generateSurfacePalette(custom.value?.color ?? CUSTOM_SEED))

const palette = computed(() => preset.resolvedScale('surface', scheme.value))
const { selectedShade, editedShades, shadeColor, resetShade } = useShadeTweaks({
  custom,
  palette,
  set: setSurface,
  key: () => `surface.${scheme.value}.shade`,
  resetOn: () => `${scheme.value}:${current.value.kind}`,
})

function setTintedBackgrounds(value: boolean) {
  workspace.update((d) => {
    d.design.tintedBackgrounds = value
  })
}

function applyToOther() {
  const target = other.value
  const value = { ...current.value }
  workspace.update((d) => {
    d.design.surface[target] = value
  })
}

const isSelected = (value: SurfaceDesign) => surfaceId(current.value) === surfaceId(value)

const swatch = (name: string, shade: string) => preset.resolvers?.light.resolve(`${name}-${shade}`)?.value ?? 'transparent'

const tint = computed(() => (current.value.kind === 'tinted' ? Math.round(current.value.chroma * 1000) : 14))

const tintedPreview = computed(() =>
  preset.basePreset ? generateNeutralPalette(primaryHue(workspace.theme.design.primary, preset.basePreset), tint.value / 1000) : null)

function setTint(value: number | number[]) {
  const n = Array.isArray(value) ? value[0]! : value
  setSurface({ kind: 'tinted', chroma: n / 1000 }, `surface.${scheme.value}.tint`)
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Light and dark have their own surfaces; the preview's mode decides which is edited. -->
    <EditorSchemeNote />

    <EditorInspectorGroup title="Palette">
      <EditorPaletteStrip
        :label="`${scheme} mode surface palette`"
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
          :aria-label="`Pick color for surface shade ${selectedShade}`"
        />
        <span class="min-w-0 flex-1 truncate font-mono text-sm">{{ selectedShade }} · {{ palette?.[selectedShade] }}</span>
        <Button
          v-if="editedShades.includes(selectedShade)"
          label="Reset"
          icon="pi pi-undo"
          size="small"
          text
          @click="resetShade(selectedShade)"
        />
      </div>

      <div
        class="flex flex-col gap-2"
        role="radiogroup"
        :aria-label="`${scheme} mode surface`"
      >
        <EditorOptionCard
          :name="`surface-${scheme}`"
          value="base"
          :selected="isSelected({ kind: 'base' })"
          :label="`${baseLabel} default`"
          @select="setSurface({ kind: 'base' })"
        />
        <div class="grid grid-cols-2 gap-2">
          <EditorOptionCard
            v-for="name in NEUTRAL_COLORS"
            :key="name"
            :name="`surface-${scheme}`"
            :value="name"
            :selected="isSelected({ kind: 'palette', name })"
            :label="name.charAt(0).toUpperCase() + name.slice(1)"
            @select="setSurface({ kind: 'palette', name })"
          >
            <template #visual>
              <span class="flex overflow-hidden rounded">
                <span
                  v-for="shade in ['200', '500', '800']"
                  :key="shade"
                  class="h-5 w-2.5"
                  :style="{ backgroundColor: swatch(name, shade) }"
                />
              </span>
            </template>
          </EditorOptionCard>
          <EditorOptionCard
            :name="`surface-${scheme}`"
            value="tinted"
            :selected="isSelected({ kind: 'tinted', chroma: 0 })"
            label="Tinted"
            @select="setSurface({ kind: 'tinted', chroma: tint / 1000 })"
          >
            <template #visual>
              <span class="flex overflow-hidden rounded">
                <span
                  v-for="shade in ['200', '500', '800']"
                  :key="shade"
                  class="h-5 w-2.5"
                  :style="{ backgroundColor: tintedPreview?.[shade as '500'] }"
                />
              </span>
            </template>
          </EditorOptionCard>
        </div>
        <EditorOptionCard
          :name="`surface-${scheme}`"
          value="custom"
          :selected="!!custom"
          label="Custom color"
          hint="Any color; the ramp keeps surfaces calm"
          @select="chooseCustom"
        >
          <template #visual>
            <span class="flex overflow-hidden rounded">
              <span
                v-for="shade in ['200', '500', '800']"
                :key="shade"
                class="h-5 w-2.5"
                :style="{ backgroundColor: customPreview[shade as '500'] }"
              />
            </span>
          </template>
        </EditorOptionCard>
        <div
          v-if="custom"
          class="flex flex-col gap-2 rounded-lg border border-surface-200 p-3 dark:border-surface-700"
        >
          <div class="flex items-center gap-2">
            <ColorPicker
              :model-value="custom.color.slice(1)"
              aria-label="Surface color"
              @update:model-value="setCustomColor"
            />
            <InputText
              :model-value="custom.color"
              aria-label="Surface color hex"
              size="small"
              class="w-28 font-mono"
              @change="(e: Event) => setCustomColor((e.target as HTMLInputElement).value)"
            />
          </div>
          <p class="text-xs text-surface-500 dark:text-surface-400">
            Uses the color's hue and some of its saturation on a neutral light-to-dark ladder. Select a shade
            in the palette above to set it exactly.
          </p>
        </div>
        <div
          v-if="current.kind === 'tinted'"
          class="flex flex-col gap-2 rounded-lg border border-surface-200 p-3 dark:border-surface-700"
        >
          <label
            id="tint-strength"
            class="flex justify-between text-xs font-medium"
          >
            Tint strength <span class="font-mono text-surface-500">{{ tint }}</span>
          </label>
          <Slider
            :model-value="tint"
            :min="0"
            :max="40"
            :step="1"
            aria-labelledby="tint-strength"
            @update:model-value="setTint"
          />
          <p class="text-xs text-surface-500 dark:text-surface-400">
            A neutral with a hint of your primary hue.
          </p>
        </div>
      </div>
    </EditorInspectorGroup>

    <EditorInspectorGroup
      v-if="scheme === 'light'"
      title="Backgrounds"
      description="Cards, inputs, tables and overlays are pure white (surface 0) in light mode, so a new neutral mostly shows in borders and text. Tint them to carry it into every background."
    >
      <label class="flex items-center justify-between gap-3 text-sm">
        Tint white backgrounds
        <ToggleSwitch
          :model-value="workspace.theme.design.tintedBackgrounds"
          @update:model-value="setTintedBackgrounds"
        />
      </label>
    </EditorInspectorGroup>

    <!-- Only worth a word when the modes differ. -->
    <div
      v-if="!sameAsOther"
      class="flex items-center justify-between gap-2 text-xs text-surface-600 dark:text-surface-300"
    >
      <span>{{ other === 'dark' ? 'Dark' : 'Light' }} mode uses a different neutral.</span>
      <Button
        :label="`Use in ${other} mode too`"
        size="small"
        text
        @click="applyToOther"
      />
    </div>
  </div>
</template>
