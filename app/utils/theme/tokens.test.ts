import { $dt, Theme } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'
import Lara from '@primeuix/themes/lara'
import Material from '@primeuix/themes/material'
import Nora from '@primeuix/themes/nora'
import { describe, expect, it } from 'vitest'
import { createResolver, flattenPreset, referenceName, tokenName } from './tokens'
import type { ColorScheme, TokenTree } from './types'

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
