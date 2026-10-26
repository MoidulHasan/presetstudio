<script setup lang="ts">
// Shape stage: components grouped by size, so every step of the radius scale is visible.
</script>

<template>
  <PreviewStageSchemes
    intro="The radius scale on the components that use it. The Shape panel shows which step each one follows."
    single
  >
    <template #default>
      <div class="hidden">
        <Dialog :visible="false" />
        <Popover />
      </div>
      <div class="flex flex-col gap-3">
        <h3 class="text-xs font-medium text-muted-color">
          Small details
        </h3>
        <div class="flex flex-wrap items-center gap-4">
          <Checkbox
            :model-value="true"
            binary
          />
          <Checkbox
            :model-value="false"
            binary
          />
          <Tag value="Tag" />
          <Badge value="8" />
          <Chip label="Chip" />
        </div>
      </div>
      <div class="flex flex-col gap-3">
        <h3 class="text-xs font-medium text-muted-color">
          Controls
        </h3>
        <div class="flex flex-wrap items-center gap-3">
          <Button
            label="Button"
            tabindex="-1"
          />
          <Button
            label="Outlined"
            outlined
            tabindex="-1"
          />
          <InputText
            placeholder="Input"
            tabindex="-1"
          />
          <Select
            :options="['One']"
            placeholder="Select"
          />
          <SelectButton
            :model-value="'Day'"
            :options="['Day', 'Week']"
          />
        </div>
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="flex flex-col gap-3">
          <h3 class="text-xs font-medium text-muted-color">
            Containers
          </h3>
          <Card>
            <template #title>
              Card
            </template>
            <template #content>
              <p class="m-0 text-sm">
                Cards, panels and messages.
              </p>
            </template>
          </Card>
          <Message severity="info">
            A message
          </Message>
        </div>
        <div class="flex flex-col gap-3">
          <h3 class="text-xs font-medium text-muted-color">
            Overlays
          </h3>
          <div class="p-popover p-component !static !mt-2">
            <div class="p-popover-content text-sm">
              A popover
            </div>
          </div>
          <div
            class="p-dialog p-component !static"
            role="dialog"
            aria-label="Example dialog"
          >
            <div class="p-dialog-header">
              <span class="p-dialog-title">Dialog</span>
            </div>
            <div class="p-dialog-content text-sm">
              Dialogs use the largest steps.
            </div>
          </div>
        </div>
      </div>
    </template>
  </PreviewStageSchemes>
</template>
