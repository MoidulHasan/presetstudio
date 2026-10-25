import { parseThemeState, sanitizeThemeName } from './serialize'
import type { ThemeState } from './types'

// Moving themes between browsers and people, without a server:
// - theme files: the theme as JSON (export / import);
// - share links: the same JSON compressed into the URL hash (`/editor#theme=…`), which never
//   reaches a server. Everything decoded here is untrusted: it's size-limited before and while
//   decompressing, and the theme goes through `parseThemeState` (validated and sanitized).

export const THEME_FILE_FORMAT = 'presetstudio-theme'
export const THEME_FILE_VERSION = 1

/** Largest theme file, or decompressed share link, accepted. A theme is a few KB. */
export const MAX_THEME_SIZE = 512 * 1024
/** Share tokens longer than this aren't decoded at all. */
export const MAX_SHARE_TOKEN_LENGTH = 200_000

const DEFAULT_IMPORT_NAME = 'Imported theme'

export interface SharedTheme {
  name: string
  theme: ThemeState
}

function envelope(name: string, theme: ThemeState) {
  return { format: THEME_FILE_FORMAT, version: THEME_FILE_VERSION, name, theme }
}

/** Reads a theme file's (or a link's) JSON: the envelope, or a bare theme state. */
function parseShared(data: unknown): SharedTheme | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null
  const d = data as Record<string, unknown>
  if (d.format === THEME_FILE_FORMAT) {
    if (d.version !== THEME_FILE_VERSION) return null
    const theme = parseThemeState(d.theme)
    return theme ? { name: sanitizeThemeName(d.name, DEFAULT_IMPORT_NAME), theme } : null
  }
  const theme = parseThemeState(d)
  return theme ? { name: DEFAULT_IMPORT_NAME, theme } : null
}

// --- Theme files ------------------------------------------------------------------------

/** A theme as a downloadable JSON file. */
export function themeFile(name: string, theme: ThemeState): string {
  return `${JSON.stringify(envelope(name, theme), null, 2)}\n`
}

export function parseThemeFile(text: string): SharedTheme | null {
  if (text.length > MAX_THEME_SIZE) return null
  try {
    return parseShared(JSON.parse(text))
  }
  catch {
    return null
  }
}

// --- Share links -------------------------------------------------------------------------

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(token: string): Uint8Array {
  const base64 = token.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((token.length + 3) % 4)
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0))
}

async function deflate(text: string): Promise<Uint8Array> {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('deflate-raw'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

/** Decompresses, giving up as soon as the output passes `limit` bytes (no zip bombs). */
async function inflate(bytes: Uint8Array, limit: number): Promise<string | null> {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.length
    if (size > limit) {
      await reader.cancel()
      return null
    }
    chunks.push(value)
  }
  const all = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    all.set(chunk, offset)
    offset += chunk.length
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(all)
}

/** A theme as a compact token for a share link's hash. */
export async function encodeShareToken(name: string, theme: ThemeState): Promise<string> {
  return toBase64Url(await deflate(JSON.stringify(envelope(name, theme))))
}

/** The theme in a share token, or null for anything invalid, oversized or tampered with. */
export async function decodeShareToken(token: string): Promise<SharedTheme | null> {
  if (!token || token.length > MAX_SHARE_TOKEN_LENGTH || !/^[\w-]+$/.test(token)) return null
  try {
    const json = await inflate(fromBase64Url(token), MAX_THEME_SIZE)
    return json === null ? null : parseShared(JSON.parse(json))
  }
  catch {
    return null
  }
}

const SHARE_PARAM = 'theme'

/** The editor URL that opens a shared theme (the token travels in the hash, never to a server). */
export function shareUrl(origin: string, token: string): string {
  return `${origin}/editor#${SHARE_PARAM}=${token}`
}

/** The share token in a location hash ('#theme=…'), if any. */
export function shareTokenFromHash(hash: string): string | null {
  const value = new URLSearchParams(hash.replace(/^#/, '')).get(SHARE_PARAM)
  return value || null
}
