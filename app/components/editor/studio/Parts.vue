<script setup lang="ts">
import { EDITOR_SECTIONS, useEditorStore, type EditorSection } from '~/stores/editor'
import { COMPONENT_META } from '~/utils/theme/components'
import { componentCell, componentTokens, partsStudio } from '~/utils/theme/parts-studio'

// Visual editor for components made of parts (DataTable): a color grid per part (properties ×
// states, light|dark pairs), then the shared settings by purpose (parts-studio.ts).
const props = defineProps<{ component: string }>()

const store = useEditorStore()
const studio = computed(() => partsStudio(props.component)!)
const label = computed(() => COMPONENT_META[props.component]?.label ?? props.component)

const grids = computed(() => studio.value.parts.map(part => ({
  ...part,
  rows: part.rows.map(row => ({
    key: row.key,
    label: row.label,
    cells: Object.fromEntries(Object.entries(row.cells).map(([column, path]) => [column, componentCell(store.descriptors, props.component, path)])),
  })),
})))

const resolve = (path: string) => componentTokens(store.descriptors, props.component, path)

const related = computed(() => (studio.value.related ?? [])
  .filter((r): r is typeof r & { section: EditorSection } => (EDITOR_SECTIONS as readonly string[]).includes(r.section)))

// --- Stage picks: 'cell:<part>:<row>:<column>' or 'section:<key>[:<size>]' -------------
const gridRefs = ref<Record<string, { focus: (row: string, column?: string) => Promise<void>, clear: () => void } | null>>({})

/** One selected cell across all parts. */
function onSelect(part: string) {
  for (const [key, grid] of Object.entries(gridRefs.value)) if (key !== part) grid?.clear()
}
const sectionsRef = ref<{ show: (key: string, size?: string) => void } | null>(null)

watch(() => store.stagePick, async (pick) => {
  if (!pick) return
  store.stagePick = null
  const [kind, first, second, third] = pick.target.split(':')
  await nextTick()
  if (kind === 'cell' && first && second) await gridRefs.value[first]?.focus(second, third)
  else if (kind === 'section' && first) sectionsRef.value?.show(first, second)
}, { immediate: true })
</script>

<template>
  <div class="flex flex-col gap-8">
    <EditorInspectorGroup
      v-for="part in grids"
      :key="part.key"
      :title="part.label"
      :description="part.description ? `${part.description} Light and dark side by side in every cell.` : 'Light and dark side by side in every cell. Select one to edit both.'"
    >
      <EditorStudioTokenGrid
        :ref="el => (gridRefs[part.key] = el as typeof gridRefs[string])"
        :columns="part.columns"
        :rows="part.rows"
        :title="part.label"
        @select="onSelect(part.key)"
      />
    </EditorInspectorGroup>

    <EditorStudioSections
      ref="sectionsRef"
      :sections="studio.sections"
      :resolve="resolve"
    />

    <Button
      v-for="link in related"
      :key="link.section"
      severity="secondary"
      outlined
      class="!w-full !justify-start !gap-2.5 !p-3 text-left"
      @click="store.prefs.section = link.section"
    >
      <i
        class="pi pi-info-circle shrink-0"
        aria-hidden="true"
      />
      <span class="min-w-0 flex-1 text-sm">{{ link.text }} <span class="font-semibold">{{ link.label }}</span></span>
      <i
        class="pi pi-arrow-right shrink-0 text-xs text-surface-400"
        aria-hidden="true"
      />
    </Button>
    <p class="text-xs text-surface-500">
      Need a token that isn't here? Switch to <span class="font-medium">All tokens</span> at the top. Every {{ label }} token is there.
    </p>
  </div>
</template>
