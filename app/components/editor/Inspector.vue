<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import { usePresetStore } from '~/stores/preset'
import { EDITOR_SECTIONS, SECTION_META, destinationOf, type EditorSection } from '~/utils/editor-sections'
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
// With section tabs (the two-pane layout), the active tab names the section, so there's no title
// row, except inside a component (its name, the way back, Show in preview). Its explanation is
// on the tab, and Reset closes the panel.
const slots = useSlots()
const tabbed = computed(() => !!slots.nav && destinationOf(editor.prefs.section).sections.length > 1)
const titled = computed(() => !tabbed.value || !!openComponent.value)

function showInPreview(component: string) {
  editor.prefs.pane = 'preview'
  editor.revealComponent(component)
}

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
    editor.openSection(value as EditorSection)
  },
})

const designSection = computed(() =>
  (DESIGN_SECTIONS as readonly string[]).includes(editor.prefs.section) ? (editor.prefs.section as DesignSection) : null)
function reset(section: DesignSection) {
  preset.resetSection(section)
  toast.add({ severity: 'secondary', summary: `${SECTION_META[section].label} reset`, detail: `Back to the base preset. Press ${undoHint} to undo.`, life: 3000 })
}

// Sections with something to reset show the button even when there's nothing changed yet.
const resettable = computed(() => ['semantic', 'components', 'changes'].includes(editor.prefs.section) || !!designSection.value || !!openSemantic.value)
const resetHint = computed(() => {
  if (editor.prefs.section === 'changes') return 'Revert every change (back to the base preset)'
  if (openSemantic.value) return `Clear the custom ${openSemantic.value.label.toLowerCase()} tokens`
  if (editor.prefs.section === 'semantic') return 'Clear every custom semantic token'
  if (editor.prefs.section === 'components') return openComponent.value ? `Clear the custom ${openComponent.value.label} tokens` : 'Clear the custom tokens of every component'
  return `Put ${meta.value.label.toLowerCase()} back to the base preset`
})

const { baseDefault } = useBaseDefault()
const resetLabel = computed(() => {
  if (editor.prefs.section === 'changes') return 'Revert every change'
  if (editor.prefs.section === 'semantic') return 'Clear every custom token'
  if (editor.prefs.section === 'components') return 'Clear every component’s custom tokens'
  return `Reset to ${baseDefault.value}`
})

const canReset = computed(() => {
  if (editor.prefs.section === 'changes') return !preset.pristine
  if (openSemantic.value) return (preset.semanticGroupCounts[openSemantic.value.key] ?? 0) > 0
  if (editor.prefs.section === 'semantic') return preset.semanticOverrideCount > 0
  if (editor.prefs.section === 'components') {
    return editor.prefs.component ? (preset.componentOverrideCounts[editor.prefs.component] ?? 0) > 0 : preset.componentOverrideCount > 0
  }
  return !!designSection.value && preset.modifiedSections.has(designSection.value)
})

function onReset() {
  if (editor.prefs.section === 'changes') {
    preset.resetTheme()
    toast.add({ severity: 'secondary', summary: 'Every change reverted', detail: `Back to the base preset. Press ${undoHint} to undo.`, life: 3000 })
  }
  else if (editor.prefs.section === 'components') {
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

// Hovering or using a control points at what it edits in the preview.
useStageTargets(body)
</script>

<template>
  <div
    ref="body"
    class="flex flex-col"
  >
    <header class="sticky top-0 z-10 border-b border-surface-200 bg-surface-0 dark:border-surface-800 dark:bg-surface-900">
      <!-- The two-pane layout puts the destination's section tabs here. -->
      <slot name="nav" />
      <h2
        v-if="!titled"
        class="sr-only"
      >
        {{ meta.label }}
      </h2>
      <!-- Hidden when it would hold only an empty toolbar. -->
      <div
        class="flex flex-col gap-3 px-4 py-3 [&:has(>#inspector-toolbar:empty:only-child)]:hidden"
        :class="{ 'border-t border-surface-200 dark:border-surface-800': tabbed }"
      >
        <!-- Classic layout: below xl the section nav is hidden; pick sections here instead. -->
        <Select
          v-if="!$slots.nav"
          v-model="sectionValue"
          :options="sectionOptions"
          option-label="label"
          option-value="value"
          aria-label="Editor section"
          class="w-full xl:hidden"
        />
        <div
          v-if="titled"
          class="flex items-center justify-between gap-2"
        >
          <div class="flex min-w-0 items-center gap-1">
            <Button
              v-if="openComponent"
              v-tooltip.bottom="'All components'"
              icon="pi pi-arrow-left"
              severity="secondary"
              size="small"
              text
              rounded
              aria-label="All components"
              class="-my-1 -ml-2 shrink-0"
              @click="editor.openComponentList()"
            />
            <h2 class="truncate text-base font-semibold">
              {{ meta.label }}
            </h2>
            <EditorInfoTip
              :text="meta.description"
              :subject="meta.label"
            />
          </div>
          <div class="-my-1 flex shrink-0 items-center">
            <Button
              v-if="editor.prefs.component && openComponent"
              v-tooltip.bottom="'Scroll the preview to it'"
              icon="pi pi-eye"
              severity="secondary"
              size="small"
              text
              rounded
              aria-label="Show in preview"
              @click="showInPreview(editor.prefs.component)"
            />
            <Button
              v-if="resettable"
              v-tooltip.left="canReset ? resetHint : 'Nothing to reset yet'"
              label="Reset"
              icon="pi pi-undo"
              severity="secondary"
              size="small"
              text
              :disabled="!canReset"
              @click="onReset"
            />
          </div>
        </div>
        <!-- Panels can teleport sticky controls (search, filters) here. -->
        <div
          id="inspector-toolbar"
          class="flex flex-col gap-2 empty:hidden"
        />
      </div>
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
      class="px-4 py-4"
    >
      <EditorPanelsOverviewPanel v-if="editor.prefs.section === 'start'" />
      <EditorPanelsPrimaryPanel v-else-if="editor.prefs.section === 'primary'" />
      <EditorPanelsSurfacePanel v-else-if="editor.prefs.section === 'surface'" />
      <EditorPanelsStatusPanel v-else-if="editor.prefs.section === 'status'" />
      <EditorPanelsShapePanel v-else-if="editor.prefs.section === 'shape'" />
      <EditorPanelsDensityPanel v-else-if="editor.prefs.section === 'density'" />
      <EditorPanelsFocusPanel v-else-if="editor.prefs.section === 'focus'" />
      <EditorPanelsPatternPanel v-else-if="editor.sectionGroup" />
      <EditorPanelsSemanticPanel v-else-if="editor.prefs.section === 'semantic'" />
      <EditorPanelsComponentsPanel v-else-if="editor.prefs.section === 'components'" />
      <EditorPanelsChangesPanel v-else-if="editor.prefs.section === 'changes'" />
      <EditorPanelsAccessibilityPanel v-else-if="editor.prefs.section === 'accessibility'" />
      <!-- Without a title row, Reset closes the panel, and only when there's something to reset. -->
      <Button
        v-if="!titled && resettable && canReset"
        :label="resetLabel"
        icon="pi pi-undo"
        severity="secondary"
        size="small"
        text
        class="-ml-3 mt-6"
        @click="onReset"
      />
    </div>
  </div>
</template>
