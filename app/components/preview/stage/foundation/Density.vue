<script setup lang="ts">
// Density stage: the components whose spacing density scales, side by side in their sizes.
const ROWS = [
  { name: 'Desk lamp', category: 'Lighting', price: '$49' },
  { name: 'Walnut shelf', category: 'Furniture', price: '$189' },
  { name: 'Wool throw', category: 'Textiles', price: '$79' },
]
const MENU = [{ label: 'New', icon: 'pi pi-plus' }, { label: 'Search', icon: 'pi pi-search' }, { label: 'Share', icon: 'pi pi-share-alt' }]
</script>

<template>
  <PreviewStageSchemes
    intro="Paddings and gaps scale with density: form controls, lists, menus, tables and containers."
    single
  >
    <template #default>
      <div class="flex flex-col gap-3">
        <h3 class="text-xs font-semibold uppercase tracking-wide text-muted-color">
          Form controls
        </h3>
        <div class="flex flex-wrap items-center gap-3">
          <InputText
            placeholder="Small"
            class="max-w-full"
            size="small"
            tabindex="-1"
          />
          <InputText
            placeholder="Normal"
            class="max-w-full"
            tabindex="-1"
          />
          <InputText
            placeholder="Large"
            class="max-w-full"
            size="large"
            tabindex="-1"
          />
          <Button
            label="Small"
            size="small"
            tabindex="-1"
          />
          <Button
            label="Normal"
            tabindex="-1"
          />
          <Button
            label="Large"
            size="large"
            tabindex="-1"
          />
        </div>
      </div>
      <div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.6fr)]">
        <div class="flex flex-col gap-3">
          <h3 class="text-xs font-semibold uppercase tracking-wide text-muted-color">
            List
          </h3>
          <Listbox
            :model-value="'Berlin'"
            :options="['Amsterdam', 'Berlin', 'Lisbon']"
            fluid
          />
        </div>
        <div class="flex flex-col gap-3">
          <h3 class="text-xs font-semibold uppercase tracking-wide text-muted-color">
            Menu
          </h3>
          <Menu :model="MENU" />
        </div>
        <div class="flex flex-col gap-3">
          <h3 class="text-xs font-semibold uppercase tracking-wide text-muted-color">
            Table
          </h3>
          <DataTable :value="ROWS">
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
      </div>
      <div class="flex flex-col gap-3">
        <h3 class="text-xs font-semibold uppercase tracking-wide text-muted-color">
          Containers
        </h3>
        <div class="grid gap-4 sm:grid-cols-2">
          <Card>
            <template #title>
              Card
            </template>
            <template #content>
              <p class="m-0 text-sm">
                Card body padding scales too.
              </p>
            </template>
          </Card>
          <Accordion value="0">
            <AccordionPanel value="0">
              <AccordionHeader>Accordion</AccordionHeader>
              <AccordionContent>
                <p class="m-0 text-sm">
                  Header and content padding.
                </p>
              </AccordionContent>
            </AccordionPanel>
          </Accordion>
        </div>
      </div>
    </template>
  </PreviewStageSchemes>
</template>
