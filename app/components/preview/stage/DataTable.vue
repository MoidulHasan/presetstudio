<script setup lang="ts">
import { HOVER_CLASS } from '~/composables/usePreviewForcedStyles'
import { PICK_EVENT } from '~/plugins/pick'

// The DataTable stage: a table with its resting states (a sorted column, default, selected and
// striped rows, row toggles, header and footer), a small one hovered, then the small and large
// sizes. DataTable renders its own rows and cells, so they're tagged through `pt`
// (`data-ps-pick`, like v-pick) and one capture handler reports clicks; the tables never see
// them, so they don't sort or select and the states stay put. Forced hover styles apply inside
// a hovered element, not to it, so the hover sample is a whole table inside one.

const ORDERS = [
  { id: 'ORD-1042', customer: 'Maya Chen', status: 'Paid', amount: 248 },
  { id: 'ORD-1041', customer: 'Sam Okafor', status: 'Pending', amount: 1120 },
  { id: 'ORD-1040', customer: 'Lena Petrova', status: 'Paid', amount: 86.5 },
  { id: 'ORD-1039', customer: 'Diego Ruiz', status: 'Refunded', amount: 312 },
  { id: 'ORD-1038', customer: 'Aiko Tanaka', status: 'Paid', amount: 54.9 },
]
const STATUS_SEVERITY: Record<string, string> = { Paid: 'success', Pending: 'warn', Refunded: 'secondary' }
const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
const total = money(ORDERS.reduce((sum, o) => sum + o.amount, 0))

// Odd rows are striped; the third is selected.
const ROW_STATES = ['default', 'striped', 'selected', 'striped', 'default']
const tablePt = {
  header: { 'data-ps-pick': 'cell:header:default' },
  footer: { 'data-ps-pick': 'cell:footer:default' },
  bodyRow: ({ context }: { context: { index: number } }) => ({ 'data-ps-pick': `cell:row:${ROW_STATES[context.index] ?? 'default'}` }),
}
const headerPt = (state: string) => ({
  headerCell: { 'data-ps-pick': `cell:headercell:${state}` },
  sort: { 'data-ps-pick': `cell:sorticon:${state === 'hover' ? 'hover' : 'default'}` },
})
const hoverPt = { bodyRow: { 'data-ps-pick': 'cell:row:hover' } }

function onClick(event: MouseEvent) {
  event.stopPropagation()
  event.preventDefault()
  const el = (event.target as HTMLElement).closest<HTMLElement>('[data-ps-pick]')
  if (el?.dataset.psPick) el.dispatchEvent(new CustomEvent(PICK_EVENT, { bubbles: true, detail: el.dataset.psPick }))
}
</script>

<template>
  <PreviewStageSchemes intro="A table with a sorted and a hovered column, hovered, selected and striped rows, and its sizes. Click a part to edit it.">
    <template #default>
      <div
        class="flex min-w-0 flex-col gap-6"
        @click.capture="onClick"
      >
        <DataTable
          :value="ORDERS"
          data-key="id"
          selection-mode="single"
          :selection="ORDERS[2]"
          sort-field="id"
          :sort-order="-1"
          striped-rows
          row-hover
          :pt="tablePt"
        >
          <template #header>
            <span class="font-semibold">Recent orders</span>
          </template>
          <Column
            expander
            style="width: 3rem"
            :pt="{ bodyCell: { 'data-ps-pick': 'cell:toggle:default' } }"
          />
          <Column
            field="id"
            header="Order"
            sortable
            :pt="headerPt('selected')"
          />
          <Column
            field="customer"
            header="Customer"
            sortable
            :pt="headerPt('default')"
          />
          <Column
            field="status"
            header="Status"
            :pt="headerPt('default')"
          >
            <template #body="{ data }">
              <Tag
                :value="data.status"
                :severity="STATUS_SEVERITY[data.status]"
              />
            </template>
          </Column>
          <Column
            field="amount"
            header="Amount"
            sortable
            :pt="headerPt('default')"
          >
            <template #body="{ data }">
              {{ money(data.amount) }}
            </template>
          </Column>
          <template #footer>
            {{ ORDERS.length }} orders · {{ total }}
          </template>
        </DataTable>

        <div class="flex flex-col gap-2">
          <h3 class="text-xs font-medium text-muted-color">
            Hover
          </h3>
          <div :class="HOVER_CLASS">
            <DataTable
              :value="ORDERS.slice(1, 2)"
              data-key="id"
              selection-mode="single"
              row-hover
              :pt="hoverPt"
            >
              <Column
                expander
                style="width: 3rem"
                :pt="{ bodyCell: { 'data-ps-pick': 'cell:toggle:hover' } }"
              />
              <Column
                field="id"
                header="Order"
                sortable
                :pt="headerPt('hover')"
              />
              <Column
                field="customer"
                header="Customer"
                sortable
                :pt="headerPt('hover')"
              />
              <Column
                field="amount"
                header="Amount"
              >
                <template #body="{ data }">
                  {{ money(data.amount) }}
                </template>
              </Column>
            </DataTable>
          </div>
        </div>

        <div
          v-for="size in (['small', 'large'] as const)"
          :key="size"
          class="flex flex-col gap-2"
          :data-ps-pick="`section:size:${size === 'small' ? 'sm' : 'lg'}`"
        >
          <h3 class="text-xs font-medium text-muted-color">
            {{ size === 'small' ? 'Small' : 'Large' }}
          </h3>
          <DataTable
            :value="ORDERS.slice(0, 2)"
            data-key="id"
            :size="size"
          >
            <Column
              field="id"
              header="Order"
            />
            <Column
              field="customer"
              header="Customer"
            />
            <Column
              field="amount"
              header="Amount"
            >
              <template #body="{ data }">
                {{ money(data.amount) }}
              </template>
            </Column>
          </DataTable>
        </div>
      </div>
    </template>
  </PreviewStageSchemes>
</template>
