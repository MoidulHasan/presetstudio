<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import { DENSITY_FACTORS } from '~/utils/theme/design'
import type { Density } from '~/utils/theme/types'

const store = useEditorStore()

const options: Array<{ value: Density, label: string, hint: string }> = [
  { value: 'compact', label: 'Compact', hint: 'Data-dense apps, admin tools' },
  { value: 'base', label: 'Default', hint: 'The base preset\'s spacing' },
  { value: 'comfortable', label: 'Comfortable', hint: 'Touch-friendly, airy layouts' },
]

function setDensity(value: Density) {
  store.update((d) => {
    d.design.density = value
  })
}

const samples = computed(() => {
  const r = store.resolvers?.light
  return [
    { label: 'Input padding', value: r?.resolve('form-field-padding-y')?.value + ' / ' + r?.resolve('form-field-padding-x')?.value },
    { label: 'Button padding', value: r?.resolve('button-padding-y')?.value + ' / ' + r?.resolve('button-padding-x')?.value },
    { label: 'List option', value: r?.resolve('list-option-padding')?.value },
    { label: 'Table cell', value: r?.resolve('datatable-body-cell-padding')?.value },
  ]
})
</script>

<template>
  <div class="flex flex-col gap-8">
    <EditorInspectorGroup
      title="Spacing"
      description="Scales the padding of inputs, buttons, lists, menus, overlays, cards and tables. Values that reference other tokens follow them automatically."
    >
      <div
        class="flex flex-col gap-2"
        role="radiogroup"
        aria-label="Density"
      >
        <EditorOptionCard
          v-for="option in options"
          :key="option.value"
          name="density"
          :value="option.value"
          :selected="store.theme.design.density === option.value"
          :label="option.label"
          :hint="option.hint"
          @select="setDensity(option.value)"
        >
          <template #visual>
            <span
              class="flex w-8 flex-col justify-center"
              :style="{ gap: `${3 * DENSITY_FACTORS[option.value]}px` }"
              aria-hidden="true"
            >
              <span
                v-for="i in 3"
                :key="i"
                class="h-1 rounded bg-surface-400"
              />
            </span>
          </template>
        </EditorOptionCard>
      </div>
    </EditorInspectorGroup>

    <EditorInspectorGroup title="Resulting values">
      <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
        <template
          v-for="sample in samples"
          :key="sample.label"
        >
          <dt class="text-surface-500 dark:text-surface-400">
            {{ sample.label }}
          </dt>
          <dd class="text-right font-mono">
            {{ sample.value }}
          </dd>
        </template>
      </dl>
    </EditorInspectorGroup>
  </div>
</template>
