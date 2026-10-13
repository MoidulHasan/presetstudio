import Aura from '@primeuix/themes/aura'
import Lara from '@primeuix/themes/lara'
import Material from '@primeuix/themes/material'
import Nora from '@primeuix/themes/nora'
import { describe, expect, it } from 'vitest'
import { COMPONENT_CATEGORIES, COMPONENT_META, COMPONENT_NAMES, countComponentOverrides, groupComponentTokens, isComponentName, tokenLabel } from './components'
import { describePreset } from './schema'
import type { TokenTree } from './types'

const presets = { aura: Aura, lara: Lara, nora: Nora, material: Material } as unknown as Record<string, TokenTree>

describe('component metadata', () => {
  it('covers exactly the components of every base preset', () => {
    for (const [name, preset] of Object.entries(presets)) {
      expect(Object.keys(preset.components as TokenTree).sort(), name).toEqual([...COMPONENT_NAMES].sort())
    }
  })

  it('puts every component in a known category', () => {
    for (const meta of Object.values(COMPONENT_META)) expect(COMPONENT_CATEGORIES).toContain(meta.category)
    expect(isComponentName('datatable')).toBe(true)
    expect(isComponentName('constructor')).toBe(false)
  })
})

describe('groupComponentTokens', () => {
  const descriptors = describePreset(presets.aura!)

  it('groups by part in preset order, root first', () => {
    const groups = groupComponentTokens(descriptors, 'button', 'light')
    expect(groups[0]!.label).toBe('Root')
    const labels = groups.map(g => g.label)
    expect(labels).toEqual(expect.arrayContaining(['Small', 'Large', 'Focus ring', 'Primary', 'Outlined', 'Text', 'Link']))
    // One group per top-level part, deeper keys go into the token label.
    expect(labels).not.toContain('Outlined › Primary')
    const outlined = groups.find(g => g.key === 'outlined')!
    expect(outlined.tokens.map(tokenLabel)).toContain('Primary › Border color')
    const primary = groups.find(g => g.key === 'primary')!
    expect(primary.tokens.map(tokenLabel)).toEqual(expect.arrayContaining(['Background', 'Focus ring › Color']))
    expect(groups[0]!.tokens.map(tokenLabel)).toContain('Padding x')
  })

  it('shows every token of the component for each scheme exactly once', () => {
    for (const component of COMPONENT_NAMES) {
      for (const scheme of ['light', 'dark'] as const) {
        const names = groupComponentTokens(descriptors, component, scheme).flatMap(g => g.tokens.map(t => t.name))
        expect(new Set(names).size, component).toBe(names.length)
        const expected = new Set(descriptors.filter(d => d.component === component && (d.scheme === null || d.scheme === scheme)).map(d => d.name))
        expect(names.length, component).toBe(expected.size)
      }
    }
  })
})

describe('countComponentOverrides', () => {
  it('counts custom tokens per component', () => {
    expect(countComponentOverrides({ components: { button: { root: { paddingX: '1rem', colorScheme: { light: { primary: { background: 'red' } } } } }, card: { body: { padding: '0' } } } }))
      .toEqual({ button: 2, card: 1 })
    expect(countComponentOverrides({})).toEqual({})
  })
})
