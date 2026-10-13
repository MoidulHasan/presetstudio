import Aura from '@primeuix/themes/aura'
import { describe, expect, it } from 'vitest'
import { buildEffectivePreset } from './build'
import { checkContrast, classifyContrast } from './contrast'
import { DESIGN_SECTIONS, isPristine, isSectionModified, resetSection } from './sections'
import { createResolver } from './tokens'
import { createDefaultDesign, createDefaultThemeState, type ThemeState, type TokenTree } from './types'

const aura = Aura as unknown as TokenTree

const modified: ThemeState = {
  ...createDefaultThemeState(),
  design: {
    ...createDefaultDesign(),
    primary: { kind: 'palette', name: 'indigo' },
    surface: { light: { kind: 'palette', name: 'stone' }, dark: { kind: 'base' } },
    status: { ...createDefaultDesign().status, warn: { kind: 'palette', name: 'amber' } },
    radius: 'large',
    density: 'compact',
    focusRing: { kind: 'outline', width: 2, offset: 2, color: 'primary' },
  },
  overrides: {
    semantic: {
      colorScheme: { light: { primary: { contrastColor: '#000000' } } },
      list: { gap: '4px' },
    },
  },
}

describe('sections', () => {
  it('detects modified sections', () => {
    for (const s of DESIGN_SECTIONS) {
      expect(isSectionModified(createDefaultThemeState(), s)).toBe(false)
      expect(isSectionModified(modified, s)).toBe(true)
    }
    expect(isPristine(createDefaultThemeState())).toBe(true)
    expect(isPristine(modified)).toBe(false)
  })

  it('counts owned raw overrides as section changes', () => {
    const state = { ...createDefaultThemeState(), overrides: { semantic: { colorScheme: { dark: { primary: { contrastColor: '#fff' } } } } } }
    expect(isSectionModified(state, 'primary')).toBe(true)
    expect(isSectionModified(state, 'surface')).toBe(false)
  })

  it('resets one section, including the overrides it owns, and nothing else', () => {
    const reset = resetSection(modified, 'primary')
    expect(reset.design.primary).toEqual({ kind: 'base' })
    expect(reset.design.radius).toBe('large')
    expect(reset.overrides).toEqual({ semantic: { list: { gap: '4px' } } })
    expect(isSectionModified(reset, 'primary')).toBe(false)
    // The input is not mutated.
    expect(modified.design.primary.kind).toBe('palette')
  })

  it('resets every section back to pristine except unrelated overrides', () => {
    const reset = DESIGN_SECTIONS.reduce(resetSection, modified)
    expect(reset.design).toEqual(createDefaultThemeState().design)
    expect(reset.overrides).toEqual({ semantic: { list: { gap: '4px' } } })
  })
})

describe('classifyContrast', () => {
  const baseline = checkContrast(createResolver(aura, 'light'))

  it('marks the base preset\'s own failures as inherited, not introduced', () => {
    const classified = classifyContrast(baseline, baseline)
    expect(classified.some(c => c.status === 'introduced')).toBe(false)
    expect(classified.find(c => c.pair.id === 'primary')!.status).toBe('inherited')
    expect(classified.find(c => c.pair.id === 'field-border')!.status).toBe('advisory')
  })

  it('reports failures the theme introduces or worsens', () => {
    const yellow: ThemeState = { ...createDefaultThemeState(), design: { ...createDefaultThemeState().design, primary: { kind: 'custom', color: '#fde047', algorithm: 'oklch', shades: {} } } }
    const current = checkContrast(createResolver(buildEffectivePreset(yellow, aura), 'light'))
    const primary = classifyContrast(current, baseline).find(c => c.pair.id === 'primary')!
    expect(primary.status).toBe('introduced')
    expect(primary.ratio!).toBeLessThan(primary.baselineRatio!)
  })
})
