import { designToTokens } from './design'
import { mergeOverrides, overlayTree, pruneEmpty } from './merge'
import type { ThemeState, TokenTree } from './types'

/**
 * The full set of overrides to pass to `definePreset(base, overrides)`:
 * design decisions first, explicit token overrides on top.
 */
export function buildPresetOverrides(state: Pick<ThemeState, 'design' | 'overrides'>, base: TokenTree): TokenTree {
  return pruneEmpty(mergeOverrides(designToTokens(state.design, base), state.overrides))
}

/**
 * Base preset with overrides applied, as plain token data (for resolving and inspecting).
 * Shares the base preset's untouched subtrees (read-only), so resolvers rebuild fast.
 */
export function buildEffectivePreset(state: Pick<ThemeState, 'design' | 'overrides'>, base: TokenTree): TokenTree {
  return overlayTree(base, buildPresetOverrides(state, base))
}
