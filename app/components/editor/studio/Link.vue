<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import { COMPONENT_META, STUDIO_ICONS } from '~/utils/theme/components'

// A link into a component's visual editor, for panels whose settings that component uses.
const props = withDefaults(defineProps<{ component: string, text: string, variant?: 'card' | 'row' }>(), { variant: 'card' })

const store = useEditorStore()
const label = computed(() => COMPONENT_META[props.component]?.label ?? props.component)
</script>

<template>
  <Button
    severity="secondary"
    :outlined="variant === 'card'"
    :text="variant === 'row'"
    class="!w-full !min-w-0 !justify-start !gap-2.5 text-left"
    :class="variant === 'card' ? '!p-3' : ''"
    :aria-label="`${text} (opens the ${label} visual editor)`"
    @click="store.openComponent(component)"
  >
    <i
      :class="STUDIO_ICONS[component] ?? 'pi pi-box'"
      class="shrink-0"
      aria-hidden="true"
    />
    <span class="min-w-0 flex-1 truncate text-sm">{{ text }}</span>
    <Tag
      value="Visual"
      severity="info"
      class="shrink-0 !px-1.5 !py-0 !text-[10px]"
    />
    <i
      class="pi pi-arrow-right shrink-0 text-xs text-surface-400"
      aria-hidden="true"
    />
  </Button>
</template>
