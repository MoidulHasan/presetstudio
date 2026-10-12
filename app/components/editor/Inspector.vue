<script setup lang="ts">
import { EDITOR_SECTIONS, useEditorStore } from '~/stores/editor'
import { SECTION_META } from '~/utils/editor-sections'

const store = useEditorStore()
const meta = computed(() => SECTION_META[store.prefs.section])
const sectionOptions = EDITOR_SECTIONS.map(value => ({ value, label: SECTION_META[value].label }))
</script>

<template>
  <div class="flex flex-col">
    <header class="sticky top-0 z-10 border-b border-surface-200 bg-surface-0 px-5 py-4 dark:border-surface-800 dark:bg-surface-900">
      <!-- On narrow screens the section nav is hidden; pick sections here instead. -->
      <Select
        v-model="store.prefs.section"
        :options="sectionOptions"
        option-label="label"
        option-value="value"
        aria-label="Editor section"
        class="mb-3 w-full lg:hidden"
      />
      <h2 class="text-base font-semibold">
        {{ meta.label }}
      </h2>
      <p class="mt-1 text-xs text-surface-500 dark:text-surface-400">
        {{ meta.description }}
      </p>
    </header>

    <div
      v-if="!store.resolvers"
      class="grid place-items-center p-10"
    >
      <ProgressSpinner
        style="width: 2rem; height: 2rem"
        aria-label="Loading base preset"
      />
    </div>
    <div
      v-else
      class="p-5"
    >
      <EditorPanelsPrimaryPanel v-if="store.prefs.section === 'primary'" />
      <EditorPanelsSurfacePanel v-else-if="store.prefs.section === 'surface'" />
      <EditorPanelsShapePanel v-else-if="store.prefs.section === 'shape'" />
      <EditorPanelsDensityPanel v-else-if="store.prefs.section === 'density'" />
      <EditorPanelsFocusPanel v-else-if="store.prefs.section === 'focus'" />
      <EditorPanelsAccessibilityPanel v-else-if="store.prefs.section === 'accessibility'" />
    </div>
  </div>
</template>
