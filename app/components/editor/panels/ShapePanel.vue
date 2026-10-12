<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import { RADIUS_VALUES } from '~/utils/theme/design'
import { BASE_PRESET_LABELS, type RadiusScale } from '~/utils/theme/types'

const store = useEditorStore()

const options: Array<{ value: RadiusScale, label: string }> = [
  { value: 'none', label: 'Square' },
  { value: 'small', label: 'Subtle' },
  { value: 'base', label: `Default` },
  { value: 'large', label: 'Rounded' },
  { value: 'xlarge', label: 'Soft' },
]

const steps = ['xs', 'sm', 'md', 'lg', 'xl'] as const

function setRadius(value: RadiusScale) {
  store.update((d) => {
    d.design.radius = value
  })
}

/** The md radius for an option (what most components use). */
function previewRadius(value: RadiusScale): string {
  if (value !== 'base') return RADIUS_VALUES[value].md!
  return store.resolvers?.light.entries.get('border-radius-md')?.raw.toString() ?? '6px'
}

const resolved = computed(() => steps.map(step => ({
  step,
  value: store.resolvers?.light.resolve(`border-radius-${step}`)?.value ?? '',
})))
</script>

<template>
  <div class="flex flex-col gap-8">
    <EditorInspectorGroup title="Corner radius">
      <div
        class="grid grid-cols-5 gap-2"
        role="radiogroup"
        aria-label="Corner radius scale"
      >
        <button
          v-for="option in options"
          :key="option.value"
          type="button"
          role="radio"
          :aria-checked="store.theme.design.radius === option.value"
          class="flex flex-col items-center gap-2 rounded-lg border p-2 text-xs transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          :class="store.theme.design.radius === option.value
            ? 'border-primary bg-primary-50 dark:bg-primary-950'
            : 'border-surface-200 hover:border-surface-400 dark:border-surface-700'"
          @click="setRadius(option.value)"
        >
          <span
            class="size-9 border-2 border-surface-500 bg-surface-100 dark:bg-surface-800"
            :style="{ borderRadius: previewRadius(option.value) }"
          />
          {{ option.label }}
        </button>
      </div>
      <p
        v-if="store.theme.design.radius === 'base'"
        class="text-xs text-surface-500 dark:text-surface-400"
      >
        Using {{ BASE_PRESET_LABELS[store.theme.basePreset] }}'s radius scale.
      </p>
    </EditorInspectorGroup>

    <EditorInspectorGroup
      title="Scale"
      description="Buttons and inputs use md, overlays lg/xl, small items xs/sm."
    >
      <dl class="grid grid-cols-5 gap-2 text-center text-xs">
        <div
          v-for="item in resolved"
          :key="item.step"
          class="flex flex-col items-center gap-1"
        >
          <span
            class="size-8 border border-surface-400 bg-surface-100 dark:bg-surface-800"
            :style="{ borderRadius: item.value }"
            aria-hidden="true"
          />
          <dt class="font-medium">
            {{ item.step }}
          </dt>
          <dd class="font-mono text-surface-500">
            {{ item.value }}
          </dd>
        </div>
      </dl>
    </EditorInspectorGroup>
  </div>
</template>
