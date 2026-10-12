import { mergeOverrides, pruneEmpty } from './merge'
import { generatePalette } from './palette'
import type { ThemeState, TokenTree } from './types'

/**
 * The full set of overrides to pass to `definePreset(base, overrides)`:
 * generated values first, explicit user overrides on top.
 */
export function buildPresetOverrides(state: Pick<ThemeState, 'primaryColor' | 'overrides'>): TokenTree {
  const generated: TokenTree = {
    semantic: {
      primary: { ...generatePalette(state.primaryColor) },
    },
  }
  return pruneEmpty(mergeOverrides(generated, state.overrides))
}
