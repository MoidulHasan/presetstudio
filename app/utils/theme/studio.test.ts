import Aura from '@primeuix/themes/aura'
import Lara from '@primeuix/themes/lara'
import Material from '@primeuix/themes/material'
import Nora from '@primeuix/themes/nora'
import { describe, expect, it } from 'vitest'
import { buildEffectivePreset } from './build'
import { clearRecolor, recolorOverrides, recolorValue, withoutComponent } from './recolor'
import { describePreset } from './schema'
import { buttonVariants, propertyState, stateMatrix } from './studio'
import { createResolver } from './tokens'
import { createDefaultDesign, type TokenTree } from './types'

const presets = { aura: Aura, lara: Lara, nora: Nora, material: Material } as unknown as Record<string, TokenTree>

describe('buttonVariants', () => {
  it('has one row per severity plus link, in every preset', () => {
    for (const preset of Object.values(presets)) {
      const rows = buttonVariants(describePreset(preset))
      expect(rows.map(r => r.key)).toEqual(['primary', 'secondary', 'success', 'info', 'warn', 'help', 'danger', 'contrast', 'plain', 'link'])
      const info = rows.find(r => r.key === 'info')!
      expect(Object.keys(info.styles)).toEqual(['root', 'outlined', 'text'])
      expect(info.tokens.every(t => t.scheme !== null)).toBe(true)
    }
  })
})

describe('stateMatrix', () => {
  it('reads properties and states from token names', () => {
    expect(propertyState(['root', 'info', 'hoverBorderColor'])).toEqual(['borderColor', 'hover'])
    expect(propertyState(['root', 'info', 'focusRing', 'color'])).toEqual(['focusRing', 'default'])
    expect(propertyState(['root', 'info', 'focusRing', 'shadow'])).toBeNull()
    const info = buttonVariants(describePreset(presets.aura!)).find(r => r.key === 'info')!
    const filled = stateMatrix(info.styles.root!)
    expect(filled.map(r => r.label)).toEqual(['Background', 'Border', 'Text', 'Focus ring'])
    const bg = filled[0]!.cells
    expect(Object.keys(bg)).toEqual(['default', 'hover', 'active'])
    expect(bg.hover!.light!.path.at(-1)).toBe('hoverBackground')
    expect(bg.hover!.dark!.scheme).toBe('dark')
  })
})

describe('recolor', () => {
  const aura = presets.aura!
  const resolvers = { light: createResolver(aura, 'light'), dark: createResolver(aura, 'dark') }

  it('moves references to another palette, keeping shades and literals', () => {
    expect(recolorValue('{sky.600}', resolvers.light, 'rose')).toBe('{rose.600}')
    expect(recolorValue('{primary.hover.color}', resolvers.light, 'rose')).toBe('{rose.600}')
    expect(recolorValue('{primary.hover.color}', resolvers.dark, 'rose')).toBe('{rose.300}')
    expect(recolorValue('0 0 0 0.2rem color-mix(in srgb, {sky.400}, transparent 80%)', resolvers.dark, 'rose')).toBe('0 0 0 0.2rem color-mix(in srgb, {rose.400}, transparent 80%)')
    expect(recolorValue('#ffffff', resolvers.light, 'rose')).toBeNull()
  })

  it('recolors a whole variant in both schemes in every preset', () => {
    for (const preset of Object.values(presets)) {
      const descriptors = describePreset(preset)
      const r = { light: createResolver(preset, 'light'), dark: createResolver(preset, 'dark') }
      const info = buttonVariants(descriptors).find(v => v.key === 'info')!
      const overrides = recolorOverrides({}, info.tokens, r, 'button', 'info', { kind: 'palette', name: 'rose' })
      const state = { design: createDefaultDesign(), overrides }
      for (const scheme of ['light', 'dark'] as const) {
        const before = r[scheme]
        const after = createResolver(buildEffectivePreset(state, preset), scheme)
        for (const name of ['button-info-background', 'button-info-hover-background', 'button-outlined-info-color', 'button-text-info-active-background']) {
          // Every palette reference now points at rose…
          expect(String(after.resolve(name)!.raw), `${name} ${scheme}`).toMatch(/\{rose\.\d+\}/)
          // …at the shade the preset used (single references).
          const shade = before.resolve(name)!.chain.at(-1)!.split('-').at(-1)!
          if (/^\d+$/.test(shade)) expect(after.resolve(name)!.value, `${name} ${scheme}`).toBe(after.resolve(`rose-${shade}`)!.value)
        }
        expect(after.resolve('button-success-background')!.value).toBe(before.resolve('button-success-background')!.value)
      }
      expect(clearRecolor(overrides, info.tokens, 'button', 'info')).toEqual({})
    }
  })

  it('generates a palette for custom colors and strips it for comparing', () => {
    const descriptors = describePreset(aura)
    const info = buttonVariants(descriptors).find(v => v.key === 'info')!
    const overrides = recolorOverrides({}, info.tokens, resolvers, 'button', 'info', { kind: 'custom', color: '#7c3aed' })
    const after = createResolver(buildEffectivePreset({ design: createDefaultDesign(), overrides }, aura), 'light')
    expect(after.resolve('button-info-background')!.value).toBe('#7c3aed')
    expect(withoutComponent(overrides, 'button')).toEqual({})
  })
})
