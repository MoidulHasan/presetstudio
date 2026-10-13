<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import { MAX_RADIUS, RADIUS_VALUES, radiusScaleFrom } from '~/utils/theme/design'
import { BASE_PRESET_LABELS, RADIUS_STEPS, type CustomRadius, type RadiusScale, type RadiusStep } from '~/utils/theme/types'

const store = useEditorStore()

const options: Array<{ value: RadiusScale, label: string }> = [
  { value: 'none', label: 'Square' },
  { value: 'small', label: 'Subtle' },
  { value: 'base', label: `Default` },
  { value: 'large', label: 'Rounded' },
  { value: 'xlarge', label: 'Soft' },
  { value: 'custom', label: 'Custom' },
]

// Which components use each step differs per preset (Material's buttons use sm, Aura's md),
// so the hints follow the reference chains of a few well-known tokens.
const NOTABLE: Array<[label: string, token: string]> = [
  ['buttons', 'button-border-radius'],
  ['inputs', 'inputtext-border-radius'],
  ['checkboxes', 'checkbox-border-radius'],
  ['tags', 'tag-border-radius'],
  ['menu items', 'menu-item-border-radius'],
  ['cards', 'card-border-radius'],
  ['panels', 'panel-border-radius'],
  ['popovers', 'popover-border-radius'],
  ['dialogs', 'dialog-border-radius'],
  ['toasts', 'toast-border-radius'],
]

const usedBy = computed<Record<RadiusStep, string>>(() => {
  const r = store.resolvers?.light
  return Object.fromEntries(RADIUS_STEPS.map((step) => {
    const labels = NOTABLE.filter(([, token]) => r?.resolve(token)?.chain.includes(`border-radius-${step}`)).map(([label]) => label)
    const text = labels.join(', ')
    return [step, text ? text.charAt(0).toUpperCase() + text.slice(1) : 'Less common parts']
  })) as Record<RadiusStep, string>
})

const custom = computed(() => store.theme.design.radius === 'custom')

const px = (value: string | undefined) => {
  const n = Number.parseFloat(value ?? '')
  return Number.isFinite(n) ? Math.min(MAX_RADIUS, Math.max(0, Math.round(n))) : 0
}

/** The scale currently in effect, in px. */
const current = computed<CustomRadius>(() =>
  Object.fromEntries(RADIUS_STEPS.map(step => [step, px(store.resolvers?.light.resolve(`border-radius-${step}`)?.value)])) as CustomRadius)

function setRadius(value: RadiusScale) {
  // A new custom scale starts from what's on screen.
  const seed = value === 'custom' && !custom.value ? { ...current.value } : null
  store.update((d) => {
    d.design.radius = value
    if (seed) d.design.customRadius = seed
  })
}

function setCustom(values: Partial<CustomRadius>, key: string) {
  store.update((d) => {
    d.design.radius = 'custom'
    d.design.customRadius = { ...d.design.customRadius, ...values }
  }, key)
}

const sliderValue = (v: number | number[]) => (Array.isArray(v) ? v[0]! : v)

/** The md radius for an option (what most components use). */
function previewRadius(value: RadiusScale): string {
  if (value === 'custom') return `${store.theme.design.customRadius.md}px`
  if (value !== 'base') return RADIUS_VALUES[value].md!
  return store.resolvers?.light.entries.get('border-radius-md')?.raw.toString() ?? '6px'
}
</script>

<template>
  <div class="flex flex-col gap-8">
    <EditorInspectorGroup title="Corner radius">
      <div
        class="grid grid-cols-3 gap-2"
        role="radiogroup"
        aria-label="Corner radius scale"
      >
        <EditorOptionCard
          v-for="option in options"
          :key="option.value"
          name="radius"
          :value="option.value"
          :label="option.label"
          :selected="store.theme.design.radius === option.value"
          layout="stacked"
          @select="setRadius(option.value)"
        >
          <template #visual>
            <span
              v-if="option.value === 'custom' && !custom"
              class="grid size-9 place-items-center rounded-md border-2 border-dashed border-surface-400"
              aria-hidden="true"
            >
              <i class="pi pi-sliders-h text-sm text-surface-500" />
            </span>
            <span
              v-else
              class="size-9 border-2 border-surface-500 bg-surface-100 dark:bg-surface-800"
              :style="{ borderRadius: previewRadius(option.value) }"
              aria-hidden="true"
            />
          </template>
        </EditorOptionCard>
      </div>
      <p
        v-if="store.theme.design.radius === 'base'"
        class="text-xs text-surface-500 dark:text-surface-400"
      >
        Using {{ BASE_PRESET_LABELS[store.theme.basePreset] }}'s radius scale.
      </p>
    </EditorInspectorGroup>

    <EditorInspectorGroup
      v-if="custom"
      title="Custom radius"
      description="Drag to scale everything from the medium radius, then fine-tune each step."
    >
      <div class="flex flex-col gap-2">
        <label
          id="radius-base"
          class="flex justify-between text-xs font-medium"
        >Base (md) <span class="font-mono text-surface-500">{{ store.theme.design.customRadius.md }}px</span></label>
        <Slider
          :model-value="store.theme.design.customRadius.md"
          :min="0"
          :max="24"
          :step="1"
          aria-labelledby="radius-base"
          @update:model-value="v => setCustom(radiusScaleFrom(sliderValue(v)), 'radius.scale')"
        />
      </div>
      <ul class="flex flex-col divide-y divide-surface-200 dark:divide-surface-800">
        <li
          v-for="step in RADIUS_STEPS"
          :key="step"
          class="flex items-center gap-3 py-2"
        >
          <span
            class="size-8 shrink-0 border border-surface-400 bg-surface-100 dark:bg-surface-800"
            :style="{ borderRadius: `${store.theme.design.customRadius[step]}px` }"
            aria-hidden="true"
          />
          <span class="min-w-0 flex-1">
            <span class="block text-sm font-medium">{{ step }}</span>
            <span class="block truncate text-xs text-surface-500 dark:text-surface-400">{{ usedBy[step] }}</span>
          </span>
          <InputNumber
            :model-value="store.theme.design.customRadius[step]"
            :min="0"
            :max="MAX_RADIUS"
            suffix="px"
            show-buttons
            button-layout="horizontal"
            size="small"
            :aria-label="`${step} radius in pixels`"
            :input-class="'!w-16 text-center'"
            @update:model-value="v => setCustom({ [step]: v ?? 0 }, `radius.${step}`)"
          >
            <template #incrementbuttonicon>
              <i class="pi pi-plus text-xs" />
            </template>
            <template #decrementbuttonicon>
              <i class="pi pi-minus text-xs" />
            </template>
          </InputNumber>
        </li>
      </ul>
    </EditorInspectorGroup>

    <EditorInspectorGroup
      v-else
      title="Scale"
      description="Each step is shared by many components. Hover a step to see where it's used."
    >
      <dl class="grid grid-cols-5 gap-2 text-center text-xs">
        <div
          v-for="step in RADIUS_STEPS"
          :key="step"
          v-tooltip.bottom="usedBy[step]"
          class="flex flex-col items-center gap-1"
        >
          <span
            class="size-8 border border-surface-400 bg-surface-100 dark:bg-surface-800"
            :style="{ borderRadius: `${current[step]}px` }"
            aria-hidden="true"
          />
          <dt class="font-medium">
            {{ step }}
          </dt>
          <dd class="font-mono text-surface-500">
            {{ current[step] }}px
          </dd>
        </div>
      </dl>
      <Button
        label="Customize these values"
        icon="pi pi-sliders-h"
        severity="secondary"
        size="small"
        outlined
        class="self-start"
        @click="setRadius('custom')"
      />
    </EditorInspectorGroup>
  </div>
</template>
