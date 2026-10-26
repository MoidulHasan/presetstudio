import { describe, expect, it } from 'vitest'
import { BRAND_RAMP, LOGO_SHADES, logoVars } from './logo'
import { generatePalette } from './theme/palette'

describe('logoVars', () => {
  it('takes five shades of a palette as CSS variables', () => {
    const palette = generatePalette('#4f46e5', 'oklch')
    expect(logoVars(palette)).toEqual(Object.fromEntries(LOGO_SHADES.map((shade, i) => [`--ps-logo-${i + 1}`, palette[shade]])))
  })

  it('falls back (null) for a missing palette, a missing shade or a value that is not a color', () => {
    const palette = generatePalette('#4f46e5', 'oklch')
    expect(logoVars(null)).toBeNull()
    expect(logoVars({ ...palette, 500: undefined })).toBeNull()
    expect(logoVars({ ...palette, 500: 'red;} html{display:none' })).toBeNull()
  })

  it('keeps the brand ramp in step with the landing page default', () => {
    const palette = generatePalette('#0f766e', 'oklch')
    expect(BRAND_RAMP).toEqual(LOGO_SHADES.map(shade => palette[shade]))
  })
})
