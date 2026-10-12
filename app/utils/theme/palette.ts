import { palette } from '@primeuix/themes'
import { SHADES, type ColorPalette } from './types'

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

/** Generates a 50–950 palette from a hex color (500 = the input color). */
export function generatePalette(color: string): ColorPalette {
  const hex = normalizeHex(color)
  if (!hex) throw new Error(`Invalid hex color: ${color}`)
  const generated = palette(hex) as Record<string, string>
  return Object.fromEntries(SHADES.map(shade => [shade, generated[shade]!])) as ColorPalette
}
