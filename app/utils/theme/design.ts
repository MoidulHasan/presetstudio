import { mergeOverrides } from './merge'
import { parseColor, rgbToOklch } from './color'
import { generateNeutralPalette, generatePalette } from './palette'
import { createResolver } from './tokens'
import { getPath, setPath } from './tree'
import {
  SHADES,
  type ColorPalette,
  type Density,
  type DesignSettings,
  type FocusRingDesign,
  type PrimaryDesign,
  type RadiusScale,
  type SurfaceDesign,
  type TokenTree,
} from './types'

const refPalette = (name: string): ColorPalette =>
  Object.fromEntries(SHADES.map(s => [s, `{${name}.${s}}`])) as ColorPalette

/** The 50–950 primary scale for a design, or null to keep the base preset's. */
export function primaryPalette(primary: PrimaryDesign): ColorPalette | null {
  switch (primary.kind) {
    case 'base':
      return null
    case 'palette':
      return refPalette(primary.name)
    case 'custom':
      return { ...generatePalette(primary.color, primary.algorithm), ...primary.shades }
  }
}

const FALLBACK_HUE = 250

/** Hue of the effective primary-500 (custom, built-in or the base preset's own). */
export function primaryHue(primary: PrimaryDesign, base: TokenTree): number {
  const palette = primaryPalette(primary)
  const tree = palette ? mergeOverrides(base, { semantic: { primary: { ...palette } } }) : base
  const value = createResolver(tree, 'light').resolve('primary-500')?.value
  const rgb = value ? parseColor(value) : null
  return rgb ? rgbToOklch(rgb).h : FALLBACK_HUE
}

export function surfacePalette(surface: SurfaceDesign, hue: () => number): ColorPalette | null {
  switch (surface.kind) {
    case 'base':
      return null
    case 'palette':
      return refPalette(surface.name)
    case 'tinted':
      return generateNeutralPalette(hue(), surface.chroma)
  }
}

// borderRadius primitives: none, xs, sm, md, lg, xl. 'base' keeps the preset's values.
export const RADIUS_VALUES: Record<Exclude<RadiusScale, 'base'>, Record<string, string>> = {
  none: { none: '0', xs: '0', sm: '0', md: '0', lg: '0', xl: '0' },
  small: { none: '0', xs: '1px', sm: '2px', md: '4px', lg: '6px', xl: '8px' },
  large: { none: '0', xs: '3px', sm: '6px', md: '10px', lg: '14px', xl: '18px' },
  xlarge: { none: '0', xs: '4px', sm: '8px', md: '12px', lg: '16px', xl: '24px' },
}

export const DENSITY_FACTORS: Record<Density, number> = { compact: 0.75, base: 1, comfortable: 1.25 }

/** Spacing tokens scaled by density. References are left alone so they follow their target. */
export const DENSITY_PATHS: readonly string[][] = [
  ['semantic', 'formField', 'paddingX'],
  ['semantic', 'formField', 'paddingY'],
  ['semantic', 'formField', 'sm', 'paddingX'],
  ['semantic', 'formField', 'sm', 'paddingY'],
  ['semantic', 'formField', 'lg', 'paddingX'],
  ['semantic', 'formField', 'lg', 'paddingY'],
  ['semantic', 'list', 'padding'],
  ['semantic', 'list', 'option', 'padding'],
  ['semantic', 'list', 'optionGroup', 'padding'],
  ['semantic', 'list', 'header', 'padding'],
  ['semantic', 'navigation', 'list', 'padding'],
  ['semantic', 'navigation', 'item', 'padding'],
  ['semantic', 'navigation', 'submenuLabel', 'padding'],
  ['semantic', 'overlay', 'popover', 'padding'],
  ['semantic', 'overlay', 'modal', 'padding'],
  ['components', 'button', 'root', 'paddingX'],
  ['components', 'button', 'root', 'paddingY'],
  ['components', 'card', 'body', 'padding'],
  ['components', 'datatable', 'headerCell', 'padding'],
  ['components', 'datatable', 'bodyCell', 'padding'],
  ['components', 'datatable', 'footerCell', 'padding'],
]

const LENGTH_TOKEN_RE = /^(-?\d*\.?\d+)(px|rem|em)?$/

/** Scales every length in a space-separated value ("0.5rem 0.75rem"). Returns null for non-literal values. */
export function scaleLength(value: string, factor: number): string | null {
  const parts = value.trim().split(/\s+/)
  const scaled = parts.map((part) => {
    const m = LENGTH_TOKEN_RE.exec(part)
    if (!m) return null
    const n = Number(m[1]) * factor
    const unit = m[2] ?? ''
    if (n === 0) return '0'
    const precision = unit === 'px' ? 1 : 1000
    return `${Math.round(n * precision) / precision}${unit}`
  })
  return scaled.includes(null) ? null : scaled.join(' ')
}

function densityTokens(density: Density, base: TokenTree): TokenTree {
  const factor = DENSITY_FACTORS[density]
  let out: TokenTree = {}
  if (factor === 1) return out
  for (const path of DENSITY_PATHS) {
    const current = getPath(base, path)
    if (typeof current !== 'string') continue
    const scaled = scaleLength(current, factor)
    if (scaled !== null) out = setPath(out, path, scaled)
  }
  return out
}

function focusRingTokens(focus: FocusRingDesign): TokenTree {
  if (focus.kind === 'base') return {}
  const width = Math.max(0, focus.width)
  const ring = {
    width: `${width}px`,
    style: width > 0 ? 'solid' : 'none',
    color: focus.color === 'primary' ? '{primary.color}' : focus.color,
    offset: `${focus.offset}px`,
    shadow: 'none',
  }
  // Lara/Material draw the ring as a scheme-specific box-shadow; disable it so the outline is the ring.
  return {
    semantic: {
      focusRing: ring,
      colorScheme: { light: { focusRing: { shadow: 'none' } }, dark: { focusRing: { shadow: 'none' } } },
    },
  }
}

/** Maps high-level design decisions to token overrides on top of `base`. */
export function designToTokens(design: DesignSettings, base: TokenTree): TokenTree {
  const trees: TokenTree[] = []

  const primary = primaryPalette(design.primary)
  if (primary) trees.push({ semantic: { primary: { ...primary } } })

  let hue: number | undefined
  const lazyHue = () => (hue ??= primaryHue(design.primary, base))
  for (const scheme of ['light', 'dark'] as const) {
    const surface = surfacePalette(design.surface[scheme], lazyHue)
    // Keep surface.0 (pure white in every base preset) and replace the 50–950 ramp.
    if (surface) trees.push({ semantic: { colorScheme: { [scheme]: { surface: { ...surface } } } } })
  }

  if (design.radius !== 'base') trees.push({ primitive: { borderRadius: { ...RADIUS_VALUES[design.radius] } } })
  trees.push(densityTokens(design.density, base))
  trees.push(focusRingTokens(design.focusRing))

  return mergeOverrides(...trees)
}
