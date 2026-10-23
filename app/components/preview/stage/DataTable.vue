<script setup lang="ts">
import { FOCUS_CLASS, HOVER_CLASS } from '~/composables/usePreviewForcedStyles'

// The DataTable stage: a full table (header, sorted column, selected row, column footers, footer),
// then each part in every state. Hover and focus are forced with classes on an ancestor, so every
// state gets its own small table. Clicks are captured here (nothing sorts or selects) and tell the
// editor what to edit: 'cell:<part>:<row>:<column>' or 'section:size:<size>'.
const emit = defineEmits<{ pick: [target: string] }>()

const ROWS = [
  { id: 1, name: 'Desk lamp', category: 'Lighting', price: 49 },
  { id: 2, name: 'Walnut shelf', category: 'Storage', price: 189 },
  { id: 3, name: 'Wool throw', category: 'Textiles', price: 79 },
]
const ONE = ROWS.slice(0, 1)
const TWO = ROWS.slice(0, 2)
const price = (value: number) => `$${value}`

const HEADER_STATES = [
  { key: 'default', label: 'Default', cls: '', sorted: false },
  { key: 'hover', label: 'Hover', cls: HOVER_CLASS, sorted: false },
  { key: 'sorted', label: 'Sorted', cls: '', sorted: true },
  { key: 'focus', label: 'Focus', cls: FOCUS_CLASS, sorted: false, pick: 'cell:headercells:focusring:focus' },
]

const ROW_STATES = [
  { key: 'default', label: 'Default', cls: '', rows: ONE, selected: false, striped: false },
  { key: 'hover', label: 'Hover', cls: HOVER_CLASS, rows: ONE, selected: false, striped: false },
  { key: 'selected', label: 'Selected', cls: '', rows: ONE, selected: true, striped: false },
  { key: 'striped', label: 'Striped', cls: '', rows: TWO, selected: false, striped: true, pick: 'cell:rows:striped:default' },
  { key: 'focus', label: 'Focus', cls: FOCUS_CLASS, rows: ONE, selected: false, striped: false, pick: 'cell:rows:focusring:focus' },
]

const EXPAND_STATES = [
  { key: 'default', label: 'Default', cls: '', selected: false, pick: 'cell:expand:icon:default' },
  { key: 'hover', label: 'Hover', cls: HOVER_CLASS, selected: false, pick: 'cell:expand:background:hover' },
  { key: 'selectedhover', label: 'Hover, selected row', cls: HOVER_CLASS, selected: true, pick: 'cell:expand:background:selectedhover' },
  { key: 'focus', label: 'Focus', cls: FOCUS_CLASS, selected: false, pick: 'cell:expand:focusring:focus' },
]

const SIZES = [
  { key: 'sm', label: 'Small', size: 'small' },
  { key: 'normal', label: 'Normal', size: undefined },
  { key: 'lg', label: 'Large', size: 'large' },
] as const

/** What a click in the full table edits, from the part that was clicked. */
function pickInTable(event: MouseEvent) {
  const target = event.target as Element
  if (target.closest('.p-datatable-row-toggle-button')) return emit('pick', 'cell:expand:icon:default')
  if (target.closest('.p-datatable-header')) return emit('pick', 'cell:bars:background:header')
  if (target.closest('.p-datatable-footer')) return emit('pick', 'cell:bars:background:footer')
  if (target.closest('.p-datatable-tfoot')) return emit('pick', 'cell:bars:background:footercell')
  const th = target.closest('th')
  if (th) return emit('pick', `cell:headercells:background:${th.classList.contains('p-datatable-column-sorted') ? 'sorted' : 'default'}`)
  const tr = target.closest('tr')
  if (tr) return emit('pick', `cell:rows:background:${tr.classList.contains('p-datatable-row-selected') ? 'selected' : 'default'}`)
  emit('pick', 'cell:rows:lines:default')
}
</script>

<template>
  <PreviewStageSchemes
    intro="A full table, then every part in each state. Click any part to edit it."
    stacked
  >
    <template #default>
      <div class="flex flex-col gap-3">
        <h3 class="text-xs font-semibold uppercase tracking-wide text-muted-color">
          Table
        </h3>
        <div
          class="min-w-0 cursor-pointer"
          @click.capture.stop.prevent="pickInTable"
        >
          <DataTable
            :value="ROWS"
            :selection="ROWS[1]"
            selection-mode="single"
            data-key="id"
            sort-field="price"
            :sort-order="1"
            :expanded-rows="{}"
            row-hover
            scrollable
          >
            <template #header>
              <span class="font-semibold">Products</span>
            </template>
            <Column
              expander
              class="w-12"
            />
            <Column
              field="name"
              header="Name"
              sortable
              footer="Total"
            />
            <Column
              field="category"
              header="Category"
              sortable
            />
            <Column
              field="price"
              header="Price"
              sortable
              :footer="price(ROWS.reduce((n, r) => n + r.price, 0))"
            >
              <template #body="{ data }">
                {{ price(data.price) }}
              </template>
            </Column>
            <template #footer>
              <span class="text-sm">{{ ROWS.length }} products</span>
            </template>
          </DataTable>
        </div>
      </div>

      <div class="flex flex-col gap-3">
        <h3 class="text-xs font-semibold uppercase tracking-wide text-muted-color">
          Column headers
        </h3>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-4">
          <div
            v-for="state in HEADER_STATES"
            :key="state.key"
            class="flex min-w-0 cursor-pointer flex-col gap-1.5"
            :data-ps-pick="`headercells:${state.key}`"
            @click.capture.stop.prevent="emit('pick', state.pick ?? `cell:headercells:background:${state.key}`)"
          >
            <span class="text-[11px] text-muted-color">{{ state.label }}</span>
            <div :class="state.cls">
              <DataTable
                :value="ONE"
                data-key="id"
                :sort-field="state.sorted ? 'name' : undefined"
                :sort-order="1"
                size="small"
              >
                <Column
                  field="name"
                  header="Name"
                  sortable
                />
                <Column
                  field="category"
                  header="Category"
                  sortable
                />
              </DataTable>
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-3">
        <h3 class="text-xs font-semibold uppercase tracking-wide text-muted-color">
          Rows
        </h3>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-4">
          <div
            v-for="state in ROW_STATES"
            :key="state.key"
            class="flex min-w-0 cursor-pointer flex-col gap-1.5"
            :data-ps-pick="`rows:${state.key}`"
            @click.capture.stop.prevent="emit('pick', state.pick ?? `cell:rows:background:${state.key}`)"
          >
            <span class="text-[11px] text-muted-color">{{ state.label }}</span>
            <div :class="state.cls">
              <DataTable
                :value="state.rows"
                :selection="state.selected ? state.rows[0] : null"
                selection-mode="single"
                data-key="id"
                :striped-rows="state.striped"
                row-hover
                size="small"
                class="[&_thead]:hidden"
              >
                <Column field="name" />
                <Column field="category" />
              </DataTable>
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-3">
        <h3 class="text-xs font-semibold uppercase tracking-wide text-muted-color">
          Expand button
        </h3>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-4">
          <div
            v-for="state in EXPAND_STATES"
            :key="state.key"
            class="flex min-w-0 cursor-pointer flex-col gap-1.5"
            :data-ps-pick="`expand:${state.key}`"
            @click.capture.stop.prevent="emit('pick', state.pick)"
          >
            <span class="text-[11px] text-muted-color">{{ state.label }}</span>
            <div :class="state.cls">
              <DataTable
                :value="ONE"
                :selection="state.selected ? ONE[0] : null"
                selection-mode="single"
                data-key="id"
                :expanded-rows="{}"
                size="small"
                class="[&_thead]:hidden"
              >
                <Column
                  expander
                  class="w-12"
                />
                <Column field="name" />
              </DataTable>
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-3">
        <h3 class="text-xs font-semibold uppercase tracking-wide text-muted-color">
          Sizes
        </h3>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-4">
          <div
            v-for="size in SIZES"
            :key="size.key"
            class="flex min-w-0 cursor-pointer flex-col gap-1.5"
            :data-ps-pick="`size:${size.key}`"
            @click.capture.stop.prevent="emit('pick', `section:size:${size.key}`)"
          >
            <span class="text-[11px] text-muted-color">{{ size.label }}</span>
            <DataTable
              :value="TWO"
              data-key="id"
              :size="size.size"
            >
              <Column
                field="name"
                header="Name"
              />
              <Column
                field="price"
                header="Price"
              >
                <template #body="{ data }">
                  {{ price(data.price) }}
                </template>
              </Column>
            </DataTable>
          </div>
        </div>
      </div>
    </template>
  </PreviewStageSchemes>
</template>
