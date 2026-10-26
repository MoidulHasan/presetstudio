<script setup lang="ts">
// Highlight stage: the same "selected" look across components: list options, table rows, tree
// nodes (selected, and selected + focused).

const ROWS = [
  { id: 1, name: 'Desk lamp', price: '$49' },
  { id: 2, name: 'Walnut shelf', price: '$189' },
  { id: 3, name: 'Wool throw', price: '$79' },
]
const selectedRow = ref(ROWS[1])
const nodes = [{ key: '0', label: 'Documents', icon: 'pi pi-folder' }, { key: '1', label: 'Pictures', icon: 'pi pi-image' }]
const selectedKeys = ref({ 0: true })
</script>

<template>
  <PreviewStageSchemes intro="Selected items everywhere use the highlight colors. Click one to edit them.">
    <template #default>
      <div class="hidden">
        <Listbox :options="[]" />
      </div>
      <div class="grid gap-6 sm:grid-cols-2">
        <div
          v-pick="'cell:background:default'"
          class="flex cursor-pointer flex-col gap-2"
        >
          <h3 class="text-xs font-semibold uppercase tracking-wide text-muted-color">
            Selected list option
          </h3>
          <div class="p-listbox p-component">
            <div class="p-listbox-list-container">
              <ul
                class="p-listbox-list"
                role="listbox"
                aria-label="Selected options"
              >
                <li
                  class="p-listbox-option"
                  role="option"
                >
                  Amsterdam
                </li>
                <li
                  class="p-listbox-option p-listbox-option-selected"
                  role="option"
                  aria-selected="true"
                >
                  Lisbon
                </li>
                <li
                  v-pick="'cell:background:focus'"
                  class="p-listbox-option p-listbox-option-selected p-focus"
                  role="option"
                  aria-selected="true"
                >
                  Madrid (focused)
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div
          v-pick="'cell:background:default'"
          class="flex cursor-pointer flex-col gap-2"
        >
          <h3 class="text-xs font-semibold uppercase tracking-wide text-muted-color">
            Selected tree node
          </h3>
          <Tree
            v-model:selection-keys="selectedKeys"
            :value="nodes"
            selection-mode="single"
          />
        </div>
      </div>
      <div
        v-pick="'cell:background:default'"
        class="flex cursor-pointer flex-col gap-2"
      >
        <h3 class="text-xs font-semibold uppercase tracking-wide text-muted-color">
          Selected table row
        </h3>
        <DataTable
          v-model:selection="selectedRow"
          :value="ROWS"
          selection-mode="single"
          data-key="id"
          size="small"
        >
          <Column
            field="name"
            header="Name"
          />
          <Column
            field="price"
            header="Price"
          />
        </DataTable>
      </div>
    </template>
  </PreviewStageSchemes>
</template>
