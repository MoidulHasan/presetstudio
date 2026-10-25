<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import { usePresetStore } from '~/stores/preset'
import { EDITOR_SECTIONS, SECTION_META, type EditorSection } from '~/utils/editor-sections'
import { CATEGORY_META } from '~/utils/preview-categories'
import { COMPONENT_META, STUDIO_COMPONENTS } from '~/utils/theme/components'
import { DESIGN_SECTIONS, type DesignSection } from '~/utils/theme/sections'
import { semanticStudio } from '~/utils/theme/semantic-studio'

const editor = useEditorStore()
const preset = usePresetStore()
const toast = useToast()
// A boolean, so the inspector doesn't re-render whenever the resolvers are rebuilt (every edit).
const loading = computed(() => !preset.resolvers)
const undoHint = import.meta.client && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘Z' : 'Ctrl+Z'
const openComponent = computed(() =>
  editor.prefs.section === 'components' && editor.prefs.component ? COMPONENT_META[editor.prefs.component] ?? null : null)
// Pattern sections (and Text) edit one semantic group.
const openSemantic = computed(() => (editor.sectionGroup ? semanticStudio(editor.sectionGroup) ?? null : null))
// Inside a component or semantic group editor, the header names what's open.
const meta = computed(() => {
  if (openComponent.value) {
    return { ...SECTION_META.components, label: openComponent.value.label, description: `In the ${CATEGORY_META[openComponent.value.category].label} group. Changes here apply only to ${openComponent.value.label}.` }
  }
  return SECTION_META[editor.prefs.section]
})
// Same entries as the section nav: visual component editors are listed by name.
const sectionOptions = EDITOR_SECTIONS.flatMap(value => [
  { value, label: SECTION_META[value].label },
  ...(value === 'components' ? STUDIO_COMPONENTS.map(name => ({ value: `component:${name}`, label: `${COMPONENT_META[name]!.label} (visual editor)` })) : []),
])

const sectionValue = computed({
  get: () => (editor.prefs.section === 'components' && editor.prefs.component && STUDIO_COMPONENTS.includes(editor.prefs.component)
    ? `component:${editor.prefs.component}`
    : editor.prefs.section),
  set: (value: string) => {
    if (value.startsWith('component:')) return editor.openComponent(value.slice('component:'.length))
    if (value === 'components') return editor.openComponentList()
    editor.prefs.section = value as EditorSection
    // Overview sections look at everything.
    if (['start', 'semantic', 'accessibility'].includes(value)) editor.showAllComponents()
  },
})

const designSection = computed(() =>
  (DESIGN_SECTIONS as readonly string[]).includes(editor.prefs.section) ? (editor.prefs.section as DesignSection) : null)
function reset(section: DesignSection) {
  preset.resetSection(section)
  toast.add({ severity: 'secondary', summary: `${SECTION_META[section].label} reset`, detail: `Back to the base preset. Press ${undoHint} to undo.`, life: 3000 })
}

// Sections with something to reset show the button even when there's nothing changed yet.
const resettable = computed(() => ['semantic', 'components'].includes(editor.prefs.section) || !!designSection.value || !!openSemantic.value)
const resetHint = computed(() => {
  if (openSemantic.value) return `Clear the custom ${openSemantic.value.label.toLowerCase()} tokens`
  if (editor.prefs.section === 'semantic') return 'Clear every custom semantic token'
  if (editor.prefs.section === 'components') return openComponent.value ? `Clear the custom ${openComponent.value.label} tokens` : 'Clear the custom tokens of every component'
  return `Put ${meta.value.label.toLowerCase()} back to the base preset`
})

const canReset = computed(() => {
  if (openSemantic.value) return (preset.semanticGroupCounts[openSemantic.value.key] ?? 0) > 0
  if (editor.prefs.section === 'semantic') return preset.semanticOverrideCount > 0
  if (editor.prefs.section === 'components') {
    return editor.prefs.component ? (preset.componentOverrideCounts[editor.prefs.component] ?? 0) > 0 : preset.componentOverrideCount > 0
  }
  return !!designSection.value && preset.modifiedSections.has(designSection.value)
})

function onReset() {
  if (editor.prefs.section === 'components') {
    const label = openComponent.value?.label
    preset.resetComponents(editor.prefs.component)
    toast.add({ severity: 'secondary', summary: label ? `Custom ${label} tokens cleared` : 'Custom component tokens cleared', detail: `Press ${undoHint} to undo.`, life: 3000 })
  }
  else if (openSemantic.value || editor.prefs.section === 'semantic') {
    const label = openSemantic.value?.label
    preset.resetSemantic(openSemantic.value?.key ?? null)
    toast.add({ severity: 'secondary', summary: label ? `Custom ${label.toLowerCase()} tokens cleared` : 'Custom semantic tokens cleared', detail: `Press ${undoHint} to undo.`, life: 3000 })
  }
  else if (designSection.value) {
    reset(designSection.value)
  }
}

// Scroll the panel back to the top when switching sections.
const body = ref<HTMLElement | null>(null)
watch([() => editor.prefs.section, () => editor.prefs.component], () => body.value?.closest('aside')?.scrollTo({ top: 0 }))
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
      v-if="loading"
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
      <EditorPanelsQuickStartPanel v-if="editor.prefs.section === 'start'" />
      <EditorPanelsPrimaryPanel v-else-if="editor.prefs.section === 'primary'" />
      <EditorPanelsSurfacePanel v-else-if="editor.prefs.section === 'surface'" />
      <EditorPanelsStatusPanel v-else-if="editor.prefs.section === 'status'" />
      <EditorPanelsShapePanel v-else-if="editor.prefs.section === 'shape'" />
      <EditorPanelsDensityPanel v-else-if="editor.prefs.section === 'density'" />
      <EditorPanelsFocusPanel v-else-if="editor.prefs.section === 'focus'" />
      <EditorPanelsPatternPanel v-else-if="editor.sectionGroup" />
      <EditorPanelsSemanticPanel v-else-if="editor.prefs.section === 'semantic'" />
      <EditorPanelsComponentsPanel v-else-if="editor.prefs.section === 'components'" />
      <EditorPanelsAccessibilityPanel v-else-if="editor.prefs.section === 'accessibility'" />
    </div>
  </div>
</template>
