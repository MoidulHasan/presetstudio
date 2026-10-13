<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import { parseColor } from '~/utils/theme/color'
import { normalizeHex } from '~/utils/theme/palette'
import type { TokenDescriptor } from '~/utils/theme/schema'
import { tokenSource } from '~/utils/theme/semantic'
import { hasPath } from '~/utils/theme/tree'
import type { ColorScheme } from '~/utils/theme/types'
import { referenceFor, sanitizeTokenValue } from '~/utils/theme/values'

// One token in the token editor: a summary row that expands into an editor.
const props = defineProps<{ token: TokenDescriptor, scheme: ColorScheme, expanded: boolean, label: string }>()
const emit = defineEmits<{ toggle: [] }>()

const store = useEditorStore()

const resolver = computed(() => store.resolvers?.[props.token.scheme ?? props.scheme])
const resolved = computed(() => resolver.value?.resolve(props.token.name) ?? null)
const raw = computed(() => String(resolved.value?.raw ?? props.token.defaultValue))
const source = computed(() => tokenSource(props.token, store.theme.overrides, store.designTokens))
const hasDesignValue = computed(() => hasPath(store.designTokens, props.token.path))
const isColor = computed(() => props.token.kind === 'color')
const swatch = computed(() => (isColor.value && resolved.value && parseColor(resolved.value.value) ? resolved.value.value : null))

const SOURCE_LABEL = { base: 'Base preset', design: 'Design setting', custom: 'Custom' } as const

// --- Editing ---------------------------------------------------------------------
const draft = ref(raw.value)
watch([raw, () => props.expanded], () => {
  draft.value = raw.value
})
// Only flag invalid input after an attempt to apply it, not while typing.
const attempted = ref(false)
watch(draft, () => {
  attempted.value = false
})
const invalid = computed(() => attempted.value && sanitizeTokenValue(draft.value) === null)

function apply() {
  if (draft.value.trim() === raw.value) return
  attempted.value = true
  store.setToken(props.token.path, draft.value)
}

const suggestions = ref<string[]>([])
const metaByName = computed(() => {
  const map = new Map<string, { kind: string, layer: string }>()
  for (const d of store.descriptors) if (!map.has(d.name)) map.set(d.name, { kind: d.kind, layer: d.layer })
  return map
})

// Semantic tokens are the usual targets (also for component tokens), then primitives.
const LAYER_RANK: Record<string, number> = { semantic: 0, primitive: 1, component: 2 }

/** Suggests references to tokens of the same kind, e.g. {primary.600} for colors. */
function complete(event: { query: string }) {
  const q = event.query.replace(/[{}]/g, '').replace(/\./g, '-').toLowerCase().trim()
  const names = [...(resolver.value?.entries.keys() ?? [])]
  const rank = (name: string) => LAYER_RANK[metaByName.value.get(name)?.layer ?? 'component'] ?? 2
  suggestions.value = names
    .filter(name => name !== props.token.name && metaByName.value.get(name)?.kind === props.token.kind && name.includes(q))
    .sort((a, b) => rank(a) - rank(b))
    .slice(0, 40)
    .map(referenceFor)
}

const pickerColor = computed({
  get: () => (swatch.value ? (normalizeHex(swatch.value) ?? '#000000').slice(1) : '000000'),
  set: (value: string) => {
    draft.value = `#${value}`
    store.setToken(props.token.path, draft.value)
  },
})

const chain = computed(() => (resolved.value?.chain ?? []).map(name => referenceFor(name)))
const inputId = useId()
</script>

<template>
  <div
    class="rounded-md"
    :class="props.expanded ? 'bg-surface-50 ring-1 ring-surface-200 dark:bg-surface-800 dark:ring-surface-700' : ''"
  >
    <div class="flex items-center">
      <Button
        severity="secondary"
        text
        class="!min-w-0 !flex-1 !justify-start !gap-2.5 !px-2 !py-1.5 text-left"
        :aria-expanded="props.expanded"
        @click="emit('toggle')"
      >
        <span
          v-if="isColor"
          class="size-5 shrink-0 rounded border border-surface-300 dark:border-surface-600"
          :style="{ background: swatch ?? 'repeating-linear-gradient(45deg, transparent 0 3px, rgba(0,0,0,.15) 3px 6px)' }"
          aria-hidden="true"
        />
        <span class="flex min-w-0 flex-1 flex-col">
          <span class="truncate text-sm text-surface-900 dark:text-surface-0">{{ props.label }}</span>
          <span class="truncate font-mono text-[11px] text-surface-500">{{ raw }}</span>
        </span>
        <span
          v-if="source !== 'base'"
          v-tooltip.left="SOURCE_LABEL[source]"
          class="size-2 shrink-0 rounded-full"
          :class="source === 'custom' ? 'bg-surface-900 dark:bg-surface-0' : 'border border-surface-500'"
          role="img"
          :aria-label="SOURCE_LABEL[source]"
        />
        <i
          class="pi text-xs text-surface-400"
          :class="props.expanded ? 'pi-chevron-up' : 'pi-chevron-down'"
          aria-hidden="true"
        />
      </Button>
      <!-- Reset sits on the row itself, so a custom value can be undone without expanding. -->
      <Button
        v-if="source === 'custom'"
        v-tooltip.left="'Reset to ' + (hasDesignValue ? 'design setting' : 'base preset')"
        icon="pi pi-undo"
        severity="secondary"
        size="small"
        text
        rounded
        class="shrink-0"
        :aria-label="`Reset ${props.label}`"
        @click="store.resetToken(props.token.path)"
      />
    </div>

    <div
      v-if="props.expanded"
      class="flex flex-col gap-3 px-2 pb-3 pt-1"
    >
      <div class="flex items-center gap-2 text-xs text-surface-500">
        <code
          v-tooltip.top="`--p-${props.token.name}`"
          class="min-w-0 flex-1 truncate font-mono"
        >--p-{{ props.token.name }}</code>
        <Tag
          :value="props.token.scheme ? `${props.token.scheme === 'light' ? 'Light' : 'Dark'} only` : 'Both modes'"
          severity="secondary"
          class="shrink-0 !px-1.5 !py-0 !text-[10px]"
        />
        <Tag
          :value="SOURCE_LABEL[source]"
          :severity="source === 'custom' ? 'contrast' : 'secondary'"
          class="shrink-0 !px-1.5 !py-0 !text-[10px]"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label
          :for="inputId"
          class="text-xs font-medium"
        >Value or reference</label>
        <div class="flex items-center gap-2">
          <ColorPicker
            v-if="isColor"
            v-model="pickerColor"
            :aria-label="`Pick a color for ${props.label}`"
          />
          <AutoComplete
            v-model="draft"
            :input-id="inputId"
            :suggestions="suggestions"
            :show-empty-message="false"
            :invalid="invalid"
            size="small"
            fluid
            class="min-w-0 flex-1"
            input-class="font-mono !text-xs"
            :placeholder="isColor ? '#rrggbb or {primary.600}' : 'Value or {token.name}'"
            @complete="complete"
            @option-select="apply"
            @keydown.enter="apply"
            @blur="apply"
          />
        </div>
        <Message
          v-if="invalid"
          severity="error"
          size="small"
          variant="simple"
        >
          Not a valid token value. Use a CSS value or a reference like {primary.500}.
        </Message>
      </div>

      <div
        v-if="chain.length > 1"
        class="flex flex-wrap items-center gap-1 text-[11px]"
        aria-label="Reference chain"
      >
        <template
          v-for="(step, i) in chain"
          :key="step"
        >
          <i
            v-if="i > 0"
            class="pi pi-arrow-right text-[9px] text-surface-400"
            aria-hidden="true"
          />
          <code class="max-w-full break-all rounded bg-surface-100 px-1 py-0.5 font-mono dark:bg-surface-700">{{ step }}</code>
        </template>
        <i
          class="pi pi-arrow-right text-[9px] text-surface-400"
          aria-hidden="true"
        />
        <code class="max-w-full break-all font-mono font-semibold">{{ resolved?.value }}</code>
      </div>
      <p
        v-else-if="resolved && resolved.value !== raw"
        class="break-all font-mono text-[11px] text-surface-500"
      >
        = {{ resolved.value }}
      </p>
    </div>
  </div>
</template>
