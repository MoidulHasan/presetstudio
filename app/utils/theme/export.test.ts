import Lara from '@primeuix/themes/lara'
import { describe, expect, it } from 'vitest'
import { buildPresetOverrides } from './build'
import { countTokens, formatObject, generateNuxtSnippets, generatePresetCode, generateVueSnippet, presetFileBase, presetIdentifier, quoteString } from './export'
import { createDefaultDesign, createDefaultThemeState, SHADES, type ThemeState, type TokenTree } from './types'

const evalLiteral = (code: string): unknown => new Function(`return (${code})`)()

describe('formatObject', () => {
  it('round-trips a token tree as a valid JS literal', () => {
    const tree: TokenTree = {
      'semantic': { primary: { 50: '#fff', 950: '#000' }, focusRing: { width: '2px' } },
      'kebab-key': 'x',
      'quote': 'it\'s "fine"\nnew line \\ backslash',
      'n': 1.5,
    }
    expect(evalLiteral(formatObject(tree))).toEqual(tree)
  })

  it('quotes keys only when needed', () => {
    const code = formatObject({ 'a': '1', '50': '2', 'b-c': '3', '05': '4' })
    expect(code).toContain('  a: \'1\'')
    expect(code).toContain('  50: \'2\'')
    expect(code).toContain('  \'b-c\': \'3\'')
    expect(code).toContain('  \'05\': \'4\'')
  })

  it('formats empty objects', () => {
    expect(formatObject({})).toBe('{}')
  })
})

describe('quoteString', () => {
  it('escapes quotes, backslashes and line terminators', () => {
    const value = 'a\'b\\c\nd\u2028e'
    expect(evalLiteral(quoteString(value))).toBe(value)
  })
})

describe('generatePresetCode', () => {
  const lara = Lara as unknown as TokenTree
  const state: ThemeState = {
    ...createDefaultThemeState('lara'),
    design: { ...createDefaultDesign(), primary: { kind: 'custom', color: '#6366f1', algorithm: 'oklch', shades: {} } },
  }

  it('imports definePreset and the chosen base preset', () => {
    const code = generatePresetCode(state, lara)
    expect(code).toContain('import { definePreset } from \'@primeuix/themes\'')
    expect(code).toContain('import Lara from \'@primeuix/themes/lara\'')
    expect(code).toContain('const MyPreset = definePreset(Lara, {')
    expect(code).toContain('export default MyPreset')
  })

  it('exports an empty override object for an untouched theme', () => {
    expect(generatePresetCode(createDefaultThemeState('lara'), lara)).toContain('definePreset(Lara, {})')
  })

  it('embeds the full generated 50–950 primary palette', () => {
    const code = generatePresetCode(state, lara)
    for (const shade of SHADES) expect(code).toMatch(new RegExp(`\\n {6}${shade}: '#[0-9a-f]{6}'`))
    expect(code).toContain('500: \'#6366f1\'')
  })

  it('produces an overrides literal equal to buildPresetOverrides', () => {
    const dense = { ...state, design: { ...state.design, density: 'compact' as const, radius: 'large' as const } }
    const code = generatePresetCode(dense, lara)
    const literal = code.slice(code.indexOf('definePreset(Lara, ') + 'definePreset(Lara, '.length, code.lastIndexOf(')'))
    expect(evalLiteral(literal)).toEqual(buildPresetOverrides(dense, lara))
  })

  it('lets explicit overrides win over the generated palette', () => {
    const code = generatePresetCode({
      ...state,
      overrides: { semantic: { primary: { 500: '{red.500}' }, focusRing: { width: '3px' } } },
    }, lara)
    expect(code).toContain('500: \'{red.500}\'')
    expect(code).toContain('width: \'3px\'')
  })

  it('supports a custom name and falls back on invalid ones', () => {
    expect(generatePresetCode(state, lara, { name: 'BrandPreset' })).toContain('const BrandPreset = definePreset(')
    expect(generatePresetCode(state, lara, { name: '1bad name' })).toContain('const MyPreset = definePreset(')
  })
})

describe('naming and snippets', () => {
  it('derives a valid identifier and file name from the theme name', () => {
    expect(presetIdentifier('Brand theme')).toBe('BrandThemePreset')
    expect(presetIdentifier('acme preset')).toBe('AcmePreset')
    expect(presetIdentifier('2025 café-UI!')).toBe('CafeUIPreset')
    expect(presetIdentifier('  ')).toBe('MyPreset')
    expect(presetFileBase('Brand theme')).toBe('brand-theme')
    expect(presetFileBase('!!!')).toBe('my-preset')
  })

  it('generates Nuxt snippets with a { preset, options } theme module', () => {
    const { themeFile, config } = generateNuxtSnippets('BrandPreset', 'brand')
    expect(themeFile).toContain('import BrandPreset from \'./brand\'')
    expect(themeFile).toContain('preset: BrandPreset,')
    expect(config).toContain('importTheme: { as: \'AppTheme\', from: \'~/themes/theme.ts\' }')
  })

  it('generates a Vue setup snippet', () => {
    const code = generateVueSnippet('BrandPreset', 'brand')
    expect(code).toContain('import BrandPreset from \'./themes/brand\'')
    expect(code).toContain('preset: BrandPreset,')
  })

  it('counts changed tokens', () => {
    expect(countTokens({})).toBe(0)
    expect(countTokens({ semantic: { primary: { 500: '#000', 600: '#111' }, x: '1' } })).toBe(3)
  })
})
