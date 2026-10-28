<script setup lang="ts">
import { useEditorStore } from '~/stores/editor'
import { useWorkspaceStore } from '~/stores/workspace'
import { usePresetStore } from '~/stores/preset'
import type { EditorSection } from '~/utils/editor-sections'
import { contrastRatio, parseColor } from '~/utils/theme/color'
import { contrastFix, type ClassifiedContrast, type ContrastFix, type ContrastStatus } from '~/utils/theme/contrast'
import { BASE_PRESET_LABELS, type ColorScheme } from '~/utils/theme/types'

// Every failing check counts, the base preset's own included: a theme that ships with
// unreadable button text isn't fine because the preset already had it. Each failure says what
// a fix does and applies it in one step (undoable); "Fix all" applies them all.
const editor = useEditorStore()
const workspace = useWorkspaceStore()
const preset = usePresetStore()
const baseLabel = computed(() => BASE_PRESET_LABELS[workspace.theme.basePreset])

// The previewed scheme first.
const schemes = computed<ColorScheme[]>(() => (editor.prefs.colorScheme === 'dark' ? ['dark', 'light'] : ['light', 'dark']))

const failing = (r: ClassifiedContrast) => r.status === 'introduced' || r.status === 'inherited'

const counts = computed(() => {
  const all = [...(preset.contrast?.light ?? []), ...(preset.contrast?.dark ?? [])]
  return {
    introduced: all.filter(r => r.status === 'introduced').length,
    inherited: all.filter(r => r.status === 'inherited').length,
  }
})
const failures = computed(() => counts.value.introduced + counts.value.inherited)

// --- Fixes ---------------------------------------------------------------------------------

/** Where a token is set for a scheme: its scheme value, or the shared one scoped to the scheme. */
function pathOf(token: string, scheme: ColorScheme): string[] | null {
  const found = preset.descriptors.filter(d => d.name === token && d.layer === 'semantic')
  const own = found.find(d => d.scheme === scheme)
  if (own) return own.path
  const shared = found.find(d => d.scheme === null)
  return shared ? ['semantic', 'colorScheme', scheme, ...shared.path.slice(1)] : null
}

/** The nearest shade of the token's own scale that passes (states follow), when there is one. */
function shadeFix(result: ClassifiedContrast, scheme: ColorScheme): ContrastFix | null {
  const resolver = preset.resolvers?.[scheme]
  return resolver && failing(result) ? contrastFix(resolver, result.pair) : null
}

// Primary button text with no passing shade: switch the text to whichever color reads best.
const TEXT_CANDIDATES = ['#ffffff', '{surface.0}', '{surface.950}', '{surface.900}', '#000000']
function bestPrimaryText(scheme: ColorScheme): string | null {
  const r = preset.resolvers?.[scheme]
  const bg = r && parseColor(r.resolve('primary-color')?.value ?? '')
  if (!r || !bg) return null
  let best: { value: string, ratio: number } | null = null
  for (const candidate of TEXT_CANDIDATES) {
    const fg = parseColor(r.resolveValue(candidate).value)
    if (!fg) continue
    const ratio = contrastRatio(fg, bg)
    if (!best || ratio > best.ratio) best = { value: candidate, ratio }
  }
  return best && best.ratio >= 4.5 ? best.value : null
}

// The edits of one "Fix all" share a coalesce key, so a single undo reverts them all.
interface Fix { hint: string, apply: (key?: string) => boolean }

function fixFor(result: ClassifiedContrast, scheme: ColorScheme): Fix | null {
  const shade = shadeFix(result, scheme)
  if (shade) {
    const follow = shade.edits.length > 1 ? '; hover and pressed follow' : ''
    return {
      hint: `Use ${shade.to} (${shade.ratio.toFixed(1)}:1)${follow}`,
      apply: (key) => {
        const edits = shade.edits.flatMap((e) => {
          const path = pathOf(e.token, scheme)
          return path ? [{ path, value: e.value }] : []
        })
        if (edits.length !== shade.edits.length) return false
        preset.setTokens(edits, key)
        return true
      },
    }
  }
  const text = result.pair.id === 'primary' && failing(result) ? bestPrimaryText(scheme) : null
  if (text) {
    return {
      hint: 'Use the most readable text color on it',
      apply: (key) => {
        const path = pathOf('primary-contrast-color', scheme)
        if (!path) return false
        preset.setTokens([{ path, value: text }], key)
        return true
      },
    }
  }
  return null
}

/** Applies every available fix, light and dark (each reads the theme as the last one left it). */
function fixAll() {
  const key = `contrast-fix-all:${Date.now()}`
  for (const scheme of ['light', 'dark'] as const) {
    for (const result of preset.contrast?.[scheme] ?? []) {
      const current = preset.contrast?.[scheme]?.find(r => r.pair.id === result.pair.id)
      if (current && failing(current)) fixFor(current, scheme)?.apply(key)
    }
  }
}
const fixable = computed(() => schemes.value.some(scheme => (preset.contrast?.[scheme] ?? []).some(r => fixFor(r, scheme))))

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
