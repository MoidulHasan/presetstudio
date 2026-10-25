<script setup lang="ts">
import type { MenuItem } from 'primevue/menuitem'
import { useEditorStore } from '~/stores/editor'
import { usePresetStore } from '~/stores/preset'
import { PATTERN_SECTION_KEYS, SECTION_META, type EditorSection } from '~/utils/editor-sections'
import { COMPONENT_META, COMPONENT_NAMES, STUDIO_COMPONENTS, STUDIO_ICONS } from '~/utils/theme/components'

const editor = useEditorStore()
const preset = usePresetStore()
const { isModified } = useSectionStatus()

const MAX_SIDEBAR_STUDIOS = 8

// Components with a visual editor are listed by name, so their stage is one click away.

type NavItem = { key: string, label: string, icon: string, open: () => void, active: boolean, modified: boolean, badge?: number, visual?: boolean, count?: number }

const sectionItem = (section: EditorSection): NavItem => ({
  key: section,
  label: SECTION_META[section].label,
  icon: SECTION_META[section].icon,
  open: () => editor.openSection(section),
  active: editor.prefs.section === section,
  modified: isModified(section),
})

const openStudio = computed(() =>
  editor.prefs.section === 'components' && editor.prefs.component && STUDIO_COMPONENTS.includes(editor.prefs.component) ? editor.prefs.component : null)

const groups = computed<Array<{ label: string, items: NavItem[] }>>(() => [
  { label: 'Start', items: [sectionItem('start')] },
  { label: 'Look & feel', items: (['primary', 'surface', 'status', 'text', 'shape', 'density', 'focus'] as const).map(sectionItem) },
  // Looks that many components share (each edits one semantic group).
  { label: 'Shared styles', items: PATTERN_SECTION_KEYS.map(sectionItem) },
  {
    label: 'Components',
    items: [
      // The catalog first; the visual editors are shortcuts into it.
      {
        key: 'components',
        label: SECTION_META.components.label,
        icon: SECTION_META.components.icon,
        open: () => editor.openComponentList(),
        active: editor.prefs.section === 'components' && !openStudio.value,
        modified: preset.componentOverrideCount > 0,
        count: COMPONENT_NAMES.length,
      },
      // Capped so the sidebar doesn't grow with every new editor; all of them are pinned in the list.
      ...STUDIO_COMPONENTS.slice(0, MAX_SIDEBAR_STUDIOS).map(name => ({
        key: `component:${name}`,
        label: COMPONENT_META[name]!.label,
        icon: STUDIO_ICONS[name] ?? 'pi pi-box',
        open: () => editor.openComponent(name),
        active: openStudio.value === name,
        modified: (preset.componentOverrideCounts[name] ?? 0) > 0,
        visual: true,
      })),
    ],
  },
  { label: 'Advanced', items: [{ ...sectionItem('semantic'), badge: preset.semanticOverrideCount || undefined }] },
  { label: 'Review', items: [sectionItem('accessibility')] },
])

const model = computed<MenuItem[]>(() => groups.value.map(group => ({
  label: group.label,
  items: group.items.map(item => ({ key: item.key, label: item.label, icon: item.icon, command: item.open, data: item })),
})))
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
          :class="item.data.active ? 'bg-surface-100 font-medium text-surface-900 dark:bg-surface-800 dark:text-surface-0' : ''"
          :aria-current="item.data.active ? 'page' : undefined"
        >
          <i
            :class="item.icon"
            aria-hidden="true"
          />
          <span class="flex-1">{{ item.label }}</span>
          <span
            v-if="item.data.count"
            v-tooltip.right="'Every component, with all its tokens'"
            class="text-xs text-surface-400"
          >{{ item.data.count }}</span>
          <Tag
            v-if="item.data.visual"
            v-tooltip.right="'Visual editor with a live stage'"
            value="Visual"
            severity="secondary"
            class="!px-1.5 !py-0 !text-[10px]"
          />
          <span
            v-if="item.data.modified"
            v-tooltip.right="'Changed from base preset'"
            class="size-2 rounded-full bg-surface-900 dark:bg-surface-0"
            role="img"
            aria-label="Changed"
          />
          <Badge
            v-if="item.data.badge"
            v-tooltip.right="'Custom token values'"
            :value="item.data.badge"
            severity="secondary"
            size="small"
          />
          <Badge
            v-if="item.key === 'accessibility' && preset.contrastIssues"
            :value="preset.contrastIssues"
            severity="danger"
            size="small"
            :aria-label="`${preset.contrastIssues} contrast issues introduced by this theme`"
          />
        </a>
      </template>
    </Menu>
  </nav>
</template>
