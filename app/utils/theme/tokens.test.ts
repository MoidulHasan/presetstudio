import { $dt, Theme } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'
import Lara from '@primeuix/themes/lara'
import Material from '@primeuix/themes/material'
import Nora from '@primeuix/themes/nora'
import { describe, expect, it } from 'vitest'
import { buildEffectivePreset, buildPresetOverrides } from './build'
import { mergeOverrides } from './merge'
import { createResolver, flattenPreset, referenceName, tokenName } from './tokens'
import { createDefaultDesign, type ColorScheme, type DesignSettings, type TokenTree } from './types'

/**
 * The engine emits `light-dark(a, b)` (possibly inside a larger value) for scheme-dependent
 * tokens. Values may contain commas themselves, so try every top-level split.
 */
function candidatesFor(value: string, scheme: ColorScheme): string[] {
  const at = value.indexOf('light-dark(')
  if (at < 0) return [value]
  const open = at + 'light-dark('.length
  let depth = 1
  let close = open
  const commas: number[] = []
  for (; close < value.length && depth > 0; close++) {
    const c = value[close]
    if (c === '(') depth++
    else if (c === ')') depth--
    else if (c === ',' && depth === 1) commas.push(close)
  }
  const inner = value.slice(open, close - 1)
  return commas.map((i) => {
    const side = scheme === 'light' ? value.slice(open, i) : value.slice(i + 1, close - 1)
    return `${value.slice(0, at)}${side.trim()}${value.slice(close)}`
  }).concat(inner ? [] : [value])
}

const presets = { Aura, Lara, Nora, Material } as unknown as Record<string, TokenTree>

describe('token names', () => {
  it('matches the engine naming rules', () => {
    expect(tokenName(['semantic', 'formField', 'paddingX'])).toBe('form-field-padding-x')
    expect(tokenName(['semantic', 'colorScheme', 'light', 'primary', 'contrastColor'])).toBe('primary-contrast-color')
    expect(tokenName(['components', 'button', 'colorScheme', 'dark', 'root', 'primary', 'hoverBackground'])).toBe('button-primary-hover-background')
    expect(tokenName(['primitive', 'emerald', '500'])).toBe('emerald-500')
    expect(referenceName('{form.field.invalid.placeholder.color}')).toBe('form-field-invalid-placeholder-color')
  })

  it('names flattened tokens like tokenName does (names are built incrementally)', () => {
    for (const preset of [Aura, Lara, Nora, Material]) {
      for (const scheme of ['light', 'dark'] as const) {
        const wrong = [...flattenPreset(preset as unknown as TokenTree, scheme)].filter(([name, entry]) => name !== entry.name || name !== tokenName(entry.path))
        expect(wrong).toEqual([])
      }
    }
  })
})

describe('createResolver', () => {
  const tree: TokenTree = {
    primitive: { blue: { 500: '#3b82f6' }, red: { 500: '#ef4444' } },
    semantic: {
      primary: { 500: '{blue.500}' },
      focusRing: { shadow: '0 0 0 2px {primary.color}' },
      loopA: '{loop.b}',
      loopB: '{loop.a}',
      colorScheme: {
        light: { primary: { color: '{primary.500}' } },
        dark: { primary: { color: '{red.500}' } },
      },
    },
    components: { button: { colorScheme: { light: { root: { primary: { background: '{primary.color}' } } } } } },
  }

  it('follows reference chains', () => {
    const r = createResolver(tree, 'light').resolve('button-primary-background')!
    expect(r.value).toBe('#3b82f6')
    expect(r.chain).toEqual(['button-primary-background', 'primary-color', 'primary-500', 'blue-500'])
  })

  it('uses scheme-specific values', () => {
    expect(createResolver(tree, 'dark').resolve('primary-color')!.value).toBe('#ef4444')
  })

  it('substitutes references embedded in larger values', () => {
    expect(createResolver(tree, 'light').resolve('focus-ring-shadow')!.value).toBe('0 0 0 2px #3b82f6')
  })

  it('reports missing and circular references instead of throwing', () => {
    const r = createResolver(tree, 'light')
    expect(r.resolve('loop-a')!.unresolved).toContain('loop-a')
    expect(r.resolveValue('{nope.token}').unresolved).toEqual(['nope-token'])
    expect(r.resolve('does-not-exist')).toBeNull()
  })

  // Golden test: our resolver must agree with the real engine for every token.
  for (const [name, preset] of Object.entries(presets)) {
    for (const scheme of ['light', 'dark'] as ColorScheme[]) {
      it(`matches the engine for every ${name} token (${scheme})`, () => {
        Theme.setTheme({ preset, options: { darkModeSelector: '.dark' } })
        const resolver = createResolver(preset, scheme)
        const mismatches: string[] = []
        for (const tokenName of flattenPreset(preset, scheme).keys()) {
          const engine = $dt(tokenName.replace(/-/g, '.')).value as unknown
          const expected = typeof engine === 'object' && engine !== null
            ? (engine as Record<string, { value: unknown }>)[scheme]?.value
            : engine
          if (expected === undefined) continue
          const ours = resolver.resolve(tokenName)!.value
          if (!candidatesFor(String(expected), scheme).some(c => c.toLowerCase() === ours.toLowerCase())) mismatches.push(`${tokenName}: ${ours} != ${String(expected)}`)
        }
        expect(mismatches).toEqual([])
      })
    }
  }
})

describe('flattening edited presets (cached per subtree)', () => {
  const designs: Array<Partial<DesignSettings>> = [
    {},
    { primary: { kind: 'custom', color: '#e11d48', algorithm: 'oklch', shades: { 500: '#ff0000' } } },
    { surface: { light: { kind: 'tinted', chroma: 0.02 }, dark: { kind: 'palette', name: 'stone' } }, tintedBackgrounds: true },
    { status: { ...createDefaultDesign().status, info: { kind: 'palette', name: 'violet' }, danger: { kind: 'custom', color: '#991b1b' } } },
    { radius: 'large', density: 'compact' },
    { density: 'custom', densityScale: 1.3, focusRing: { kind: 'outline', width: 3, offset: 1, color: '#0ea5e9' } },
  ]
  // Raw overrides, including a shared value next to a scheme-specific one in the base preset.
  const overrides: TokenTree = {
    semantic: { primary: { color: '#123456' }, list: { gap: '3px' } },
    components: { button: { root: { borderRadius: '9px' }, colorScheme: { dark: { root: { primary: { background: '#abcdef' } } } } } },
  }
  const entriesOf = (tree: TokenTree, scheme: ColorScheme) =>
    [...flattenPreset(tree, scheme)].map(([name, e]) => `${name}=${e.raw}@${e.path.join('.')}`)

  it('gives the same entries as flattening a full copy, cold and warm', () => {
    for (const preset of [Aura, Lara, Nora, Material]) {
      const base = preset as unknown as TokenTree
      for (const design of designs) {
        const state = { design: { ...createDefaultDesign(), ...design }, overrides }
        for (const scheme of ['light', 'dark'] as const) {
          // A full copy shares nothing with the base preset, so nothing is cached for it.
          const expected = entriesOf(mergeOverrides(base, buildPresetOverrides(state, base)), scheme)
          expect(entriesOf(buildEffectivePreset(state, base), scheme)).toEqual(expected)
          expect(entriesOf(buildEffectivePreset(state, base), scheme)).toEqual(expected)
        }
      }
    }
  })
})
