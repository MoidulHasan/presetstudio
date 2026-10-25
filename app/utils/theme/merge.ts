import type { TokenTree, TokenValue } from './types'

// Keys that must never be copied from untrusted input (localStorage, postMessage).
const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

export function isTokenTree(value: unknown): value is TokenTree {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

function isTokenLeaf(value: unknown): value is string | number {
  return typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value))
}

/**
 * Deep-merges token trees left to right without mutating the inputs.
 * Later trees win; nested objects are merged, leaves are replaced.
 * Non-token values (undefined, null, arrays, functions, ...) and unsafe keys are skipped.
 */
export function mergeOverrides(...trees: Array<TokenTree | undefined>): TokenTree {
  const result: TokenTree = {}
  for (const tree of trees) {
    if (!isTokenTree(tree)) continue
    for (const [key, value] of Object.entries(tree)) {
      if (UNSAFE_KEYS.has(key)) continue
      if (isTokenTree(value)) {
        const current = result[key]
        result[key] = mergeOverrides(isTokenTree(current) ? current : undefined, value)
      }
      else if (isTokenLeaf(value)) {
        result[key] = value
      }
    }
  }
  return result
}

/**
 * `base` with `overrides` merged in, like `mergeOverrides(base, overrides)`, but copying only the
 * branches `overrides` touches: every other subtree of `base` is shared, not copied, so derived
 * data can be cached per subtree (see `flattenPreset`). For trees built by the app (the base
 * preset and built overrides); untrusted input goes through `mergeOverrides`, which cleans it.
 */
export function overlayTree(base: TokenTree, overrides: TokenTree): TokenTree {
  const out: TokenTree = { ...base }
  for (const [key, value] of Object.entries(overrides)) {
    if (UNSAFE_KEYS.has(key)) continue
    const current = out[key]
    out[key] = isTokenTree(value) && isTokenTree(current) ? overlayTree(current, value) : value
  }
  return out
}

/** Removes empty branches (`{}`) recursively. Returns a new tree. */
export function pruneEmpty(tree: TokenTree): TokenTree {
  const result: TokenTree = {}
  for (const [key, value] of Object.entries(tree)) {
    if (isTokenTree(value)) {
      const pruned = pruneEmpty(value)
      if (Object.keys(pruned).length) result[key] = pruned
    }
    else {
      result[key] = value as TokenValue
    }
  }
  return result
}
