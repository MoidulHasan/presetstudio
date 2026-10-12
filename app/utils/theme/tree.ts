import { isTokenTree, pruneEmpty } from './merge'
import type { TokenTree, TokenValue } from './types'

// Immutable helpers for reading and writing token trees by path.

export function getPath(tree: TokenTree, path: readonly string[]): TokenValue | undefined {
  let node: TokenValue | undefined = tree
  for (const key of path) {
    if (!isTokenTree(node)) return undefined
    node = node[key]
  }
  return node
}

export function hasPath(tree: TokenTree, path: readonly string[]): boolean {
  return getPath(tree, path) !== undefined
}

/** Returns a copy of `tree` with `value` at `path` (intermediate objects are created). */
export function setPath(tree: TokenTree, path: readonly string[], value: TokenValue): TokenTree {
  const [head, ...rest] = path
  if (head === undefined) return tree
  const child = tree[head]
  return {
    ...tree,
    [head]: rest.length ? setPath(isTokenTree(child) ? child : {}, rest, value) : value,
  }
}

/** Returns a copy of `tree` without `path`; empty parents are pruned. */
export function deletePath(tree: TokenTree, path: readonly string[]): TokenTree {
  const [head, ...rest] = path
  if (head === undefined || !(head in tree)) return tree
  if (!rest.length) return Object.fromEntries(Object.entries(tree).filter(([key]) => key !== head))
  const child = tree[head]
  if (!isTokenTree(child)) return tree
  return pruneEmpty({ ...tree, [head]: deletePath(child, rest) })
}
