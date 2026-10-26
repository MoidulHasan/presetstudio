<script setup lang="ts">
import { ACTIVE_CLASS, HOVER_CLASS } from '~/composables/usePreviewForcedStyles'

// Primary stage: the scale and everything that uses the primary color, in every state.
const SHADES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']
const STATES = [
  { key: 'default', label: 'Default', cls: '' },
  { key: 'hover', label: 'Hover', cls: HOVER_CLASS },
  { key: 'active', label: 'Pressed', cls: ACTIVE_CLASS },
]
</script>

<template>
  <PreviewStageSchemes intro="The primary scale and where the primary color shows up, in every state. Click a button to edit its state.">
    <template #default>
      <div class="flex overflow-hidden rounded-lg">
        <span
          v-for="shade in SHADES"
          :key="shade"
          class="flex h-10 flex-1 items-end justify-center pb-1 text-[9px]"
          :style="{ background: `var(--p-primary-${shade})`, color: Number(shade) >= 500 ? 'white' : 'black' }"
        >{{ shade }}</span>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <div
          v-for="state in STATES"
          :key="state.key"
          v-pick="`cell:color:${state.key}`"
          :class="state.cls"
          class="cursor-pointer"
        >
          <Button
            :label="state.label"
            tabindex="-1"
          />
        </div>
        <div
          v-for="state in STATES"
          :key="`o-${state.key}`"
          v-pick="`cell:color:${state.key}`"
          :class="state.cls"
          class="cursor-pointer"
        >
          <Button
            :label="state.label"
            outlined
            tabindex="-1"
          />
        </div>
      </div>
      <div
        v-pick="'cell:color:default'"
        class="flex cursor-pointer flex-wrap items-center gap-5"
      >
        <Checkbox
          :model-value="true"
          binary
        />
        <RadioButton
          model-value="a"
          value="a"
        />
        <ToggleSwitch :model-value="true" />
        <Slider
          :model-value="60"
          class="w-32"
        />
        <ProgressBar
          :value="45"
          class="h-2 w-32"
          :show-value="false"
        />
        <Badge value="3" />
        <a
          href="#"
          class="font-medium"
          style="color: var(--p-primary-color)"
          @click.prevent
        >A link</a>
      </div>
      <div
        v-pick="'cell:color:default'"
        class="cursor-pointer"
      >
        <Tabs value="0">
          <TabList>
            <Tab value="0">
              Active tab
            </Tab>
            <Tab value="1">
              Another
            </Tab>
          </TabList>
        </Tabs>
      </div>
    </template>
  </PreviewStageSchemes>
</template>
