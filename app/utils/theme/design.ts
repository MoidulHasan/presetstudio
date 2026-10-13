import { mergeOverrides } from './merge'
import { mixSrgb, parseColor, rgbToOklch, toHex } from './color'
import { generateNeutralPalette, generatePalette } from './palette'
import { createResolver } from './tokens'
import { setPath } from './tree'
import {
  RADIUS_STEPS,
  SHADES,
  type ColorPalette,
  type CustomRadius,
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
export const RADIUS_VALUES: Record<Exclude<RadiusScale, 'base' | 'custom'>, Record<string, string>> = {
  none: { none: '0', xs: '0', sm: '0', md: '0', lg: '0', xl: '0' },
  small: { none: '0', xs: '1px', sm: '2px', md: '4px', lg: '6px', xl: '8px' },
  large: { none: '0', xs: '3px', sm: '6px', md: '10px', lg: '14px', xl: '18px' },
  xlarge: { none: '0', xs: '4px', sm: '8px', md: '12px', lg: '16px', xl: '24px' },
}

export const MAX_RADIUS = 32

const px = (n: number) => (n > 0 ? `${n}px` : '0')

/** borderRadius primitives for a radius design, or null to keep the base preset's. */
export function radiusValues(radius: RadiusScale, custom: CustomRadius): Record<string, string> | null {
  if (radius === 'base') return null
  if (radius !== 'custom') return { ...RADIUS_VALUES[radius] }
  return { none: '0', ...Object.fromEntries(RADIUS_STEPS.map(step => [step, px(custom[step])])) }
}

/** A whole custom scale derived from the md radius (keeps the xs…xl proportions of the stock presets). */
export function radiusScaleFrom(md: number): CustomRadius {
  const r = (ratio: number) => Math.round(md * ratio)
  return { xs: r(1 / 3), sm: r(2 / 3), md, lg: r(4 / 3), xl: r(2) }
}

export const DENSITY_FACTORS: Record<Exclude<Density, 'custom'>, number> = { compact: 0.75, base: 1, comfortable: 1.25 }
export const DENSITY_SCALE_RANGE = { min: 0.5, max: 1.5 } as const

export function densityFactor(density: Density, scale: number): number {
  return density === 'custom' ? scale : DENSITY_FACTORS[density]
}

/** Keys whose literal lengths are spacing and scale with density (padding, gap, gutter, margin). */
const SPACING_KEY_RE = /padding|gap|gutter|margin/i

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

/**
 * Scales every literal spacing token of the semantic and component layers (in both color
 * schemes). References are left alone so they follow their target.
 */
export function densityTokens(factor: number, base: TokenTree): TokenTree {
  let out: TokenTree = {}
  if (factor === 1) return out
  const walk = (node: TokenTree, path: string[]) => {
    for (const [key, value] of Object.entries(node)) {
      if (key === 'css' || key === 'extend') continue
      const p = [...path, key]
      if (typeof value === 'object') walk(value, p)
      else if (typeof value === 'string' && SPACING_KEY_RE.test(key)) {
        const scaled = scaleLength(value, factor)
        if (scaled !== null && scaled !== value) out = setPath(out, p, scaled)
      }
    }
  }
  for (const layer of ['semantic', 'components']) {
    const node = base[layer]
    if (node && typeof node === 'object') walk(node, [layer])
  }
  return out
}

const FORM_FIELD_RING_RE = /\{form\.field\.focus\.ring\./
const NEGATIVE_LENGTH_RE = /^-\d/

/**
 * Points every component focus ring at the global one, so a custom outline looks the same
 * everywhere (Material and Lara otherwise disable or replace it per component). Form fields
 * keep their own focus style (a border color), and inset rings (negative offsets) stay inset.
 */
function componentFocusRings(focus: Extract<FocusRingDesign, { kind: 'outline' }>, base: TokenTree): TokenTree {
  let out: TokenTree = {}
  const ring = (node: TokenTree, path: string[]) => {
    if (Object.values(node).some(v => typeof v === 'string' && FORM_FIELD_RING_RE.test(v))) return
    const set = (key: string, value: string) => {
      if (key in node && node[key] !== value) out = setPath(out, [...path, key], value)
    }
    set('width', '{focus.ring.width}')
    set('style', '{focus.ring.style}')
    set('shadow', 'none')
    const offset = node.offset
    if (!(typeof offset === 'string' && NEGATIVE_LENGTH_RE.test(offset))) set('offset', '{focus.ring.offset}')
    // With the primary color, keep per-severity colors (a danger button gets a red ring).
    const color = node.color
    const keepColor = focus.color === 'primary' && typeof color === 'string' && color.startsWith('{')
    if (!keepColor) set('color', '{focus.ring.color}')
  }
  const walk = (node: TokenTree, path: string[]) => {
    for (const [key, value] of Object.entries(node)) {
      if (typeof value !== 'object' || key === 'css') continue
      if (key === 'focusRing') ring(value, [...path, key])
      else walk(value, [...path, key])
    }
  }
  if (base.components && typeof base.components === 'object') walk(base.components, ['components'])
  return out
}

function focusRingTokens(focus: FocusRingDesign, base: TokenTree): TokenTree {
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
  return mergeOverrides(
    {
      semantic: {
        focusRing: ring,
        colorScheme: { light: { focusRing: { shadow: 'none' } }, dark: { focusRing: { shadow: 'none' } } },
      },
    },
    componentFocusRings(focus, base),
  )
}

/** Light-mode surface.0 a quarter of the way from surface.50 to white, so white backgrounds pick up the surface tint. */
function tintedWhite(tree: TokenTree): string | null {
  const value = createResolver(tree, 'light').resolve('surface-50')?.value
  const rgb = value ? parseColor(value) : null
  return rgb ? toHex(mixSrgb({ r: 255, g: 255, b: 255, a: 1 }, rgb, 0.25)) : null
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
  if (design.tintedBackgrounds) {
    const surface0 = tintedWhite(mergeOverrides(base, ...trees))
    if (surface0) trees.push({ semantic: { colorScheme: { light: { surface: { 0: surface0 } } } } })
  }

  const radius = radiusValues(design.radius, design.customRadius)
  if (radius) trees.push({ primitive: { borderRadius: radius } })
  trees.push(densityTokens(densityFactor(design.density, design.densityScale), base))
  trees.push(focusRingTokens(design.focusRing, base))

  return mergeOverrides(...trees)
}
