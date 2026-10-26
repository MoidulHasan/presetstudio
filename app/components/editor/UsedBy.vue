<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import { COMPONENT_META, studioFor } from '~/utils/theme/components'

// "Used by N components": the reach of a setting, one quiet line that opens into the list, each
// component one click away. Components with a visual editor are marked and listed first.
const props = withDefaults(defineProps<{ components: string[], text?: string }>(), { text: 'A change here reaches all of them.' })

const editor = useEditorStore()
const open = ref(false)

const users = computed(() => props.components
  .map(name => ({ name, label: COMPONENT_META[name]?.label ?? name, visual: !!studioFor(name) }))
  .sort((a, b) => Number(b.visual) - Number(a.visual) || a.label.localeCompare(b.label)))
</script>

<template>
  <div
    v-if="users.length"
    class="flex flex-col gap-2"
  >
    <Button
      v-tooltip.bottom="text"
      :label="`Used by ${users.length} component${users.length === 1 ? '' : 's'}`"
      :icon="open ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
      icon-pos="right"
      severity="secondary"
      size="small"
      text
      :aria-expanded="open"
      class="-ml-2 self-start !px-2 !py-1 !text-xs"
      @click="open = !open"
    />
    <div
      v-if="open"
      class="flex flex-wrap gap-1.5"
    >
      <Button
        v-for="user in users"
        :key="user.name"
        v-tooltip.top="user.visual ? 'Visual editor' : undefined"
        :label="user.label"
        :icon="user.visual ? 'pi pi-sparkles' : undefined"
        severity="secondary"
        size="small"
        outlined
        class="!px-2 !py-0.5 !text-xs"
        :aria-label="`Open ${user.label}`"
        @click="editor.openComponent(user.name)"
      />
    </div>
  </div>
</template>
