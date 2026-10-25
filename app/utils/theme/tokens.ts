import { isTokenTree } from './merge'
import type { ColorScheme, TokenTree } from './types'

// Keys the theming engine drops when building CSS variable names
// (mirrors `excludedKeyRegex` in @primeuix/styled).
const STRUCTURAL_KEYS = new Set(['primitive', 'semantic', 'components', 'directives', 'root', 'extend'])
const SKIPPED_KEYS = new Set(['css'])
const REF_RE = /\{([^{}]+)\}/g

// Preset keys repeat thousands of times ('background', 'color', …), and names are built on
// every edit (flattening ~3k tokens per scheme), so conversions are memoized.
const kebabCache = new Map<string, string>()

export function toKebab(key: string): string {
  let kebab = kebabCache.get(key)
  if (kebab === undefined) {
    kebab = key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
    if (kebabCache.size < 10_000) kebabCache.set(key, kebab)
  }
  return kebab
}

/** Keys that don't appear in token names (structural layers and color-scheme wrappers). */
function isNameless(key: string): boolean {
  return STRUCTURAL_KEYS.has(key) || key === 'colorScheme' || key === 'light' || key === 'dark'
}

/** Token name for a preset path, e.g. ['semantic','formField','paddingX'] → 'form-field-padding-x'. */
export function tokenName(path: readonly string[]): string {
  return path
    .filter(k => !isNameless(k))
    .map(toKebab)
    .join('-')
}

/** The name prefix below `key`, built from its parent's (same result as `tokenName` of the path). */
function childName(prefix: string, key: string): string {
  if (isNameless(key)) return prefix
  return prefix ? `${prefix}-${toKebab(key)}` : toKebab(key)
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

// Entries a subtree flattens to (in order), per scheme and position. Edits rebuild the
// effective preset sharing the base preset's untouched subtrees (`overlayTree`), so after the
// first time only the changed branches are walked again. Trees must not be mutated.
const subtreeEntries = new WeakMap<TokenTree, Map<string, TokenEntry[]>>()

/**
 * Flattens a preset into name → entry for one color scheme.
 * Scheme-specific values win over shared ones, like in the engine.
 */
export function flattenPreset(preset: TokenTree, scheme: ColorScheme): Map<string, TokenEntry> {
  // `name` is the token name of `path` so far, extended key by key instead of rebuilt per leaf.
  const collect = (node: TokenTree, path: string[], name: string): TokenEntry[] => {
    const at = `${scheme}|${path.join('.')}`
    let cache = subtreeEntries.get(node)
    const cached = cache?.get(at)
    if (cached) return cached

    const entries: TokenEntry[] = []
    const add = (list: TokenEntry[]) => {
      for (const entry of list) entries.push(entry)
    }
    const deferred: Array<[TokenTree, string[], string]> = []
    for (const [key, value] of Object.entries(node)) {
      if (SKIPPED_KEYS.has(key)) continue
      if (key === 'colorScheme') {
        // 'colorScheme' and the scheme key add nothing to names.
        if (isTokenTree(value) && isTokenTree(value[scheme])) deferred.push([value[scheme] as TokenTree, [...path, key, scheme], name])
        continue
      }
      if (isTokenTree(value)) add(collect(value, [...path, key], childName(name, key)))
      else if (typeof value === 'string' || typeof value === 'number') {
        const tokenName = childName(name, key)
        entries.push({ name: tokenName, raw: value, path: [...path, key] })
      }
    }
    // Scheme-specific values come last, so they win.
    for (const [tree, p, n] of deferred) add(collect(tree, p, n))

    if (!cache) subtreeEntries.set(node, (cache = new Map()))
    cache.set(at, entries)
    return entries
  }

  const out = new Map<string, TokenEntry>()
  for (const entry of collect(preset, [], '')) out.set(entry.name, entry)
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
