import { COMPONENT_META } from './components'
import { isTokenTree } from './merge'
import { withoutComponentEdits } from './recolor'
import { GROUPS_ORDER } from './semantic'
import { PATTERN_SECTIONS, withoutSemanticGroup } from './semantic-studio'
import {
  STATUS_KINDS,
  createDefaultDesign,
  type DesignSettings,
  type StatusDesign,
  type StatusKind,
  type SurfaceDesign,
  type ThemeState,
  type TokenTree,
} from './types'

// "What you changed": everything a theme does differently from its base preset, in plain words,
// each with where it's edited and a way to revert just that.

export type ChangeArea = 'look' | 'shared' | 'components' | 'tokens'

export interface ThemeChange {
  /** Stable id, e.g. 'design:primary', 'semantic:formField', 'component:button'. */
  id: string
  area: ChangeArea
  label: string
  /** What it's set to, e.g. 'Custom #e11d48', '3 tokens'. */
  detail: string
  /** Where it's edited: an editor section, or a component. */
  target: { section: string } | { component: string } | null
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

function countLeaves(node: unknown): number {
  if (!node || typeof node !== 'object') return node === undefined ? 0 : 1
  return Object.values(node).reduce<number>((n, v) => n + countLeaves(v), 0)
}

// --- Design decisions --------------------------------------------------------------------

function surfaceDetail(surface: SurfaceDesign): string | null {
  switch (surface.kind) {
    case 'base': return null
    case 'palette': return capitalize(surface.name)
    case 'tinted': return 'Tinted with the primary color'
    case 'custom': return `Custom ${surface.color}`
  }
}

function statusDetail(status: StatusDesign): string | null {
  switch (status.kind) {
    case 'base': return null
    case 'palette': return capitalize(status.name)
    case 'custom': return `Custom ${status.color}`
  }
}

const STATUS_LABELS: Record<StatusKind, string> = { info: 'Info', success: 'Success', warn: 'Warning', danger: 'Danger', help: 'Help' }

function designChanges(design: DesignSettings): ThemeChange[] {
  const out: ThemeChange[] = []
  const look = (id: string, label: string, detail: string, section: string) =>
    out.push({ id: `design:${id}`, area: 'look', label, detail, target: { section } })

  const p = design.primary
  if (p.kind === 'palette') look('primary', 'Primary color', `Built-in ${capitalize(p.name)}`, 'primary')
  if (p.kind === 'custom') {
    const tweaked = Object.keys(p.shades).length
    look('primary', 'Primary color', `Custom ${p.color}${tweaked ? ` · ${plural(tweaked, 'shade')} adjusted` : ''}`, 'primary')
  }

  const surfaces = [
    ['Light', surfaceDetail(design.surface.light)],
    ['Dark', surfaceDetail(design.surface.dark)],
  ].filter(([, detail]) => detail).map(([scheme, detail]) => `${scheme}: ${detail}`)
  if (design.tintedBackgrounds) surfaces.push('Tinted backgrounds')
  if (surfaces.length) look('surface', 'Surfaces', surfaces.join(' · '), 'surface')

  for (const kind of STATUS_KINDS) {
    const detail = statusDetail(design.status[kind])
    if (detail) look(`status:${kind}`, `${STATUS_LABELS[kind]} color`, detail, 'status')
  }

  if (design.radius === 'custom') look('radius', 'Corners', `Custom (${design.customRadius.md}px medium)`, 'shape')
  else if (design.radius !== 'base') look('radius', 'Corners', capitalize(design.radius === 'xlarge' ? 'extra large' : design.radius), 'shape')

  if (design.density === 'custom') look('density', 'Density', `Custom ×${design.densityScale}`, 'density')
  else if (design.density !== 'base') look('density', 'Density', capitalize(design.density), 'density')

  const f = design.focusRing
  if (f.kind === 'outline') look('focus', 'Focus ring', `Outline ${f.width}px, offset ${f.offset}px, ${f.color === 'primary' ? 'primary color' : f.color}`, 'focus')
  return out
}

// --- Token overrides -------------------------------------------------------------------------

const GENERAL_KEYS = new Set(['transitionDuration', 'disabledOpacity', 'iconSize', 'anchorGutter'])
/** Semantic group → the section that edits it. */
const SECTION_OF_GROUP: Record<string, string> = {
  ...Object.fromEntries(Object.entries(PATTERN_SECTIONS).map(([section, group]) => [group, section])),
  primary: 'primary',
  surface: 'surface',
  focusRing: 'focus',
}
const GROUP_LABELS: Record<string, string> = {
  primary: 'Primary color tokens',
  surface: 'Surface tokens',
  focusRing: 'Focus ring tokens',
  general: 'General tokens',
}

/** The semantic group a semantic override key belongs to ('mask' is part of overlays). */
function semanticGroupOf(key: string): string {
  if (GENERAL_KEYS.has(key)) return 'general'
  if (key === 'mask') return 'overlay'
  return key
}

function semanticChanges(overrides: TokenTree): ThemeChange[] {
  const semantic = overrides.semantic
  if (!isTokenTree(semantic)) return []
  const counts = new Map<string, number>()
  const add = (tree: TokenTree) => {
    for (const [key, value] of Object.entries(tree)) {
      const group = semanticGroupOf(key)
      counts.set(group, (counts.get(group) ?? 0) + countLeaves(value))
    }
  }
  for (const [key, value] of Object.entries(semantic)) {
    if (key !== 'colorScheme') add({ [key]: value })
    else if (isTokenTree(value)) for (const scheme of Object.values(value)) if (isTokenTree(scheme)) add(scheme)
  }
  // In the token list's group order, so the list doesn't depend on how keys happen to be stored.
  const rank = (group: string) => (GROUPS_ORDER.includes(group) ? GROUPS_ORDER.indexOf(group) : GROUPS_ORDER.length)
  return [...counts].filter(([, n]) => n > 0).sort((a, b) => rank(a[0]) - rank(b[0]) || a[0].localeCompare(b[0])).map(([group, n]) => {
    const section = SECTION_OF_GROUP[group]
    const shared = section !== undefined && Object.hasOwn(PATTERN_SECTIONS, section)
    return {
      id: `semantic:${group}`,
      area: shared ? 'shared' : 'tokens',
      // Shared styles are named by their section in the UI; this is the fallback.
      label: GROUP_LABELS[group] ?? capitalize(group.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()),
      detail: `${plural(n, 'token')} changed`,
      target: { section: section ?? 'semantic' },
    }
  })
}

function componentChanges(overrides: TokenTree): ThemeChange[] {
  const components = isTokenTree(overrides.components) ? overrides.components : {}
  const palettes = isTokenTree(overrides.primitive) && isTokenTree(overrides.primitive.ps) ? overrides.primitive.ps : {}
  const names = new Set([...Object.keys(components), ...Object.keys(palettes)])
  return [...names].sort().map((name) => {
    const n = countLeaves(components[name])
    return {
      id: `component:${name}`,
      area: 'components' as const,
      label: COMPONENT_META[name]?.label ?? name,
      detail: n ? `${plural(n, 'token')} changed` : 'Custom palette',
      target: COMPONENT_META[name] ? { component: name } : null,
    }
  })
}

/** Overrides outside semantic tokens and components (e.g. primitive colors set by hand). */
function otherChanges(overrides: TokenTree): ThemeChange[] {
  let n = 0
  for (const [key, value] of Object.entries(overrides)) {
    if (key === 'semantic' || key === 'components') continue
    if (key === 'primitive' && isTokenTree(value)) n += countLeaves(Object.fromEntries(Object.entries(value).filter(([k]) => k !== 'ps')))
    else n += countLeaves(value)
  }
  return n ? [{ id: 'other', area: 'tokens', label: 'Other tokens', detail: `${plural(n, 'token')} changed`, target: null }] : []
}

/** Everything the theme changes from its base preset, design decisions first. */
export function listChanges(state: Pick<ThemeState, 'design' | 'overrides'>): ThemeChange[] {
  return [
    ...designChanges(state.design),
    ...semanticChanges(state.overrides),
    ...componentChanges(state.overrides),
    ...otherChanges(state.overrides),
  ]
}

/** The theme with one change reverted (back to the base preset for that part only). */
export function revertChange(state: ThemeState, id: string): ThemeState {
  const defaults = createDefaultDesign()
  const design = { ...state.design }
  let overrides = state.overrides
  const [kind, name, sub] = id.split(':')

  if (kind === 'design') {
    if (name === 'primary') design.primary = defaults.primary
    if (name === 'surface') Object.assign(design, { surface: defaults.surface, tintedBackgrounds: defaults.tintedBackgrounds })
    if (name === 'status' && sub && (STATUS_KINDS as readonly string[]).includes(sub)) design.status = { ...design.status, [sub]: { kind: 'base' } }
    if (name === 'radius') Object.assign(design, { radius: defaults.radius, customRadius: defaults.customRadius })
    if (name === 'density') Object.assign(design, { density: defaults.density, densityScale: defaults.densityScale })
    if (name === 'focus') design.focusRing = defaults.focusRing
  }
  else if (kind === 'semantic' && name) {
    overrides = withoutSemanticGroup(overrides, name)
  }
  else if (kind === 'component' && name) {
    overrides = withoutComponentEdits(overrides, name)
  }
  else if (kind === 'other') {
    const ps = isTokenTree(overrides.primitive) ? overrides.primitive.ps : undefined
    overrides = Object.fromEntries(Object.entries(overrides).filter(([k]) => k === 'semantic' || k === 'components'))
    if (ps !== undefined) overrides = { ...overrides, primitive: { ps } }
  }
  return { ...state, design, overrides }
}
