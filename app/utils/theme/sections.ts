import { pruneEmpty } from './merge'
import { deletePath, hasPath } from './tree'
import { COLOR_SCHEMES, createDefaultDesign, type ThemeState } from './types'

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

export function isSectionModified(state: ThemeState, section: DesignSection): boolean {
  const d = state.design
  const designChanged = {
    primary: d.primary.kind !== 'base',
    surface: d.surface.light.kind !== 'base' || d.surface.dark.kind !== 'base' || d.tintedBackgrounds,
    shape: d.radius !== 'base',
    density: d.density !== 'base',
    focus: d.focusRing.kind !== 'base',
  }[section]
  return designChanged || OWNED_OVERRIDES[section].some(path => hasPath(state.overrides, path))
}

/** Returns a copy of `state` with one section back at the base preset's values. */
export function resetSection(state: ThemeState, section: DesignSection): ThemeState {
  const design = { ...state.design }
  const defaults = createDefaultDesign()
  if (section === 'primary') design.primary = defaults.primary
  if (section === 'surface') Object.assign(design, { surface: defaults.surface, tintedBackgrounds: defaults.tintedBackgrounds })
  if (section === 'shape') Object.assign(design, { radius: defaults.radius, customRadius: defaults.customRadius })
  if (section === 'density') Object.assign(design, { density: defaults.density, densityScale: defaults.densityScale })
  if (section === 'focus') design.focusRing = defaults.focusRing
  const overrides = pruneEmpty(OWNED_OVERRIDES[section].reduce(deletePath, state.overrides))
  return { ...state, design, overrides }
}

/** True when the theme is identical to its base preset. */
export function isPristine(state: ThemeState): boolean {
  return !DESIGN_SECTIONS.some(s => isSectionModified(state, s)) && !Object.keys(state.overrides).length
}
