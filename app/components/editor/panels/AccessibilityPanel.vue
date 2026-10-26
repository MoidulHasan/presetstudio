<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import { useWorkspaceStore } from '~/stores/workspace'
import { usePresetStore } from '~/stores/preset'
import type { EditorSection } from '~/utils/editor-sections'
import { contrastRatio, parseColor } from '~/utils/theme/color'
import type { ClassifiedContrast, ContrastStatus } from '~/utils/theme/contrast'
import { BASE_PRESET_LABELS, type ColorScheme } from '~/utils/theme/types'

const editor = useEditorStore()
const workspace = useWorkspaceStore()
const preset = usePresetStore()
const baseLabel = computed(() => BASE_PRESET_LABELS[workspace.theme.basePreset])

// The previewed scheme first.
const schemes = computed<ColorScheme[]>(() => (editor.prefs.colorScheme === 'dark' ? ['dark', 'light'] : ['light', 'dark']))

// Where to go to fix each pair.
const fixSection: Record<string, EditorSection> = {
  'text': 'surface',
  'muted': 'surface',
  'field': 'surface',
  'placeholder': 'surface',
  'field-border': 'surface',
  'highlight': 'primary',
  'primary-ui': 'primary',
}

const CONTRAST_CANDIDATES = ['#ffffff', '{surface.0}', '{surface.950}', '{surface.900}', '#000000']

/** Best contrast color for text on the primary color, if one passes. */
function bestPrimaryText(scheme: ColorScheme): string | null {
  const r = preset.resolvers?.[scheme]
  const bg = r && parseColor(r.resolve('primary-color')?.value ?? '')
  if (!r || !bg) return null
  let best: { value: string, ratio: number } | null = null
  for (const candidate of CONTRAST_CANDIDATES) {
    const fg = parseColor(r.resolveValue(candidate).value)
    if (!fg) continue
    const ratio = contrastRatio(fg, bg)
    if (!best || ratio > best.ratio) best = { value: candidate, ratio }
  }
  return best && best.ratio >= 4.5 ? best.value : null
}

function fixPrimaryText(scheme: ColorScheme) {
  const value = bestPrimaryText(scheme)
  if (!value) return
  workspace.update((d) => {
    const semantic = (d.overrides.semantic ??= {}) as Record<string, unknown>
    const schemesTree = (semantic.colorScheme ??= {}) as Record<string, Record<string, Record<string, string>>>
    const s = (schemesTree[scheme] ??= {})
    s.primary = { ...s.primary, contrastColor: value }
  })
}

const STATUS: Record<ContrastStatus, { severity: string, value: string, tooltip?: string }> = {
  pass: { severity: 'success', value: 'Pass' },
  introduced: { severity: 'danger', value: 'Fail' },
  inherited: { severity: 'secondary', value: 'Preset', tooltip: 'The base preset fails this too. Your theme didn\'t make it worse.' },
  advisory: { severity: 'warn', value: 'Advisory', tooltip: 'Only required when the border alone identifies the input.' },
  unknown: { severity: 'secondary', value: 'n/a', tooltip: 'This value can\'t be evaluated statically.' },
}

const counts = computed(() => {
  const all = [...(preset.contrast?.light ?? []), ...(preset.contrast?.dark ?? [])]
  return {
    introduced: all.filter(r => r.status === 'introduced').length,
    inherited: all.filter(r => r.status === 'inherited').length,
  }
})

const canFix = (result: ClassifiedContrast, scheme: ColorScheme) =>
  result.pair.id === 'primary' && (result.status === 'introduced' || result.status === 'inherited') && !!bestPrimaryText(scheme)
</script>

<template>
  <div class="flex flex-col gap-6">
    <div
      class="flex flex-col gap-1 rounded-lg p-3 text-sm"
      :class="counts.introduced ? 'bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100' : 'bg-surface-50 dark:bg-surface-800'"
    >
      <p class="font-medium">
        <template v-if="counts.introduced">
          {{ counts.introduced }} contrast issue{{ counts.introduced === 1 ? '' : 's' }} introduced by your changes
        </template>
        <template v-else>
          No new contrast issues
        </template>
      </p>
      <p
        v-if="counts.inherited"
        class="text-xs opacity-80"
      >
        {{ counts.inherited }} check{{ counts.inherited === 1 ? '' : 's' }} also fail in stock {{ baseLabel }}. You can still fix them.
      </p>
      <p class="text-xs opacity-80">
        Text needs 4.5:1 (WCAG 1.4.3). Other UI parts need 3:1 (WCAG 1.4.11).
      </p>
    </div>

    <EditorInspectorGroup
      v-for="scheme in schemes"
      :key="scheme"
      :title="scheme === 'light' ? 'Light mode' : 'Dark mode'"
    >
      <ul class="flex flex-col divide-y divide-surface-200 rounded-lg border border-surface-200 dark:divide-surface-700 dark:border-surface-700">
        <li
          v-for="result in preset.contrast?.[scheme] ?? []"
          :key="result.pair.id"
          class="flex items-center gap-3 p-2"
        >
          <span
            class="grid size-9 shrink-0 place-items-center rounded-md border border-surface-200 text-sm font-semibold dark:border-surface-700"
            :style="{ backgroundColor: result.background ?? undefined, color: result.foreground ?? undefined }"
            aria-hidden="true"
          >Aa</span>
          <span class="flex min-w-0 flex-1 flex-col">
            <span class="truncate text-sm">{{ result.pair.label }}</span>
            <span class="font-mono text-xs text-surface-500">
              {{ result.ratio === null ? '–' : `${result.ratio.toFixed(2)}:1` }}
              <span class="text-surface-400">/ {{ result.pair.minimum }}</span>
              <span
                v-if="result.baselineRatio !== null && result.ratio !== null && Math.abs(result.ratio - result.baselineRatio) >= 0.05"
                class="text-surface-400"
              >· was {{ result.baselineRatio.toFixed(2) }}</span>
            </span>
          </span>
          <Button
            v-if="canFix(result, scheme)"
            v-tooltip.left="'Use the best-contrast text color'"
            label="Fix"
            size="small"
            text
            @click="fixPrimaryText(scheme)"
          />
          <Button
            v-else-if="result.status === 'introduced' && fixSection[result.pair.id]"
            v-tooltip.left="'Adjust in another section'"
            icon="pi pi-arrow-right"
            size="small"
            text
            rounded
            :aria-label="`Adjust ${result.pair.label}`"
            @click="editor.prefs.section = fixSection[result.pair.id]!"
          />
          <Tag
            v-tooltip.left="STATUS[result.status].tooltip"
            :severity="STATUS[result.status].severity"
            :value="result.status === 'inherited' ? `From ${baseLabel}` : STATUS[result.status].value"
          />
        </li>
      </ul>
    </EditorInspectorGroup>
  </div>
</template>
