import { palette } from '@primeuix/themes'
import { oklchToRgb, parseColor, rgbToOklch, toHex } from './color'
import { SHADES, type ColorPalette, type PaletteAlgorithm, type Shade } from './types'

const HEX_RE = /^#?(?:[0-9a-f]{3}|[0-9a-f]{6})$/i

export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_RE.test(value.trim())
}

/** Normalizes `#abc` / `abc` / `#AABBCC` to lowercase `#aabbcc`. Returns null if invalid. */
export function normalizeHex(value: string): string | null {
  if (!isHexColor(value)) return null
  let hex = value.trim().replace(/^#/, '').toLowerCase()
  if (hex.length === 3) hex = [...hex].map(c => c + c).join('')
  return `#${hex}`
}

function requireHex(color: string): string {
  const hex = normalizeHex(color)
  if (!hex) throw new Error(`Invalid hex color: ${color}`)
  return hex
}

/** PrimeTek's `palette()` (linear tint/shade mixing). 500 = the input color. */
export function generateClassicPalette(color: string): ColorPalette {
  const generated = palette(requireHex(color)) as Record<string, string>
  return Object.fromEntries(SHADES.map(shade => [shade, generated[shade]!])) as ColorPalette
}

// Reference lightness / relative chroma per shade, tuned on common UI palettes.
const REF_LIGHTNESS: Record<Shade, number> = {
  50: 0.975, 100: 0.94, 200: 0.885, 300: 0.81, 400: 0.71, 500: 0.63,
  600: 0.56, 700: 0.49, 800: 0.42, 900: 0.36, 950: 0.27,
}
const REF_CHROMA: Record<Shade, number> = {
  50: 0.12, 100: 0.25, 200: 0.45, 300: 0.7, 400: 0.9, 500: 1,
  600: 0.95, 700: 0.85, 800: 0.72, 900: 0.58, 950: 0.42,
}

/**
 * Maps the reference lightness curve so shade 500 lands exactly on the input lightness
 * (piecewise linear around the anchor). The ends widen for very light or very dark
 * inputs so the scale always stays monotonic.
 */
function lightnessFor(shade: Shade, anchorL: number): number {
  const ref = REF_LIGHTNESS[shade]
  const ref500 = REF_LIGHTNESS[500]
  const top = Math.max(0.975, anchorL + (1 - anchorL) * 0.75)
  const bottom = Math.min(0.25, anchorL * 0.45)
  if (ref >= ref500) {
    const t = (ref - ref500) / (REF_LIGHTNESS[50] - ref500)
    return anchorL + t * (top - anchorL)
  }
  const t = (ref500 - ref) / (ref500 - REF_LIGHTNESS[950])
  return anchorL - t * (anchorL - bottom)
}

/** Perceptual palette in OKLCH: even lightness steps, chroma tapered at the ends, hue kept. */
export function generateOklchPalette(color: string): ColorPalette {
  const hex = requireHex(color)
  const base = rgbToOklch(parseColor(hex)!)
  const anchorL = base.l
  const result = {} as ColorPalette
  for (const shade of SHADES) {
    result[shade] = shade === '500'
      ? hex
      : toHex(oklchToRgb({ l: lightnessFor(shade, anchorL), c: base.c * REF_CHROMA[shade], h: base.h }))
  }
  return result
}

/** A neutral (surface) palette, optionally tinted with a hue. 50 ≈ near-white, 950 ≈ near-black. */
export function generateNeutralPalette(hue: number, chroma = 0.012): ColorPalette {
  const neutralL: Record<Shade, number> = {
    50: 0.985, 100: 0.967, 200: 0.928, 300: 0.869, 400: 0.704, 500: 0.554,
    600: 0.446, 700: 0.372, 800: 0.279, 900: 0.208, 950: 0.13,
  }
  const result = {} as ColorPalette
  for (const shade of SHADES) {
    // Slightly more tint in the mid-tones, where it's visible.
    const c = chroma * (shade === '50' || shade === '950' ? 0.6 : 1)
    result[shade] = toHex(oklchToRgb({ l: neutralL[shade], c, h: hue }))
  }
  return result
}

export function hueOf(color: string): number {
  return rgbToOklch(parseColor(requireHex(color))!).h
}

export function generatePalette(color: string, algorithm: PaletteAlgorithm = 'oklch'): ColorPalette {
  return algorithm === 'classic' ? generateClassicPalette(color) : generateOklchPalette(color)
}
