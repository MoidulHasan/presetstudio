import { describe, expect, it } from 'vitest'
import { createApplyMessage, createReadyMessage, parseEditorMessage, parsePreviewMessage } from './messages'
import { generateClassicPalette, normalizeHex } from './palette'
import {
  createWorkspace,
  deserializeThemeState,
  deserializeWorkspace,
  parseThemeState,
  parseWorkspace,
  sanitizeThemeName,
  serializeThemeState,
} from './serialize'
import { createDefaultThemeState, type ThemeState } from './types'

const custom: ThemeState = {
  ...createDefaultThemeState('nora'),
  design: {
    primary: { kind: 'custom', color: '#6366f1', algorithm: 'oklch', shades: { 50: '#ffffff' } },
    surface: { light: { kind: 'palette', name: 'stone' }, dark: { kind: 'tinted', chroma: 0.02 } },
    radius: 'large',
    density: 'compact',
    focusRing: { kind: 'outline', width: 2, offset: 2, color: 'primary' },
  },
  overrides: { semantic: { a: '1' } },
}

describe('theme state serialization', () => {
  it('round-trips a v2 ThemeState', () => {
    expect(deserializeThemeState(serializeThemeState(custom))).toEqual(custom)
  })

  it('migrates v1 states, preserving the exact v1 palette', () => {
    const migrated = parseThemeState({ version: 1, basePreset: 'lara', primaryColor: '#6366F1', overrides: { x: '1' }, colorScheme: 'dark' })!
    expect(migrated.version).toBe(2)
    expect(migrated.basePreset).toBe('lara')
    expect(migrated.design.primary).toEqual({ kind: 'custom', color: '#6366f1', algorithm: 'classic', shades: {} })
    expect(migrated.overrides).toEqual({ x: '1' })
  })

  it('rejects garbage and unknown versions', () => {
    expect(deserializeThemeState('not json')).toBeNull()
    expect(deserializeThemeState(null)).toBeNull()
    expect(parseThemeState({ version: 99 })).toBeNull()
    expect(parseThemeState([])).toBeNull()
  })

  it('falls back to defaults for invalid fields', () => {
    const parsed = parseThemeState({
      version: 2,
      basePreset: 'evil',
      design: {
        primary: { kind: 'custom', color: 'red' },
        surface: { light: { kind: 'palette', name: 'emerald' }, dark: { kind: 'tinted', chroma: 9 } },
        radius: 'huge',
        density: 1,
        focusRing: { kind: 'outline', width: 999, offset: 'x', color: 'javascript:alert(1)' },
      },
      overrides: 'x',
    })!
    expect(parsed.basePreset).toBe('aura')
    expect(parsed.design.primary).toEqual({ kind: 'base' })
    expect(parsed.design.surface.light).toEqual({ kind: 'base' })
    expect(parsed.design.surface.dark).toEqual({ kind: 'tinted', chroma: 0.04 })
    expect(parsed.design.radius).toBe('base')
    expect(parsed.design.density).toBe('base')
    expect(parsed.design.focusRing).toEqual({ kind: 'outline', width: 8, offset: 2, color: 'primary' })
    expect(parsed.overrides).toEqual({})
  })
})

describe('workspace serialization', () => {
  it('round-trips a workspace', () => {
    const ws = createWorkspace(custom)
    expect(deserializeWorkspace(JSON.stringify(ws))).toEqual(ws)
  })

  it('drops invalid and duplicate themes and repairs activeId', () => {
    const ws = createWorkspace(custom)
    const doc = ws.themes[0]!
    const parsed = parseWorkspace({ ...ws, activeId: 'missing', themes: [doc, doc, { id: 'x', theme: { version: 99 } }, 'junk'] })!
    expect(parsed.themes).toHaveLength(1)
    expect(parsed.activeId).toBe(doc.id)
    expect(parseWorkspace({ version: 2, activeId: 'a', themes: [] })).toBeNull()
  })

  it('sanitizes theme names', () => {
    expect(sanitizeThemeName('  Brand\u0000 theme  ')).toBe('Brand theme')
    expect(sanitizeThemeName('')).toBe('Untitled theme')
    expect(sanitizeThemeName('x'.repeat(200))).toHaveLength(60)
  })
})

describe('palette helpers', () => {
  it('normalizes hex colors', () => {
    expect(normalizeHex('ABC')).toBe('#aabbcc')
    expect(normalizeHex('#10B981')).toBe('#10b981')
    expect(normalizeHex('red')).toBeNull()
  })

  it('generates 11 classic shades with the input at 500', () => {
    const p = generateClassicPalette('#10b981')
    expect(Object.keys(p)).toHaveLength(11)
    expect(p['500']).toBe('#10b981')
  })
})

describe('messages', () => {
  const origin = 'https://presetstudio.example'

  it('accepts same-origin, well-formed messages', () => {
    const msg = createApplyMessage(custom, 'dark', 'dashboard')
    expect(parseEditorMessage({ origin, data: msg }, origin)).toEqual(msg)
    expect(parsePreviewMessage({ origin, data: createReadyMessage() }, origin)).toEqual(createReadyMessage())
  })

  it('rejects cross-origin, opaque-origin and foreign messages', () => {
    const msg = createApplyMessage(custom, 'light')
    expect(parseEditorMessage({ origin: 'https://evil.example', data: msg }, origin)).toBeNull()
    expect(parseEditorMessage({ origin: 'null', data: msg }, 'null')).toBeNull()
    expect(parseEditorMessage({ origin, data: { ...msg, channel: 'other' } }, origin)).toBeNull()
    expect(parseEditorMessage({ origin, data: { ...msg, state: { version: 99 } } }, origin)).toBeNull()
    expect(parseEditorMessage({ origin, data: { ...msg, colorScheme: 'sepia' } }, origin)).toBeNull()
    expect(parseEditorMessage({ origin, data: { ...msg, template: '../admin' } }, origin)).toBeNull()
    expect(parsePreviewMessage({ origin, data: msg }, origin)).toBeNull()
  })
})
