<script setup lang="ts">
import { ACTIVE_CLASS, FOCUS_CLASS, HOVER_CLASS, SCHEME_CLASS } from '~/composables/usePreviewForcedStyles'

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

const SCHEMES = [
  { key: 'light', label: 'Light', icon: 'pi pi-sun', cls: SCHEME_CLASS },
  { key: 'dark', label: 'Dark', icon: 'pi pi-moon', cls: `${SCHEME_CLASS} ps-dark` },
] as const

const label = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Button props for a severity ('primary' is the default, 'plain' a flag). */
function severityProps(severity: Severity) {
  if (severity === 'primary') return {}
  if (severity === 'plain') return { plain: true }
  return { severity }
}
</script>

<template>
  <div class="mx-auto flex max-w-7xl flex-col gap-4">
    <p class="text-xs text-muted-color">
      Every variant in every state. Click any button to edit it.
    </p>
    <div class="grid gap-4 xl:grid-cols-2">
      <section
        v-for="scheme in SCHEMES"
        :key="scheme.key"
        :class="scheme.cls"
        class="flex min-w-0 flex-col gap-8 rounded-xl border border-surface bg-surface-0 p-5 text-color dark:bg-surface-900"
        :aria-label="`${scheme.label} mode`"
      >
        <h2 class="flex items-center gap-2 text-sm font-semibold">
          <i
            :class="scheme.icon"
            aria-hidden="true"
          />
          {{ scheme.label }}
        </h2>

        <div
          v-for="style in STYLES"
          :key="style.key"
          class="flex flex-col gap-3"
        >
          <h3 class="text-xs font-semibold uppercase tracking-wide text-muted-color">
            {{ style.label }}
          </h3>
          <!-- Room around each cell so hover shadows and focus rings never touch the next row. -->
          <div class="grid grid-cols-[5.5rem_repeat(4,minmax(0,1fr))] items-center gap-x-3 gap-y-4">
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
          <div class="grid grid-cols-[5.5rem_repeat(4,minmax(0,1fr))] items-center gap-x-3">
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
      </section>
    </div>
  </div>
</template>
