<script setup lang="ts">
// Overlay stage: a dropdown panel, a popover and a dialog, shown open (PrimeVue's own markup).
const emit = defineEmits<{ pick: [target: string] }>()
</script>

<template>
  <PreviewStageSchemes intro="A dropdown panel, a popover and a dialog on its backdrop, shown open. Click one to edit its colors.">
    <template #default>
      <div class="hidden">
        <Select :options="[]" />
        <Popover />
        <Dialog :visible="false" />
      </div>
      <div class="grid gap-6 lg:grid-cols-2">
        <div class="flex flex-col gap-2">
          <h3 class="text-xs font-semibold uppercase tracking-wide text-muted-color">
            Dropdown
          </h3>
          <div
            class="p-select-overlay p-component cursor-pointer !static"
            @click="emit('pick', 'cell:background:select')"
          >
            <div class="p-select-list-container">
              <ul
                class="p-select-list"
                role="listbox"
                aria-label="Dropdown options"
              >
                <li
                  v-for="city in ['Amsterdam', 'Berlin', 'Lisbon']"
                  :key="city"
                  class="p-select-option"
                  role="option"
                >
                  {{ city }}
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <h3 class="text-xs font-semibold uppercase tracking-wide text-muted-color">
            Popover
          </h3>
          <div
            class="p-popover p-component cursor-pointer !static !mt-3"
            @click="emit('pick', 'cell:background:popover')"
          >
            <div class="p-popover-content">
              <p class="m-0 text-sm font-semibold">
                Team members
              </p>
              <p class="m-0 text-sm">
                Popovers show extra content next to what opened them.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div class="flex flex-col gap-2">
        <h3 class="text-xs font-semibold uppercase tracking-wide text-muted-color">
          Dialog on its backdrop
        </h3>
        <div
          class="relative h-72 cursor-pointer overflow-hidden rounded-lg border border-surface"
          @click="emit('pick', 'cell:backdrop:modal')"
        >
          <div class="flex flex-col gap-2 p-4">
            <p class="m-0 font-semibold">
              Page content
            </p>
            <p class="m-0 text-sm text-muted-color">
              The backdrop covers everything behind the dialog.
            </p>
          </div>
          <div class="p-overlay-mask !absolute inset-0 grid place-items-center p-4">
            <div
              class="p-dialog p-component !static w-full max-w-sm"
              role="dialog"
              aria-label="Example dialog"
              @click.stop="emit('pick', 'cell:background:modal')"
            >
              <div class="p-dialog-header">
                <span class="p-dialog-title">Edit profile</span>
              </div>
              <div class="p-dialog-content">
                <p class="m-0">
                  Dialogs use the modal colors, radius and padding.
                </p>
              </div>
              <div class="p-dialog-footer">
                <Button
                  label="Cancel"
                  severity="secondary"
                  text
                  tabindex="-1"
                />
                <Button
                  label="Save"
                  tabindex="-1"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </PreviewStageSchemes>
</template>
