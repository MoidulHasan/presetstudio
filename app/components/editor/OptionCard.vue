<script setup lang="ts">
// A radio choice rendered as a card (PrimeVue RadioButton + label).
// Cards with the same `name` form one radio group.
const props = withDefaults(defineProps<{
  selected: boolean
  label: string
  name: string
  value: string
  hint?: string
  /** 'row': radio, visual and text side by side. 'stacked': visual on top, for narrow grids. */
  layout?: 'row' | 'stacked'
}>(), { hint: undefined, layout: 'row' })

const emit = defineEmits<{ select: [] }>()

const id = useId()
</script>

<template>
  <label
    :for="id"
    class="flex h-full cursor-pointer rounded-lg border text-sm transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary"
    :class="[
      props.selected
        ? 'border-surface-900 bg-surface-50 dark:border-surface-0 dark:bg-surface-800'
        : 'border-surface-200 hover:border-surface-400 dark:border-surface-700 dark:hover:border-surface-500',
      props.layout === 'stacked' ? 'flex-col items-center gap-2 p-2 text-center text-xs' : 'items-center gap-3 p-3',
    ]"
  >
    <slot
      v-if="props.layout === 'stacked'"
      name="visual"
    />
    <span
      class="flex items-center gap-2"
      :class="props.layout === 'stacked' ? 'justify-center' : 'min-w-0 flex-1 gap-3'"
    >
      <RadioButton
        :input-id="id"
        :name="props.name"
        :value="props.value"
        :model-value="props.selected ? props.value : undefined"
        size="small"
        @update:model-value="emit('select')"
      />
      <slot
        v-if="props.layout === 'row'"
        name="visual"
      />
      <span class="flex min-w-0 flex-col">
        <span class="font-medium">{{ props.label }}</span>
        <span
          v-if="props.hint"
          class="text-xs text-surface-500 dark:text-surface-400"
        >{{ props.hint }}</span>
      </span>
    </span>
  </label>
</template>
