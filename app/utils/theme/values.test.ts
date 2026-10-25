import Aura from '@primeuix/themes/aura'
import Lara from '@primeuix/themes/lara'
import Material from '@primeuix/themes/material'
import Nora from '@primeuix/themes/nora'
import { describe, expect, it } from 'vitest'
import { describePreset } from './schema'
import { countSemanticOverrides, groupSemanticTokens, matchesQuery, semanticPath, tokenSource } from './semantic'
import { deletePath, getPath, setPath } from './tree'
import type { TokenTree } from './types'
import { isSafeTokenKey, referenceFor, sanitizeTokenTree, sanitizeTokenValue } from './values'

describe('sanitizeTokenValue', () => {
  it('accepts every token value of the four base presets', () => {
    for (const preset of [Aura, Lara, Nora, Material]) {
      const rejected = describePreset(preset as unknown as TokenTree)
        .filter(t => sanitizeTokenValue(t.defaultValue) === null)
        .map(t => `${t.name}: ${t.defaultValue}`)
      expect(rejected).toEqual([])
    }
  })

  it('accepts common CSS values and references', () => {
    for (const v of ['#10b981', '{primary.500}', '0.5rem 0.75rem', 'rgba(0,0,0,.4)', 'color-mix(in srgb, {primary.color}, transparent 80%)', '0 0 0 0.2rem {primary.200}', '0.2s', '600', 'none', '"Inter", sans-serif']) {
      expect(sanitizeTokenValue(v)).toBe(v)
    }
    expect(sanitizeTokenValue('  #fff  ')).toBe('#fff')
    expect(sanitizeTokenValue(12)).toBe('12')
  })

  it('rejects values that could escape the CSS declaration or load resources', () => {
    for (const v of [
      'red; } body { display: none',
      'red}',
      '{primary.500',
      '</style><script>',
      'url(https://evil.example/x.png)',
      'expression(alert(1))',
      '@import "x"',
      'calc(1px',
      '"unbalanced',
      'a\\b',
      '/* comment */ red',
      '',
      'x'.repeat(201),
    ]) {
      expect(sanitizeTokenValue(v), v).toBeNull()
    }
    expect(sanitizeTokenValue(Number.NaN)).toBeNull()
    expect(sanitizeTokenValue({})).toBeNull()
  })

  it('drops unsafe leaves from override trees', () => {
    expect(sanitizeTokenTree({ a: '#fff', b: 'red;}', c: { d: 'url(x)', e: '1px' }, f: { g: '}' } })).toEqual({ a: '#fff', c: { e: '1px' } })
  })

  it('drops keys that could break out of a CSS variable name', () => {
    const tree = {
      semantic: {
        'primary': { 500: '#000' },
        'x;}body{background:red': '#fff',
        'a b': '1px',
        'a-b': '1px',
        '': '1px',
        'é': '1px',
        ['k'.repeat(65)]: '1px',
        'list': { 'gap': '2px', 'gap}': '3px' },
      },
      components: { button: { css: '.p-button{color:red}', root: { borderRadius: '4px' } } },
    }
    expect(sanitizeTokenTree(tree as TokenTree)).toEqual({
      semantic: { primary: { 500: '#000' }, list: { gap: '2px' } },
      components: { button: { root: { borderRadius: '4px' } } },
    })
  })

  it('keeps every key of the four base presets', () => {
    for (const preset of [Aura, Lara, Nora, Material]) {
      const tree = preset as unknown as TokenTree
      const unsafe = describePreset(tree).filter(t => !t.path.every(isSafeTokenKey)).map(t => t.path.join('.'))
      expect(unsafe).toEqual([])
    }
  })

  it('builds references from token names', () => {
    expect(referenceFor('form-field-padding-x')).toBe('{form.field.padding.x}')
  })
})

describe('tree helpers', () => {
  const tree: TokenTree = { semantic: { primary: { 500: '#000' }, list: { gap: '2px' } } }

  it('gets, sets and deletes immutably', () => {
    expect(getPath(tree, ['semantic', 'primary', '500'])).toBe('#000')
    const set = setPath(tree, ['semantic', 'colorScheme', 'dark', 'text', 'color'], '#fff')
    expect(getPath(set, ['semantic', 'colorScheme', 'dark', 'text', 'color'])).toBe('#fff')
    expect(getPath(tree, ['semantic', 'colorScheme'])).toBeUndefined()
    const deleted = deletePath(tree, ['semantic', 'primary', '500'])
    expect(deleted).toEqual({ semantic: { list: { gap: '2px' } } })
    expect(deletePath(tree, ['nope', 'x'])).toBe(tree)
  })
})

describe('semantic grouping', () => {
  const tokens = describePreset(Aura as unknown as TokenTree)

  it('groups shared and scheme tokens for the edited scheme', () => {
    const groups = groupSemanticTokens(tokens, 'dark')
    const keys = groups.map(g => g.key)
    expect(keys.slice(0, 3)).toEqual(['primary', 'surface', 'text'])
    const all = groups.flatMap(g => g.tokens)
    expect(all.every(t => t.layer === 'semantic' && t.scheme !== 'light')).toBe(true)
    expect(all.some(t => t.name === 'form-field-padding-x' && t.scheme === null)).toBe(true)
    expect(groups.find(g => g.key === 'general')!.tokens.map(t => t.name)).toContain('transition-duration')
  })

  it('strips the colorScheme prefix from semantic paths', () => {
    const token = tokens.find(t => t.name === 'form-field-focus-border-color' && t.scheme === 'light')!
    expect(semanticPath(token)).toEqual(['formField', 'focusBorderColor'])
  })

  it('reports where a value comes from', () => {
    const token = tokens.find(t => t.name === 'primary-500')!
    expect(tokenSource(token, {}, {})).toBe('base')
    expect(tokenSource(token, {}, { semantic: { primary: { 500: '#000' } } })).toBe('design')
    expect(tokenSource(token, { semantic: { primary: { 500: '#111' } } }, { semantic: { primary: { 500: '#000' } } })).toBe('custom')
  })

  it('filters by label, name or value and counts overrides', () => {
    const token = tokens.find(t => t.name === 'form-field-focus-border-color')!
    expect(matchesQuery(token, 'focus border')).toBe(true)
    expect(matchesQuery(token, 'form-field-focus')).toBe(true)
    expect(matchesQuery(token, '#10b981', '#10b981')).toBe(true)
    expect(matchesQuery(token, 'shadow')).toBe(false)
    expect(countSemanticOverrides({ semantic: { a: '1', b: { c: '2' } }, primitive: { x: '1' } })).toBe(2)
  })
})

describe('shadowed shared tokens', () => {
  it('hides a shared token when the scheme defines the same token', async () => {
    const Lara = (await import('@primeuix/themes/lara')).default as unknown as TokenTree
    const names = groupSemanticTokens(describePreset(Lara), 'light').flatMap(g => g.tokens).filter(t => t.name === 'focus-ring-shadow')
    expect(names).toHaveLength(1)
    expect(names[0]!.scheme).toBe('light')
  })
})
