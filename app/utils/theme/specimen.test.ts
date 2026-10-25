import Aura from '@primeuix/themes/aura'
import Lara from '@primeuix/themes/lara'
import { describe, expect, it } from 'vitest'
import { specimenVars } from './specimen'
import { createDefaultThemeState, type TokenTree } from './types'

const aura = Aura as unknown as TokenTree
const lara = Lara as unknown as TokenTree

describe('specimenVars', () => {
  it('writes out semantic tokens and the listed components only, as plain values', () => {
    const vars = specimenVars(createDefaultThemeState(), aura, ['button'])
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
    const vars = specimenVars(state, lara, ['button'])
    expect(vars['--p-button-primary-background']).toBe(vars['--p-primary-color'])
    expect(vars['--p-primary-color']).not.toBe(specimenVars(createDefaultThemeState('lara'), lara, [])['--p-primary-color'])
    expect(vars['--p-button-border-radius']).toBe('0')
  })

  it('uses the dark values for the dark scheme', () => {
    const light = specimenVars(createDefaultThemeState(), aura, [])
    const dark = specimenVars(createDefaultThemeState(), aura, [], 'dark')
    expect(dark['--p-content-background']).not.toBe(light['--p-content-background'])
  })
})
