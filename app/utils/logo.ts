import { normalizeHex } from './theme/palette'
import type { ColorPalette, Shade } from './theme/types'

// The logo is a five-step scale. It takes the colors of the theme on screen (the landing page's
// choice, the theme open in the editor) and falls back to the brand ramp elsewhere (docs,
// favicon, loading screen). Shades chosen so all five show on white and on near-black.
export const LOGO_SHADES: readonly Shade[] = ['200', '400', '500', '700', '800']

/** The brand ramp: those shades of the landing page's default teal (#0f766e, OKLCH palette). */
export const BRAND_RAMP: readonly string[] = ['#b4d8d3', '#48958d', '#0f766e', '#00544e', '#00443f']

/**
 * CSS custom properties for the logo (`--ps-logo-1` … `--ps-logo-5`) from a palette, or null
 * when it's missing a shade or holds anything but a plain color (the logo then shows the brand
 * ramp).
 */
export function logoVars(palette: Partial<ColorPalette> | null | undefined): Record<string, string> | null {
  if (!palette) return null
  const colors = LOGO_SHADES.map(shade => normalizeHex(palette[shade] ?? ''))
  if (colors.some(color => color === null)) return null
  return Object.fromEntries(colors.map((color, index) => [`--ps-logo-${index + 1}`, color!]))
}
