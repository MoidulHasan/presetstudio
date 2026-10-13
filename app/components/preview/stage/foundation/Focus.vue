<script setup lang="ts">
import { FOCUS_CLASS } from '~/composables/usePreviewForcedStyles'

// Focus ring stage: components shown keyboard-focused, so the ring is visible without a keyboard.
</script>

<template>
  <PreviewStageSchemes intro="Components shown keyboard-focused, so the ring is always visible.">
    <template #default>
      <div
        :class="FOCUS_CLASS"
        class="flex flex-wrap items-center gap-5 p-1"
      >
        <Button
          label="Button"
          tabindex="-1"
        />
        <Button
          label="Secondary"
          severity="secondary"
          tabindex="-1"
        />
        <Button
          label="Text"
          text
          tabindex="-1"
        />
        <Checkbox
          :model-value="true"
          binary
        />
        <RadioButton
          model-value="a"
          value="a"
        />
        <ToggleSwitch :model-value="true" />
        <Rating :model-value="3" />
      </div>
      <div
        :class="FOCUS_CLASS"
        class="flex flex-col gap-4 p-1"
      >
        <Tabs value="0">
          <TabList>
            <Tab value="0">
              Focused tab
            </Tab>
            <Tab value="1">
              Another
            </Tab>
          </TabList>
        </Tabs>
        <div class="flex flex-wrap items-center gap-4">
          <InputText
            placeholder="Input (border focus)"
            tabindex="-1"
          />
          <Slider
            :model-value="50"
            class="w-40"
          />
        </div>
      </div>
    </template>
  </PreviewStageSchemes>
</template>
