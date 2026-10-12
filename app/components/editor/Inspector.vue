<script setup lang="ts">
import { EDITOR_SECTIONS, useEditorStore } from '~/stores/editor'
import { SECTION_META } from '~/utils/editor-sections'
import { DESIGN_SECTIONS, type DesignSection } from '~/utils/theme/sections'

const store = useEditorStore()
const toast = useToast()
const undoHint = import.meta.client && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘Z' : 'Ctrl+Z'
const meta = computed(() => SECTION_META[store.prefs.section])
const sectionOptions = EDITOR_SECTIONS.map(value => ({ value, label: SECTION_META[value].label }))

const designSection = computed(() =>
  (DESIGN_SECTIONS as readonly string[]).includes(store.prefs.section) ? (store.prefs.section as DesignSection) : null)
function reset(section: DesignSection) {
  store.resetSection(section)
  toast.add({ severity: 'secondary', summary: `${SECTION_META[section].label} reset`, detail: `Back to the base preset. Press ${undoHint} to undo.`, life: 3000 })
}

const canReset = computed(() =>
  store.prefs.section === 'semantic'
    ? store.semanticOverrideCount > 0
    : !!designSection.value && store.modifiedSections.has(designSection.value))

function onReset() {
  if (store.prefs.section === 'semantic') {
    store.resetSemantic()
    toast.add({ severity: 'secondary', summary: 'Custom semantic tokens cleared', detail: `Press ${undoHint} to undo.`, life: 3000 })
  }
  else if (designSection.value) {
    reset(designSection.value)
  }
}

// Scroll the panel back to the top when switching sections.
const body = ref<HTMLElement | null>(null)
watch(() => store.prefs.section, () => body.value?.closest('aside')?.scrollTo({ top: 0 }))
</script>

<template>
  <div
    ref="body"
    class="flex flex-col"
  >
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
      <div class="flex items-start justify-between gap-2">
        <h2 class="text-base font-semibold">
          {{ meta.label }}
        </h2>
        <Button
          v-if="canReset"
          v-tooltip.left="'Back to the base preset\'s values'"
          label="Reset"
          icon="pi pi-undo"
          severity="secondary"
          size="small"
          text
          class="-my-1"
          @click="onReset"
        />
      </div>
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
      <EditorPanelsQuickStartPanel v-if="store.prefs.section === 'start'" />
      <EditorPanelsPrimaryPanel v-else-if="store.prefs.section === 'primary'" />
      <EditorPanelsSurfacePanel v-else-if="store.prefs.section === 'surface'" />
      <EditorPanelsShapePanel v-else-if="store.prefs.section === 'shape'" />
      <EditorPanelsDensityPanel v-else-if="store.prefs.section === 'density'" />
      <EditorPanelsFocusPanel v-else-if="store.prefs.section === 'focus'" />
      <EditorPanelsSemanticPanel v-else-if="store.prefs.section === 'semantic'" />
      <EditorPanelsAccessibilityPanel v-else-if="store.prefs.section === 'accessibility'" />
    </div>
  </div>
</template>
