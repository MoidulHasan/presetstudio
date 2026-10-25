import { buildEffectivePreset } from './build'
import { createResolver } from './tokens'
import type { ColorScheme, ThemeState, TokenTree } from './types'
import { sanitizeTokenValue } from './values'

/**
 * A theme as CSS custom properties for one element: every semantic token and the tokens of
 * `components`, resolved to plain values. Set on a wrapper, they restyle the PrimeVue
 * components inside it without touching the rest of the page (a variable that refers to another
 * is resolved where it's declared, so each one is written out, not just the primary scale).
 */
export function specimenVars(state: Pick<ThemeState, 'design' | 'overrides'>, base: TokenTree, components: readonly string[], scheme: ColorScheme = 'light'): Record<string, string> {
  const resolver = createResolver(buildEffectivePreset(state, base), scheme)
  const wanted = new Set(components)
  const vars: Record<string, string> = {}
  for (const [name, entry] of resolver.entries) {
    const [layer, component] = entry.path
    if (layer !== 'semantic' && !(layer === 'components' && component && wanted.has(component))) continue
    const value = resolver.resolve(name)?.value
    const safe = value === undefined ? null : sanitizeTokenValue(value)
    if (safe !== null) vars[`--p-${name}`] = String(safe)
  }
  return vars
}
