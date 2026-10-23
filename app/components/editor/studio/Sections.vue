<script setup lang="ts">
import type { TokenDescriptor } from '~/utils/theme/schema'
import { SIZE_LABELS, controlPath, type StudioSection, type StudioSize } from '~/utils/theme/studio-controls'

// A visual editor's shared settings by purpose: one group per section, with a size switch when
// the section has sizes. `resolve` finds the token(s) at a path: one shared token, or a light and
// a dark one (those get a control each).
const props = defineProps<{ sections: StudioSection[], resolve: (path: string) => TokenDescriptor[] }>()

const sizes = ref<Record<string, StudioSize>>({})
const sizeOf = (key: string): StudioSize => sizes.value[key] ?? 'normal'
function setSize(key: string, size: StudioSize) {
  sizes.value = { ...sizes.value, [key]: size }
}
function sizeOptions(list: StudioSize[]) {
  return list.map(value => ({ value, label: SIZE_LABELS[value] }))
}

/** Controls of a section for its current size; per-scheme tokens get a light and a dark control. */
function controlsOf(section: StudioSection) {
  const size = sizeOf(section.key)
  const out: Array<{ key: string, token: TokenDescriptor, label: string, hint?: string, min?: number, max?: number }> = []
  for (const control of section.controls) {
    const path = controlPath(control, size)
    if (!path) continue
    const tokens = props.resolve(path)
    for (const token of tokens) {
      const hint = tokens.length > 1 ? (token.scheme === 'dark' ? 'dark mode' : 'light mode') : control.hint
      out.push({ key: token.path.join('.'), token, label: control.label, hint, min: control.min, max: control.max })
    }
  }
  return out
}

const elements = ref<Record<string, HTMLElement | null>>({})

/** Scrolls to a section (from a stage click), optionally switching its size. */
function show(key: string, size?: string) {
  const section = props.sections.find(s => s.key === key)
  if (!section) return
  if (size && (section.sizes as string[] | undefined)?.includes(size)) setSize(key, size as StudioSize)
  elements.value[key]?.scrollIntoView({ block: 'start', behavior: 'smooth' })
}

defineExpose({ show })
</script>

<template>
  <div
    v-for="section in sections"
    :key="section.key"
    :ref="el => (elements[section.key] = el as HTMLElement | null)"
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
        :aria-label="`${section.title} size to edit`"
        size="small"
        class="w-full"
        :pt="{ pcToggleButton: { root: { class: 'flex-1' } } }"
        @update:model-value="(v: StudioSize) => setSize(section.key, v)"
      />
      <EditorStudioControl
        v-for="control in controlsOf(section)"
        :key="control.key"
        :token="control.token"
        :label="control.label"
        :hint="control.hint"
        :min="control.min"
        :max="control.max"
      />
    </EditorInspectorGroup>
  </div>
</template>
