import { isTokenTree } from './merge'
import type { ColorScheme, TokenTree } from './types'

// Keys the theming engine drops when building CSS variable names
// (mirrors `excludedKeyRegex` in @primeuix/styled).
const STRUCTURAL_KEYS = new Set(['primitive', 'semantic', 'components', 'directives', 'root', 'extend'])
const SKIPPED_KEYS = new Set(['css'])
const REF_RE = /\{([^{}]+)\}/g

export function toKebab(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

/** Token name for a preset path, e.g. ['semantic','formField','paddingX'] → 'form-field-padding-x'. */
export function tokenName(path: readonly string[]): string {
  return path
    .filter(k => !STRUCTURAL_KEYS.has(k) && k !== 'colorScheme' && k !== 'light' && k !== 'dark')
    .map(toKebab)
    .join('-')
}

/** Token name for a reference, e.g. '{form.field.padding.x}' → 'form-field-padding-x'. */
export function referenceName(ref: string): string {
  return ref.replace(/^\{|\}$/g, '').split('.').map(toKebab).join('-')
}

export function cssVariable(name: string, prefix = 'p'): string {
  return `--${prefix}-${name}`
}

export interface TokenEntry {
  name: string
  /** Raw value as written in the preset (may contain references). */
  raw: string | number
  /** Path in the preset object. */
  path: string[]
}

/**
 * Flattens a preset into name → entry for one color scheme.
 * Scheme-specific values win over shared ones, like in the engine.
 */
export function flattenPreset(preset: TokenTree, scheme: ColorScheme): Map<string, TokenEntry> {
  const out = new Map<string, TokenEntry>()

  const walk = (node: TokenTree, path: string[]) => {
    const deferred: Array<[TokenTree, string[]]> = []
    for (const [key, value] of Object.entries(node)) {
      if (SKIPPED_KEYS.has(key)) continue
      if (key === 'colorScheme') {
        if (isTokenTree(value) && isTokenTree(value[scheme])) deferred.push([value[scheme] as TokenTree, [...path, key, scheme]])
        continue
      }
      if (isTokenTree(value)) walk(value, [...path, key])
      else if (typeof value === 'string' || typeof value === 'number') {
        const p = [...path, key]
        out.set(tokenName(p), { name: tokenName(p), raw: value, path: p })
      }
    }
    for (const [tree, p] of deferred) walk(tree, p)
  }

  walk(preset, [])
  return out
}

export interface ResolvedToken {
  name: string
  raw: string | number
  /** Fully resolved value (all references substituted). */
  value: string
  /** Reference chain while the value is a single reference: ['button-primary-background', 'primary-color', 'primary-500', ...]. */
  chain: string[]
  /** References that couldn't be resolved (missing or circular). */
  unresolved: string[]
}

export interface TokenResolver {
  scheme: ColorScheme
  entries: Map<string, TokenEntry>
  resolve: (name: string) => ResolvedToken | null
  /** Resolves an arbitrary value that may contain references. */
  resolveValue: (raw: string | number) => { value: string, unresolved: string[] }
}

export function createResolver(preset: TokenTree, scheme: ColorScheme): TokenResolver {
  const entries = flattenPreset(preset, scheme)
  const cache = new Map<string, ResolvedToken>()

  const resolveValue = (raw: string | number, stack: string[] = []): { value: string, unresolved: string[] } => {
    const unresolved: string[] = []
    const value = String(raw).replace(REF_RE, (match, ref: string) => {
      const name = referenceName(ref)
      if (stack.includes(name)) {
        unresolved.push(name)
        return match
      }
      const resolved = resolveName(name, stack)
      if (!resolved) {
        unresolved.push(name)
        return match
      }
      unresolved.push(...resolved.unresolved)
      return resolved.value
    })
    return { value, unresolved }
  }

  const resolveName = (name: string, stack: string[] = []): ResolvedToken | null => {
    if (stack.includes(name)) return null
    const cached = cache.get(name)
    if (cached) return cached
    const entry = entries.get(name)
    if (!entry) return null
    const { value, unresolved } = resolveValue(entry.raw, [...stack, name])
    const single = typeof entry.raw === 'string' ? /^\{([^{}]+)\}$/.exec(entry.raw.trim()) : null
    const next = single ? resolveName(referenceName(single[1]!), [...stack, name]) : null
    const result: ResolvedToken = { name, raw: entry.raw, value, chain: [name, ...(next?.chain ?? [])], unresolved }
    // Don't cache results computed while a cycle was being broken.
    if (!unresolved.length) cache.set(name, result)
    return result
  }

  return { scheme, entries, resolve: name => resolveName(name), resolveValue: raw => resolveValue(raw) }
}
