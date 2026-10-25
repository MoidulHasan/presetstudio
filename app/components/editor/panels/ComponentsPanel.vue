<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import { CATEGORY_META } from '~/utils/preview-categories'
import { COMPONENT_CATEGORIES, COMPONENT_META, COMPONENT_NAMES, STUDIO_COMPONENTS, STUDIO_ICONS, groupComponentTokens, studioFor, tokenLabel } from '~/utils/theme/components'
import type { TokenDescriptor } from '~/utils/theme/schema'
import { matchesQuery, tokenSource } from '~/utils/theme/semantic'
import type { ColorScheme } from '~/utils/theme/types'

// Two levels, like the preset: the component list (grouped as in the PrimeVue docs), then one
// component's tokens grouped by part (root, header, option, …).
const store = useEditorStore()

const component = computed(() => store.prefs.component)
const meta = computed(() => (component.value ? COMPONENT_META[component.value] : null))

// The edited scheme is the previewed scheme, like the other token panels.
const scheme = computed<ColorScheme>({
  get: () => store.prefs.colorScheme,
  set: (value) => {
    store.prefs.colorScheme = value
  },
})

const keyOf = (token: TokenDescriptor) => token.path.join('.')
const isCustom = (token: TokenDescriptor) => tokenSource(token, store.theme.overrides, store.designTokens) === 'custom'

// --- Component list ------------------------------------------------------------------
const listQuery = ref('')
const listShow = ref<'all' | 'custom'>('all')

/** Token names per component (both schemes), for search and counts. */
const tokensByComponent = computed(() => {
  const map = new Map<string, TokenDescriptor[]>()
  for (const d of store.descriptors) {
    if (d.layer !== 'component' || !d.component) continue
    const list = map.get(d.component) ?? []
    list.push(d)
    map.set(d.component, list)
  }
  return map
})

const tokenCount = (name: string) => new Set((tokensByComponent.value.get(name) ?? []).map(t => t.name)).size

const listItems = computed(() => {
  const q = listQuery.value.trim().toLowerCase()
  return COMPONENT_NAMES.map((name) => {
    const meta = COMPONENT_META[name]!
    const nameMatch = !q || name.includes(q) || meta.label.toLowerCase().includes(q)
    // Searching for a token ("focus ring", "#10b981") also finds the components that have it.
    const tokenMatches = q && !nameMatch
      ? new Set((tokensByComponent.value.get(name) ?? []).filter(t => matchesQuery(t, q, String(t.defaultValue))).map(t => t.name)).size
      : 0
    return { name, meta, custom: store.componentOverrideCounts[name] ?? 0, nameMatch, tokenMatches }
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
  query.value = carryQuery ? listQuery.value : ''
  show.value = 'all'
  store.openComponent(name)
}

// --- One component -------------------------------------------------------------------
const query = ref('')
const show = ref<'all' | 'custom'>('all')
const expanded = ref<string | null>(null)
const openGroups = ref<string[]>([])

const allGroups = computed(() => (component.value ? groupComponentTokens(store.descriptors, component.value, scheme.value) : []))

const groups = computed(() => {
  const resolver = store.resolvers?.[scheme.value]
  return allGroups.value
    .map(group => ({
      ...group,
      customCount: group.tokens.filter(isCustom).length,
      tokens: group.tokens.filter(t =>
        matchesQuery(t, query.value, resolver?.resolve(t.name)?.value ?? '')
        && (show.value === 'all' || isCustom(t))),
    }))
    .filter(group => group.tokens.length)
})

const filtering = computed(() => query.value.trim() !== '' || show.value === 'custom')
const visibleCount = computed(() => groups.value.reduce((n, g) => n + g.tokens.length, 0))

const accordionValue = computed({
  get: () => (filtering.value ? groups.value.map(g => g.key) : openGroups.value),
  set: (value: string[] | string | null | undefined) => {
    if (!filtering.value) openGroups.value = Array.isArray(value) ? value : value ? [value] : []
  },
})

// Each component opens with its first part expanded (also once the base preset has loaded,
// after a reload or a base preset switch).
watch([component, () => allGroups.value[0]?.key], ([, first]) => {
  expanded.value = null
  openGroups.value = first ? [first] : []
}, { immediate: true })

function back() {
  store.openComponentList()
  query.value = ''
}

function toggle(token: TokenDescriptor) {
  expanded.value = expanded.value === keyOf(token) ? null : keyOf(token)
}

/** Components with a visual editor default to it; the token list is always one click away. */
const hasStudio = computed(() => !!component.value && STUDIO_COMPONENTS.includes(component.value))
const designView = computed(() => hasStudio.value && store.prefs.componentView === 'design')

const revealedHere = computed(() => (store.revealed?.component === component.value ? store.revealed : null))

function showInPreview() {
  if (!component.value) return
  store.prefs.pane = 'preview'
  store.revealComponent(component.value)
}

function showInGallery() {
  if (!meta.value || !component.value) return
  store.prefs.template = 'components'
  store.prefs.category = meta.value.category
  store.revealComponent(component.value)
}
</script>

<template>
  <!-- Component list -->
  <div
    v-if="!component || !meta"
    class="flex flex-col gap-5"
  >
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
          :options="[{ value: 'all', label: 'All' }, { value: 'custom', label: `Customized (${Object.keys(store.componentOverrideCounts).length})` }]"
          option-label="label"
          option-value="value"
          :allow-empty="false"
          aria-label="Which components to show"
          size="small"
        />
        <span class="text-xs text-surface-500">{{ listTotal }} component{{ listTotal === 1 ? '' : 's' }}</span>
      </div>
    </Teleport>

    <!-- One-time tip: the preview is the fastest way to find a component. -->
    <Message
      v-if="!store.prefs.dismissedTips.includes('inspect')"
      severity="secondary"
      size="small"
      closable
      @close="store.prefs.dismissedTips = [...store.prefs.dismissedTips, 'inspect']"
    >
      <span class="text-xs">
        Tip: click <span class="font-semibold"><i
          class="pi pi-search text-[10px]"
          aria-hidden="true"
        /> Inspect</span> above the preview, then any component, to jump straight to it.
      </span>
    </Message>

    <!-- Visual editors first: every variant and state on a live stage. -->
    <section
      v-if="!listQuery.trim() && listShow === 'all'"
      aria-label="Visual editors"
      class="flex flex-col gap-2"
    >
      <h3 class="flex items-center gap-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-surface-500">
        <i
          class="pi pi-sparkles"
          aria-hidden="true"
        />
        Visual editors
      </h3>
      <Button
        v-for="name in STUDIO_COMPONENTS"
        :key="name"
        severity="secondary"
        outlined
        class="!w-full !min-w-0 !justify-start !gap-3 !p-3 text-left"
        :aria-label="`Open the ${COMPONENT_META[name]!.label} visual editor`"
        @click="open(name, false)"
      >
        <span
          class="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-100 dark:bg-surface-800"
          aria-hidden="true"
        >
          <i
            :class="STUDIO_ICONS[name] ?? 'pi pi-box'"
            class="text-surface-600 dark:text-surface-300"
          />
        </span>
        <span class="flex min-w-0 flex-1 flex-col">
          <span class="text-sm font-semibold text-surface-900 dark:text-surface-0">{{ COMPONENT_META[name]!.label }}</span>
          <span class="truncate text-xs text-surface-500">{{ STUDIO_SUBTITLES[name] ?? 'Every variant and state, light and dark' }}</span>
        </span>
        <Badge
          v-if="store.componentOverrideCounts[name]"
          :value="`${store.componentOverrideCounts[name]} custom`"
          severity="contrast"
          size="small"
          class="shrink-0"
        />
        <i
          class="pi pi-arrow-right shrink-0 text-xs text-surface-400"
          aria-hidden="true"
        />
      </Button>
      <p class="px-2 text-xs text-surface-500">
        More components get visual editors soon. Every component's tokens are below.
      </p>
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
      <h3 class="mb-1 flex items-center gap-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-surface-500">
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
            <span
              v-else
              class="shrink-0 text-xs text-surface-400"
            >{{ tokenCount(item.name) }}</span>
            <i
              class="pi pi-chevron-right shrink-0 text-xs text-surface-400"
              aria-hidden="true"
            />
          </Button>
        </li>
      </ul>
    </section>
  </div>

  <!-- One component -->
  <div
    v-else
    class="flex flex-col gap-4"
  >
    <Teleport
      defer
      to="#inspector-toolbar"
    >
      <div class="flex items-center justify-between gap-2">
        <Button
          :label="`All components`"
          icon="pi pi-arrow-left"
          severity="secondary"
          size="small"
          text
          class="-ml-2"
          @click="back"
        />
        <Button
          v-tooltip.left="'Scroll the preview to this component'"
          label="Show in preview"
          icon="pi pi-eye"
          severity="secondary"
          size="small"
          text
          class="-mr-2"
          @click="showInPreview"
        />
      </div>
      <div
        v-if="hasStudio"
        class="flex items-center gap-2"
      >
        <SelectButton
          :model-value="store.prefs.componentView"
          :options="[{ value: 'design', label: 'Design' }, { value: 'tokens', label: 'All tokens' }]"
          option-label="label"
          option-value="value"
          :allow-empty="false"
          aria-label="Component editor view"
          size="small"
          class="flex-1"
          :pt="{ pcToggleButton: { root: { class: 'flex-1' } } }"
          @update:model-value="v => (store.prefs.componentView = v)"
        />
        <EditorCompareButton
          v-if="designView"
          :subject="meta.label"
        />
      </div>
      <SelectButton
        v-if="!designView"
        v-model="scheme"
        :options="[{ value: 'light', label: 'Light mode' }, { value: 'dark', label: 'Dark mode' }]"
        option-label="label"
        option-value="value"
        :allow-empty="false"
        aria-label="Color scheme to edit"
        size="small"
        class="w-full"
        :pt="{ pcToggleButton: { root: { class: 'flex-1' } } }"
      />
      <IconField v-if="!designView">
        <InputIcon class="pi pi-search" />
        <InputText
          v-model="query"
          :placeholder="`Search ${meta.label} tokens`"
          :aria-label="`Search ${meta.label} tokens`"
          size="small"
          class="w-full"
        />
      </IconField>
      <div
        v-if="!designView"
        class="flex items-center justify-between gap-2"
      >
        <SelectButton
          v-model="show"
          :options="[{ value: 'all', label: 'All' }, { value: 'custom', label: `Custom (${store.componentOverrideCounts[component] ?? 0})` }]"
          option-label="label"
          option-value="value"
          :allow-empty="false"
          aria-label="Which tokens to show"
          size="small"
        />
        <span class="text-xs text-surface-500">{{ visibleCount }} token{{ visibleCount === 1 ? '' : 's' }}</span>
      </div>
    </Teleport>

    <Message
      v-if="meta.deprecated"
      severity="warn"
      size="small"
      variant="simple"
    >
      {{ meta.label }} is deprecated in PrimeVue 4. Use {{ meta.deprecated }} instead.
    </Message>
    <Message
      v-if="meta.unpreviewable"
      severity="secondary"
      size="small"
    >
      {{ meta.unpreviewable }}
    </Message>
    <Message
      v-else-if="revealedHere && !revealedHere.found"
      severity="secondary"
      size="small"
    >
      <span class="flex flex-wrap items-center gap-x-2">
        {{ meta.label }} isn't on this preview page.
        <Button
          v-if="store.prefs.template !== 'components' || store.prefs.category !== meta.category"
          :label="`Show ${CATEGORY_META[meta.category].label} components`"
          size="small"
          text
          class="!p-0"
          @click="showInGallery"
        />
      </span>
    </Message>

    <!-- Parts drawn by nested components (SpeedDial's buttons, DataTable's paginator) use their own tokens. -->
    <div
      v-if="revealedHere?.uses.length"
      class="flex flex-col gap-1.5 rounded-lg bg-surface-50 p-3 dark:bg-surface-800"
    >
      <p class="text-xs text-surface-500 dark:text-surface-400">
        Also uses these components, styled by their own tokens:
      </p>
      <div class="flex flex-wrap gap-1.5">
        <Button
          v-for="used in revealedHere.uses"
          :key="used"
          :label="COMPONENT_META[used]?.label ?? used"
          icon="pi pi-arrow-right"
          icon-pos="right"
          severity="secondary"
          size="small"
          outlined
          class="!px-2 !py-0.5 !text-xs"
          @click="open(used, false)"
        />
      </div>
    </div>

    <template v-if="designView">
      <EditorStudioButton v-if="component === 'button'" />
      <EditorStudioSeverity
        v-else
        :key="component"
        :component="component"
      />
    </template>

    <p
      v-else-if="!groups.length"
      class="py-8 text-center text-sm text-surface-500"
    >
      {{ show === 'custom' && !query ? `No custom ${meta.label} tokens yet. Expand a token to change it.` : 'No tokens match your search.' }}
    </p>

    <Accordion
      v-else
      v-model:value="accordionValue"
      multiple
    >
      <AccordionPanel
        v-for="group in groups"
        :key="group.key"
        :value="group.key"
      >
        <AccordionHeader class="!px-1 !py-2.5">
          <span class="flex min-w-0 flex-1 items-center gap-2">
            <span class="truncate text-sm font-semibold">{{ group.label }}</span>
            <Badge
              :value="group.tokens.length"
              severity="secondary"
              size="small"
            />
            <Badge
              v-if="group.customCount"
              :value="`${group.customCount} custom`"
              severity="contrast"
              size="small"
            />
          </span>
        </AccordionHeader>
        <AccordionContent :pt="{ root: { class: '!grid-cols-[minmax(0,1fr)]' }, contentWrapper: { class: 'min-w-0' }, content: { class: '!px-0 !pb-3 !pt-0' } }">
          <div class="flex flex-col">
            <EditorTokenRow
              v-for="token in group.tokens"
              :key="keyOf(token)"
              :token="token"
              :scheme="scheme"
              :label="tokenLabel(token)"
              :expanded="expanded === keyOf(token)"
              @toggle="toggle(token)"
            />
          </div>
        </AccordionContent>
      </AccordionPanel>
    </Accordion>

    <p
      v-if="!designView"
      class="text-xs text-surface-500"
    >
      <span class="mr-1 inline-block size-2 rounded-full bg-surface-900 align-middle dark:bg-surface-0" /> custom value
      <span class="ml-3 mr-1 inline-block size-2 rounded-full border border-surface-500 align-middle" /> set by a design section
    </p>
  </div>
</template>
