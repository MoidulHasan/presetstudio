<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import { COMPONENT_META, studioFor } from '~/utils/theme/components'
import { semanticCell, semanticStudio, semanticTokens, semanticUsedBy } from '~/utils/theme/semantic-studio'
import { SIZE_LABELS, controlPath, type StudioSection, type StudioSize } from '~/utils/theme/studio-controls'
import type { TokenDescriptor } from '~/utils/theme/schema'

// Visual editor of one semantic group: what uses it, its colors as a property × state grid
// (light|dark pairs) and its shared settings by purpose.
const props = defineProps<{ group: string }>()

const store = useEditorStore()
const studio = computed(() => semanticStudio(props.group)!)

// --- Used by -------------------------------------------------------------------------
const usedBy = computed(() => semanticUsedBy(store.descriptors, props.group)
  .map(name => ({ name, label: COMPONENT_META[name]?.label ?? name, visual: !!studioFor(name) }))
  .sort((a, b) => Number(b.visual) - Number(a.visual) || a.label.localeCompare(b.label)))
const showAllUsers = ref(false)
const USERS_SHOWN = 10

// --- Colors ----------------------------------------------------------------------------
const grid = computed(() => {
  const config = studio.value
  if (!config.rows || !config.columns) return null
  return {
    columns: config.columns,
    rows: config.rows.map(row => ({
      key: row.key,
      label: row.label,
      cells: Object.fromEntries(Object.entries(row.cells).map(([column, path]) => [column, semanticCell(store.descriptors, path)])),
    })),
  }
})

// --- Controls --------------------------------------------------------------------------
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
    const tokens = semanticTokens(store.descriptors, path)
    for (const token of tokens) {
      const hint = tokens.length > 1 ? (token.scheme === 'dark' ? 'dark mode' : 'light mode') : control.hint
      out.push({ key: token.path.join('.'), token, label: control.label, hint, min: control.min, max: control.max })
    }
  }
  return out
}

// --- Stage picks -----------------------------------------------------------------------
const sections = ref<Record<string, HTMLElement | null>>({})
const gridRef = ref<{ focus: (row: string, column?: string) => Promise<void> } | null>(null)
const colorsSection = ref<HTMLElement | null>(null)

watch(() => store.stagePick, async (pick) => {
  if (!pick) return
  store.stagePick = null
  const [kind, first, second] = pick.target.split(':')
  await nextTick()
  if (kind === 'cell' && first) {
    await gridRef.value?.focus(first, second)
  }
  else if (kind === 'section' && first) {
    if (second && (['normal', 'sm', 'lg'] as string[]).includes(second)) setSize(first, second as StudioSize)
    sections.value[first]?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }
}, { immediate: true })
</script>

<template>
  <div class="flex flex-col gap-8">
    <!-- Where this group shows up -->
    <div
      v-if="usedBy.length"
      class="flex flex-col gap-2 rounded-lg bg-surface-50 p-3 dark:bg-surface-800"
    >
      <p class="text-xs text-surface-600 dark:text-surface-300">
        Used by <span class="font-semibold">{{ usedBy.length }} component{{ usedBy.length === 1 ? '' : 's' }}</span>. A change here reaches all of them.
      </p>
      <div class="flex flex-wrap gap-1.5">
        <Button
          v-for="user in showAllUsers ? usedBy : usedBy.slice(0, USERS_SHOWN)"
          :key="user.name"
          :label="user.label"
          :icon="user.visual ? 'pi pi-sparkles' : undefined"
          severity="secondary"
          size="small"
          outlined
          class="!px-2 !py-0.5 !text-xs"
          :aria-label="`Open ${user.label}`"
          @click="store.openComponent(user.name)"
        />
        <Button
          v-if="usedBy.length > USERS_SHOWN"
          :label="showAllUsers ? 'Show fewer' : `+${usedBy.length - USERS_SHOWN} more`"
          size="small"
          text
          class="!px-2 !py-0.5 !text-xs"
          @click="showAllUsers = !showAllUsers"
        />
      </div>
    </div>

    <!-- Colors -->
    <div
      v-if="grid"
      ref="colorsSection"
    >
      <EditorInspectorGroup
        title="Colors"
        :description="grid.columns.length > 1 ? 'Light and dark side by side in every cell. Select one to edit both.' : 'Light and dark side by side. Select one to edit both.'"
      >
        <EditorStudioTokenGrid
          ref="gridRef"
          :columns="grid.columns"
          :rows="grid.rows"
          :title="studio.label"
        />
      </EditorInspectorGroup>
    </div>

    <!-- Shared settings -->
    <div
      v-for="section in studio.sections ?? []"
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

    <p class="text-xs text-surface-500">
      Need a token that isn't here? Switch to <span class="font-medium">All tokens</span> at the top. Every {{ studio.label.toLowerCase() }} token is there.
    </p>
  </div>
</template>
