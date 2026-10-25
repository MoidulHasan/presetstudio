<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import { SECTION_META, destinationOf, type EditorSection } from '~/utils/editor-sections'

// The sections of the current destination as tabs (Colors: Primary color, Surfaces, …), at the
// top of the panel. A destination with one section has no tabs.
const editor = useEditorStore()
const { isModified } = useSectionStatus()

const destination = computed(() => destinationOf(editor.prefs.section))

function open(section: EditorSection) {
  if (section === editor.prefs.section) return
  if (section === 'components') editor.openComponentList()
  else editor.openSection(section)
}
</script>

<template>
  <Tabs
    v-if="destination.sections.length > 1"
    :value="editor.prefs.section"
    scrollable
    @update:value="(value) => open(value as EditorSection)"
  >
    <TabList :pt="{ tabList: { class: '!border-b-0' } }">
      <Tab
        v-for="section in destination.sections"
        :key="section"
        :value="section"
        class="!flex !items-center !gap-1.5 !whitespace-nowrap !px-3 !py-2 !text-sm"
      >
        {{ SECTION_META[section].label }}
        <span
          v-if="isModified(section)"
          class="size-1.5 rounded-full bg-surface-900 dark:bg-surface-0"
          role="img"
          aria-label="Changed"
        />
      </Tab>
    </TabList>
  </Tabs>
</template>
