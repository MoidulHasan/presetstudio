import { isTokenTree } from './merge'
import type { TokenTree } from './types'

// Token values end up inside CSS custom properties (`--p-x: <value>;`) in the
// preview and in exported code. Only allow characters that can appear in color,
// length, shadow, duration and font values plus `{a.b}` references, so a value
// can never close the declaration/rule or load external resources.

const MAX_LENGTH = 200
const ALLOWED_CHARS = /^[\w\s#%.,()+\-*/'"!{}]*$/
const REFERENCE = /\{[a-z0-9.-]+\}/gi
const FORBIDDEN = /url\s*\(|expression\s*\(|@import|\\|\/\*|\*\//i

/** Returns the trimmed value if it's safe to use as a token value, else null. */
export function sanitizeTokenValue(input: unknown): string | null {
  if (typeof input === 'number') return Number.isFinite(input) ? String(input) : null
  if (typeof input !== 'string') return null
  const value = input.trim()
  if (!value || value.length > MAX_LENGTH) return null
  if (!ALLOWED_CHARS.test(value) || FORBIDDEN.test(value)) return null
  // Braces are only allowed as complete references like {primary.500}.
  if (/[{}]/.test(value.replace(REFERENCE, ''))) return null
  // Parentheses and quotes must balance (no breaking out of functions/strings).
  let depth = 0
  for (const c of value) {
    if (c === '(') depth++
    else if (c === ')' && --depth < 0) return null
  }
  if (depth !== 0) return null
  if ((value.match(/"/g)?.length ?? 0) % 2 || (value.match(/'/g)?.length ?? 0) % 2) return null
  return value
}

// Keys become CSS variable names (`--p-<path>`) unescaped, so they're limited to what preset
// keys use (camelCase words and shade numbers). `css` holds raw stylesheet text in the engine.
const SAFE_KEY = /^[A-Za-z0-9]{1,64}$/
const RAW_CSS_KEY = 'css'

export function isSafeTokenKey(key: string): boolean {
  return SAFE_KEY.test(key) && key !== RAW_CSS_KEY
}

/** Drops every unsafe key and every leaf that isn't a safe token value (for untrusted override trees). */
export function sanitizeTokenTree(tree: TokenTree): TokenTree {
  const out: TokenTree = {}
  for (const [key, value] of Object.entries(tree)) {
    if (!isSafeTokenKey(key)) continue
    if (isTokenTree(value)) {
      const child = sanitizeTokenTree(value)
      if (Object.keys(child).length) out[key] = child
    }
    else {
      const safe = sanitizeTokenValue(value)
      if (safe !== null) out[key] = typeof value === 'number' ? value : safe
    }
  }
  return out
}

/** `form-field-padding-x` → `{form.field.padding.x}` (the engine treats - and . alike). */
export function referenceFor(tokenName: string): string {
  return `{${tokenName.replace(/-/g, '.')}}`
}
