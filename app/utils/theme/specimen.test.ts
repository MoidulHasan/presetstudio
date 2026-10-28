import Aura from '@primeuix/themes/aura'
import Lara from '@primeuix/themes/lara'
import Nora from '@primeuix/themes/nora'
import { describe, expect, it } from 'vitest'
import { referenceChain, specimenVars, themeResolver } from './specimen'
import { createDefaultThemeState, type TokenTree } from './types'

const aura = Aura as unknown as TokenTree
const lara = Lara as unknown as TokenTree
const nora = Nora as unknown as TokenTree

describe('specimenVars', () => {
  it('writes out semantic tokens and the listed components only, as plain values', () => {
    const vars = specimenVars(themeResolver(createDefaultThemeState(), aura), ['button'])
    expect(vars['--p-primary-color']).toMatch(/^#/)
    expect(vars['--p-button-primary-background']).toBe(vars['--p-primary-color'])
    expect(vars['--p-card-background']).toBeUndefined()
    expect(vars['--p-emerald-500']).toBeUndefined()
    expect(Object.values(vars).some(v => v.includes('{'))).toBe(false)
  })

  it('applies the design (brand color, corners) and the base preset', () => {
    const state = createDefaultThemeState('lara')
    state.design.primary = { kind: 'custom', color: '#0d9488', algorithm: 'oklch', shades: {} }
    state.design.radius = 'none'
    const vars = specimenVars(themeResolver(state, lara), ['button'])
    expect(vars['--p-button-primary-background']).toBe(vars['--p-primary-color'])
    expect(vars['--p-primary-color']).not.toBe(specimenVars(themeResolver(createDefaultThemeState('lara'), lara), [])['--p-primary-color'])
    expect(vars['--p-button-border-radius']).toBe('0px')
  })

  it('uses the dark values for the dark scheme', () => {
    const light = specimenVars(themeResolver(createDefaultThemeState(), aura), [])
    const dark = specimenVars(themeResolver(createDefaultThemeState(), aura, 'dark'), [])
    expect(dark['--p-content-background']).not.toBe(light['--p-content-background'])
  })
})

describe('referenceChain', () => {
  const state = createDefaultThemeState()
  state.design.primary = { kind: 'custom', color: '#0d9488', algorithm: 'oklch', shades: {} }

  it('follows a component token back to its palette shade, layer by layer', () => {
    const chain = referenceChain(themeResolver(state, aura), 'inputtext-focus-border-color')!
    expect(chain.map(s => [s.layer, s.reference])).toEqual([
      ['palette', 'primary.500'],
      ['semantic', 'primary.color'],
      ['semantic', 'formField.focusBorderColor'],
      ['component', 'inputtext.focusBorderColor'],
    ])
    expect(new Set(chain.map(s => s.value))).toEqual(new Set(['#0d9488']))
  })

  it('shows how base presets wire the same token differently', () => {
    const shade = (base: TokenTree) => referenceChain(themeResolver(state, base), 'button-primary-background')![0]!.reference
    expect(shade(aura)).toBe('primary.500')
    expect(shade(nora)).toBe('primary.600')
  })

  it('counts gray scales as palette and returns null for unknown tokens', () => {
    const chain = referenceChain(themeResolver(state, aura), 'avatar-background')!
    expect(chain.slice(0, 2).map(s => s.layer)).toEqual(['palette', 'palette'])
    expect(referenceChain(themeResolver(state, aura), 'nope')).toBeNull()
  })
})
