<script setup lang="ts">
import type { MenuItem } from 'primevue/menuitem'
import { useEditorStore, type EditorSection } from '~/stores/editor'
import { SECTION_META } from '~/utils/editor-sections'
import { DESIGN_SECTIONS, type DesignSection } from '~/utils/theme/sections'

const store = useEditorStore()

const groups: Array<{ label: string, sections: readonly EditorSection[] }> = [
  { label: 'Start', sections: ['start'] },
  { label: 'Global design', sections: DESIGN_SECTIONS },
  { label: 'Tokens', sections: ['semantic'] },
  { label: 'Review', sections: ['accessibility'] },
]

const model = computed<MenuItem[]>(() => groups.map(group => ({
  label: group.label,
  items: group.sections.map(section => ({
    key: section,
    label: SECTION_META[section].label,
    icon: SECTION_META[section].icon,
    command: () => (store.prefs.section = section),
  })),
})))

const isModified = (section: EditorSection) => store.modifiedSections.has(section as DesignSection)
</script>

<template>
  <nav
    class="px-2 py-3"
    aria-label="Editor sections"
  >
    <Menu
      :model="model"
      class="!w-full !min-w-0 !border-0 !bg-transparent !p-0"
      :pt="{ list: { class: '!gap-0.5' }, submenuLabel: { class: '!px-2 !pb-1 !pt-3 first:!pt-0' } }"
    >
      <template #submenulabel="{ item }">
        <span class="text-[11px] font-semibold uppercase tracking-wider text-surface-500">{{ item.label }}</span>
      </template>
      <template #item="{ item, props }">
        <a
          v-bind="props.action"
          class="flex items-center gap-2.5 rounded-md !px-2 !py-1.5 text-sm"
          :class="store.prefs.section === item.key ? 'bg-surface-100 font-medium text-surface-900 dark:bg-surface-800 dark:text-surface-0' : ''"
          :aria-current="store.prefs.section === item.key ? 'page' : undefined"
        >
          <i
            :class="item.icon"
            aria-hidden="true"
          />
          <span class="flex-1">{{ item.label }}</span>
          <span
            v-if="isModified(item.key as EditorSection)"
            v-tooltip.right="'Changed from base preset'"
            class="size-2 rounded-full bg-surface-900 dark:bg-surface-0"
            role="img"
            aria-label="Changed"
          />
          <Badge
            v-if="item.key === 'semantic' && store.semanticOverrideCount"
            v-tooltip.right="'Custom token values'"
            :value="store.semanticOverrideCount"
            severity="secondary"
            size="small"
          />
          <Badge
            v-if="item.key === 'accessibility' && store.contrastIssues"
            :value="store.contrastIssues"
            severity="danger"
            size="small"
            :aria-label="`${store.contrastIssues} contrast issues introduced by this theme`"
          />
        </a>
      </template>
    </Menu>

    <p class="mt-4 px-2 text-xs text-surface-400 dark:text-surface-500">
      Component tokens are coming next.
    </p>
  </nav>
</template>
