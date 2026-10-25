import Aura from '@primeuix/themes/aura'
import { describe, expect, it } from 'vitest'
import { checkContrast, classifyContrast, tokenContrast, worseThanBase } from './contrast'
import { mergeOverrides } from './merge'
import { createResolver } from './tokens'
import type { TokenTree } from './types'

const aura = Aura as unknown as TokenTree

describe('tokenContrast', () => {
  it('measures two tokens of a resolver', () => {
    const r = createResolver(mergeOverrides(aura, { semantic: { colorScheme: { light: { text: { color: '#000000' } } } } }), 'light')
    // Black text on Aura's white content background.
    expect(tokenContrast(r, 'text-color', 'content-background')).toBeCloseTo(21, 1)
  })

  it('is null for missing tokens, unparseable values or no resolver', () => {
    const r = createResolver(aura, 'light')
    expect(tokenContrast(r, 'nope', 'content-background')).toBeNull()
    expect(tokenContrast(null, 'text-color', 'content-background')).toBeNull()
  })
})

describe('worseThanBase', () => {
  it('flags ratios below the minimum that the theme made worse', () => {
    expect(worseThanBase(3, 5)).toBe(true)
    expect(worseThanBase(3, null)).toBe(true)
    expect(worseThanBase(2.5, 3, 3)).toBe(true)
  })

  it('leaves passing ratios and the preset\'s own failures alone', () => {
    expect(worseThanBase(4.6, 7)).toBe(false)
    expect(worseThanBase(3, 3)).toBe(false)
    expect(worseThanBase(2.97, 3)).toBe(false)
    expect(worseThanBase(null, 5)).toBe(false)
  })
})

describe('classifyContrast', () => {
  it('tells introduced failures from inherited ones', () => {
    const base = checkContrast(createResolver(aura, 'light'))
    const broken = createResolver(mergeOverrides(aura, { semantic: { colorScheme: { light: { text: { color: '#ffffff' } } } } }), 'light')
    const byId = Object.fromEntries(classifyContrast(checkContrast(broken), base).map(r => [r.pair.id, r.status]))
    expect(byId.text).toBe('introduced')
    expect(byId.primary).toBe(classifyContrast(base, base).find(r => r.pair.id === 'primary')!.status)
  })
})
