import type { TokenDescriptor } from './schema'
import { hasPath } from './tree'
import type { ColorScheme, TokenTree } from './types'

export interface TokenGroup {
  key: string
  label: string
  description: string
  tokens: TokenDescriptor[]
}

// Order and wording of semantic groups in the editor.
const GROUPS: Array<{ key: string, label: string, description: string }> = [
  { key: 'primary', label: 'Primary', description: 'Brand scale and the primary color states.' },
  { key: 'surface', label: 'Surface', description: 'Neutral scale for backgrounds and borders.' },
  { key: 'text', label: 'Text', description: 'Default, hover and muted text colors.' },
  { key: 'content', label: 'Content', description: 'Panels, cards and other containers.' },
  { key: 'highlight', label: 'Highlight', description: 'Selected items in lists, tables and menus.' },
  { key: 'formField', label: 'Form field', description: 'Inputs, selects and other form controls.' },
  { key: 'list', label: 'List', description: 'Options in dropdowns and listboxes.' },
  { key: 'navigation', label: 'Navigation', description: 'Menu items and submenus.' },
  { key: 'overlay', label: 'Overlay', description: 'Popovers, dropdown panels and modals.' },
  { key: 'focusRing', label: 'Focus ring', description: 'Keyboard focus indicator.' },
  { key: 'mask', label: 'Mask', description: 'Backdrop behind modal overlays.' },
  { key: 'general', label: 'General', description: 'Transitions, opacity, icon size and spacing.' },
]
const KNOWN = new Set(GROUPS.map(g => g.key))

/** Path below `semantic` (and below `colorScheme.<scheme>`), e.g. ['formField', 'focusBorderColor']. */
export function semanticPath(token: TokenDescriptor): string[] {
  const rest = token.path.slice(1)
  return rest[0] === 'colorScheme' ? rest.slice(2) : rest
}

export function groupKeyOf(token: TokenDescriptor): string {
  const head = semanticPath(token)[0] ?? ''
  return KNOWN.has(head) ? head : 'general'
}

/** Semantic tokens visible when editing `scheme`: shared tokens plus that scheme's tokens, grouped. */
export function groupSemanticTokens(tokens: TokenDescriptor[], scheme: ColorScheme): TokenGroup[] {
  const candidates = tokens.filter(t => t.layer === 'semantic' && (t.scheme === null || t.scheme === scheme))
  // A scheme value shadows a shared token with the same name (the engine uses the scheme one).
  const schemeNames = new Set(candidates.filter(t => t.scheme === scheme).map(t => t.name))
  const visible = candidates.filter(t => t.scheme !== null || !schemeNames.has(t.name))
  return GROUPS
    .map(group => ({ ...group, tokens: visible.filter(t => groupKeyOf(t) === group.key) }))
    .filter(group => group.tokens.length)
}

export type TokenSource = 'base' | 'design' | 'custom'

/** Where a token's current value comes from. */
export function tokenSource(token: TokenDescriptor, overrides: TokenTree, designTokens: TokenTree): TokenSource {
  if (hasPath(overrides, token.path)) return 'custom'
  if (hasPath(designTokens, token.path)) return 'design'
  return 'base'
}

/** Case-insensitive match on label, name and value. */
export function matchesQuery(token: TokenDescriptor, query: string, value = ''): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [token.label, token.name, value].some(s => s.toLowerCase().includes(q))
}

/** Number of raw override leaves under `semantic` (custom semantic edits). */
export function countSemanticOverrides(overrides: TokenTree): number {
  const count = (node: unknown): number =>
    node && typeof node === 'object' ? Object.values(node).reduce<number>((n, v) => n + count(v), 0) : 1
  return overrides.semantic ? count(overrides.semantic) : 0
}
