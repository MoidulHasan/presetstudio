<script setup lang="ts">
import { useWorkspaceStore } from '~/stores/workspace'
import { usePresetStore } from '~/stores/preset'
import { parseColor, rgbToOklch } from '~/utils/theme/color'
import { normalizeHex } from '~/utils/theme/palette'
import { semanticCell, semanticStudio, semanticUsedBy } from '~/utils/theme/semantic-studio'
import { BASE_PRESET_LABELS, PRIMITIVE_COLORS, type PaletteAlgorithm, type PrimaryDesign } from '~/utils/theme/types'

const workspace = useWorkspaceStore()
const preset = usePresetStore()

const usedBy = computed(() => semanticUsedBy(preset.descriptors, 'primary'))

// Clicks on the Primary stage select the matching state cell.
const grid = ref<{ focus: (row: string, column?: string) => Promise<void> } | null>(null)
useStagePick(async ([kind, row, column]) => {
  if (kind === 'cell' && row) await grid.value?.focus(row, column)
})

const stateGrid = computed(() => {
  const config = semanticStudio('primary')
  if (!config?.rows || !config.columns) return null
  return {
    columns: config.columns,
    rows: config.rows.map(row => ({
      key: row.key,
      label: row.label,
      cells: Object.fromEntries(Object.entries(row.cells).map(([column, path]) => [column, semanticCell(preset.descriptors, path)])),
    })),
  }
})
const primary = computed(() => workspace.theme.design.primary)
const baseLabel = computed(() => BASE_PRESET_LABELS[workspace.theme.basePreset])

const modeOptions = [
  { value: 'base', label: 'Preset' },
  { value: 'palette', label: 'Built-in' },
  { value: 'custom', label: 'Custom' },
] as const

function setPrimary(value: PrimaryDesign, key: string | null = null) {
  workspace.update((d) => {
    d.design.primary = value
  }, key)
}

function setMode(kind: PrimaryDesign['kind']) {
  if (kind === primary.value.kind) return
  if (kind === 'base') return setPrimary({ kind: 'base' })
  if (kind === 'palette') return setPrimary({ kind: 'palette', name: 'indigo' })
  // Start the custom color from whatever primary-500 currently is.
  const current = normalizeHex(preset.resolvedScale('primary', 'light')?.['500'] ?? '') ?? '#6366f1'
  setPrimary({ kind: 'custom', color: current, algorithm: 'oklch', shades: {} })
}

// --- Built-in palettes -------------------------------------------------------------
const swatch = (name: string) => preset.resolvers?.light.resolve(`${name}-500`)?.value ?? 'transparent'

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
const palette = computed(() => preset.resolvedScale('primary', 'light'))
const { selectedShade, editedShades, shadeColor, resetShade } = useShadeTweaks({
  custom,
  palette,
  set: setPrimary,
  key: () => 'primary.shade',
  resetOn: () => primary.value.kind,
})

// Which shade each scheme uses as "the" primary color, e.g. {primary.500} / {primary.400}.
const usage = computed(() => {
  const r = preset.resolvers
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

    <!-- Which shade each state uses (from the palette above), light and dark side by side. -->
    <EditorInspectorGroup
      v-if="stateGrid"
      title="States"
      description="The colors buttons, links and selections use at rest, hovered and pressed, and the text on them. They point at the palette above; select one to change it."
    >
      <EditorStudioTokenGrid
        ref="grid"
        :columns="stateGrid.columns"
        :rows="stateGrid.rows"
        title="Primary"
      />
    </EditorInspectorGroup>

    <EditorUsedBy :components="usedBy" />
  </div>
</template>
