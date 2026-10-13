<script setup lang="ts">
import type { MenuItem } from 'primevue/menuitem'
import { useEditorStore, type EditorSection } from '~/stores/editor'
import { SECTION_META } from '~/utils/editor-sections'
import { COMPONENT_META, STUDIO_COMPONENTS } from '~/utils/theme/components'
import { DESIGN_SECTIONS, type DesignSection } from '~/utils/theme/sections'

const store = useEditorStore()

// Components with a visual editor are listed by name, so their stage is one click away.
const STUDIO_ICONS: Record<string, string> = { button: 'pi pi-stop' }

type NavItem = { key: string, label: string, icon: string, open: () => void, active: boolean, modified: boolean, badge?: number, visual?: boolean }

const sectionItem = (section: EditorSection): NavItem => ({
  key: section,
  label: SECTION_META[section].label,
  icon: SECTION_META[section].icon,
  open: () => (store.prefs.section = section),
  active: store.prefs.section === section,
  modified: section === 'semantic' ? store.semanticOverrideCount > 0 : store.modifiedSections.has(section as DesignSection),
})

const openStudio = computed(() =>
  store.prefs.section === 'components' && store.prefs.component && STUDIO_COMPONENTS.includes(store.prefs.component) ? store.prefs.component : null)

const groups = computed<Array<{ label: string, items: NavItem[] }>>(() => [
  { label: 'Start', items: [sectionItem('start')] },
  { label: 'Global design', items: DESIGN_SECTIONS.map(sectionItem) },
  {
    label: 'Components',
    items: [
      ...STUDIO_COMPONENTS.map(name => ({
        key: `component:${name}`,
        label: COMPONENT_META[name]!.label,
        icon: STUDIO_ICONS[name] ?? 'pi pi-box',
        open: () => store.openComponent(name),
        active: openStudio.value === name,
        modified: (store.componentOverrideCounts[name] ?? 0) > 0,
        visual: true,
      })),
      {
        key: 'components',
        label: SECTION_META.components.label,
        icon: SECTION_META.components.icon,
        open: () => {
          store.prefs.section = 'components'
          store.prefs.component = null
        },
        active: store.prefs.section === 'components' && !openStudio.value,
        modified: store.componentOverrideCount > 0,
      },
    ],
  },
  { label: 'Tokens', items: [{ ...sectionItem('semantic'), badge: store.semanticOverrideCount || undefined }] },
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
            v-if="item.key === 'accessibility' && store.contrastIssues"
            :value="store.contrastIssues"
            severity="danger"
            size="small"
            :aria-label="`${store.contrastIssues} contrast issues introduced by this theme`"
          />
        </a>
      </template>
    </Menu>
  </nav>
</template>
