import { componentPath } from './components'
import type { TokenDescriptor } from './schema'

// Model for the visual component editor ("studio"): variants (severities) of a component and
// their color tokens as a property × state matrix, read from PrimeVue's token naming
// (`background`, `hoverBackground`, `activeBorderColor`, `focusRing.color`, …).

export type StudioState = 'default' | 'hover' | 'active'
export const STUDIO_STATES: readonly StudioState[] = ['default', 'hover', 'active']
export const STATE_LABELS: Record<StudioState, string> = { default: 'Default', hover: 'Hover', active: 'Pressed' }

/** Button styles as the preset groups them: filled ('root'), outlined, text and link. */
export const BUTTON_STYLES = ['root', 'outlined', 'text', 'link'] as const
export type ButtonStyle = (typeof BUTTON_STYLES)[number]
export const BUTTON_STYLE_LABELS: Record<ButtonStyle, string> = { root: 'Filled', outlined: 'Outlined', text: 'Text', link: 'Link' }

const SEVERITY_ORDER = ['primary', 'secondary', 'success', 'info', 'warn', 'help', 'danger', 'contrast', 'plain']

export interface VariantRow {
  /** Severity key ('primary', 'danger', 'plain') or 'link'. */
  key: string
  label: string
  /** Color tokens of the variant per style, both schemes. */
  styles: Partial<Record<ButtonStyle, TokenDescriptor[]>>
  /** Every token of the variant (both schemes), e.g. for recoloring or resetting it. */
  tokens: TokenDescriptor[]
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Button variants: one row per severity (filled, outlined and text together) plus link. */
export function buttonVariants(descriptors: TokenDescriptor[]): VariantRow[] {
  const rows = new Map<string, VariantRow>()
  for (const token of descriptors) {
    if (token.component !== 'button' || token.scheme === null) continue
    const path = componentPath(token)
    const style = path[0] as ButtonStyle
    if (!(BUTTON_STYLES as readonly string[]).includes(style)) continue
    const key = style === 'link' ? 'link' : path[1]
    if (!key) continue
    let row = rows.get(key)
    if (!row) {
      row = { key, label: key === 'link' ? 'Link' : capitalize(key), styles: {}, tokens: [] }
      rows.set(key, row)
    }
    ;(row.styles[style] ??= []).push(token)
    row.tokens.push(token)
  }
  const rank = (key: string) => (key === 'link' ? 99 : SEVERITY_ORDER.indexOf(key) === -1 ? 50 : SEVERITY_ORDER.indexOf(key))
  return [...rows.values()].sort((a, b) => rank(a.key) - rank(b.key))
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
  focusRing: 'Focus ring',
}

export function propertyLabel(property: string): string {
  return PROPERTY_LABELS[property] ?? capitalize(property.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase())
}

/** 'hoverBorderColor' → ['borderColor', 'hover']; 'focusRing.color' → ['focusRing', 'default']. */
export function propertyState(path: string[]): [string, StudioState] | null {
  const key = path.at(-1)!
  if (path.at(-2) === 'focusRing') return key === 'color' ? ['focusRing', 'default'] : null
  const match = /^(hover|active)([A-Z].*)$/.exec(key)
  if (match) return [match[2]!.charAt(0).toLowerCase() + match[2]!.slice(1), match[1] as StudioState]
  return [key, 'default']
}

/** Color tokens of one style as rows of properties with a cell per state. */
export function stateMatrix(tokens: TokenDescriptor[]): Array<{ property: string, label: string, cells: Partial<Record<StudioState, StateCell>> }> {
  const rows = new Map<string, Partial<Record<StudioState, StateCell>>>()
  for (const token of tokens) {
    if (token.kind !== 'color') continue
    const ps = propertyState(componentPath(token))
    if (!ps) continue
    const [property, state] = ps
    const cells = rows.get(property) ?? {}
    const cell = cells[state] ?? { property, state }
    if (token.scheme === 'dark') cell.dark = token
    else cell.light = token
    cells[state] = cell
    rows.set(property, cells)
  }
  const order = ['background', 'borderColor', 'color', 'focusRing']
  return [...rows.entries()]
    .sort(([a], [b]) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99))
    .map(([property, cells]) => ({ property, label: propertyLabel(property), cells }))
}
