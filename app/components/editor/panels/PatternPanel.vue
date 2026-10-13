<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import { semanticStudio } from '~/utils/theme/semantic-studio'

// A pattern section (form fields, lists, menus, …) or Text: one semantic group in its visual
// editor, with its stage in the preview, or as its token list.
const store = useEditorStore()

const group = computed(() => store.sectionGroup!)
const studio = computed(() => semanticStudio(group.value)!)
const designView = computed(() => store.prefs.semanticView === 'design')
// Overlays also cover the backdrop (mask) behind dialogs.
const listGroups = computed(() => (group.value === 'overlay' ? ['overlay', 'mask'] : [group.value]))

// Compare: while held, the preview shows the pattern without this theme's edits to it.
function compare(on: boolean) {
  store.prefs.compare = on
}
onBeforeUnmount(() => compare(false))
</script>

<template>
  <div class="flex flex-col gap-4">
    <Teleport
      defer
      to="#inspector-toolbar"
    >
      <div class="flex items-center gap-2">
        <SelectButton
          :model-value="store.prefs.semanticView"
          :options="[{ value: 'design', label: 'Design' }, { value: 'tokens', label: 'All tokens' }]"
          option-label="label"
          option-value="value"
          :allow-empty="false"
          :aria-label="`${studio.label} view`"
          size="small"
          class="flex-1"
          :pt="{ pcToggleButton: { root: { class: 'flex-1' } } }"
          @update:model-value="store.setSemanticView"
        />
        <Button
          v-tooltip.bottom="`Hold to see the preset without your ${studio.label.toLowerCase()} changes`"
          label="Compare"
          icon="pi pi-clone"
          severity="secondary"
          size="small"
          outlined
          :class="store.prefs.compare ? '!bg-surface-200 dark:!bg-surface-700' : ''"
          @pointerdown="compare(true)"
          @pointerup="compare(false)"
          @pointerleave="compare(false)"
          @keydown.space.prevent="compare(true)"
          @keyup.space="compare(false)"
        />
      </div>
    </Teleport>

    <EditorStudioSemanticGroup
      v-if="designView"
      :key="group"
      :group="group"
    />
    <EditorSemanticTokenList
      v-else
      :key="`list-${group}`"
      :groups="listGroups"
    />
  </div>
</template>
