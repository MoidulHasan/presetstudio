<script setup lang="ts">
import { FOCUS_CLASS, HOVER_CLASS } from '~/composables/usePreviewForcedStyles'

// Form field stage: inputs in every state the form field tokens cover, forced visible.
const emit = defineEmits<{ pick: [target: string] }>()

const STATES = [
  { key: 'default', label: 'Default', cls: '', props: {} },
  { key: 'hover', label: 'Hover', cls: HOVER_CLASS, props: {} },
  { key: 'focus', label: 'Focus', cls: FOCUS_CLASS, props: {} },
  { key: 'invalid', label: 'Invalid', cls: '', props: { invalid: true } },
  { key: 'disabled', label: 'Disabled', cls: '', props: { disabled: true } },
] as const

const CITIES = [{ name: 'Amsterdam' }, { name: 'Berlin' }]

const FLOAT_SAMPLES = [
  { key: 'empty', cls: '', value: undefined, invalid: false, pick: 'cell:floatlabel:default' },
  { key: 'focused', cls: FOCUS_CLASS, value: undefined, invalid: false, pick: 'cell:floatlabel:focus' },
  { key: 'floated', cls: '', value: 'ada@example.com', invalid: false, pick: 'cell:floated:default' },
  { key: 'invalid', cls: '', value: undefined, invalid: true, pick: 'cell:floatlabel:invalid' },
]
// Select marks focus with a class (not :focus), so the focus cell gets it directly.
const selectPt = (state: string) => (state === 'focus' ? { root: { class: 'p-focus' } } : undefined)
const borderPick = (state: string) => (state === 'disabled' ? 'cell:background:disabled' : state === 'default' ? 'cell:border:default' : `cell:border:${state}`)
</script>

<template>
  <PreviewStageSchemes
    intro="Every form field state at once. Click any field to edit that exact color."
    stacked
  >
    <template #default>
      <div class="grid grid-cols-[5.5rem_repeat(5,minmax(0,1fr))] items-center gap-x-3 gap-y-4">
        <span />
        <span
          v-for="state in STATES"
          :key="state.key"
          class="text-center text-[11px] text-muted-color"
        >{{ state.label }}</span>

        <span class="text-xs text-muted-color">Input</span>
        <div
          v-for="state in STATES"
          :key="state.key"
          :class="state.cls"
          class="min-w-0 cursor-pointer"
          @click="emit('pick', borderPick(state.key))"
        >
          <InputText
            placeholder="Name"
            fluid
            tabindex="-1"
            v-bind="state.props"
          />
        </div>

        <span class="text-xs text-muted-color">With value</span>
        <div
          v-for="state in STATES"
          :key="state.key"
          :class="state.cls"
          class="min-w-0 cursor-pointer"
          @click="emit('pick', state.key === 'disabled' ? 'cell:text:disabled' : 'cell:text:default')"
        >
          <InputText
            model-value="Ada Lovelace"
            fluid
            tabindex="-1"
            v-bind="state.props"
          />
        </div>

        <span class="text-xs text-muted-color">Select</span>
        <div
          v-for="state in STATES"
          :key="state.key"
          :class="state.cls"
          class="min-w-0 cursor-pointer"
          @click="emit('pick', borderPick(state.key))"
        >
          <Select
            :options="CITIES"
            option-label="name"
            placeholder="City"
            fluid
            :pt="selectPt(state.key)"
            v-bind="state.props"
          />
        </div>

        <span class="text-xs text-muted-color">Filled style</span>
        <div
          v-for="state in STATES"
          :key="state.key"
          :class="state.cls"
          class="min-w-0 cursor-pointer"
          @click="emit('pick', ['hover', 'focus'].includes(state.key) ? `cell:filled:${state.key}` : state.key === 'disabled' ? 'cell:background:disabled' : state.key === 'invalid' ? 'cell:border:invalid' : 'cell:filled:default')"
        >
          <InputText
            placeholder="Name"
            variant="filled"
            fluid
            tabindex="-1"
            v-bind="state.props"
          />
        </div>

        <span class="text-xs text-muted-color">With icon</span>
        <div
          v-for="state in STATES"
          :key="state.key"
          :class="state.cls"
          class="min-w-0 cursor-pointer"
          @click="emit('pick', state.key === 'invalid' ? 'cell:placeholder:invalid' : 'cell:icon:default')"
        >
          <IconField>
            <InputIcon class="pi pi-search" />
            <InputText
              placeholder="Search"
              fluid
              tabindex="-1"
              v-bind="state.props"
            />
          </IconField>
        </div>
      </div>

      <div class="grid grid-cols-[5.5rem_repeat(4,minmax(0,1fr))] items-end gap-x-3 gap-y-2">
        <span />
        <span
          v-for="label in ['Empty', 'Focused', 'Floated', 'Invalid']"
          :key="label"
          class="text-center text-[11px] text-muted-color"
        >{{ label }}</span>
        <span class="self-center text-xs text-muted-color">Float label</span>
        <div
          v-for="sample in FLOAT_SAMPLES"
          :key="sample.key"
          :class="sample.cls"
          class="min-w-0 cursor-pointer pt-2"
          @click="emit('pick', sample.pick)"
        >
          <FloatLabel variant="on">
            <InputText
              :id="`fl-${sample.key}`"
              :model-value="sample.value"
              :invalid="sample.invalid"
              fluid
              tabindex="-1"
            />
            <label :for="`fl-${sample.key}`">Email</label>
          </FloatLabel>
        </div>
      </div>

      <div
        class="flex cursor-pointer flex-wrap items-center gap-3"
        @click="emit('pick', 'section:size')"
      >
        <span class="w-[5.5rem] text-xs text-muted-color">Sizes</span>
        <InputText
          placeholder="Small"
          size="small"
          tabindex="-1"
        />
        <InputText
          placeholder="Normal"
          tabindex="-1"
        />
        <InputText
          placeholder="Large"
          size="large"
          tabindex="-1"
        />
      </div>
    </template>
  </PreviewStageSchemes>
</template>
