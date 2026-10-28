<script setup lang="ts">
import { usePresetStore } from '~/stores/preset'
import { COMPONENT_META } from '~/utils/theme/components'
import { PARTS_STUDIO, componentCell, componentTokens } from '~/utils/theme/parts-studio'
import type { TokenDescriptor } from '~/utils/theme/schema'
import { SIZE_LABELS, controlPath, type StudioSection, type StudioSize } from '~/utils/theme/studio-controls'

// Visual editor of a component built from parts (DataTable): its colors as a parts × states grid
// (light|dark pairs), then its controls by purpose. Clicks on the stage select a cell or a section.
const props = defineProps<{ component: string }>()

const preset = usePresetStore()
const studio = computed(() => PARTS_STUDIO[props.component]!)
const label = computed(() => COMPONENT_META[props.component]?.label ?? props.component)

// --- Colors ----------------------------------------------------------------------------
const grid = computed(() => ({
  columns: studio.value.columns,
  rows: studio.value.rows.map(row => ({
    key: row.key,
    label: row.label,
    cells: Object.fromEntries(Object.entries(row.cells).map(([column, path]) => [column, componentCell(preset.descriptors, props.component, path)])),
  })),
}))

// --- Controls --------------------------------------------------------------------------
const sizes = ref<Record<string, StudioSize>>({})
const sizeOf = (key: string): StudioSize => sizes.value[key] ?? 'normal'
function setSize(key: string, size: StudioSize) {
  sizes.value = { ...sizes.value, [key]: size }
}
function sizeOptions(list: StudioSize[]) {
  return list.map(value => ({ value, label: SIZE_LABELS[value] }))
}

/** Controls of a section for its current size; per-mode tokens get a light and a dark control. */
function controlsOf(section: StudioSection) {
  const size = sizeOf(section.key)
  const out: Array<{ key: string, token: TokenDescriptor, label: string, hint?: string, min?: number, max?: number }> = []
  for (const control of section.controls) {
    const path = controlPath(control, size)
    if (!path) continue
    const tokens = componentTokens(preset.descriptors, props.component, path)
    for (const token of tokens) {
      const hint = tokens.length > 1 ? (token.scheme === 'dark' ? 'dark mode' : 'light mode') : control.hint
      out.push({ key: token.path.join('.'), token, label: control.label, hint, min: control.min, max: control.max })
    }
  }
  return out
}

// --- Stage picks -----------------------------------------------------------------------
const sections = ref<Record<string, HTMLElement | null>>({})
const gridRef = ref<{ focus: (row: string, column?: string) => Promise<void> } | null>(null)

useStagePick(async ([kind, first, second]) => {
  if (kind === 'cell' && first) {
    await gridRef.value?.focus(first, second)
  }
  else if (kind === 'section' && first) {
    if (second && (['normal', 'sm', 'lg'] as string[]).includes(second)) setSize(first, second as StudioSize)
    sections.value[first]?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <EditorInspectorGroup
      title="Colors"
      :description="studio.colorsDescription"
    >
      <EditorStudioTokenGrid
        ref="gridRef"
        :columns="grid.columns"
        :rows="grid.rows"
        :title="label"
      />
    </EditorInspectorGroup>

    <div
      v-for="section in studio.sections"
      :key="section.key"
      :ref="el => (sections[section.key] = el as HTMLElement | null)"
      :data-stage-target="`section:${section.key}`"
    >
      <EditorInspectorGroup
        :title="section.title"
        :description="section.description"
      >
        <SelectButton
          v-if="section.sizes"
          :model-value="sizeOf(section.key)"
          :options="sizeOptions(section.sizes)"
          option-label="label"
          option-value="value"
          :allow-empty="false"
          :aria-label="`${section.title} size to edit`"
          size="small"
          class="w-full"
          :pt="{ pcToggleButton: { root: { class: 'flex-1' } } }"
          @update:model-value="(v: StudioSize) => setSize(section.key, v)"
        />
        <EditorStudioControl
          v-for="control in controlsOf(section)"
          :key="control.key"
          :token="control.token"
          :label="control.label"
          :hint="control.hint"
          :min="control.min"
          :max="control.max"
        />
      </EditorInspectorGroup>
    </div>
  </div>
</template>
