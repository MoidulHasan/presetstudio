<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import { useWorkspaceStore } from '~/stores/workspace'
import { usePresetStore } from '~/stores/preset'
import type { EditorSection } from '~/utils/editor-sections'
import type { ContrastStatus } from '~/utils/theme/contrast'
import { BASE_PRESET_LABELS, type ColorScheme } from '~/utils/theme/types'

// Every failing check counts, the base preset's own included: a theme that ships with
// unreadable button text isn't fine because the preset already had it. Each failure says what
// a fix does and applies it in one step (undoable); "Fix all" applies them all.
const editor = useEditorStore()
const workspace = useWorkspaceStore()
const preset = usePresetStore()
const { fixFor, fixAll, fixable } = useContrastFixes()
const failing = failingContrast
const baseLabel = computed(() => BASE_PRESET_LABELS[workspace.theme.basePreset])

// The previewed scheme first.
const schemes = computed<ColorScheme[]>(() => (editor.prefs.colorScheme === 'dark' ? ['dark', 'light'] : ['light', 'dark']))

const counts = computed(() => {
  const all = [...(preset.contrast?.light ?? []), ...(preset.contrast?.dark ?? [])]
  return {
    introduced: all.filter(r => r.status === 'introduced').length,
    inherited: all.filter(r => r.status === 'inherited').length,
  }
})
const failures = computed(() => counts.value.introduced + counts.value.inherited)

// Failures nothing here fixes: where to adjust them by hand.
const fixSection: Record<string, EditorSection> = {
  'text': 'surface',
  'muted': 'surface',
  'field': 'surface',
  'placeholder': 'surface',
  'field-border': 'surface',
  'highlight': 'primary',
  'primary-ui': 'primary',
}

const STATUS: Record<ContrastStatus, { severity: string, value: string, tooltip?: string }> = {
  pass: { severity: 'success', value: 'Pass' },
  introduced: { severity: 'danger', value: 'Fails' },
  inherited: { severity: 'warn', value: 'Fails', tooltip: 'The base preset fails this too.' },
  advisory: { severity: 'secondary', value: 'Advisory', tooltip: 'Only required when the border alone identifies the input.' },
  unknown: { severity: 'secondary', value: 'n/a', tooltip: 'This value can\'t be evaluated statically.' },
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex items-start gap-3">
      <i
        :class="failures ? 'pi pi-exclamation-circle text-red-600 dark:text-red-400' : 'pi pi-check-circle text-green-600 dark:text-green-400'"
        class="mt-0.5 text-lg"
        aria-hidden="true"
      />
      <div class="min-w-0 flex-1">
        <p class="font-medium">
          {{ failures ? `${failures} check${failures === 1 ? '' : 's'} fail` : 'All checks pass' }}
        </p>
        <p
          v-if="failures"
          class="text-sm text-surface-600 dark:text-surface-300"
        >
          <template v-if="counts.introduced">
            {{ counts.introduced }} from your changes<template v-if="counts.inherited">
              ,
            </template>
          </template>
          <template v-if="counts.inherited">
            {{ counts.inherited }} from {{ baseLabel }} itself
          </template>
        </p>
      </div>
      <Button
        v-if="fixable"
        label="Fix all"
        icon="pi pi-wrench"
        size="small"
        @click="fixAll"
      />
    </div>

    <EditorInspectorGroup
      v-for="scheme in schemes"
      :key="scheme"
      :title="scheme === 'light' ? 'Light mode' : 'Dark mode'"
      description="Text needs 4.5:1 (WCAG 1.4.3); other parts of the UI need 3:1 (WCAG 1.4.11)."
    >
      <ul class="-mx-2 flex flex-col">
        <li
          v-for="result in preset.contrast?.[scheme] ?? []"
          :key="result.pair.id"
          class="flex items-center gap-3 rounded-lg px-2 py-1.5"
        >
          <span
            class="grid size-8 shrink-0 place-items-center rounded-md border border-surface-200 text-sm font-semibold dark:border-surface-700"
            :style="{ backgroundColor: result.background ?? undefined, color: result.foreground ?? undefined }"
            aria-hidden="true"
          >Aa</span>
          <span class="flex min-w-0 flex-1 flex-col">
            <span class="truncate text-sm">{{ result.pair.label }}</span>
            <span class="text-xs text-surface-500 dark:text-surface-400">
              {{ result.ratio === null ? '–' : `${result.ratio.toFixed(1)}:1` }}, needs {{ result.pair.minimum }}
            </span>
          </span>
          <Button
            v-if="fixFor(result, scheme)"
            v-tooltip.left="fixFor(result, scheme)!.hint"
            label="Fix"
            size="small"
            text
            :aria-label="`Fix ${result.pair.label}: ${fixFor(result, scheme)!.hint}`"
            @click="fixFor(result, scheme)!.apply()"
          />
          <Button
            v-else-if="failing(result) && fixSection[result.pair.id]"
            v-tooltip.left="'Adjust it in its section'"
            icon="pi pi-arrow-right"
            size="small"
            text
            rounded
            :aria-label="`Adjust ${result.pair.label}`"
            @click="editor.openSection(fixSection[result.pair.id]!)"
          />
          <Tag
            v-tooltip.left="STATUS[result.status].tooltip"
            :severity="STATUS[result.status].severity"
            :value="STATUS[result.status].value"
          />
        </li>
      </ul>
    </EditorInspectorGroup>
  </div>
</template>
