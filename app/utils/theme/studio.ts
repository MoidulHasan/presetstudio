import { componentPath } from './components'
import type { TokenDescriptor } from './schema'

// Model for the visual component editors ("studios"): variants (severities) of a component and
// their color tokens as a property × state matrix, read from PrimeVue's token naming
// (`background`, `hoverBackground`, `activeBorderColor`, `focusRing.color`, `closeButton.…`).

export type StudioState = 'default' | 'hover' | 'active'
export const STUDIO_STATES: readonly StudioState[] = ['default', 'hover', 'active']
export const STATE_LABELS: Record<StudioState, string> = { default: 'Default', hover: 'Hover', active: 'Pressed' }

/** Button styles as the preset groups them: filled ('root'), outlined, text and link. */
export const BUTTON_STYLES = ['root', 'outlined', 'text', 'link'] as const
export type ButtonStyle = (typeof BUTTON_STYLES)[number]
export const BUTTON_STYLE_LABELS: Record<ButtonStyle, string> = { root: 'Filled', outlined: 'Outlined', text: 'Text', link: 'Link' }

/** Styles nested inside a severity (Message's outlined and simple variants). */
const NESTED_STYLES = ['outlined', 'simple']

export function styleLabel(style: string): string {
  return { root: 'Default', outlined: 'Outlined', simple: 'Simple', text: 'Text', link: 'Link' }[style] ?? capitalize(style)
}

const SEVERITY_ORDER = ['primary', 'secondary', 'success', 'info', 'warn', 'help', 'danger', 'error', 'contrast', 'plain']

/** A token of a variant with its path inside the style, e.g. ['closeButton', 'hoverBackground']. */
export interface VariantToken {
  token: TokenDescriptor
  local: string[]
}

export interface VariantRow {
  /** Severity key ('primary', 'error', 'plain') or 'link'. */
  key: string
  label: string
  /** Tokens of the variant per style ('root' is the default style), both schemes. */
  styles: Record<string, VariantToken[]>
  /** Every token of the variant (both schemes), e.g. for recoloring or resetting it. */
  tokens: TokenDescriptor[]
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function collect(entries: Array<{ key: string, style: string, token: TokenDescriptor, local: string[] }>): VariantRow[] {
  const rows = new Map<string, VariantRow>()
  for (const { key, style, token, local } of entries) {
    let row = rows.get(key)
    if (!row) {
      row = { key, label: capitalize(key), styles: {}, tokens: [] }
      rows.set(key, row)
    }
    ;(row.styles[style] ??= []).push({ token, local })
    row.tokens.push(token)
  }
  const rank = (key: string) => (key === 'link' ? 99 : SEVERITY_ORDER.indexOf(key) === -1 ? 50 : SEVERITY_ORDER.indexOf(key))
  return [...rows.values()].sort((a, b) => rank(a.key) - rank(b.key))
}

/** Button variants: one row per severity (filled, outlined and text together) plus link. */
export function buttonVariants(descriptors: TokenDescriptor[]): VariantRow[] {
  const entries = []
  for (const token of descriptors) {
    if (token.component !== 'button' || token.scheme === null) continue
    const path = componentPath(token)
    const style = path[0] as ButtonStyle
    if (!(BUTTON_STYLES as readonly string[]).includes(style)) continue
    const key = style === 'link' ? 'link' : path[1]
    if (!key) continue
    entries.push({ key, style, token, local: path.slice(style === 'link' ? 1 : 2) })
  }
  return collect(entries)
}

/**
 * Variants of a severity-first component (Message, Toast, Tag, Badge): the scheme tokens are
 * keyed by severity, with optional nested styles (Message's outlined and simple).
 */
export function severityVariants(descriptors: TokenDescriptor[], component: string): VariantRow[] {
  const entries = []
  for (const token of descriptors) {
    if (token.component !== component || token.scheme === null) continue
    const path = componentPath(token)
    const key = path[0]
    // Scheme-wide settings (Toast's `root.blur`) aren't a variant.
    if (!key || key === 'root' || path.length < 2) continue
    const style = NESTED_STYLES.includes(path[1]!) ? path[1]! : 'root'
    entries.push({ key, style, token, local: path.slice(style === 'root' ? 1 : 2) })
  }
  return collect(entries)
}

export interface StateCell {
  property: string
  state: StudioState
  /** Light and dark tokens of the cell (either may be missing). */
  light?: TokenDescriptor
  dark?: TokenDescriptor
}

const PROPERTY_LABELS: Record<string, string> = {
  background: 'Background',
  borderColor: 'Border',
  color: 'Text',
  detailColor: 'Detail text',
  focusRing: 'Focus ring',
}

export function propertyLabel(property: string): string {
  return property.split('.').map((part, i) => {
    const label = PROPERTY_LABELS[part] ?? capitalize(part.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase())
    return i === 0 ? label : label.toLowerCase()
  }).join(' ')
}

/**
 * Property and state of a token from its path inside a style:
 * 'hoverBorderColor' → ['borderColor', 'hover'], ['focusRing', 'color'] → ['focusRing', 'default'],
 * ['closeButton', 'hoverBackground'] → ['closeButton.background', 'hover'].
 */
export function propertyState(local: string[]): [string, StudioState] | null {
  const key = local.at(-1)!
  const parents = local.slice(0, -1)
  if (parents.at(-1) === 'focusRing') return key === 'color' ? [[...parents].join('.'), 'default'] : null
  const match = /^(hover|active)([A-Z].*)$/.exec(key)
  const base = match ? match[2]!.charAt(0).toLowerCase() + match[2]!.slice(1) : key
  return [[...parents, base].join('.'), match ? (match[1] as StudioState) : 'default']
}

const PROPERTY_ORDER = ['background', 'borderColor', 'color', 'detailColor', 'focusRing']

/** Color tokens of one style as rows of properties with a cell per state. */
export function stateMatrix(entries: VariantToken[]): Array<{ property: string, label: string, cells: Partial<Record<StudioState, StateCell>> }> {
  const rows = new Map<string, Partial<Record<StudioState, StateCell>>>()
  for (const { token, local } of entries) {
    if (token.kind !== 'color') continue
    const ps = propertyState(local)
    if (!ps) continue
    const [property, state] = ps
    const cells = rows.get(property) ?? {}
    const cell = cells[state] ?? { property, state }
    if (token.scheme === 'dark') cell.dark = token
    else cell.light = token
    cells[state] = cell
    rows.set(property, cells)
  }
  const rank = (p: string) => (PROPERTY_ORDER.indexOf(p) + 1 || 50 + p.split('.').length)
  return [...rows.entries()]
    .sort(([a], [b]) => rank(a) - rank(b))
    .map(([property, cells]) => ({ property, label: propertyLabel(property), cells }))
}

/** States present in a matrix, in order (most styles have no pressed state). */
export function matrixStates(matrix: ReturnType<typeof stateMatrix>): StudioState[] {
  return STUDIO_STATES.filter(state => matrix.some(row => row.cells[state]))
}
