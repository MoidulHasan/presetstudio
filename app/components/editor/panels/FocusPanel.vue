<script setup lang="ts">
import { useWorkspaceStore } from '~/stores/workspace'
import { usePresetStore } from '~/stores/preset'
import { normalizeHex } from '~/utils/theme/palette'
import { BASE_PRESET_LABELS, type FocusRingDesign } from '~/utils/theme/types'

const workspace = useWorkspaceStore()
const preset = usePresetStore()
const focus = computed(() => workspace.theme.design.focusRing)
const outline = computed(() => (focus.value.kind === 'outline' ? focus.value : null))
const baseLabel = computed(() => BASE_PRESET_LABELS[workspace.theme.basePreset])

function setFocus(value: FocusRingDesign, key: string | null = null) {
  workspace.update((d) => {
    d.design.focusRing = value
  }, key)
}

function setMode(kind: FocusRingDesign['kind']) {
  if (kind === focus.value.kind) return
  setFocus(kind === 'base' ? { kind: 'base' } : { kind: 'outline', width: 2, offset: 2, color: 'primary' })
}

function patch(change: Partial<Extract<FocusRingDesign, { kind: 'outline' }>>, key: string) {
  if (outline.value) setFocus({ ...outline.value, ...change }, key)
}

const sliderValue = (v: number | number[]) => (Array.isArray(v) ? v[0]! : v)

const customColor = computed({
  get: () => (outline.value && outline.value.color !== 'primary' ? outline.value.color.slice(1) : '000000'),
  set: (value: string) => {
    const hex = normalizeHex(value)
    if (hex) patch({ color: hex }, 'focus.color')
  },
})

/** Describes how the base preset draws focus, from its own (unedited) tokens. */
const baseResolver = computed(() => preset.baseResolvers?.light ?? null)
const baseDescription = computed(() => {
  const r = baseResolver.value
  if (!r) return ''
  const width = r.resolve('focus-ring-width')?.value
  const shadow = r.resolve('focus-ring-shadow')?.value
  if (width && width !== '0' && width !== '0px') return `${baseLabel.value} draws a ${width} outline with a ${r.resolve('focus-ring-offset')?.value} offset.`
  if (shadow && shadow !== 'none') return `${baseLabel.value} draws focus as a soft box-shadow ring.`
  return `${baseLabel.value} has no global focus ring; components style focus themselves.`
})

// The base preset's own focus ring is named after it, like every "unchanged" choice.
const { baseDefault } = useBaseDefault()
</script>

<template>
  <div class="flex flex-col gap-6">
    <EditorInspectorGroup
      title="Style"
      :description="baseDescription"
    >
      <SelectButton
        :model-value="focus.kind"
        :options="[{ value: 'base', label: baseDefault }, { value: 'outline', label: 'Custom outline' }]"
        option-label="label"
        option-value="value"
        :allow-empty="false"
        aria-label="Focus ring style"
        class="w-full"
        :pt="{ pcToggleButton: { root: { class: 'flex-1' } } }"
        @update:model-value="setMode"
      />
    </EditorInspectorGroup>

    <template v-if="outline">
      <EditorInspectorGroup title="Outline">
        <div class="flex flex-col gap-2">
          <label
            id="focus-width"
            class="flex justify-between text-xs font-medium"
          >Width <span class="font-mono text-surface-500">{{ outline.width }}px</span></label>
          <Slider
            :model-value="outline.width"
            :min="0"
            :max="4"
            :step="1"
            aria-labelledby="focus-width"
            @update:model-value="v => patch({ width: sliderValue(v) }, 'focus.width')"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label
            id="focus-offset"
            class="flex justify-between text-xs font-medium"
          >Offset <span class="font-mono text-surface-500">{{ outline.offset }}px</span></label>
          <Slider
            :model-value="outline.offset"
            :min="-2"
            :max="6"
            :step="1"
            aria-labelledby="focus-offset"
            @update:model-value="v => patch({ offset: sliderValue(v) }, 'focus.offset')"
          />
        </div>
        <Message
          v-if="outline.width === 0"
          severity="warn"
          size="small"
          variant="simple"
        >
          With no focus ring, keyboard users can't see where they are (WCAG 2.4.7).
        </Message>
      </EditorInspectorGroup>

      <EditorInspectorGroup title="Color">
        <SelectButton
          :model-value="outline.color === 'primary' ? 'primary' : 'custom'"
          :options="[{ value: 'primary', label: 'Primary' }, { value: 'custom', label: 'Custom' }]"
          option-label="label"
          option-value="value"
          :allow-empty="false"
          aria-label="Focus ring color"
          class="w-full"
          :pt="{ pcToggleButton: { root: { class: 'flex-1' } } }"
          @update:model-value="v => patch({ color: v === 'primary' ? 'primary' : '#000000' }, 'focus.mode')"
        />
        <div
          v-if="outline.color !== 'primary'"
          class="flex items-center gap-2"
        >
          <ColorPicker
            v-model="customColor"
            aria-label="Focus ring color"
          />
          <span class="font-mono text-sm">{{ outline.color }}</span>
        </div>
      </EditorInspectorGroup>
    </template>
  </div>
</template>
