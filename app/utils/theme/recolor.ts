import { generatePalette } from './palette'
import type { TokenDescriptor } from './schema'
import { referenceName, type TokenResolver } from './tokens'
import { deletePath, setPath } from './tree'
import { SHADES, type ColorScheme, type TokenTree } from './types'

// Recoloring a group of tokens (e.g. every Button "info" token) with another palette while
// keeping the shade each token uses: `{sky.600}` → `{rose.600}`, `{primary.hover.color}` (which
// is primary.600 in light, primary.300 in dark) → `{rose.600}` / `{rose.300}`. Each preset's own
// light/dark shade choices stay intact, so hover, pressed, border and text stay balanced.

const REF_RE = /\{([^{}]+)\}/g
const SHADE_SET = new Set<string>(SHADES)

/** Palette name and shade a token name ends in, e.g. 'status-info-600' → ['status-info', '600']. */
function paletteShade(name: string): [string, string] | null {
  const at = name.lastIndexOf('-')
  if (at < 0) return null
  const shade = name.slice(at + 1)
  return SHADE_SET.has(shade) ? [name.slice(0, at), shade] : null
}

/** The shade a reference ends up at, following aliases like {primary.hover.color} → primary-600. */
export function shadeOf(ref: string, resolver: TokenResolver): string | null {
  const name = referenceName(ref)
  const direct = paletteShade(name)
  if (direct) return direct[1]
  for (const step of resolver.resolve(name)?.chain ?? []) {
    const match = paletteShade(step)
    if (match) return match[1]
  }
  return null
}

/**
 * The value with every palette reference moved to `palette` (same shade). Literal colors
 * (white button text) stay. Returns null when nothing changes.
 */
export function recolorValue(raw: string, resolver: TokenResolver, palette: string): string | null {
  let changed = false
  const next = raw.replace(REF_RE, (match, ref: string) => {
    const shade = shadeOf(ref, resolver)
    if (!shade) return match
    changed = true
    return `{${palette}.${shade}}`
  })
  return changed ? next : null
}

/** Where generated palettes for custom colors live, e.g. primitive.ps.button.info.500. */
export function customPalettePath(component: string, group: string): string[] {
  return ['primitive', 'ps', component, group]
}

export function customPaletteRef(component: string, group: string): string {
  return ['ps', component, group].join('.')
}

export type PaletteChoice = { kind: 'palette', name: string } | { kind: 'custom', color: string }

/**
 * Overrides that recolor `tokens` (descriptors of both schemes) with `choice`. Applied on top of
 * `overrides`; previous recolor overrides of these tokens are replaced.
 */
export function recolorOverrides(
  overrides: TokenTree,
  tokens: TokenDescriptor[],
  resolvers: Record<ColorScheme, TokenResolver>,
  component: string,
  group: string,
  choice: PaletteChoice,
): TokenTree {
  let out = deletePath(overrides, customPalettePath(component, group))
  const palette = choice.kind === 'palette' ? choice.name : customPaletteRef(component, group)
  if (choice.kind === 'custom') out = setPath(out, customPalettePath(component, group), { ...generatePalette(choice.color, 'oklch') })
  for (const token of tokens) {
    const resolver = resolvers[token.scheme ?? 'light']
    // Recolor from the preset's value, not from an earlier recolor's reference.
    const next = recolorValue(String(token.defaultValue), resolver, palette)
    if (next !== null) out = setPath(out, token.path, next)
  }
  return out
}

/** Removes the overrides of `tokens` and the group's custom palette (back to the preset). */
export function clearRecolor(overrides: TokenTree, tokens: TokenDescriptor[], component: string, group: string): TokenTree {
  let out = deletePath(overrides, customPalettePath(component, group))
  for (const token of tokens) out = deletePath(out, token.path)
  return out
}

/** A theme state's overrides without one component's edits (for comparing with the preset). */
export function withoutComponent(overrides: TokenTree, component: string): TokenTree {
  return deletePath(deletePath(overrides, ['components', component]), ['primitive', 'ps', component])
}
