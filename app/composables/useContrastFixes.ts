import { usePresetStore } from '~/stores/preset'
import { contrastRatio, parseColor } from '~/utils/theme/color'
import { contrastFix, type ClassifiedContrast, type ContrastFix } from '~/utils/theme/contrast'
import type { ColorScheme } from '~/utils/theme/types'

export interface ContrastFixAction {
  /** What the fix does, for its tooltip. */
  hint: string
  /** Applies it; edits sharing `key` coalesce into one undo step. */
  apply: (key?: string) => boolean
}

/** Whether a check fails (introduced by the theme or inherited from the base preset). */
export const failingContrast = (r: ClassifiedContrast) => r.status === 'introduced' || r.status === 'inherited'

// Primary button text with no passing shade: whichever of these reads best on it.
const TEXT_CANDIDATES = ['#ffffff', '{surface.0}', '{surface.950}', '{surface.900}', '#000000']

/**
 * One-click fixes for failing contrast checks: the nearest passing shade of the token's own scale
 * (hover and pressed follow), or for primary button text with no passing shade, the most readable
 * text color. Every fix is an ordinary edit (undoable); one "Fix all" is one undo step.
 */
export function useContrastFixes() {
  const preset = usePresetStore()

  /** Where a token is set for a scheme: its scheme value, or the shared one scoped to the scheme. */
  function pathOf(token: string, scheme: ColorScheme): string[] | null {
    const found = preset.descriptors.filter(d => d.name === token && d.layer === 'semantic')
    const own = found.find(d => d.scheme === scheme)
    if (own) return own.path
    const shared = found.find(d => d.scheme === null)
    return shared ? ['semantic', 'colorScheme', scheme, ...shared.path.slice(1)] : null
  }

  function shadeFix(result: ClassifiedContrast, scheme: ColorScheme): ContrastFix | null {
    const resolver = preset.resolvers?.[scheme]
    return resolver && failingContrast(result) ? contrastFix(resolver, result.pair) : null
  }

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

  function fixFor(result: ClassifiedContrast, scheme: ColorScheme): ContrastFixAction | null {
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
    const text = result.pair.id === 'primary' && failingContrast(result) ? bestPrimaryText(scheme) : null
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
        if (current && failingContrast(current)) fixFor(current, scheme)?.apply(key)
      }
    }
  }

  const fixable = computed(() => (['light', 'dark'] as const).some(scheme => (preset.contrast?.[scheme] ?? []).some(r => fixFor(r, scheme))))

  return { fixFor, fixAll, fixable }
}
