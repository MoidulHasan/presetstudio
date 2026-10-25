<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import { COMPONENT_META, componentPath } from '~/utils/theme/components'
import type { TokenDescriptor } from '~/utils/theme/schema'
import { SIZE_LABELS, STUDIO_CONFIG, controlPath, type StudioSize } from '~/utils/theme/studio-controls'
import { severityVariants, type StudioState } from '~/utils/theme/studio'

// Visual editor for severity components (Message, Toast, Tag, Badge): colors per severity,
// then the component's shared settings by purpose (studio-controls.ts).
const props = defineProps<{ component: string }>()

const store = useEditorStore()

const config = computed(() => STUDIO_CONFIG[props.component]!)
const label = computed(() => COMPONENT_META[props.component]?.label ?? props.component)
const variants = computed(() => severityVariants(store.descriptors, props.component))

const tokensByPath = computed(() => {
  const map = new Map<string, TokenDescriptor>()
  for (const t of store.descriptors) {
    if (t.component === props.component && t.scheme === null) map.set(componentPath(t).join('.'), t)
  }
  return map
})

// Size tab per section that has sizes.
const sizes = ref<Record<string, StudioSize>>({})
const sizeOf = (key: string): StudioSize => sizes.value[key] ?? 'normal'
function sizeOptions(list: StudioSize[]) {
  return list.map(value => ({ value, label: SIZE_LABELS[value] }))
}

function setSize(key: string, size: StudioSize) {
  sizes.value = { ...sizes.value, [key]: size }
}

function controlsOf(section: (typeof config.value.sections)[number]) {
  const size = sizeOf(section.key)
  return section.controls
    .map(control => ({ control, token: (() => {
      const path = controlPath(control, size)
      return path ? tokensByPath.value.get(path) : undefined
    })() }))
    .filter((c): c is { control: typeof c.control, token: TokenDescriptor } => !!c.token)
}

// --- Stage picks -----------------------------------------------------------------------
const sections = ref<Record<string, HTMLElement | null>>({})
const colors = ref<{ focus: (key: string, style: string, state: StudioState) => Promise<void> } | null>(null)

useStagePick(async ([first, second, third]) => {
  if (first === 'section' && second) {
    if (third && (['normal', 'sm', 'lg', 'xl'] as string[]).includes(third)) setSize(second, third as StudioSize)
    sections.value[second]?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    return
  }
  if (first && second) await colors.value?.focus(second, first, (third as StudioState) ?? 'default')
})
</script>

<template>
  <div class="flex flex-col gap-8">
    <EditorStudioVariantColors
      ref="colors"
      :component="component"
      :variants="variants"
      :description="config.colorsDescription"
    />

    <div
      v-for="section in config.sections"
      :key="section.key"
      :ref="el => (sections[section.key] = el as HTMLElement | null)"
    >
      <EditorInspectorGroup
        :title="section.title"
        :description="section.description"
      >
        <SelectButton
          v-if="section.sizes"
          :model-value="sizeOf(section.key)"
          :options="sizeOptions(section.sizes)"
          option-label="label"
          option-value="value"
          :allow-empty="false"
          :aria-label="`${label} size to edit`"
          size="small"
          class="w-full"
          :pt="{ pcToggleButton: { root: { class: 'flex-1' } } }"
          @update:model-value="(v: StudioSize) => setSize(section.key, v)"
        />
        <EditorStudioControl
          v-for="{ control, token } in controlsOf(section)"
          :key="token.name"
          :token="token"
          :label="control.label"
          :hint="control.hint"
          :min="control.min"
          :max="control.max"
        />
      </EditorInspectorGroup>
    </div>

    <Button
      severity="secondary"
      outlined
      class="!w-full !justify-start !gap-2.5 !p-3 text-left"
      @click="store.prefs.section = 'status'"
    >
      <i
        class="pi pi-info-circle shrink-0"
        aria-hidden="true"
      />
      <span class="min-w-0 flex-1 text-sm">Change a severity in every component at once in <span class="font-semibold">Status colors</span></span>
      <i
        class="pi pi-arrow-right shrink-0 text-xs text-surface-400"
        aria-hidden="true"
      />
    </Button>
    <p class="text-xs text-surface-500">
      Need a token that isn't here? Switch to <span class="font-medium">All tokens</span> at the top. Every {{ label }} token is there.
    </p>
  </div>
</template>
