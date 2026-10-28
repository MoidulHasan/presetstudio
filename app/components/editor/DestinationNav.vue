<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import { usePresetStore } from '~/stores/preset'
import { EDITOR_DESTINATIONS, destinationOf, type Destination } from '~/utils/editor-sections'

// The editor's five places (Overview, Colors, Shape & spacing, Components, Review): a rail beside
// the panel on wide screens, a bar above it on narrow ones. A destination always opens its first
// section (Components: the list), so the rail goes to the same place every time.
const props = withDefaults(defineProps<{ orientation?: 'vertical' | 'horizontal' }>(), { orientation: 'vertical' })

const editor = useEditorStore()
const preset = usePresetStore()
const { isModified } = useSectionStatus()

const current = computed(() => destinationOf(editor.prefs.section).key)

function open(destination: Destination) {
  const home = destination.sections[0]!
  if (home === 'components') editor.openComponentList()
  else editor.openSection(home)
}

const items = computed(() => EDITOR_DESTINATIONS.map(d => ({
  destination: d,
  active: current.value === d.key,
  modified: d.sections.some(isModified),
  issues: d.key === 'review' ? preset.contrastIssues : 0,
})))
</script>

<template>
  <nav
    aria-label="Editor"
    :class="props.orientation === 'vertical' ? 'flex flex-col gap-1 p-2' : 'grid grid-cols-5 gap-1 px-2 py-1'"
  >
    <Button
      v-for="item in items"
      :key="item.destination.key"
      severity="secondary"
      text
      class="!relative !flex-col !px-1"
      :class="[
        item.active ? '!bg-surface-100 !text-surface-900 dark:!bg-surface-800 dark:!text-surface-0' : '!text-surface-500 dark:!text-surface-400',
        props.orientation === 'vertical' ? '!w-full !gap-1 !py-2' : '!gap-0.5 !py-1',
      ]"
      :aria-current="item.active ? 'page' : undefined"
      @click="open(item.destination)"
    >
      <i
        :class="[item.destination.icon, props.orientation === 'vertical' ? 'text-base' : 'text-sm']"
        aria-hidden="true"
      />
      <span
        v-if="props.orientation === 'vertical'"
        class="text-center text-[11px] font-medium leading-tight"
      >{{ item.destination.label }}</span>
      <span
        v-else
        class="whitespace-nowrap text-center text-[11px] font-medium leading-tight"
      >{{ item.destination.short ?? item.destination.label }}</span>
      <span
        v-if="item.issues"
        class="absolute right-1.5 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white"
        :aria-label="`${item.issues} contrast checks fail`"
      >{{ item.issues }}</span>
      <span
        v-else-if="item.modified"
        class="absolute right-2 top-2 size-1.5 rounded-full bg-surface-900 dark:bg-surface-0"
        role="img"
        aria-label="Changed"
      />
    </Button>
  </nav>
</template>
