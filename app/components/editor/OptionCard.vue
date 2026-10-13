<script setup lang="ts">
// A radio choice rendered as a card (PrimeVue RadioButton + label).
// Cards with the same `name` form one radio group.
const props = withDefaults(defineProps<{
  selected: boolean
  label: string
  name: string
  value: string
  hint?: string
  /**
   * 'row': radio, visual and text side by side.
   * 'stacked': visual on top and the label under it, for narrow grids. The radio sits in the
   * corner so the label gets the card's full width.
   */
  layout?: 'row' | 'stacked'
}>(), { hint: undefined, layout: 'row' })

const emit = defineEmits<{ select: [] }>()

const id = useId()
</script>

<template>
  <label
    :for="id"
    class="relative flex h-full min-w-0 cursor-pointer rounded-lg border text-sm transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary"
    :class="[
      props.selected
        ? 'border-surface-900 bg-surface-50 dark:border-surface-0 dark:bg-surface-800'
        : 'border-surface-200 hover:border-surface-400 dark:border-surface-700 dark:hover:border-surface-500',
      props.layout === 'stacked' ? 'flex-col items-center gap-1.5 px-1.5 pb-2 pt-3 text-center text-xs' : 'items-center gap-3 p-3',
    ]"
  >
    <RadioButton
      :input-id="id"
      :name="props.name"
      :value="props.value"
      :model-value="props.selected ? props.value : undefined"
      size="small"
      :class="props.layout === 'stacked' ? '!absolute left-1 top-1 scale-75' : 'shrink-0'"
      @update:model-value="emit('select')"
    />
    <slot name="visual" />
    <span
      class="flex min-w-0 flex-col"
      :class="props.layout === 'stacked' ? 'w-full items-center' : 'flex-1'"
    >
      <span
        class="font-medium"
        :class="props.layout === 'stacked' ? 'w-full truncate' : ''"
        :title="props.layout === 'stacked' ? props.label : undefined"
      >{{ props.label }}</span>
      <span
        v-if="props.hint"
        class="text-xs text-surface-500 dark:text-surface-400"
      >{{ props.hint }}</span>
    </span>
  </label>
</template>
