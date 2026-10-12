<script setup lang="ts">
import { useEditorStore, type EditorSection } from '~/stores/editor'
import { contrastRatio, parseColor } from '~/utils/theme/color'
import type { ContrastResult } from '~/utils/theme/contrast'
import type { ColorScheme } from '~/utils/theme/types'

const store = useEditorStore()

const schemes: Array<{ value: ColorScheme, label: string }> = [
  { value: 'light', label: 'Light mode' },
  { value: 'dark', label: 'Dark mode' },
]

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
  const r = store.resolvers?.[scheme]
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
  store.update((d) => {
    const cs = (d.overrides.semantic ??= {}) as Record<string, unknown>
    const schemes = (cs.colorScheme ??= {}) as Record<string, Record<string, Record<string, string>>>
    const s = (schemes[scheme] ??= {})
    s.primary = { ...s.primary, contrastColor: value }
  })
}

function badge(result: ContrastResult) {
  if (result.pass === null) return { severity: 'secondary', value: 'n/a' }
  return result.pass ? { severity: 'success', value: 'Pass' } : { severity: 'danger', value: 'Fail' }
}
</script>

<template>
  <div class="flex flex-col gap-8">
    <p class="text-xs text-surface-500 dark:text-surface-400">
      Text needs 4.5:1 (WCAG 1.4.3). Borders and other UI parts need 3:1 (WCAG 1.4.11).
    </p>

    <EditorInspectorGroup
      v-for="scheme in schemes"
      :key="scheme.value"
      :title="scheme.label"
    >
      <ul class="flex flex-col divide-y divide-surface-200 rounded-lg border border-surface-200 dark:divide-surface-700 dark:border-surface-700">
        <li
          v-for="result in store.contrast?.[scheme.value] ?? []"
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
              {{ result.ratio === null ? 'can\'t evaluate' : `${result.ratio.toFixed(2)}:1` }}
              <span class="text-surface-400">/ {{ result.pair.minimum }}</span>
            </span>
          </span>
          <Button
            v-if="result.pass === false && result.pair.id === 'primary' && bestPrimaryText(scheme.value)"
            label="Fix"
            size="small"
            text
            @click="fixPrimaryText(scheme.value)"
          />
          <Button
            v-else-if="result.pass === false && fixSection[result.pair.id]"
            v-tooltip.left="'Adjust in another section'"
            icon="pi pi-arrow-right"
            size="small"
            text
            rounded
            :aria-label="`Adjust ${result.pair.label}`"
            @click="store.prefs.section = fixSection[result.pair.id]!"
          />
          <Tag
            :severity="badge(result).severity"
            :value="badge(result).value"
          />
        </li>
      </ul>
    </EditorInspectorGroup>
  </div>
</template>
