<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import { primaryHue } from '~/utils/theme/design'
import { generateNeutralPalette } from '~/utils/theme/palette'
import { BASE_PRESET_LABELS, NEUTRAL_COLORS, type ColorScheme, type SurfaceDesign } from '~/utils/theme/types'

const store = useEditorStore()
const baseLabel = computed(() => BASE_PRESET_LABELS[store.theme.basePreset])

// The edited scheme is the previewed scheme: you always edit what you see.
const scheme = computed<ColorScheme>({
  get: () => store.prefs.colorScheme,
  set: (value) => {
    store.prefs.colorScheme = value
  },
})
const other = computed<ColorScheme>(() => (scheme.value === 'light' ? 'dark' : 'light'))
const current = computed(() => store.theme.design.surface[scheme.value])

const surfaceId = (s: SurfaceDesign) => (s.kind === 'palette' ? s.name : s.kind)
const sameAsOther = computed(() => {
  const o = store.theme.design.surface[other.value]
  return surfaceId(current.value) === surfaceId(o) && (current.value.kind !== 'tinted' || o.kind !== 'tinted' || current.value.chroma === o.chroma)
})

function setSurface(value: SurfaceDesign, key: string | null = null) {
  const target = scheme.value
  store.update((d) => {
    d.design.surface[target] = value
  }, key)
}

function setTintedBackgrounds(value: boolean) {
  store.update((d) => {
    d.design.tintedBackgrounds = value
  })
}

function applyToOther() {
  const target = other.value
  const value = { ...current.value }
  store.update((d) => {
    d.design.surface[target] = value
  })
}

const isSelected = (value: SurfaceDesign) => surfaceId(current.value) === surfaceId(value)

const swatch = (name: string, shade: string) => store.resolvers?.light.resolve(`${name}-${shade}`)?.value ?? 'transparent'

const tint = computed(() => (current.value.kind === 'tinted' ? Math.round(current.value.chroma * 1000) : 14))

const tintedPreview = computed(() =>
  store.basePreset ? generateNeutralPalette(primaryHue(store.theme.design.primary, store.basePreset), tint.value / 1000) : null)

function setTint(value: number | number[]) {
  const n = Array.isArray(value) ? value[0]! : value
  setSurface({ kind: 'tinted', chroma: n / 1000 }, `surface.${scheme.value}.tint`)
}
</script>

<template>
  <div class="flex flex-col gap-8">
    <EditorInspectorGroup
      title="Editing"
      description="The preview switches with this toggle."
    >
      <SelectButton
        v-model="scheme"
        :options="[{ value: 'light', label: 'Light mode' }, { value: 'dark', label: 'Dark mode' }]"
        option-label="label"
        option-value="value"
        :allow-empty="false"
        aria-label="Color scheme to edit"
        class="w-full"
        :pt="{ pcToggleButton: { root: { class: 'flex-1' } } }"
      />
    </EditorInspectorGroup>

    <EditorInspectorGroup title="Palette">
      <EditorPaletteStrip
        :label="`${scheme} mode surface palette`"
        :palette="store.resolvedScale('surface', scheme)"
      />

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
          :model-value="store.theme.design.tintedBackgrounds"
          @update:model-value="setTintedBackgrounds"
        />
      </label>
    </EditorInspectorGroup>

    <div class="flex items-center justify-between gap-2 rounded-lg bg-surface-50 p-3 text-xs dark:bg-surface-800">
      <span v-if="sameAsOther">Same as {{ other }} mode.</span>
      <span v-else>{{ other === 'dark' ? 'Dark' : 'Light' }} mode uses a different neutral.</span>
      <Button
        v-if="!sameAsOther"
        :label="`Use in ${other} mode too`"
        size="small"
        text
        @click="applyToOther"
      />
    </div>
  </div>
</template>
