import Aura from '@primeuix/themes/aura'
import Lara from '@primeuix/themes/lara'
import { describe, expect, it } from 'vitest'
import { CONTRAST_PAIRS, checkContrast, contrastFix } from './contrast'
import { buildEffectivePreset } from './build'
import { createResolver } from './tokens'
import { createDefaultThemeState, type TokenTree } from './types'
import { setPath } from './tree'

const aura = Aura as unknown as TokenTree
const pair = (id: string) => CONTRAST_PAIRS.find(p => p.id === id)!

describe('contrastFix', () => {
  it('moves Aura\'s primary to the nearest shade white text passes on, with hover and pressed', () => {
    const resolver = createResolver(aura, 'light')
    const fix = contrastFix(resolver, pair('primary'))!
    expect(fix.edits).toEqual([
      { token: 'primary-color', value: '{primary.700}' },
      { token: 'primary-hover-color', value: '{primary.800}' },
      { token: 'primary-active-color', value: '{primary.900}' },
    ])
    expect(fix.to).toBe('primary.700')
    expect(fix.ratio).toBeGreaterThanOrEqual(4.5)
  })

  it('makes the pair pass once applied', () => {
    const resolver = createResolver(aura, 'light')
    const fix = contrastFix(resolver, pair('primary'))!
    let overrides: TokenTree = {}
    for (const edit of fix.edits) {
      const key = edit.token.replace('primary-', '').replace(/-(\w)/g, (_, c: string) => c.toUpperCase())
      overrides = setPath(overrides, ['semantic', 'colorScheme', 'light', 'primary', key], edit.value)
    }
    const fixed = createResolver(buildEffectivePreset({ ...createDefaultThemeState(), overrides }, aura), 'light')
    expect(checkContrast(fixed, [pair('primary')])[0]!.pass).toBe(true)
  })

  it('returns null for a pair that passes or has no fix', () => {
    const resolver = createResolver(aura, 'light')
    expect(contrastFix(resolver, pair('text'))).toBeNull()
    expect(contrastFix(resolver, pair('field-border'))).toBeNull()
  })

  it('darkens muted text along its own scale when a theme made it too light', () => {
    const state = createDefaultThemeState()
    state.overrides = { semantic: { colorScheme: { light: { text: { mutedColor: '{surface.300}' } } } } }
    const resolver = createResolver(buildEffectivePreset(state, aura), 'light')
    const fix = contrastFix(resolver, pair('muted'))!
    expect(fix.edits).toEqual([{ token: 'text-muted-color', value: '{surface.500}' }])
  })

  it('works on other base presets', () => {
    const fix = contrastFix(createResolver(Lara as unknown as TokenTree, 'light'), pair('primary'))
    expect(fix === null || fix.ratio >= 4.5).toBe(true)
  })
})
