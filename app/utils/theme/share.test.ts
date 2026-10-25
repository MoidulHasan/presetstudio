import { describe, expect, it } from 'vitest'
import {
  MAX_SHARE_TOKEN_LENGTH,
  MAX_THEME_SIZE,
  THEME_FILE_FORMAT,
  decodeShareToken,
  encodeShareToken,
  parseThemeFile,
  shareTokenFromHash,
  shareUrl,
  startPath,
  startTokenFromHash,
  themeFile,
} from './share'
import { createDefaultDesign, createDefaultThemeState, type ThemeState } from './types'

const theme: ThemeState = {
  ...createDefaultThemeState('lara'),
  design: { ...createDefaultDesign(), primary: { kind: 'custom', color: '#e11d48', algorithm: 'oklch', shades: { 700: '#7f1d1d' } }, radius: 'large', density: 'compact' },
  overrides: { semantic: { list: { gap: '3px' } }, components: { button: { root: { borderRadius: '9px' } } } },
}

const deflateRaw = async (text: string) =>
  new Uint8Array(await new Response(new Blob([text]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer())
const base64Url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

describe('theme files', () => {
  it('round-trips a theme with its name', () => {
    expect(parseThemeFile(themeFile('Brand', theme))).toEqual({ name: 'Brand', theme })
  })

  it('accepts a bare theme state', () => {
    expect(parseThemeFile(JSON.stringify(theme))).toEqual({ name: 'Imported theme', theme })
  })

  it('rejects other formats, versions, garbage and oversized files', () => {
    expect(parseThemeFile('not json')).toBeNull()
    expect(parseThemeFile('[]')).toBeNull()
    expect(parseThemeFile(JSON.stringify({ format: 'other', theme }))).toBeNull()
    expect(parseThemeFile(JSON.stringify({ format: THEME_FILE_FORMAT, version: 2, name: 'x', theme }))).toBeNull()
    expect(parseThemeFile(JSON.stringify({ format: THEME_FILE_FORMAT, version: 1, name: 'x', theme: { version: 99 } }))).toBeNull()
    expect(parseThemeFile(`${themeFile('x', theme)}${' '.repeat(MAX_THEME_SIZE)}`)).toBeNull()
  })

  it('sanitizes names, keys and values from the file', () => {
    const file = JSON.stringify({
      format: THEME_FILE_FORMAT,
      version: 1,
      name: '  <b>Evil</b>\u0000 name  ',
      theme: { ...theme, overrides: { semantic: { 'x;}body{background:red': '#fff', 'list': { gap: 'red;}' }, '__proto__': { polluted: '1' } } } },
    })
    const parsed = parseThemeFile(file)!
    expect(parsed.name).toBe('<b>Evil</b> name')
    expect(parsed.theme.overrides).toEqual({})
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })
})

describe('share links', () => {
  it('round-trips a theme through a compact, URL-safe token', async () => {
    const token = await encodeShareToken('Brand', theme)
    expect(token).toMatch(/^[\w-]+$/)
    expect(token.length).toBeLessThan(JSON.stringify(theme).length)
    expect(await decodeShareToken(token)).toEqual({ name: 'Brand', theme })
  })

  it('puts the token in the hash and reads it back', async () => {
    const token = await encodeShareToken('Brand', theme)
    const url = new URL(shareUrl('https://presetstudio.example', token))
    expect(url.pathname).toBe('/editor')
    expect(url.search).toBe('')
    expect(shareTokenFromHash(url.hash)).toBe(token)
    expect(shareTokenFromHash('')).toBeNull()
    expect(shareTokenFromHash('#other=1')).toBeNull()
  })

  it('keeps landing page choices apart from shared themes', async () => {
    const token = await encodeShareToken('Brand', theme)
    const url = new URL(startPath(token), 'https://presetstudio.example')
    expect(url.pathname).toBe('/editor')
    expect(startTokenFromHash(url.hash)).toBe(token)
    expect(shareTokenFromHash(url.hash)).toBeNull()
    expect(startTokenFromHash(new URL(shareUrl('https://presetstudio.example', token)).hash)).toBeNull()
  })

  it('rejects tampered, malformed and oversized tokens', async () => {
    const token = await encodeShareToken('Brand', theme)
    expect(await decodeShareToken('')).toBeNull()
    expect(await decodeShareToken(`${token}!`)).toBeNull()
    expect(await decodeShareToken('a b')).toBeNull()
    expect(await decodeShareToken(token.slice(0, token.length / 2))).toBeNull()
    expect(await decodeShareToken(`${token.slice(0, 10)}AAAA${token.slice(14)}`)).toBeNull()
    expect(await decodeShareToken('A'.repeat(MAX_SHARE_TOKEN_LENGTH + 1))).toBeNull()
    // Valid compression of something that isn't a theme.
    expect(await decodeShareToken(base64Url(await deflateRaw('{"hello":"world"}')))).toBeNull()
    expect(await decodeShareToken(base64Url(await deflateRaw('ÿþ not json')))).toBeNull()
  })

  it('stops decompressing a deflate bomb at the size limit', async () => {
    // A few KB of token that would inflate to several MB.
    const bomb = await deflateRaw(`{"format":"${THEME_FILE_FORMAT}","version":1,"name":"${'x'.repeat(8 * 1024 * 1024)}"}`)
    const token = base64Url(bomb)
    expect(token.length).toBeLessThan(MAX_SHARE_TOKEN_LENGTH)
    expect(await decodeShareToken(token)).toBeNull()
  })

  it('sanitizes what a link carries', async () => {
    const evil = await deflateRaw(JSON.stringify({
      format: THEME_FILE_FORMAT,
      version: 1,
      name: 'x'.repeat(500),
      theme: { ...theme, overrides: { components: { button: { css: '.p-button{}', root: { 'borderRadius;}*{': '1px', 'borderRadius': 'url(//evil)' } } } } },
    }))
    const shared = (await decodeShareToken(base64Url(evil)))!
    expect(shared.name).toHaveLength(60)
    expect(shared.theme.overrides).toEqual({})
  })
})
