<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import { semanticCell, semanticStudio, semanticTokens, semanticUsedBy } from '~/utils/theme/semantic-studio'

// Visual editor of one semantic group: what uses it, its colors as a property × state grid
// (light|dark pairs) and its shared settings by purpose.
const props = defineProps<{ group: string }>()

const store = useEditorStore()
const studio = computed(() => semanticStudio(props.group)!)

// --- Used by -------------------------------------------------------------------------
const usedBy = computed(() => semanticUsedBy(store.descriptors, props.group))

// --- Colors ----------------------------------------------------------------------------
const grid = computed(() => {
  const config = studio.value
  if (!config.rows || !config.columns) return null
  return {
    columns: config.columns,
    rows: config.rows.map(row => ({
      key: row.key,
      label: row.label,
      cells: Object.fromEntries(Object.entries(row.cells).map(([column, path]) => [column, semanticCell(store.descriptors, path)])),
    })),
  }
})

// --- Controls ----------------------------------------------------------------------------
const resolve = (path: string) => semanticTokens(store.descriptors, path)

// --- Stage picks -----------------------------------------------------------------------
const sectionsRef = ref<{ show: (key: string, size?: string) => void } | null>(null)
const gridRef = ref<{ focus: (row: string, column?: string) => Promise<void> } | null>(null)
const colorsSection = ref<HTMLElement | null>(null)

watch(() => store.stagePick, async (pick) => {
  if (!pick) return
  store.stagePick = null
  const [kind, first, second] = pick.target.split(':')
  await nextTick()
  if (kind === 'cell' && first) {
    await gridRef.value?.focus(first, second)
  }
  else if (kind === 'section' && first) {
    sectionsRef.value?.show(first, second)
  }
}, { immediate: true })
</script>

<template>
  <div class="flex flex-col gap-8">
    <!-- Where this group shows up -->
    <EditorUsedBy :components="usedBy" />

    <!-- Colors -->
    <div
      v-if="grid"
      ref="colorsSection"
    >
      <EditorInspectorGroup
        title="Colors"
        :description="grid.columns.length > 1 ? 'Light and dark side by side in every cell. Select one to edit both.' : 'Light and dark side by side. Select one to edit both.'"
      >
        <EditorStudioTokenGrid
          ref="gridRef"
          :columns="grid.columns"
          :rows="grid.rows"
          :title="studio.label"
        />
      </EditorInspectorGroup>
    </div>

    <!-- Shared settings -->
    <EditorStudioSections
      ref="sectionsRef"
      :sections="studio.sections ?? []"
      :resolve="resolve"
    />

    <p class="text-xs text-surface-500">
      Need a token that isn't here? Switch to <span class="font-medium">All tokens</span> at the top. Every {{ studio.label.toLowerCase() }} token is there.
    </p>
  </div>
</template>
