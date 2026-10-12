import { describe, expect, it } from 'vitest'
import { parseEditorMessage, parsePreviewMessage, createApplyMessage, createReadyMessage } from './messages'
import { deserializeThemeState, parseThemeState, serializeThemeState } from './serialize'
import { createDefaultThemeState } from './types'
import { generatePalette, normalizeHex } from './palette'

describe('serialization', () => {
  it('round-trips a ThemeState', () => {
    const state = { ...createDefaultThemeState(), basePreset: 'nora' as const, overrides: { semantic: { a: '1' } } }
    expect(deserializeThemeState(serializeThemeState(state))).toEqual(state)
  })

  it('rejects garbage and unknown versions', () => {
    expect(deserializeThemeState('not json')).toBeNull()
    expect(deserializeThemeState(null)).toBeNull()
    expect(parseThemeState({ version: 99 })).toBeNull()
    expect(parseThemeState([])).toBeNull()
  })

  it('falls back to defaults for invalid fields', () => {
    const defaults = createDefaultThemeState()
    expect(parseThemeState({ version: 1, basePreset: 'evil', primaryColor: 'red', colorScheme: 'sepia', overrides: 'x' }))
      .toEqual(defaults)
  })
})

describe('palette', () => {
  it('normalizes hex colors', () => {
    expect(normalizeHex('ABC')).toBe('#aabbcc')
    expect(normalizeHex('#10B981')).toBe('#10b981')
    expect(normalizeHex('red')).toBeNull()
  })

  it('generates 11 shades with the input at 500', () => {
    const p = generatePalette('#10b981')
    expect(Object.keys(p)).toHaveLength(11)
    expect(p['500']).toBe('#10b981')
  })
})

describe('messages', () => {
  const origin = 'https://presetstudio.example'

  it('accepts same-origin, well-formed messages', () => {
    const msg = createApplyMessage(createDefaultThemeState())
    expect(parseEditorMessage({ origin, data: msg }, origin)).toEqual(msg)
    expect(parsePreviewMessage({ origin, data: createReadyMessage() }, origin)).toEqual(createReadyMessage())
  })

  it('rejects cross-origin, opaque-origin and foreign messages', () => {
    const msg = createApplyMessage(createDefaultThemeState())
    expect(parseEditorMessage({ origin: 'https://evil.example', data: msg }, origin)).toBeNull()
    expect(parseEditorMessage({ origin: 'null', data: msg }, 'null')).toBeNull()
    expect(parseEditorMessage({ origin, data: { ...msg, channel: 'other' } }, origin)).toBeNull()
    expect(parseEditorMessage({ origin, data: { ...msg, state: { version: 2 } } }, origin)).toBeNull()
    expect(parsePreviewMessage({ origin, data: msg }, origin)).toBeNull()
  })
})
