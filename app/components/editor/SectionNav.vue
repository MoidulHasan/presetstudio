<script setup lang="ts">
import { EDITOR_SECTIONS, useEditorStore } from '~/stores/editor'
import { SECTION_META } from '~/utils/editor-sections'

const store = useEditorStore()

const upcoming = [
  { label: 'Semantic tokens', icon: 'pi pi-sitemap' },
  { label: 'Components', icon: 'pi pi-th-large' },
]
</script>

<template>
  <nav
    class="flex flex-col gap-1 p-3"
    aria-label="Editor sections"
  >
    <p class="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-surface-500">
      Global design
    </p>
    <button
      v-for="section in EDITOR_SECTIONS"
      :key="section"
      type="button"
      class="flex items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition focus-visible:outline-2 focus-visible:outline-primary"
      :class="store.prefs.section === section
        ? 'bg-primary-50 font-medium text-primary-700 dark:bg-primary-950 dark:text-primary-300'
        : 'text-surface-700 hover:bg-surface-100 dark:text-surface-200 dark:hover:bg-surface-800'"
      :aria-current="store.prefs.section === section ? 'page' : undefined"
      @click="store.prefs.section = section"
    >
      <i
        :class="SECTION_META[section].icon"
        aria-hidden="true"
      />
      <span class="flex-1">{{ SECTION_META[section].label }}</span>
      <Badge
        v-if="section === 'accessibility' && store.contrastIssues"
        :value="store.contrastIssues"
        severity="danger"
        size="small"
        :aria-label="`${store.contrastIssues} contrast issues`"
      />
    </button>

    <p class="px-2 pb-1 pt-5 text-xs font-semibold uppercase tracking-wide text-surface-500">
      Coming soon
    </p>
    <div
      v-for="item in upcoming"
      :key="item.label"
      class="flex items-center gap-3 px-2 py-2 text-sm text-surface-400 dark:text-surface-500"
    >
      <i
        :class="item.icon"
        aria-hidden="true"
      />
      {{ item.label }}
    </div>
  </nav>
</template>
