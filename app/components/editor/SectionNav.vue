<script setup lang="ts">
import { useEditorStore, type EditorSection } from '~/stores/editor'
import { SECTION_META } from '~/utils/editor-sections'
import { DESIGN_SECTIONS, type DesignSection } from '~/utils/theme/sections'

const store = useEditorStore()

const groups: Array<{ label: string, sections: readonly EditorSection[] }> = [
  { label: 'Start', sections: ['start'] },
  { label: 'Global design', sections: DESIGN_SECTIONS },
  { label: 'Review', sections: ['accessibility'] },
]

const isModified = (section: EditorSection) => store.modifiedSections.has(section as DesignSection)
</script>

<template>
  <nav
    class="flex flex-col gap-1 p-3"
    aria-label="Editor sections"
  >
    <template
      v-for="group in groups"
      :key="group.label"
    >
      <p class="px-2 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-surface-500 first:pt-0">
        {{ group.label }}
      </p>
      <button
        v-for="section in group.sections"
        :key="section"
        type="button"
        class="flex items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition focus-visible:outline-2 focus-visible:outline-primary"
        :class="store.prefs.section === section
          ? 'bg-surface-100 font-medium text-surface-900 dark:bg-surface-800 dark:text-surface-0'
          : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900 dark:text-surface-300 dark:hover:bg-surface-800'"
        :aria-current="store.prefs.section === section ? 'page' : undefined"
        @click="store.prefs.section = section"
      >
        <i
          :class="SECTION_META[section].icon"
          aria-hidden="true"
        />
        <span class="flex-1">{{ SECTION_META[section].label }}</span>
        <span
          v-if="isModified(section)"
          v-tooltip.right="'Changed from base preset'"
          class="size-2 rounded-full bg-surface-900 dark:bg-surface-0"
          role="img"
          aria-label="Changed"
        />
        <Badge
          v-if="section === 'accessibility' && store.contrastIssues"
          :value="store.contrastIssues"
          severity="danger"
          size="small"
          :aria-label="`${store.contrastIssues} contrast issues introduced by this theme`"
        />
      </button>
    </template>

    <p class="mt-4 px-2 text-xs text-surface-400 dark:text-surface-500">
      Semantic and component tokens are coming next.
    </p>
  </nav>
</template>
