<script setup lang="ts">
// A selectable color swatch (PrimeVue Button). The inline background overrides
// the button's own colors, including hover/active states.
const props = withDefaults(defineProps<{
  color: string
  label: string
  selected?: boolean
  shape?: 'circle' | 'square'
}>(), { selected: false, shape: 'circle' })

defineEmits<{ click: [] }>()
</script>

<template>
  <Button
    v-tooltip.top="props.label"
    :aria-label="props.label"
    :aria-pressed="props.selected"
    :rounded="props.shape === 'circle'"
    class="!p-0 transition-transform hover:scale-110"
    :class="props.selected ? 'ring-2 ring-surface-900 ring-offset-2 ring-offset-surface-0 dark:ring-surface-0 dark:ring-offset-surface-900' : ''"
    :style="{ backgroundColor: props.color, borderColor: props.color }"
    @click="$emit('click')"
  >
    <slot />
  </Button>
</template>
