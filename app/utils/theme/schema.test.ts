import Aura from '@primeuix/themes/aura'
import { describe, expect, it } from 'vitest'
import { describePreset, inferTokenKind } from './schema'
import { flattenPreset } from './tokens'
import type { TokenTree } from './types'

describe('inferTokenKind', () => {
  it('infers kinds from key names and values', () => {
    expect(inferTokenKind('hoverBackground', '{surface.100}')).toBe('color')
    expect(inferTokenKind('color', '{text.color}')).toBe('color')
    expect(inferTokenKind('borderRadius', '{border.radius.md}')).toBe('radius')
    expect(inferTokenKind('padding', '0.5rem 0.75rem')).toBe('spacing')
    expect(inferTokenKind('shadow', '0 1px 2px rgba(0,0,0,.1)')).toBe('shadow')
    expect(inferTokenKind('transitionDuration', '0.2s')).toBe('duration')
    expect(inferTokenKind('fontWeight', '600')).toBe('fontWeight')
    expect(inferTokenKind('width', '1px')).toBe('length')
    expect(inferTokenKind('500', '#10b981')).toBe('color')
  })
})

describe('describePreset', () => {
  const tokens = describePreset(Aura as unknown as TokenTree)

  it('covers every token of both schemes', () => {
    const light = flattenPreset(Aura as unknown as TokenTree, 'light')
    const names = new Set(tokens.map(t => t.name))
    for (const name of light.keys()) expect(names.has(name)).toBe(true)
    expect(tokens.length).toBeGreaterThan(2500)
  })

  it('describes component and scheme tokens', () => {
    const hover = tokens.find(t => t.name === 'button-primary-hover-background' && t.scheme === 'dark')!
    expect(hover).toMatchObject({ layer: 'component', component: 'button', kind: 'color', label: 'Primary › Hover background' })
    expect(hover.path).toEqual(['components', 'button', 'colorScheme', 'dark', 'root', 'primary', 'hoverBackground'])
    const padding = tokens.find(t => t.name === 'form-field-padding-x')!
    expect(padding).toMatchObject({ layer: 'semantic', scheme: null, kind: 'spacing' })
  })
})
