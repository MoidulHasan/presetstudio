<script setup lang="ts">
import { EDITOR_SECTIONS, useEditorStore, type EditorSection } from '~/stores/editor'
import { SECTION_META } from '~/utils/editor-sections'
import { CATEGORY_META } from '~/utils/preview-categories'
import { COMPONENT_META, STUDIO_COMPONENTS } from '~/utils/theme/components'
import { DESIGN_SECTIONS, type DesignSection } from '~/utils/theme/sections'
import { semanticStudio } from '~/utils/theme/semantic-studio'

const store = useEditorStore()
const toast = useToast()
const undoHint = import.meta.client && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘Z' : 'Ctrl+Z'
const openComponent = computed(() =>
  store.prefs.section === 'components' && store.prefs.component ? COMPONENT_META[store.prefs.component] ?? null : null)
// Pattern sections (and Text) edit one semantic group.
const openSemantic = computed(() => (store.sectionGroup ? semanticStudio(store.sectionGroup) ?? null : null))
// Inside a component or semantic group editor, the header names what's open.
const meta = computed(() => {
  if (openComponent.value) {
    return { ...SECTION_META.components, label: openComponent.value.label, description: `In the ${CATEGORY_META[openComponent.value.category].label} group. Changes here apply only to ${openComponent.value.label}.` }
  }
  return SECTION_META[store.prefs.section]
})
// Same entries as the section nav: visual component editors are listed by name.
const sectionOptions = EDITOR_SECTIONS.flatMap(value => [
  { value, label: SECTION_META[value].label },
  ...(value === 'components' ? STUDIO_COMPONENTS.map(name => ({ value: `component:${name}`, label: `${COMPONENT_META[name]!.label} (visual editor)` })) : []),
])

const sectionValue = computed({
  get: () => (store.prefs.section === 'components' && store.prefs.component && STUDIO_COMPONENTS.includes(store.prefs.component)
    ? `component:${store.prefs.component}`
    : store.prefs.section),
  set: (value: string) => {
    if (value.startsWith('component:')) return store.openComponent(value.slice('component:'.length))
    if (value === 'components') return store.openComponentList()
    store.prefs.section = value as EditorSection
  },
})

const designSection = computed(() =>
  (DESIGN_SECTIONS as readonly string[]).includes(store.prefs.section) ? (store.prefs.section as DesignSection) : null)
function reset(section: DesignSection) {
  store.resetSection(section)
  toast.add({ severity: 'secondary', summary: `${SECTION_META[section].label} reset`, detail: `Back to the base preset. Press ${undoHint} to undo.`, life: 3000 })
}

// Sections with something to reset show the button even when there's nothing changed yet.
const resettable = computed(() => ['semantic', 'components'].includes(store.prefs.section) || !!designSection.value || !!openSemantic.value)
const resetHint = computed(() => {
  if (openSemantic.value) return `Clear the custom ${openSemantic.value.label.toLowerCase()} tokens`
  if (store.prefs.section === 'semantic') return 'Clear every custom semantic token'
  if (store.prefs.section === 'components') return openComponent.value ? `Clear the custom ${openComponent.value.label} tokens` : 'Clear the custom tokens of every component'
  return `Put ${meta.value.label.toLowerCase()} back to the base preset`
})

const canReset = computed(() => {
  if (openSemantic.value) return (store.semanticGroupCounts[openSemantic.value.key] ?? 0) > 0
  if (store.prefs.section === 'semantic') return store.semanticOverrideCount > 0
  if (store.prefs.section === 'components') {
    return store.prefs.component ? (store.componentOverrideCounts[store.prefs.component] ?? 0) > 0 : store.componentOverrideCount > 0
  }
  return !!designSection.value && store.modifiedSections.has(designSection.value)
})

function onReset() {
  if (store.prefs.section === 'components') {
    const label = openComponent.value?.label
    store.resetComponents(store.prefs.component)
    toast.add({ severity: 'secondary', summary: label ? `Custom ${label} tokens cleared` : 'Custom component tokens cleared', detail: `Press ${undoHint} to undo.`, life: 3000 })
  }
  else if (openSemantic.value || store.prefs.section === 'semantic') {
    const label = openSemantic.value?.label
    store.resetSemantic(openSemantic.value?.key ?? null)
    toast.add({ severity: 'secondary', summary: label ? `Custom ${label.toLowerCase()} tokens cleared` : 'Custom semantic tokens cleared', detail: `Press ${undoHint} to undo.`, life: 3000 })
  }
  else if (designSection.value) {
    reset(designSection.value)
  }
}

// Scroll the panel back to the top when switching sections.
const body = ref<HTMLElement | null>(null)
watch([() => store.prefs.section, () => store.prefs.component], () => body.value?.closest('aside')?.scrollTo({ top: 0 }))
</script>

<template>
  <div
    ref="body"
    class="flex flex-col"
  >
    <header class="sticky top-0 z-10 border-b border-surface-200 bg-surface-0 px-5 py-4 dark:border-surface-800 dark:bg-surface-900">
      <!-- Below xl the section nav is hidden; pick sections here instead. -->
      <Select
        v-model="sectionValue"
        :options="sectionOptions"
        option-label="label"
        option-value="value"
        aria-label="Editor section"
        class="mb-3 w-full xl:hidden"
      />
      <div class="flex items-start justify-between gap-2">
        <h2 class="text-base font-semibold">
          {{ meta.label }}
        </h2>
        <Button
          v-if="resettable"
          v-tooltip.left="canReset ? resetHint : 'Nothing to reset yet'"
          label="Reset"
          icon="pi pi-undo"
          severity="secondary"
          size="small"
          outlined
          class="-my-1 shrink-0"
          :disabled="!canReset"
          @click="onReset"
        />
      </div>
      <p class="mt-1 text-xs text-surface-500 dark:text-surface-400">
        {{ meta.description }}
      </p>
      <!-- Panels can teleport sticky controls (search, filters) here. -->
      <div
        id="inspector-toolbar"
        class="mt-3 flex flex-col gap-2 empty:hidden"
      />
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
      <EditorPanelsStatusPanel v-else-if="store.prefs.section === 'status'" />
      <EditorPanelsShapePanel v-else-if="store.prefs.section === 'shape'" />
      <EditorPanelsDensityPanel v-else-if="store.prefs.section === 'density'" />
      <EditorPanelsFocusPanel v-else-if="store.prefs.section === 'focus'" />
      <EditorPanelsPatternPanel v-else-if="store.sectionGroup" />
      <EditorPanelsSemanticPanel v-else-if="store.prefs.section === 'semantic'" />
      <EditorPanelsComponentsPanel v-else-if="store.prefs.section === 'components'" />
      <EditorPanelsAccessibilityPanel v-else-if="store.prefs.section === 'accessibility'" />
    </div>
  </div>
</template>
