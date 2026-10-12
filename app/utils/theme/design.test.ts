import Aura from '@primeuix/themes/aura'
import Lara from '@primeuix/themes/lara'
import Material from '@primeuix/themes/material'
import { describe, expect, it } from 'vitest'
import { buildEffectivePreset, buildPresetOverrides } from './build'
import { CONTRAST_PAIRS, checkContrast } from './contrast'
import { designToTokens, scaleLength } from './design'
import { createResolver } from './tokens'
import { createDefaultThemeState, type DesignSettings, type ThemeState, type TokenTree } from './types'

const aura = Aura as unknown as TokenTree
const lara = Lara as unknown as TokenTree
const material = Material as unknown as TokenTree

const withDesign = (design: Partial<DesignSettings>): ThemeState => {
  const state = createDefaultThemeState()
  return { ...state, design: { ...state.design, ...design } }
}

describe('scaleLength', () => {
  it('scales every length of a shorthand value', () => {
    expect(scaleLength('0.5rem 0.75rem', 0.75)).toBe('0.375rem 0.563rem')
    expect(scaleLength('0.5rem 0', 2)).toBe('1rem 0')
    expect(scaleLength('12px', 1.25)).toBe('15px')
    expect(scaleLength('{form.field.padding.x}', 2)).toBeNull()
  })
})

describe('designToTokens', () => {
  it('produces no overrides for the default design', () => {
    expect(buildPresetOverrides(createDefaultThemeState(), aura)).toEqual({})
  })

  it('maps a built-in primary palette to references', () => {
    const tokens = designToTokens(withDesign({ primary: { kind: 'palette', name: 'indigo' } }).design, aura)
    expect((tokens.semantic as TokenTree).primary).toMatchObject({ 50: '{indigo.50}', 500: '{indigo.500}', 950: '{indigo.950}' })
  })

  it('generates a custom primary palette and applies per-shade tweaks', () => {
    const design = withDesign({ primary: { kind: 'custom', color: '#6366f1', algorithm: 'oklch', shades: { 950: '#000000' } } }).design
    const primary = (designToTokens(design, aura).semantic as TokenTree).primary as TokenTree
    expect(primary['500']).toBe('#6366f1')
    expect(primary['950']).toBe('#000000')
  })

  it('replaces surfaces per scheme', () => {
    const design = withDesign({ surface: { light: { kind: 'palette', name: 'stone' }, dark: { kind: 'tinted', chroma: 0.02 } } }).design
    const resolverLight = createResolver(buildEffectivePreset({ design, overrides: {} }, aura), 'light')
    const resolverDark = createResolver(buildEffectivePreset({ design, overrides: {} }, aura), 'dark')
    expect(resolverLight.resolve('surface-500')!.value).toBe((Aura.primitive as unknown as TokenTree & { stone: Record<string, string> }).stone['500'])
    expect(resolverDark.resolve('surface-500')!.value).toMatch(/^#[0-9a-f]{6}$/)
    expect(resolverLight.resolve('surface-0')!.value).toBe('#ffffff')
  })

  it('applies a radius scale to the primitives', () => {
    const r = createResolver(buildEffectivePreset(withDesign({ radius: 'none' }), aura), 'light')
    expect(r.resolve('button-border-radius')!.value).toBe('0')
    expect(r.resolve('border-radius-xl')!.value).toBe('0')
  })

  it('scales literal paddings and leaves references alone', () => {
    const compact = buildPresetOverrides(withDesign({ density: 'compact' }), aura)
    const semantic = compact.semantic as TokenTree
    expect((semantic.formField as TokenTree).paddingX).toBe('0.563rem')
    // Aura's button padding references formField, so it isn't overridden directly...
    expect(((compact.components as TokenTree)?.button as TokenTree | undefined)?.root).toBeUndefined()
    // ...but still follows it.
    const r = createResolver(buildEffectivePreset(withDesign({ density: 'compact' }), aura), 'light')
    expect(r.resolve('button-padding-x')!.value).toBe('0.563rem')
    // Lara's button padding is a literal and gets scaled directly.
    const lr = createResolver(buildEffectivePreset(withDesign({ density: 'comfortable' }), lara), 'light')
    expect(lr.resolve('button-padding-x')!.value).toBe('1.25rem')
  })

  it('replaces box-shadow focus rings with an outline', () => {
    const state = withDesign({ focusRing: { kind: 'outline', width: 3, offset: 1, color: 'primary' } })
    for (const scheme of ['light', 'dark'] as const) {
      const r = createResolver(buildEffectivePreset(state, material), scheme)
      expect(r.resolve('focus-ring-width')!.value).toBe('3px')
      expect(r.resolve('focus-ring-style')!.value).toBe('solid')
      expect(r.resolve('focus-ring-shadow')!.value).toBe('none')
      expect(r.resolve('focus-ring-color')!.value).toBe(r.resolve('primary-color')!.value)
    }
  })

  it('lets explicit overrides win over design decisions', () => {
    const state = { ...withDesign({ primary: { kind: 'palette', name: 'indigo' } }), overrides: { semantic: { primary: { 500: '#123456' } } } } as ThemeState
    const primary = (buildPresetOverrides(state, aura).semantic as TokenTree).primary as TokenTree
    expect(primary['500']).toBe('#123456')
    expect(primary['400']).toBe('{indigo.400}')
  })
})

describe('checkContrast', () => {
  it('evaluates every pair for each base preset and scheme', () => {
    for (const preset of [aura, lara, material]) {
      for (const scheme of ['light', 'dark'] as const) {
        const results = checkContrast(createResolver(preset, scheme))
        expect(results).toHaveLength(CONTRAST_PAIRS.length)
        // Body text in the stock presets passes AA.
        expect(results.find(r => r.pair.id === 'text')!.pass).toBe(true)
        // Material's translucent color-mix highlight is still evaluable.
        expect(results.find(r => r.pair.id === 'highlight')!.ratio).not.toBeNull()
      }
    }
  })

  it('flags a low-contrast primary button', () => {
    const state = withDesign({ primary: { kind: 'custom', color: '#fde047', algorithm: 'oklch', shades: {} } })
    const results = checkContrast(createResolver(buildEffectivePreset(state, aura), 'light'))
    expect(results.find(r => r.pair.id === 'primary')!.pass).toBe(false)
  })
})

describe('tinted surfaces', () => {
  it('follow the effective primary hue', async () => {
    const { hueOf } = await import('./palette')
    const { primaryHue } = await import('./design')
    expect(primaryHue({ kind: 'custom', color: '#f43f5e', algorithm: 'oklch', shades: {} }, aura)).toBeCloseTo(hueOf('#f43f5e'), 3)
    // Aura's default primary is emerald.
    const emerald = (Aura.primitive as unknown as Record<string, Record<string, string>>).emerald!['500']!
    expect(primaryHue({ kind: 'base' }, aura)).toBeCloseTo(hueOf(emerald), 3)
  })
})
