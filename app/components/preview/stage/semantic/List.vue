<script setup lang="ts">
// List stage: options in every state (focus and selection are classes, so they're shown with
// PrimeVue's own Listbox markup); a real Listbox and an open-looking Select panel use them too.

const OPTIONS = [
  { label: 'Amsterdam', cls: '', pick: 'cell:text:default', hint: 'Default' },
  { label: 'Berlin', cls: 'p-focus', pick: 'cell:background:focus', hint: 'Focus' },
  { label: 'Lisbon', cls: 'p-listbox-option-selected', pick: 'cell:background:selected', hint: 'Selected', selected: true },
  { label: 'Madrid', cls: 'p-listbox-option-selected p-focus', pick: 'cell:background:selectedfocus', hint: 'Selected + focus', selected: true },
  { label: 'Paris', cls: 'p-disabled', pick: 'cell:text:default', hint: 'Disabled' },
]
</script>

<template>
  <PreviewStageSchemes intro="List options in every state, with a group header. Click any option to edit that exact color.">
    <template #default>
      <div class="hidden">
        <Listbox :options="[]" />
      </div>
      <div class="grid gap-6 sm:grid-cols-2">
        <div class="flex flex-col gap-2">
          <h3 class="text-xs font-semibold uppercase tracking-wide text-muted-color">
            States
          </h3>
          <div class="p-listbox p-component">
            <div class="p-listbox-list-container">
              <ul
                class="p-listbox-list"
                role="listbox"
                aria-label="List option states"
              >
                <li
                  v-pick="'cell:groupbackground:default'"
                  class="p-listbox-option-group cursor-pointer"
                  role="presentation"
                >
                  Europe
                </li>
                <li
                  v-for="option in OPTIONS"
                  :key="option.label"
                  v-pick="option.pick"
                  :class="option.cls"
                  class="p-listbox-option cursor-pointer"
                  role="option"
                  :aria-selected="!!option.selected"
                >
                  <span class="flex-1">{{ option.label }}</span>
                  <span class="text-[10px] opacity-60">{{ option.hint }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <h3 class="text-xs font-semibold uppercase tracking-wide text-muted-color">
            With checkmarks
          </h3>
          <div
            v-pick="'cell:icon:default'"
            class="cursor-pointer"
          >
            <Listbox
              :model-value="'Lisbon'"
              :options="['Amsterdam', 'Berlin', 'Lisbon', 'Madrid']"
              checkmark
              :highlight-on-select="false"
              fluid
            />
          </div>
        </div>
      </div>
      <div
        v-pick="'section:size'"
        class="flex cursor-pointer items-center gap-3"
      >
        <span class="text-xs text-muted-color">Spacing follows the list padding, gap and option padding.</span>
      </div>
    </template>
  </PreviewStageSchemes>
</template>
