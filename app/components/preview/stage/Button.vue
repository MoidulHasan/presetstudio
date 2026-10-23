<script setup lang="ts">
import { ACTIVE_CLASS, FOCUS_CLASS, HOVER_CLASS } from '~/composables/usePreviewForcedStyles'

// The Button stage: every variant in every state, light and dark side by side. States are
// forced with classes (copies of the :hover/:active/:focus-visible rules), so nothing needs
// hovering. Clicking a cell tells the editor what to edit ('root:danger:hover').
const emit = defineEmits<{ pick: [target: string] }>()

type Severity = 'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'help' | 'danger' | 'contrast' | 'plain'

const SEVERITIES: Severity[] = ['primary', 'secondary', 'success', 'info', 'warn', 'help', 'danger', 'contrast']
const STATES = [
  { key: 'default', label: 'Default', cls: '' },
  { key: 'hover', label: 'Hover', cls: HOVER_CLASS },
  { key: 'active', label: 'Pressed', cls: ACTIVE_CLASS },
  { key: 'focus', label: 'Focus', cls: FOCUS_CLASS },
] as const

const STYLES = [
  { key: 'root', label: 'Filled', severities: SEVERITIES, props: {} },
  { key: 'outlined', label: 'Outlined', severities: [...SEVERITIES, 'plain'] as Severity[], props: { outlined: true } },
  { key: 'text', label: 'Text', severities: [...SEVERITIES, 'plain'] as Severity[], props: { text: true } },
] as const

const label = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

// Button family: built from Button (static demos, nothing happens on click).
const SPLIT_ITEMS = [{ label: 'Update', icon: 'pi pi-refresh' }, { label: 'Delete', icon: 'pi pi-times' }]
const DIAL_ITEMS = [{ label: 'Add', icon: 'pi pi-pencil' }, { label: 'Update', icon: 'pi pi-refresh' }, { label: 'Delete', icon: 'pi pi-trash' }]

/** Button props for a severity ('primary' is the default, 'plain' a flag). */
function severityProps(severity: Severity) {
  if (severity === 'primary') return {}
  if (severity === 'plain') return { plain: true }
  return { severity }
}
</script>

<template>
  <PreviewStageSchemes intro="Every variant in every state. Click any button to edit it.">
    <div
      v-for="style in STYLES"
      :key="style.key"
      class="flex flex-col gap-3"
    >
      <h3 class="text-xs font-semibold uppercase tracking-wide text-muted-color">
        {{ style.label }}
      </h3>
      <!-- Room around each cell so hover shadows and focus rings never touch the next row. -->
      <div class="-m-2 overflow-x-auto p-2 grid grid-cols-[5.5rem_repeat(4,minmax(5.5rem,1fr))] items-center gap-x-3 gap-y-4">
        <span />
        <span
          v-for="state in STATES"
          :key="state.key"
          class="text-center text-[11px] text-muted-color"
        >{{ state.label }}</span>
        <template
          v-for="severity in style.severities"
          :key="severity"
        >
          <span class="truncate text-xs text-muted-color">{{ label(severity) }}</span>
          <div
            v-for="state in STATES"
            :key="state.key"
            :class="state.cls"
            class="flex cursor-pointer justify-center"
            :data-ps-pick="`${style.key}:${severity}:${state.key}`"
            @click="emit('pick', `${style.key}:${severity}:${state.key === 'focus' ? 'default' : state.key}`)"
          >
            <Button
              label="Button"
              v-bind="{ ...severityProps(severity), ...style.props }"
              tabindex="-1"
            />
          </div>
        </template>
      </div>
    </div>

    <div class="flex flex-col gap-3">
      <h3 class="text-xs font-semibold uppercase tracking-wide text-muted-color">
        Link
      </h3>
      <div class="-m-2 overflow-x-auto p-2 grid grid-cols-[5.5rem_repeat(4,minmax(5.5rem,1fr))] items-center gap-x-3">
        <span class="text-xs text-muted-color">Link</span>
        <div
          v-for="state in STATES"
          :key="state.key"
          :class="state.cls"
          class="flex cursor-pointer justify-center"
          @click="emit('pick', `link:link:${state.key === 'focus' ? 'default' : state.key}`)"
        >
          <Button
            label="Button"
            link
            tabindex="-1"
          />
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-4">
      <h3 class="text-xs font-semibold uppercase tracking-wide text-muted-color">
        Sizes and shapes
      </h3>
      <div
        class="flex cursor-pointer flex-wrap items-center gap-3"
        @click="emit('pick', 'size')"
      >
        <Button
          label="Small"
          size="small"
          tabindex="-1"
        />
        <Button
          label="Normal"
          tabindex="-1"
        />
        <Button
          label="Large"
          size="large"
          tabindex="-1"
        />
        <Button
          icon="pi pi-check"
          size="small"
          aria-label="Small icon button"
          tabindex="-1"
        />
        <Button
          icon="pi pi-check"
          aria-label="Icon button"
          tabindex="-1"
        />
        <Button
          icon="pi pi-check"
          size="large"
          aria-label="Large icon button"
          tabindex="-1"
        />
      </div>
      <div
        class="flex cursor-pointer flex-wrap items-center gap-3"
        @click="emit('pick', 'shape')"
      >
        <Button
          label="Rounded"
          rounded
          tabindex="-1"
        />
        <Button
          label="Raised"
          raised
          tabindex="-1"
        />
        <Button
          label="Badge"
          badge="8"
          outlined
          tabindex="-1"
        />
        <Button
          label="Icon"
          icon="pi pi-star"
          tabindex="-1"
        />
        <Button
          label="Loading"
          loading
          tabindex="-1"
        />
        <Button
          label="Disabled"
          disabled
          tabindex="-1"
        />
      </div>
    </div>

    <div class="flex flex-col gap-4">
      <h3 class="text-xs font-semibold uppercase tracking-wide text-muted-color">
        Button family
      </h3>
      <div
        class="flex cursor-pointer flex-wrap items-center gap-3"
        @click="emit('pick', 'family:buttongroup')"
      >
        <span class="w-24 text-xs text-muted-color">ButtonGroup</span>
        <ButtonGroup>
          <Button
            label="Save"
            icon="pi pi-check"
            tabindex="-1"
          />
          <Button
            label="Delete"
            icon="pi pi-trash"
            tabindex="-1"
          />
          <Button
            label="Cancel"
            icon="pi pi-times"
            tabindex="-1"
          />
        </ButtonGroup>
      </div>
      <div
        class="flex cursor-pointer flex-wrap items-center gap-3"
        @click="emit('pick', 'family:splitbutton')"
      >
        <span class="w-24 text-xs text-muted-color">SplitButton</span>
        <SplitButton
          label="Save"
          :model="SPLIT_ITEMS"
          tabindex="-1"
        />
        <SplitButton
          label="Save"
          :model="SPLIT_ITEMS"
          severity="secondary"
          outlined
          tabindex="-1"
        />
        <SplitButton
          label="Save"
          :model="SPLIT_ITEMS"
          rounded
          tabindex="-1"
        />
        <SplitButton
          label="Save"
          :model="SPLIT_ITEMS"
          raised
          tabindex="-1"
        />
      </div>
      <div
        class="flex cursor-pointer items-center gap-3"
        @click="emit('pick', 'family:speeddial')"
      >
        <span class="w-24 shrink-0 text-xs text-muted-color">SpeedDial</span>
        <!-- Shown open, so the gap between actions is visible. -->
        <div class="relative h-12 min-w-0 flex-1">
          <SpeedDial
            :model="DIAL_ITEMS"
            direction="right"
            :visible="true"
            :style="{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)' }"
          />
        </div>
      </div>
    </div>
  </PreviewStageSchemes>
</template>
