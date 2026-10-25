<script setup lang="ts">
import { useWorkspaceStore } from '~/stores/workspace'
import { usePresetStore } from '~/stores/preset'
import { DENSITY_SCALE_RANGE, densityFactor } from '~/utils/theme/design'
import type { Density } from '~/utils/theme/types'

const workspace = useWorkspaceStore()
const preset = usePresetStore()

const options: Array<{ value: Density, label: string, hint: string }> = [
  { value: 'compact', label: 'Compact', hint: 'Data-dense apps, admin tools' },
  { value: 'base', label: 'Default', hint: 'The base preset\'s spacing' },
  { value: 'comfortable', label: 'Comfortable', hint: 'Touch-friendly, airy layouts' },
  { value: 'custom', label: 'Custom', hint: 'Pick your own spacing scale' },
]

const design = computed(() => workspace.theme.design)

function setDensity(value: Density) {
  // A custom scale starts from the current one.
  const scale = value === 'custom' && design.value.density !== 'custom' ? densityFactor(design.value.density, design.value.densityScale) : null
  workspace.update((d) => {
    d.design.density = value
    if (scale !== null) d.design.densityScale = scale
  })
}

function setScale(value: number | number[]) {
  const n = Array.isArray(value) ? value[0]! : value
  workspace.update((d) => {
    d.design.density = 'custom'
    d.design.densityScale = Math.round(n * 100) / 100
  }, 'density.scale')
}

const samples = computed(() => {
  const r = preset.resolvers?.light
  return [
    { label: 'Input padding', value: r?.resolve('form-field-padding-y')?.value + ' / ' + r?.resolve('form-field-padding-x')?.value },
    { label: 'Button padding', value: r?.resolve('button-padding-y')?.value + ' / ' + r?.resolve('button-padding-x')?.value },
    { label: 'List option', value: r?.resolve('list-option-padding')?.value },
    { label: 'Card body', value: r?.resolve('card-body-padding')?.value },
    { label: 'Dialog', value: r?.resolve('dialog-content-padding')?.value },
    { label: 'Table cell', value: r?.resolve('datatable-body-cell-padding')?.value },
  ]
})
</script>

<template>
  <div class="flex flex-col gap-8">
    <EditorInspectorGroup
      title="Spacing"
      description="Scales every padding and gap of every component: inputs, buttons, lists, menus, overlays, panels and tables."
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
          :selected="workspace.theme.design.density === option.value"
          :label="option.label"
          :hint="option.hint"
          @select="setDensity(option.value)"
        >
          <template #visual>
            <span
              class="flex w-8 flex-col justify-center"
              :style="{ gap: `${3 * densityFactor(option.value, design.densityScale)}px` }"
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
      <div
        v-if="design.density === 'custom'"
        class="flex flex-col gap-2"
      >
        <label
          id="density-scale"
          class="flex justify-between text-xs font-medium"
        >Spacing scale <span class="font-mono text-surface-500">{{ Math.round(design.densityScale * 100) }}%</span></label>
        <Slider
          :model-value="design.densityScale"
          :min="DENSITY_SCALE_RANGE.min"
          :max="DENSITY_SCALE_RANGE.max"
          :step="0.05"
          aria-labelledby="density-scale"
          @update:model-value="setScale"
        />
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
