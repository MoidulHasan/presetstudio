<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import { useWorkspaceStore } from '~/stores/workspace'
import { usePresetStore } from '~/stores/preset'
import { CATEGORY_META } from '~/utils/preview-categories'
import { COMPONENT_META, STUDIO_COMPONENTS, groupComponentTokens, tokenLabel } from '~/utils/theme/components'
import type { TokenDescriptor } from '~/utils/theme/schema'
import { matchesQuery, tokenSource } from '~/utils/theme/semantic'
import type { ColorScheme } from '~/utils/theme/types'

// One component: its visual editor (if it has one) or its tokens grouped by part (root, header,
// option, …), like the preset. Mounted per component (keyed), so each opens fresh.
const props = defineProps<{
  component: string
  /** Token search carried over from the component list. */
  initialQuery?: string
}>()
const emit = defineEmits<{ open: [name: string] }>()

const editor = useEditorStore()
const workspace = useWorkspaceStore()
const preset = usePresetStore()

const meta = computed(() => COMPONENT_META[props.component]!)

// The edited scheme is the previewed scheme, like the other token panels.
const scheme = computed<ColorScheme>({
  get: () => editor.prefs.colorScheme,
  set: (value) => {
    editor.prefs.colorScheme = value
  },
})

const keyOf = (token: TokenDescriptor) => token.path.join('.')
const isCustom = (token: TokenDescriptor) => tokenSource(token, workspace.theme.overrides, preset.designTokens) === 'custom'

const query = ref(props.initialQuery ?? '')
const show = ref<'all' | 'custom'>('all')
const expanded = ref<string | null>(null)
const openGroups = ref<string[]>([])

const allGroups = computed(() => groupComponentTokens(preset.descriptors, props.component, scheme.value))

// Kept while the same tokens show with the same counts, so editing a value re-renders its row,
// not the whole list (rows read their values from the stores themselves).
const groups = stableComputed(() => {
  // Values are only needed to search by value ("#10b981").
  const resolver = query.value.trim() ? preset.resolvers?.[scheme.value] : null
  return allGroups.value
    .map(group => ({
      ...group,
      customCount: group.tokens.filter(isCustom).length,
      tokens: group.tokens.filter(t =>
        matchesQuery(t, query.value, resolver?.resolve(t.name)?.value ?? '')
        && (show.value === 'all' || isCustom(t))),
    }))
    .filter(group => group.tokens.length)
}, list => `${workspace.theme.basePreset}|${list.map(g => `${g.key}:${g.customCount}:${g.tokens.map(keyOf).join(',')}`).join('|')}`)

const filtering = computed(() => query.value.trim() !== '' || show.value === 'custom')
const visibleCount = computed(() => groups.value.reduce((n, g) => n + g.tokens.length, 0))

const accordionValue = computed({
  get: () => (filtering.value ? groups.value.map(g => g.key) : openGroups.value),
  set: (value: string[] | string | null | undefined) => {
    if (!filtering.value) openGroups.value = Array.isArray(value) ? value : value ? [value] : []
  },
})

// Opens with its first part expanded (also once the base preset has loaded, after a reload or
// a base preset switch).
watch(() => allGroups.value[0]?.key, (first) => {
  expanded.value = null
  openGroups.value = first ? [first] : []
}, { immediate: true })

function toggle(token: TokenDescriptor) {
  expanded.value = expanded.value === keyOf(token) ? null : keyOf(token)
}

// A token found by search: show only it, expanded.
useTokenRequest(
  request => request.component === props.component,
  (request) => {
    query.value = request.name
    show.value = 'all'
    expanded.value = request.key
  },
)

/** Components with a visual editor default to it; the token list is always one click away. */
const hasStudio = computed(() => STUDIO_COMPONENTS.includes(props.component))
const designView = computed(() => hasStudio.value && editor.prefs.componentView === 'design')

const revealedHere = computed(() => (editor.revealed?.component === props.component ? editor.revealed : null))

function showInPreview() {
  editor.prefs.pane = 'preview'
  editor.revealComponent(props.component)
}

function showInGallery() {
  editor.prefs.template = 'components'
  editor.prefs.category = meta.value.category
  editor.revealComponent(props.component)
}
</script>

<template>
  <div class="flex flex-col gap-4">
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
          @click="editor.openComponentList()"
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
          :model-value="editor.prefs.componentView"
          :options="[{ value: 'design', label: 'Design' }, { value: 'tokens', label: 'All tokens' }]"
          option-label="label"
          option-value="value"
          :allow-empty="false"
          aria-label="Component editor view"
          size="small"
          class="flex-1"
          :pt="{ pcToggleButton: { root: { class: 'flex-1' }, label: { class: 'whitespace-nowrap' } } }"
          @update:model-value="v => (editor.prefs.componentView = v)"
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
          :options="[{ value: 'all', label: 'All' }, { value: 'custom', label: `Custom (${preset.componentOverrideCounts[component] ?? 0})` }]"
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
          v-if="editor.prefs.template !== 'components' || editor.prefs.category !== meta.category"
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
          @click="emit('open', used)"
        />
      </div>
    </div>

    <template v-if="designView">
      <EditorStudioButton v-if="component === 'button'" />
      <EditorStudioSeverity
        v-else
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
