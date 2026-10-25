<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import { useWorkspaceStore } from '~/stores/workspace'
import { usePresetStore } from '~/stores/preset'
import { groupSemanticTokens, matchesQuery, semanticPath, tokenSource } from '~/utils/theme/semantic'
import type { TokenDescriptor } from '~/utils/theme/schema'
import type { ColorScheme } from '~/utils/theme/types'

// Semantic tokens as an editable list, grouped, with search and an All/Custom filter. Shows
// every group (Advanced → All tokens) or only `groups` (a pattern section's "All tokens").
const props = defineProps<{ groups?: readonly string[] }>()

const editor = useEditorStore()
const workspace = useWorkspaceStore()
const preset = usePresetStore()

// The edited scheme is the previewed scheme, like the Surfaces panel.
const scheme = computed<ColorScheme>({
  get: () => editor.prefs.colorScheme,
  set: (value) => {
    editor.prefs.colorScheme = value
  },
})

const isCustom = (t: TokenDescriptor) => tokenSource(t, workspace.theme.overrides, preset.designTokens) === 'custom'

const query = ref('')
const show = ref<'all' | 'custom'>('all')
const expanded = ref<string | null>(null)
const openGroups = ref<string[]>([props.groups?.[0] ?? 'primary'])

const keyOf = (token: TokenDescriptor) => token.path.join('.')

function humanize(key: string): string {
  const words = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/** Label inside a group: drop the group segment, e.g. formField.focusBorderColor → "Focus border color". */
function labelOf(token: TokenDescriptor, groupKey: string): string {
  const parts = semanticPath(token)
  const rest = parts[0] === groupKey ? parts.slice(1) : parts
  return rest.length ? rest.map(humanize).join(' › ') : humanize(parts[0] ?? token.name)
}

const filtering = computed(() => query.value.trim() !== '' || show.value === 'custom')

const groups = computed(() => {
  const resolver = preset.resolvers?.[scheme.value]
  return groupSemanticTokens(preset.descriptors, scheme.value)
    .filter(g => !props.groups || props.groups.includes(g.key))
    .map(g => ({
      ...g,
      customCount: g.tokens.filter(isCustom).length,
      tokens: g.tokens.filter(t =>
        matchesQuery(t, query.value, resolver?.resolve(t.name)?.value ?? '')
        && (show.value === 'all' || isCustom(t))),
    }))
    .filter(g => g.tokens.length)
})

const total = computed(() => groups.value.reduce((n, g) => n + g.tokens.length, 0))
const customTotal = computed(() => groupSemanticTokens(preset.descriptors, scheme.value)
  .filter(g => !props.groups || props.groups.includes(g.key))
  .reduce((n, g) => n + g.tokens.filter(isCustom).length, 0))

const accordionValue = computed({
  get: () => (filtering.value || props.groups ? groups.value.map(g => g.key) : openGroups.value),
  set: (value: string[] | string | null | undefined) => {
    if (!filtering.value && !props.groups) openGroups.value = Array.isArray(value) ? value : value ? [value] : []
  },
})

function toggle(token: TokenDescriptor) {
  expanded.value = expanded.value === keyOf(token) ? null : keyOf(token)
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Sticky controls live in the inspector header, so they never scroll away. -->
    <Teleport
      defer
      to="#inspector-toolbar"
    >
      <SelectButton
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
      <IconField>
        <InputIcon class="pi pi-search" />
        <InputText
          v-model="query"
          placeholder="Search tokens, e.g. border or #fff"
          aria-label="Search semantic tokens"
          size="small"
          class="w-full"
        />
      </IconField>
      <div class="flex items-center justify-between gap-2">
        <SelectButton
          v-model="show"
          :options="[{ value: 'all', label: 'All' }, { value: 'custom', label: `Custom (${customTotal})` }]"
          option-label="label"
          option-value="value"
          :allow-empty="false"
          aria-label="Which tokens to show"
          size="small"
        />
        <span class="text-xs text-surface-500">{{ total }} token{{ total === 1 ? '' : 's' }}</span>
      </div>
    </Teleport>

    <p
      v-if="!groups.length"
      class="py-8 text-center text-sm text-surface-500"
    >
      {{ show === 'custom' && !query ? 'No custom tokens yet. Expand a token to change it.' : 'No tokens match your search.' }}
    </p>

    <Accordion
      v-else
      v-model:value="accordionValue"
      multiple
    >
      <AccordionPanel
        v-for="g in groups"
        :key="g.key"
        :value="g.key"
      >
        <AccordionHeader class="!px-1 !py-2.5">
          <span class="flex flex-1 items-center gap-2">
            <span class="text-sm font-semibold">{{ g.label }}</span>
            <Badge
              :value="g.tokens.length"
              severity="secondary"
              size="small"
            />
            <Badge
              v-if="g.customCount"
              v-tooltip.top="'Custom values'"
              :value="`${g.customCount} custom`"
              severity="contrast"
              size="small"
            />
          </span>
        </AccordionHeader>
        <AccordionContent :pt="{ root: { class: '!grid-cols-[minmax(0,1fr)]' }, contentWrapper: { class: 'min-w-0' }, content: { class: '!px-0 !pb-3 !pt-0' } }">
          <p class="mb-2 px-1 text-xs text-surface-500">
            {{ g.description }}
          </p>
          <div class="flex flex-col">
            <EditorTokenRow
              v-for="token in g.tokens"
              :key="keyOf(token)"
              :token="token"
              :scheme="scheme"
              :label="labelOf(token, g.key)"
              :expanded="expanded === keyOf(token)"
              @toggle="toggle(token)"
            />
          </div>
        </AccordionContent>
      </AccordionPanel>
    </Accordion>

    <p class="text-xs text-surface-500">
      <span class="mr-1 inline-block size-2 rounded-full bg-surface-900 align-middle dark:bg-surface-0" /> custom value
      <span class="ml-3 mr-1 inline-block size-2 rounded-full border border-surface-500 align-middle" /> set by a design section
    </p>
  </div>
</template>
