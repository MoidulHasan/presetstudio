<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import { COMPONENT_META, studioFor } from '~/utils/theme/components'

// "Used by N components": the reach of a setting, with each component one click away.
// Components with a visual editor are marked and listed first.
const props = withDefaults(defineProps<{ components: string[], text?: string }>(), { text: 'A change here reaches all of them.' })

const editor = useEditorStore()
const SHOWN = 10
const showAll = ref(false)

const users = computed(() => props.components
  .map(name => ({ name, label: COMPONENT_META[name]?.label ?? name, visual: !!studioFor(name) }))
  .sort((a, b) => Number(b.visual) - Number(a.visual) || a.label.localeCompare(b.label)))
</script>

<template>
  <div
    v-if="users.length"
    class="flex flex-col gap-2 rounded-lg bg-surface-50 p-3 dark:bg-surface-800"
  >
    <p class="text-xs text-surface-600 dark:text-surface-300">
      Used by <span class="font-semibold">{{ users.length }} component{{ users.length === 1 ? '' : 's' }}</span>. {{ text }}
    </p>
    <div class="flex flex-wrap gap-1.5">
      <Button
        v-for="user in showAll ? users : users.slice(0, SHOWN)"
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
      <Button
        v-if="users.length > SHOWN"
        :label="showAll ? 'Show fewer' : `+${users.length - SHOWN} more`"
        size="small"
        text
        class="!px-2 !py-0.5 !text-xs"
        @click="showAll = !showAll"
      />
    </div>
  </div>
</template>
