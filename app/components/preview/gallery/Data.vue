<script setup lang="ts">
import { fileNodes, orgChart, products, stockSeverity, timelineEvents } from '~/utils/preview-data'

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const selectedProducts = ref([products[1]])
const orderList = ref(products.slice(0, 4))
const pickList = ref([products.slice(0, 3), products.slice(3)])
const selectedNode = ref({})
const virtualItems = Array.from({ length: 1000 }, (_, i) => `Item #${i + 1}`)
const first = ref(0)
</script>

<template>
  <div class="grid gap-4 md:grid-cols-2">
    <PreviewDemo
      title="DataTable"
      wide
    >
      <DataTable
        v-model:selection="selectedProducts"
        :value="products"
        data-key="id"
        size="small"
        striped-rows
        paginator
        :rows="4"
        removable-sort
      >
        <Column
          selection-mode="multiple"
          header-style="width: 3rem"
        />
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
        <Column
          field="price"
          header="Price"
          sortable
        >
          <template #body="{ data }">
            {{ currency.format(data.price) }}
          </template>
        </Column>
        <Column
          field="status"
          header="Status"
        >
          <template #body="{ data }">
            <Tag
              :value="data.status"
              :severity="stockSeverity[data.status]"
            />
          </template>
        </Column>
      </DataTable>
    </PreviewDemo>

    <PreviewDemo
      title="TreeTable"
      wide
    >
      <TreeTable
        :value="fileNodes"
        size="small"
      >
        <Column
          field="name"
          header="Name"
          expander
        />
        <Column
          field="size"
          header="Size"
        />
        <Column
          field="type"
          header="Type"
        />
      </TreeTable>
    </PreviewDemo>

    <PreviewDemo title="DataView">
      <DataView
        :value="products.slice(0, 3)"
        data-key="id"
      >
        <template #list="{ items }">
          <div
            v-for="(item, i) in items"
            :key="item.id"
            class="flex items-center justify-between gap-3 py-3"
            :class="{ 'border-t border-surface': i !== 0 }"
          >
            <div class="flex flex-col">
              <span class="font-medium">{{ item.name }}</span>
              <span class="text-sm text-muted-color">{{ item.category }}</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="font-semibold">{{ currency.format(item.price) }}</span>
              <Button
                icon="pi pi-shopping-cart"
                size="small"
                aria-label="Add to cart"
              />
            </div>
          </div>
        </template>
      </DataView>
    </PreviewDemo>

    <PreviewDemo title="Tree">
      <Tree
        v-model:selection-keys="selectedNode"
        :value="fileNodes"
        selection-mode="single"
        class="w-full p-0"
      />
    </PreviewDemo>

    <PreviewDemo title="OrderList">
      <OrderList
        v-model="orderList"
        data-key="id"
        list-style="height: 12rem"
      >
        <template #option="{ option }">
          {{ option.name }}
        </template>
      </OrderList>
    </PreviewDemo>

    <PreviewDemo title="Timeline">
      <Timeline :value="timelineEvents">
        <template #content="{ item }">
          <div class="flex flex-col">
            <span class="font-medium">{{ item.status }}</span>
            <small class="text-muted-color">{{ item.date }}</small>
          </div>
        </template>
      </Timeline>
    </PreviewDemo>

    <PreviewDemo
      title="PickList"
      wide
    >
      <PickList
        v-model="pickList"
        data-key="id"
        breakpoint="1200px"
        list-style="height: 10rem"
      >
        <template #option="{ option }">
          {{ option.name }}
        </template>
      </PickList>
    </PreviewDemo>

    <PreviewDemo
      title="OrganizationChart"
      wide
    >
      <div class="overflow-x-auto">
        <OrganizationChart
          :value="orgChart"
          collapsible
        >
          <template #default="{ node }">
            <div class="flex flex-col">
              <span class="font-semibold">{{ node.label }}</span>
              <span class="text-xs text-muted-color">{{ node.data }}</span>
            </div>
          </template>
        </OrganizationChart>
      </div>
    </PreviewDemo>

    <PreviewDemo title="Paginator">
      <Paginator
        v-model:first="first"
        :rows="10"
        :total-records="120"
        :rows-per-page-options="[10, 20, 30]"
      />
    </PreviewDemo>

    <PreviewDemo title="VirtualScroller">
      <VirtualScroller
        :items="virtualItems"
        :item-size="40"
        class="rounded-md border border-surface"
        style="height: 200px"
      >
        <template #item="{ item, options }">
          <div
            class="flex h-10 items-center px-3"
            :class="{ 'bg-surface-50 dark:bg-surface-800': options.odd }"
          >
            {{ item }}
          </div>
        </template>
      </VirtualScroller>
    </PreviewDemo>
  </div>
</template>
