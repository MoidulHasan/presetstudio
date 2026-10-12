import { describe, expect, it } from 'vitest'
import { buildPresetOverrides } from './build'
import { formatObject, generatePresetCode, quoteString } from './export'
import { createDefaultThemeState, SHADES, type ThemeState, type TokenTree } from './types'

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
  const state: ThemeState = { ...createDefaultThemeState(), basePreset: 'lara', primaryColor: '#6366f1' }

  it('imports definePreset and the chosen base preset', () => {
    const code = generatePresetCode(state)
    expect(code).toContain('import { definePreset } from \'@primeuix/themes\'')
    expect(code).toContain('import Lara from \'@primeuix/themes/lara\'')
    expect(code).toContain('const MyPreset = definePreset(Lara, {')
    expect(code).toContain('export default MyPreset')
  })

  it('embeds the full generated 50–950 primary palette', () => {
    const code = generatePresetCode(state)
    for (const shade of SHADES) expect(code).toMatch(new RegExp(`\\n {6}${shade}: '#[0-9a-f]{6}'`))
    expect(code).toContain('500: \'#6366f1\'')
  })

  it('produces an overrides literal equal to buildPresetOverrides', () => {
    const code = generatePresetCode(state)
    const literal = code.slice(code.indexOf('definePreset(Lara, ') + 'definePreset(Lara, '.length, code.lastIndexOf(')'))
    expect(evalLiteral(literal)).toEqual(buildPresetOverrides(state))
  })

  it('lets explicit overrides win over the generated palette', () => {
    const code = generatePresetCode({
      ...state,
      overrides: { semantic: { primary: { 500: '{red.500}' }, focusRing: { width: '3px' } } },
    })
    expect(code).toContain('500: \'{red.500}\'')
    expect(code).toContain('width: \'3px\'')
  })

  it('supports a custom name and falls back on invalid ones', () => {
    expect(generatePresetCode(state, { name: 'BrandPreset' })).toContain('const BrandPreset = definePreset(')
    expect(generatePresetCode(state, { name: '1bad name' })).toContain('const MyPreset = definePreset(')
  })

  it('does not include the preview color scheme', () => {
    expect(generatePresetCode({ ...state, colorScheme: 'dark' })).toBe(generatePresetCode(state))
  })
})
