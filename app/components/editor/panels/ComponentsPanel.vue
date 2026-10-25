<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import { COMPONENT_META } from '~/utils/theme/components'

// Two levels, like the preset: the component list, then one component (its visual editor or
// its tokens grouped by part).
const editor = useEditorStore()

const component = computed(() => {
  const name = editor.prefs.component
  return name && COMPONENT_META[name] ? name : null
})

// A token search in the list carries over into the component it opens (only that one: a
// component opened later, e.g. by Inspect, starts without a search).
const carried = ref<{ component: string, query: string } | null>(null)
const initialQuery = computed(() => (carried.value?.component === component.value ? carried.value.query : ''))

function open(name: string, query = '') {
  carried.value = { component: name, query }
  editor.openComponent(name)
}
</script>

<template>
  <EditorComponentList
    v-if="!component"
    @open="open"
  />
  <EditorComponentTokens
    v-else
    :key="component"
    :component="component"
    :initial-query="initialQuery"
    @open="open"
  />
</template>
