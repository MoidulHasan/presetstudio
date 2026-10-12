import { isTokenTree, pruneEmpty } from './merge'
import { COLOR_SCHEMES, type ThemeState, type TokenTree } from './types'

// Editor sections that own part of a ThemeState and can be reset independently.
export const DESIGN_SECTIONS = ['primary', 'surface', 'shape', 'density', 'focus'] as const
export type DesignSection = (typeof DESIGN_SECTIONS)[number]

/** Raw-override paths owned by a section (e.g. the accessibility fix writes primary.contrastColor). */
const OWNED_OVERRIDES: Record<DesignSection, string[][]> = {
  primary: [
    ['semantic', 'primary'],
    ...COLOR_SCHEMES.flatMap(s => [['semantic', 'colorScheme', s, 'primary'], ['semantic', 'colorScheme', s, 'highlight']]),
  ],
  surface: COLOR_SCHEMES.map(s => ['semantic', 'colorScheme', s, 'surface']),
  shape: [['primitive', 'borderRadius']],
  density: [],
  focus: [['semantic', 'focusRing'], ...COLOR_SCHEMES.map(s => ['semantic', 'colorScheme', s, 'focusRing'])],
}

function hasPath(tree: TokenTree, path: string[]): boolean {
  let node: unknown = tree
  for (const key of path) {
    if (!isTokenTree(node) || !(key in node)) return false
    node = node[key]
  }
  return true
}

function withoutPath(tree: TokenTree, path: string[]): TokenTree {
  const [head, ...rest] = path
  if (!head || !(head in tree)) return tree
  if (!rest.length) return Object.fromEntries(Object.entries(tree).filter(([key]) => key !== head))
  const copy = { ...tree }
  const child = copy[head]
  if (isTokenTree(child)) copy[head] = withoutPath(child, rest)
  return copy
}

export function isSectionModified(state: ThemeState, section: DesignSection): boolean {
  const d = state.design
  const designChanged = {
    primary: d.primary.kind !== 'base',
    surface: d.surface.light.kind !== 'base' || d.surface.dark.kind !== 'base',
    shape: d.radius !== 'base',
    density: d.density !== 'base',
    focus: d.focusRing.kind !== 'base',
  }[section]
  return designChanged || OWNED_OVERRIDES[section].some(path => hasPath(state.overrides, path))
}

/** Returns a copy of `state` with one section back at the base preset's values. */
export function resetSection(state: ThemeState, section: DesignSection): ThemeState {
  const design = { ...state.design }
  if (section === 'primary') design.primary = { kind: 'base' }
  if (section === 'surface') design.surface = { light: { kind: 'base' }, dark: { kind: 'base' } }
  if (section === 'shape') design.radius = 'base'
  if (section === 'density') design.density = 'base'
  if (section === 'focus') design.focusRing = { kind: 'base' }
  const overrides = pruneEmpty(OWNED_OVERRIDES[section].reduce(withoutPath, state.overrides))
  return { ...state, design, overrides }
}

/** True when the theme is identical to its base preset. */
export function isPristine(state: ThemeState): boolean {
  return !DESIGN_SECTIONS.some(s => isSectionModified(state, s)) && !Object.keys(state.overrides).length
}
