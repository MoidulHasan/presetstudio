<script setup lang="ts">
import type { TokenDescriptor } from '~/utils/theme/schema'

// A grid of color tokens: rows (properties) × columns (states or kinds), each cell a light|dark
// pair. The selected cell is edited right under the grid, in the panel's flow. Cells, rows and
// columns point at their stage elements ('cell:<row>:<column>', see useStageTargets).
export interface GridCell { light?: TokenDescriptor, dark?: TokenDescriptor }

const props = defineProps<{
  columns: Array<{ key: string, label: string }>
  rows: Array<{ key: string, label: string, cells: Record<string, GridCell> }>
  /** Prefix of the selected cell's title, e.g. 'Form field'. */
  title: string
}>()

const selected = ref<{ row: string, column: string } | null>(null)
const { both } = useShownScheme()
const { current: highlight, flash } = useFlash<string>()
const root = ref<HTMLElement | null>(null)

const isSelected = (row: string, column: string) => selected.value?.row === row && selected.value.column === column

function select(row: string, column: string) {
  selected.value = isSelected(row, column) ? null : { row, column }
}

const selectedCell = computed(() => {
  const sel = selected.value
  if (!sel) return null
  const row = props.rows.find(r => r.key === sel.row)
  const column = props.columns.find(c => c.key === sel.column)
  const cell = row?.cells[sel.column]
  if (!row || !column || !cell) return null
  // A token shared by both modes is one editor.
  const shared = cell.light && cell.light === cell.dark
  return { ...cell, shared, label: props.columns.length > 1 ? `${row.label} · ${column.label}` : row.label }
})

/** Selects a cell (from a stage click); falls back to the row's first cell. */
async function focus(row: string, column?: string) {
  const r = props.rows.find(x => x.key === row)
  if (!r) return
  const col = column && r.cells[column] ? column : Object.keys(r.cells)[0]
  if (!col) return
  selected.value = { row, column: col }
  flash(col)
  await nextTick()
  root.value?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
}

defineExpose({ focus })
</script>

<template>
  <div
    ref="root"
    class="flex flex-col gap-3"
  >
    <div
      class="grid items-center gap-x-2 gap-y-1.5"
      :style="{ gridTemplateColumns: `6.5rem repeat(${columns.length}, minmax(0, 1fr))` }"
    >
      <span class="text-[10px] text-surface-500">{{ both ? 'Light | Dark' : '' }}</span>
      <span
        v-for="column in columns"
        :key="column.key"
        :data-stage-target="`cell:*:${column.key}`"
        class="truncate text-center text-[11px] font-medium"
        :class="highlight === column.key ? 'text-primary' : 'text-surface-500'"
        :title="column.label"
      >{{ column.label }}</span>
      <template
        v-for="row in rows"
        :key="row.key"
      >
        <span
          class="truncate text-xs"
          :title="row.label"
          :data-stage-target="`cell:${row.key}`"
        >{{ row.label }}</span>
        <template
          v-for="column in columns"
          :key="column.key"
        >
          <EditorStudioColorPair
            v-if="row.cells[column.key]"
            :data-stage-target="`cell:${row.key}:${column.key}`"
            :light="row.cells[column.key]!.light"
            :dark="row.cells[column.key]!.dark"
            :label="columns.length > 1 ? `${row.label} · ${column.label}` : row.label"
            :selected="isSelected(row.key, column.key)"
            @select="select(row.key, column.key)"
          />
          <span
            v-else
            aria-hidden="true"
          />
        </template>
      </template>
    </div>

    <div
      v-if="selectedCell"
      :data-stage-target="selected ? `cell:${selected.row}:${selected.column}` : undefined"
      class="flex flex-col gap-2 rounded-lg border border-surface-200 bg-surface-0 p-2 dark:border-surface-700 dark:bg-surface-900"
    >
      <div class="flex items-center justify-between gap-2 px-1">
        <p class="truncate text-xs font-semibold">
          {{ title }} · {{ selectedCell.label.toLowerCase() }}
        </p>
        <Button
          icon="pi pi-times"
          severity="secondary"
          size="small"
          text
          rounded
          class="!size-6 shrink-0"
          aria-label="Close color editor"
          @click="selected = null"
        />
      </div>
      <EditorTokenRow
        v-if="selectedCell.shared"
        :token="selectedCell.light!"
        scheme="light"
        label="Both modes"
        :expanded="true"
      />
      <template v-else>
        <EditorTokenRow
          v-if="selectedCell.light"
          :token="selectedCell.light"
          scheme="light"
          label="Light mode"
          :expanded="true"
        />
        <EditorTokenRow
          v-if="selectedCell.dark"
          :token="selectedCell.dark"
          scheme="dark"
          label="Dark mode"
          :expanded="true"
        />
      </template>
    </div>
  </div>
</template>
