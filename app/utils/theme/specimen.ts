import { buildEffectivePreset } from './build'
import { createResolver, type TokenResolver } from './tokens'
import type { ColorScheme, ThemeState, TokenTree } from './types'
import { sanitizeTokenValue } from './values'

/** A theme's tokens for one color scheme. */
export function themeResolver(state: Pick<ThemeState, 'design' | 'overrides'>, base: TokenTree, scheme: ColorScheme = 'light'): TokenResolver {
  return createResolver(buildEffectivePreset(state, base), scheme)
}

/**
 * A theme as CSS custom properties for one element: every semantic token and the tokens of
 * `components`, resolved to plain values. Set on a wrapper, they restyle the PrimeVue
 * components inside it without touching the rest of the page (a variable that refers to another
 * is resolved where it's declared, so each one is written out, not just the primary scale).
 */
export function specimenVars(resolver: TokenResolver, components: readonly string[]): Record<string, string> {
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

export type ChainLayer = 'palette' | 'semantic' | 'component'

export interface ChainStep {
  /** CSS variable name without prefix ('button-primary-background'). */
  name: string
  /** As a preset refers to it ('button.primary.background', 'primary.500'). */
  reference: string
  layer: ChainLayer
  value: string
}

// Color scales: 'primary.500', 'surface.200', 'slate.200' (the shades a theme's colors come from).
const SCALE_RE = /^[a-z]+\.(?:0|50|[1-9]00|950)$/

/**
 * How a token gets its value, from the palette shade it starts at to the token itself: e.g.
 * primary.500 → primary.color → button.primary.background. Null for unknown tokens.
 */
export function referenceChain(resolver: TokenResolver, name: string): ChainStep[] | null {
  const resolved = resolver.resolve(name)
  if (!resolved) return null
  const steps = resolved.chain.map((step): ChainStep | null => {
    const entry = resolver.entries.get(step)
    if (!entry) return null
    const [layer, ...rest] = entry.path
    const local = (rest[0] === 'colorScheme' ? rest.slice(2) : rest).filter(key => key !== 'root' && key !== 'colorScheme' && key !== resolver.scheme)
    const reference = local.join('.')
    return {
      name: step,
      reference,
      layer: layer === 'components' ? 'component' : layer === 'primitive' || SCALE_RE.test(reference) ? 'palette' : 'semantic',
      value: resolver.resolve(step)?.value ?? '',
    }
  })
  return steps.every(Boolean) ? (steps as ChainStep[]).reverse() : null
}
