<script setup lang="ts">
// Surface stage: the neutral scale of each mode and what it paints.
const SHADES = ['0', '50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']
</script>

<template>
  <PreviewStageSchemes intro="The surface scale of each mode and what it paints: page, cards, borders, inputs and secondary text.">
    <template #default>
      <div class="flex overflow-hidden rounded-lg border border-surface">
        <span
          v-for="shade in SHADES"
          :key="shade"
          class="flex h-10 flex-1 items-end justify-center pb-1 text-[9px]"
          :style="{ background: `var(--p-surface-${shade})`, color: Number(shade) >= 500 ? 'white' : 'black' }"
        >{{ shade }}</span>
      </div>
      <div class="flex flex-col gap-3 rounded-xl bg-surface-50 p-4 dark:bg-surface-950">
        <div class="flex flex-col gap-3 rounded-lg border border-surface bg-surface-0 p-4 dark:bg-surface-900">
          <div class="flex items-center justify-between gap-2">
            <p class="m-0 font-semibold">
              A card on the page
            </p>
            <Tag
              value="Secondary"
              severity="secondary"
            />
          </div>
          <p class="m-0 text-sm text-muted-color">
            Page background, card, border and muted text all come from the surface scale.
          </p>
          <div class="flex flex-wrap gap-2">
            <InputText
              placeholder="An input"
              tabindex="-1"
            />
            <Button
              label="Secondary"
              severity="secondary"
              tabindex="-1"
            />
          </div>
        </div>
        <DataTable
          :value="[{ name: 'Desk lamp', price: '$49' }, { name: 'Walnut shelf', price: '$189' }]"
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
