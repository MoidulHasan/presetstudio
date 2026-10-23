import { describe, expect, it } from 'vitest'
import { contrastRatio, displayColor, oklchToRgb, parseColor, rgbToOklch, toHex } from './color'
import { generateNeutralPalette, generateOklchPalette } from './palette'
import { SHADES } from './types'

describe('parseColor', () => {
  it('parses hex, rgb(a), keywords and color-mix', () => {
    expect(parseColor('#fff')).toEqual({ r: 255, g: 255, b: 255, a: 1 })
    expect(parseColor('#10b98180')).toMatchObject({ r: 16, g: 185, b: 129 })
    expect(parseColor('rgba(0,0,0,0.4)')).toEqual({ r: 0, g: 0, b: 0, a: 0.4 })
    expect(parseColor('rgb(18 18 23 / 50%)')).toEqual({ r: 18, g: 18, b: 23, a: 0.5 })
    expect(parseColor('transparent')!.a).toBe(0)
    const mixed = parseColor('color-mix(in srgb, #10b981, transparent 88%)')!
    expect(toHex(mixed)).toBe('#10b981')
    expect(mixed.a).toBeCloseTo(0.12)
    expect(toHex(parseColor('color-mix(in srgb, #000000 50%, #ffffff)')!)).toBe('#808080')
    expect(parseColor('{primary.500}')).toBeNull()
  })
})

describe('displayColor', () => {
  it('keeps opaque colors, including opaque color-mix results', () => {
    expect(displayColor('#10B981', '#000')).toEqual({ hex: '#10b981', alpha: 1 })
    expect(displayColor('color-mix(in srgb, #000000 50%, #ffffff)', '#18181b')).toEqual({ hex: '#808080', alpha: 1 })
  })

  it('composites translucent tints over the backdrop', () => {
    // Aura dark: outlined primary hover = color-mix(in srgb, {primary.color}, transparent 96%) on surface.900
    const tint = displayColor('color-mix(in srgb, #34d399, transparent 96%)', '#18181b')!
    expect(tint.alpha).toBeCloseTo(0.04)
    expect(tint.hex).toBe(toHex({ r: 0x34 * 0.04 + 0x18 * 0.96, g: 0xd3 * 0.04 + 0x18 * 0.96, b: 0x99 * 0.04 + 0x1b * 0.96, a: 1 }))
    expect(tint.hex).not.toBe('#000000')
    expect(displayColor('rgba(255,255,255,0.16)', '#000000')!.hex).toBe('#292929')
  })

  it('shows fully transparent values as the backdrop and falls back to white', () => {
    expect(displayColor('transparent', '#18181b')).toEqual({ hex: '#18181b', alpha: 0 })
    expect(displayColor('rgba(0,0,0,0.5)', '{surface.0}')!.hex).toBe('#808080')
    expect(displayColor('{primary.500}', '#fff')).toBeNull()
  })
})

describe('contrastRatio', () => {
  it('matches known WCAG values', () => {
    expect(contrastRatio(parseColor('#000')!, parseColor('#fff')!)).toBeCloseTo(21, 5)
    expect(contrastRatio(parseColor('#fff')!, parseColor('#fff')!)).toBeCloseTo(1, 5)
    expect(contrastRatio(parseColor('#767676')!, parseColor('#fff')!)).toBeCloseTo(4.54, 2)
  })

  it('composites translucent backgrounds over the backdrop', () => {
    const translucent = parseColor('rgba(0,0,0,0.5)')!
    const ratio = contrastRatio(parseColor('#fff')!, translucent, parseColor('#ffffff')!)
    expect(ratio).toBeCloseTo(contrastRatio(parseColor('#fff')!, parseColor('#808080')!), 1)
  })
})

describe('OKLCH', () => {
  it('round-trips sRGB colors', () => {
    for (const hex of ['#10b981', '#6366f1', '#f43f5e', '#000000', '#ffffff', '#64748b']) {
      expect(toHex(oklchToRgb(rgbToOklch(parseColor(hex)!)))).toBe(hex)
    }
  })

  it('maps out-of-gamut colors into sRGB', () => {
    const rgb = oklchToRgb({ l: 0.7, c: 0.5, h: 150 })
    for (const v of [rgb.r, rgb.g, rgb.b]) expect(v).toBeGreaterThanOrEqual(0)
    for (const v of [rgb.r, rgb.g, rgb.b]) expect(v).toBeLessThanOrEqual(255)
  })
})

describe('generateOklchPalette', () => {
  // Near-white/near-black inputs leave too little room in 8-bit sRGB for distinct
  // neighbours, so for those we only require the scale never to reverse.
  const cases: Array<[string, boolean]> = [
    ['#10b981', true], ['#6366f1', true], ['#f59e0b', true], ['#ff0000', true], ['#0a0a0a', true], ['#fafafa', false],
  ]
  for (const [color, strict] of cases) {
    it(`builds a monotonic scale for ${color}`, () => {
      const p = generateOklchPalette(color)
      expect(p['500']).toBe(color)
      const lightness = SHADES.map(s => rgbToOklch(parseColor(p[s])!).l)
      for (let i = 1; i < lightness.length; i++) {
        if (strict) expect(lightness[i]).toBeLessThan(lightness[i - 1]!)
        else expect(lightness[i]).toBeLessThanOrEqual(lightness[i - 1]! + 1e-9)
      }
      for (const s of SHADES) expect(p[s]).toMatch(/^#[0-9a-f]{6}$/)
    })
  }

  it('keeps the hue of saturated colors', () => {
    const p = generateOklchPalette('#6366f1')
    const hue = rgbToOklch(parseColor('#6366f1')!).h
    expect(Math.abs(rgbToOklch(parseColor(p['300'])!).h - hue)).toBeLessThan(6)
  })
})

describe('generateNeutralPalette', () => {
  it('produces a light-to-dark neutral ramp', () => {
    const p = generateNeutralPalette(250, 0.01)
    expect(rgbToOklch(parseColor(p['50'])!).l).toBeGreaterThan(0.97)
    expect(rgbToOklch(parseColor(p['950'])!).l).toBeLessThan(0.2)
    expect(rgbToOklch(parseColor(p['500'])!).c).toBeLessThan(0.02)
  })
})
