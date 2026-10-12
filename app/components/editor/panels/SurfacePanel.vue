<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import { BASE_PRESET_LABELS, NEUTRAL_COLORS, type ColorScheme, type SurfaceDesign } from '~/utils/theme/types'

const store = useEditorStore()
const baseLabel = computed(() => BASE_PRESET_LABELS[store.theme.basePreset])

const schemes: Array<{ value: ColorScheme, label: string }> = [
  { value: 'light', label: 'Light mode' },
  { value: 'dark', label: 'Dark mode' },
]

function setSurface(scheme: ColorScheme, value: SurfaceDesign, key: string | null = null) {
  store.update((d) => {
    d.design.surface[scheme] = value
  }, key)
}

function isSelected(scheme: ColorScheme, value: SurfaceDesign): boolean {
  const current = store.theme.design.surface[scheme]
  if (current.kind !== value.kind) return false
  return current.kind !== 'palette' || (value.kind === 'palette' && current.name === value.name)
}

function copyTo(target: ColorScheme) {
  const source = target === 'dark' ? 'light' : 'dark'
  setSurface(target, { ...store.theme.design.surface[source] })
}

const swatch = (name: string, shade: string) => store.resolvers?.light.resolve(`${name}-${shade}`)?.value ?? 'transparent'

function tintChroma(scheme: ColorScheme): number {
  const s = store.theme.design.surface[scheme]
  return s.kind === 'tinted' ? Math.round(s.chroma * 1000) : 12
}

function setTint(scheme: ColorScheme, value: number | number[]) {
  const n = Array.isArray(value) ? value[0]! : value
  setSurface(scheme, { kind: 'tinted', chroma: n / 1000 }, `surface.${scheme}.tint`)
}
</script>

<template>
  <div class="flex flex-col gap-8">
    <EditorInspectorGroup
      v-for="scheme in schemes"
      :key="scheme.value"
      :title="scheme.label"
    >
      <template #actions>
        <Button
          :label="`Copy from ${scheme.value === 'dark' ? 'light' : 'dark'}`"
          size="small"
          text
          @click="copyTo(scheme.value)"
        />
      </template>

      <EditorPaletteStrip
        :label="`${scheme.label} surface palette`"
        :palette="store.resolvedScale('surface', scheme.value)"
      />

      <div
        class="flex flex-col gap-2"
        role="radiogroup"
        :aria-label="`${scheme.label} surface`"
      >
        <EditorOptionCard
          :selected="isSelected(scheme.value, { kind: 'base' })"
          :label="`${baseLabel} default`"
          @select="setSurface(scheme.value, { kind: 'base' })"
        />
        <div class="grid grid-cols-2 gap-2">
          <EditorOptionCard
            v-for="name in NEUTRAL_COLORS"
            :key="name"
            :selected="isSelected(scheme.value, { kind: 'palette', name })"
            :label="name.charAt(0).toUpperCase() + name.slice(1)"
            @select="setSurface(scheme.value, { kind: 'palette', name })"
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
            :selected="isSelected(scheme.value, { kind: 'tinted', chroma: 0 })"
            label="Tinted"
            hint="Neutral with a hint of your primary"
            @select="setSurface(scheme.value, { kind: 'tinted', chroma: tintChroma(scheme.value) / 1000 })"
          />
        </div>
        <div
          v-if="store.theme.design.surface[scheme.value].kind === 'tinted'"
          class="flex flex-col gap-2 rounded-lg border border-surface-200 p-3 dark:border-surface-700"
        >
          <label
            :id="`tint-${scheme.value}`"
            class="flex justify-between text-xs font-medium"
          >
            Tint strength <span class="font-mono text-surface-500">{{ tintChroma(scheme.value) }}</span>
          </label>
          <Slider
            :model-value="tintChroma(scheme.value)"
            :min="0"
            :max="40"
            :step="1"
            :aria-labelledby="`tint-${scheme.value}`"
            @update:model-value="value => setTint(scheme.value, value)"
          />
        </div>
      </div>
    </EditorInspectorGroup>
  </div>
</template>
