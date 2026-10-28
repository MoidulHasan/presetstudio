<script setup lang="ts">
import { usePresetStore } from '~/stores/preset'
import { CATEGORY_META } from '~/utils/preview-categories'
import { COMPONENT_CATEGORIES, COMPONENT_META, COMPONENT_NAMES, STUDIO_COMPONENTS, STUDIO_ICONS, studioFor } from '~/utils/theme/components'
import type { TokenDescriptor } from '~/utils/theme/schema'
import { matchesQuery } from '~/utils/theme/semantic'

// Every component (grouped as in the PrimeVue docs), visual editors first. Searching also finds
// components by their tokens ("focus ring", "#10b981").
const emit = defineEmits<{
  /** Open a component; `query` carries a token search over into it. */
  open: [name: string, query: string]
}>()

const preset = usePresetStore()

const listQuery = ref('')
const listShow = ref<'all' | 'custom'>('all')

/** Token names per component (both schemes), for search and counts. */
const tokensByComponent = computed(() => {
  const map = new Map<string, TokenDescriptor[]>()
  for (const d of preset.descriptors) {
    if (d.layer !== 'component' || !d.component) continue
    const list = map.get(d.component) ?? []
    list.push(d)
    map.set(d.component, list)
  }
  return map
})

const listItems = computed(() => {
  const q = listQuery.value.trim().toLowerCase()
  return COMPONENT_NAMES.map((name) => {
    const meta = COMPONENT_META[name]!
    const nameMatch = !q || name.includes(q) || meta.label.toLowerCase().includes(q)
    // Searching for a token ("focus ring", "#10b981") also finds the components that have it.
    const tokenMatches = q && !nameMatch
      ? new Set((tokensByComponent.value.get(name) ?? []).filter(t => matchesQuery(t, q, String(t.defaultValue))).map(t => t.name)).size
      : 0
    return { name, meta, custom: preset.componentOverrideCounts[name] ?? 0, nameMatch, tokenMatches }
  })
    .filter(item => (item.nameMatch || item.tokenMatches > 0) && (listShow.value === 'all' || item.custom > 0))
    .sort((a, b) => a.meta.label.localeCompare(b.meta.label))
})

type ListItem = (typeof listItems.value)[number]
interface ListGroup { key: string, label: string, icon: string, items: ListItem[] }

// Browsing: grouped like the PrimeVue docs. Searching: name matches first, then components
// that only have matching tokens.
const listGroups = computed<ListGroup[]>(() => {
  if (listQuery.value.trim()) {
    return [
      { key: 'names', label: 'Components', icon: 'pi pi-box', items: listItems.value.filter(i => i.nameMatch) },
      { key: 'tokens', label: 'Have matching tokens', icon: 'pi pi-search', items: listItems.value.filter(i => !i.nameMatch).sort((a, b) => b.tokenMatches - a.tokenMatches) },
    ].filter(group => group.items.length)
  }
  return COMPONENT_CATEGORIES.map(category => ({
    key: category,
    label: CATEGORY_META[category].label,
    icon: CATEGORY_META[category].icon,
    items: listItems.value.filter(i => i.meta.category === category),
  })).filter(group => group.items.length)
})

const listTotal = computed(() => listGroups.value.reduce((n, g) => n + g.items.length, 0))

const STUDIO_SUBTITLES: Record<string, string> = {
  button: 'Also ButtonGroup, SplitButton and SpeedDial',
  message: 'Severities in default, outlined and simple styles',
  toast: 'Severities with summary, detail and close button',
  tag: 'Severities, plain and pill',
  badge: 'Severities in four sizes, plus dots',
}

function visualHint(name: string): string {
  const studio = studioFor(name)
  return studio === name ? 'Visual editor with a live stage' : `Edited in the ${COMPONENT_META[studio!]!.label} visual editor`
}

function open(name: string, carryQuery: boolean) {
  // A token search carries over into the component, so the matches are what you see.
  emit('open', name, carryQuery ? listQuery.value : '')
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <Teleport
      defer
      to="#inspector-toolbar"
    >
      <IconField>
        <InputIcon class="pi pi-search" />
        <InputText
          v-model="listQuery"
          :placeholder="`Search ${COMPONENT_NAMES.length} components or a token`"
          aria-label="Search components"
          size="small"
          class="w-full"
        />
      </IconField>
      <div class="flex items-center justify-between gap-2">
        <SelectButton
          v-model="listShow"
          :options="[{ value: 'all', label: 'All' }, { value: 'custom', label: `Customized (${Object.keys(preset.componentOverrideCounts).length})` }]"
          option-label="label"
          option-value="value"
          :allow-empty="false"
          aria-label="Which components to show"
          size="small"
        />
        <!-- The search box already says how many there are; while searching, how many match. -->
        <span
          v-if="listQuery.trim()"
          class="text-xs text-surface-500"
        >{{ listTotal }} match{{ listTotal === 1 ? '' : 'es' }}</span>
      </div>
    </Teleport>

    <!-- Visual editors first: every variant and state on a live stage. -->
    <section
      v-if="!listQuery.trim() && listShow === 'all'"
      aria-label="Visual editors"
      class="flex flex-col"
    >
      <h3 class="mb-1 flex items-center gap-2 px-2 text-xs font-medium text-surface-500">
        <i
          class="pi pi-sparkles"
          aria-hidden="true"
        />
        Visual editors
      </h3>
      <ul class="flex flex-col">
        <li
          v-for="name in STUDIO_COMPONENTS"
          :key="name"
        >
          <Button
            v-tooltip.left="{ value: STUDIO_SUBTITLES[name], showDelay: 600 }"
            severity="secondary"
            text
            class="!w-full !min-w-0 !justify-start !gap-2.5 !px-2 !py-1.5"
            :aria-label="`Open the ${COMPONENT_META[name]!.label} visual editor`"
            @click="open(name, false)"
          >
            <i
              :class="STUDIO_ICONS[name] ?? 'pi pi-box'"
              class="w-4 shrink-0 text-center text-sm text-surface-500 dark:text-surface-400"
              aria-hidden="true"
            />
            <span class="min-w-0 flex-1 truncate text-left text-sm font-medium text-surface-900 dark:text-surface-0">{{ COMPONENT_META[name]!.label }}</span>
            <Badge
              v-if="preset.componentOverrideCounts[name]"
              :value="`${preset.componentOverrideCounts[name]} custom`"
              severity="contrast"
              size="small"
              class="shrink-0"
            />
            <i
              class="pi pi-chevron-right shrink-0 text-xs text-surface-400"
              aria-hidden="true"
            />
          </Button>
        </li>
      </ul>
    </section>

    <p
      v-if="!listGroups.length"
      class="py-8 text-center text-sm text-surface-500"
    >
      {{ listShow === 'custom' && !listQuery ? 'No component has custom tokens yet.' : 'No component or token matches your search.' }}
    </p>

    <section
      v-for="group in listGroups"
      :key="group.key"
      :aria-label="group.label"
    >
      <h3 class="mb-1 flex items-center gap-2 px-2 text-xs font-medium text-surface-500">
        <i
          :class="group.icon"
          aria-hidden="true"
        />
        {{ group.label }}
        <span class="font-normal normal-case tracking-normal">{{ group.items.length }}</span>
      </h3>
      <ul class="flex flex-col">
        <li
          v-for="item in group.items"
          :key="item.name"
        >
          <Button
            severity="secondary"
            text
            class="!w-full !min-w-0 !justify-start !gap-2 !px-2 !py-1.5"
            :aria-label="`${item.meta.label} tokens`"
            @click="open(item.name, !item.nameMatch)"
          >
            <span class="min-w-0 flex-1 truncate text-left text-sm text-surface-900 dark:text-surface-0">{{ item.meta.label }}</span>
            <Tag
              v-if="studioFor(item.name)"
              v-tooltip.left="visualHint(item.name)"
              value="Visual"
              severity="info"
              class="shrink-0 !px-1.5 !py-0 !text-[10px]"
            />
            <Tag
              v-if="item.meta.deprecated"
              v-tooltip.left="`Deprecated in PrimeVue 4. Use ${item.meta.deprecated}.`"
              value="Deprecated"
              severity="secondary"
              class="shrink-0 !px-1.5 !py-0 !text-[10px]"
            />
            <Badge
              v-if="item.custom"
              v-tooltip.left="'Custom tokens'"
              :value="`${item.custom} custom`"
              severity="contrast"
              size="small"
              class="shrink-0"
            />
            <span
              v-if="item.tokenMatches"
              class="shrink-0 text-xs text-surface-500"
            >{{ item.tokenMatches }} match{{ item.tokenMatches === 1 ? '' : 'es' }}</span>
            <i
              class="pi pi-chevron-right shrink-0 text-xs text-surface-400"
              aria-hidden="true"
            />
          </Button>
        </li>
      </ul>
    </section>
  </div>
</template>
