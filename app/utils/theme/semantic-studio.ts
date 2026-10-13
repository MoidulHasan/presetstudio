import type { TokenDescriptor } from './schema'
import { semanticPath } from './semantic'
import type { StudioSection } from './studio-controls'
import { referenceName } from './tokens'
import { deletePath } from './tree'
import type { ColorScheme, TokenTree } from './types'

// Visual editors for semantic token groups. Most are "patterns" (form fields, lists, menus,
// overlays, containers, selection) with their own editor section; Text is a foundation; Primary's
// state grid lives in the Primary color section. Surface and focus ring are set by their design
// sections, and the rest (general settings) is in the raw token list. Each group gets a
// color grid of properties × states (or × kinds, for overlays) with light|dark pairs, shared
// controls by purpose, and a stage in the preview. Paths are below `semantic` (and below
// `colorScheme.<scheme>` for scheme tokens); `semantic-studio.test.ts` checks them against all
// four presets.

export interface GridColumn {
  key: string
  label: string
}

export interface GridRow {
  /** Lowercase letters only (it travels in stage-pick messages). */
  key: string
  label: string
  /** Token path per column key, e.g. { default: 'formField.borderColor', focus: 'formField.focusBorderColor' }. */
  cells: Record<string, string>
}

export interface SemanticGroupStudio {
  key: string
  label: string
  icon: string
  description: string
  columns?: GridColumn[]
  rows?: GridRow[]
  sections?: StudioSection[]
}

const STATE = {
  default: { key: 'default', label: 'Default' },
  hover: { key: 'hover', label: 'Hover' },
  focus: { key: 'focus', label: 'Focus' },
  active: { key: 'active', label: 'Active' },
  pressed: { key: 'active', label: 'Pressed' },
  invalid: { key: 'invalid', label: 'Invalid' },
  disabled: { key: 'disabled', label: 'Disabled' },
  selected: { key: 'selected', label: 'Selected' },
  selectedfocus: { key: 'selectedfocus', label: 'Selected + focus' },
} satisfies Record<string, GridColumn>

export const SEMANTIC_STUDIO: SemanticGroupStudio[] = [
  {
    key: 'primary',
    label: 'Primary',
    icon: 'pi pi-palette',
    description: 'The brand color as buttons, links, checkboxes and selections use it.',
    columns: [STATE.default, STATE.hover, STATE.pressed],
    rows: [
      { key: 'color', label: 'Primary color', cells: { default: 'primary.color', hover: 'primary.hoverColor', active: 'primary.activeColor' } },
      { key: 'contrast', label: 'Text on primary', cells: { default: 'primary.contrastColor' } },
    ],
  },
  {
    key: 'text',
    label: 'Text',
    icon: 'pi pi-align-left',
    description: 'Default and muted text, at rest and hovered.',
    columns: [STATE.default, STATE.hover],
    rows: [
      { key: 'text', label: 'Text', cells: { default: 'text.color', hover: 'text.hoverColor' } },
      { key: 'muted', label: 'Muted text', cells: { default: 'text.mutedColor', hover: 'text.hoverMutedColor' } },
    ],
  },
  {
    key: 'content',
    label: 'Containers',
    icon: 'pi pi-window-maximize',
    description: 'Cards, panels, tabs, accordions and other containers.',
    columns: [STATE.default, STATE.hover],
    rows: [
      { key: 'background', label: 'Background', cells: { default: 'content.background', hover: 'content.hoverBackground' } },
      { key: 'border', label: 'Border', cells: { default: 'content.borderColor' } },
      { key: 'text', label: 'Text', cells: { default: 'content.color', hover: 'content.hoverColor' } },
    ],
    sections: [{ key: 'shape', title: 'Shape', controls: [{ label: 'Corner radius', path: 'content.borderRadius', max: 24 }] }],
  },
  {
    key: 'highlight',
    label: 'Selection',
    icon: 'pi pi-check-square',
    description: 'Selected items everywhere: list options, table rows, menu items, tabs.',
    columns: [STATE.default, STATE.focus],
    rows: [
      { key: 'background', label: 'Background', cells: { default: 'highlight.background', focus: 'highlight.focusBackground' } },
      { key: 'text', label: 'Text', cells: { default: 'highlight.color', focus: 'highlight.focusColor' } },
    ],
  },
  {
    key: 'formField',
    label: 'Form fields',
    icon: 'pi pi-pencil',
    description: 'Inputs, selects, date pickers and every other form control.',
    columns: [STATE.default, STATE.hover, STATE.focus, STATE.invalid, STATE.disabled],
    rows: [
      { key: 'background', label: 'Background', cells: { default: 'formField.background', disabled: 'formField.disabledBackground' } },
      { key: 'filled', label: 'Filled style', cells: { default: 'formField.filledBackground', hover: 'formField.filledHoverBackground', focus: 'formField.filledFocusBackground' } },
      { key: 'border', label: 'Border', cells: { default: 'formField.borderColor', hover: 'formField.hoverBorderColor', focus: 'formField.focusBorderColor', invalid: 'formField.invalidBorderColor' } },
      { key: 'text', label: 'Text', cells: { default: 'formField.color', disabled: 'formField.disabledColor' } },
      { key: 'placeholder', label: 'Placeholder', cells: { default: 'formField.placeholderColor', invalid: 'formField.invalidPlaceholderColor' } },
      { key: 'floatlabel', label: 'Float label', cells: { default: 'formField.floatLabelColor', focus: 'formField.floatLabelFocusColor', invalid: 'formField.floatLabelInvalidColor' } },
      { key: 'floated', label: 'Floated label', cells: { default: 'formField.floatLabelActiveColor' } },
      { key: 'icon', label: 'Icon', cells: { default: 'formField.iconColor' } },
    ],
    sections: [
      { key: 'shape', title: 'Shape', controls: [{ label: 'Corner radius', path: 'formField.borderRadius', max: 24 }] },
      {
        key: 'size',
        title: 'Size and spacing',
        description: 'Also follows Density.',
        sizes: ['sm', 'normal', 'lg'],
        controls: [
          { label: 'Horizontal padding', path: { normal: 'formField.paddingX', sm: 'formField.sm.paddingX', lg: 'formField.lg.paddingX' } },
          { label: 'Vertical padding', path: { normal: 'formField.paddingY', sm: 'formField.sm.paddingY', lg: 'formField.lg.paddingY' }, max: 24 },
          { label: 'Font size', path: { sm: 'formField.sm.fontSize', lg: 'formField.lg.fontSize' }, min: 8, max: 28 },
        ],
      },
      { key: 'effects', title: 'Effects', controls: [{ label: 'Shadow', path: 'formField.shadow', schemes: true }] },
    ],
  },
  {
    key: 'list',
    label: 'Lists',
    icon: 'pi pi-list',
    description: 'Options in dropdowns, listboxes, autocompletes and pick lists.',
    columns: [STATE.default, STATE.focus, STATE.selected, STATE.selectedfocus],
    rows: [
      { key: 'background', label: 'Option background', cells: { focus: 'list.option.focusBackground', selected: 'list.option.selectedBackground', selectedfocus: 'list.option.selectedFocusBackground' } },
      { key: 'text', label: 'Option text', cells: { default: 'list.option.color', focus: 'list.option.focusColor', selected: 'list.option.selectedColor', selectedfocus: 'list.option.selectedFocusColor' } },
      { key: 'icon', label: 'Option icon', cells: { default: 'list.option.icon.color', focus: 'list.option.icon.focusColor' } },
      { key: 'groupbackground', label: 'Group header', cells: { default: 'list.optionGroup.background' } },
      { key: 'grouptext', label: 'Group header text', cells: { default: 'list.optionGroup.color' } },
    ],
    sections: [
      {
        key: 'size',
        title: 'Spacing and shape',
        controls: [
          { label: 'List padding', path: 'list.padding' },
          { label: 'Gap between options', path: 'list.gap', max: 16 },
          { label: 'Option padding', path: 'list.option.padding' },
          { label: 'Option corner radius', path: 'list.option.borderRadius', max: 16 },
          { label: 'Group header padding', path: 'list.optionGroup.padding' },
          { label: 'Header padding', hint: 'filter area', path: 'list.header.padding' },
        ],
      },
      { key: 'text', title: 'Text', controls: [{ label: 'Group header weight', path: 'list.optionGroup.fontWeight' }] },
    ],
  },
  {
    key: 'navigation',
    label: 'Menus',
    icon: 'pi pi-bars',
    description: 'Items of menus, menubars, tiered, context and panel menus.',
    columns: [STATE.default, STATE.focus, STATE.active],
    rows: [
      { key: 'background', label: 'Item background', cells: { focus: 'navigation.item.focusBackground', active: 'navigation.item.activeBackground' } },
      { key: 'text', label: 'Item text', cells: { default: 'navigation.item.color', focus: 'navigation.item.focusColor', active: 'navigation.item.activeColor' } },
      { key: 'icon', label: 'Item icon', cells: { default: 'navigation.item.icon.color', focus: 'navigation.item.icon.focusColor', active: 'navigation.item.icon.activeColor' } },
      { key: 'submenu', label: 'Submenu label', cells: { default: 'navigation.submenuLabel.background' } },
      { key: 'submenutext', label: 'Submenu label text', cells: { default: 'navigation.submenuLabel.color' } },
      { key: 'submenuicon', label: 'Submenu icon', cells: { default: 'navigation.submenuIcon.color', focus: 'navigation.submenuIcon.focusColor', active: 'navigation.submenuIcon.activeColor' } },
    ],
    sections: [
      {
        key: 'size',
        title: 'Spacing and shape',
        controls: [
          { label: 'List padding', path: 'navigation.list.padding' },
          { label: 'Gap between items', path: 'navigation.list.gap', max: 16 },
          { label: 'Item padding', path: 'navigation.item.padding' },
          { label: 'Item corner radius', path: 'navigation.item.borderRadius', max: 16 },
          { label: 'Gap between icon and label', path: 'navigation.item.gap', max: 24 },
          { label: 'Submenu label padding', path: 'navigation.submenuLabel.padding' },
          { label: 'Submenu icon size', path: 'navigation.submenuIcon.size', min: 8, max: 24 },
        ],
      },
      { key: 'text', title: 'Text', controls: [{ label: 'Submenu label weight', path: 'navigation.submenuLabel.fontWeight' }] },
    ],
  },
  {
    key: 'overlay',
    label: 'Overlays',
    icon: 'pi pi-clone',
    description: 'Dropdown panels, popovers and dialogs, and the backdrop behind dialogs.',
    columns: [{ key: 'select', label: 'Dropdown' }, { key: 'popover', label: 'Popover' }, { key: 'modal', label: 'Dialog' }],
    rows: [
      { key: 'background', label: 'Background', cells: { select: 'overlay.select.background', popover: 'overlay.popover.background', modal: 'overlay.modal.background' } },
      { key: 'border', label: 'Border', cells: { select: 'overlay.select.borderColor', popover: 'overlay.popover.borderColor', modal: 'overlay.modal.borderColor' } },
      { key: 'text', label: 'Text', cells: { select: 'overlay.select.color', popover: 'overlay.popover.color', modal: 'overlay.modal.color' } },
      { key: 'backdrop', label: 'Backdrop', cells: { modal: 'mask.background' } },
      { key: 'backdroptext', label: 'Backdrop text', cells: { modal: 'mask.color' } },
    ],
    sections: [
      {
        key: 'shape',
        title: 'Shape and spacing',
        controls: [
          { label: 'Corner radius', hint: 'dropdowns', path: 'overlay.select.borderRadius', max: 24 },
          { label: 'Corner radius', hint: 'popovers', path: 'overlay.popover.borderRadius', max: 24 },
          { label: 'Corner radius', hint: 'dialogs', path: 'overlay.modal.borderRadius', max: 24 },
          { label: 'Padding', hint: 'popovers', path: 'overlay.popover.padding' },
          { label: 'Padding', hint: 'dialogs', path: 'overlay.modal.padding' },
        ],
      },
      {
        key: 'effects',
        title: 'Shadows',
        controls: [
          { label: 'Dropdowns', path: 'overlay.select.shadow' },
          { label: 'Popovers', path: 'overlay.popover.shadow' },
          { label: 'Dialogs', path: 'overlay.modal.shadow' },
          { label: 'Menus', path: 'overlay.navigation.shadow' },
        ],
      },
    ],
  },
]

export const SEMANTIC_STUDIO_KEYS = SEMANTIC_STUDIO.map(g => g.key)

/** Editor sections that edit a semantic group, by section → group. */
export const PATTERN_SECTIONS = {
  text: 'text',
  formfield: 'formField',
  list: 'list',
  menu: 'navigation',
  overlay: 'overlay',
  container: 'content',
  selection: 'highlight',
} as const
export type PatternSection = keyof typeof PATTERN_SECTIONS

/** Semantic groups not edited visually: set by design sections (surface, focus ring), part of a pattern (mask) or only in the token list (general). */
export const SEMANTIC_ELSEWHERE = ['surface', 'focusRing', 'mask', 'general'] as const

export function semanticStudio(key: string): SemanticGroupStudio | undefined {
  return SEMANTIC_STUDIO.find(g => g.key === key)
}

/** Preview stage name of a semantic group, e.g. 'semantic-formfield' (lowercase, URL-safe). */
export function semanticStageName(key: string): string {
  return `semantic-${key.toLowerCase()}`
}

export const SEMANTIC_STAGE_NAMES = SEMANTIC_STUDIO_KEYS.map(semanticStageName)

export interface CellTokens {
  light?: TokenDescriptor
  dark?: TokenDescriptor
}

/** Light and dark tokens at a semantic path ('formField.focusBorderColor'); shared tokens fill both. */
export function semanticCell(descriptors: TokenDescriptor[], path: string): CellTokens {
  const cell: CellTokens = {}
  for (const t of descriptors) {
    if (t.layer !== 'semantic' || semanticPath(t).join('.') !== path) continue
    if (t.scheme === 'light') cell.light = t
    else if (t.scheme === 'dark') cell.dark = t
    else {
      cell.light ??= t
      cell.dark ??= t
    }
  }
  return cell
}

/** Shared token at a semantic path, or the light and dark ones (`schemes` controls). */
export function semanticTokens(descriptors: TokenDescriptor[], path: string): TokenDescriptor[] {
  const matches = descriptors.filter(t => t.layer === 'semantic' && semanticPath(t).join('.') === path)
  const shared = matches.find(t => t.scheme === null)
  if (shared) return [shared]
  const order: Record<ColorScheme, number> = { light: 0, dark: 1 }
  return matches.sort((a, b) => order[a.scheme!] - order[b.scheme!])
}

// Token-name prefixes of each group, to find the components that reference it.
const GENERAL_NAMES = new Set(['transition-duration', 'disabled-opacity', 'icon-size', 'anchor-gutter'])
const prefixOf = (key: string) => `${key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}-`

function belongsTo(group: string, name: string): boolean {
  return group === 'general' ? GENERAL_NAMES.has(name) : name.startsWith(prefixOf(group))
}

/** Components whose tokens reference this group's tokens directly (in the base preset). */
export function semanticUsedBy(descriptors: TokenDescriptor[], group: string): string[] {
  const used = new Set<string>()
  for (const t of descriptors) {
    if (t.layer !== 'component' || !t.component) continue
    for (const [, ref] of String(t.defaultValue).matchAll(/\{([^{}]+)\}/g)) {
      if (belongsTo(group, referenceName(ref!))) {
        used.add(t.component)
        break
      }
    }
  }
  return [...used].sort()
}

/** Paths a group's overrides live at (shared and per scheme). */
function groupPaths(group: string): string[][] {
  // Overlays include the backdrop (mask) behind dialogs.
  const keys = group === 'general' ? ['transitionDuration', 'disabledOpacity', 'iconSize', 'anchorGutter'] : group === 'overlay' ? ['overlay', 'mask'] : [group]
  return keys.flatMap(key => [['semantic', key], ['semantic', 'colorScheme', 'light', key], ['semantic', 'colorScheme', 'dark', key]])
}

/** Overrides without one semantic group's custom values (reset, compare). */
export function withoutSemanticGroup(overrides: TokenTree, group: string): TokenTree {
  return groupPaths(group).reduce(deletePath, overrides)
}

/** Number of custom values in a semantic group. */
export function countSemanticGroup(overrides: TokenTree, group: string): number {
  const count = (node: unknown): number =>
    node && typeof node === 'object' ? Object.values(node).reduce<number>((n, v) => n + count(v), 0) : node === undefined ? 0 : 1
  return groupPaths(group).reduce((n, path) => {
    let node: unknown = overrides
    for (const key of path) node = node && typeof node === 'object' ? (node as TokenTree)[key] : undefined
    return n + count(node)
  }, 0)
}
