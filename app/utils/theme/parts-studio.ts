import { componentPath } from './components'
import type { TokenDescriptor } from './schema'
import type { CellTokens, GridColumn, GridRow } from './semantic-studio'
import type { StudioSection } from './studio-controls'
import type { ColorScheme } from './types'

// Visual editors for components made of parts (DataTable's column headers, rows, header and
// footer…) rather than severities: one color grid per part (properties × states, light|dark
// pairs, like the pattern editors) plus shared controls by purpose. Paths are below
// `components.<name>` (and below `colorScheme.<scheme>` for scheme tokens; some presets keep a
// token per scheme where others share it, cells take either). `parts-studio.test.ts` checks every
// path against all four presets.

export interface StudioPart {
  /** Lowercase letters only (it travels in stage-pick messages: `cell:<part>:<row>:<column>`). */
  key: string
  label: string
  description?: string
  columns: GridColumn[]
  rows: GridRow[]
}

export interface PartsStudio {
  parts: StudioPart[]
  sections: StudioSection[]
  /** Editor sections that set what the parts inherit (e.g. Selection), shown as links. */
  related?: Array<{ section: string, label: string, text: string }>
}

const STATE = {
  default: { key: 'default', label: 'Default' },
  hover: { key: 'hover', label: 'Hover' },
  focus: { key: 'focus', label: 'Focus' },
  selected: { key: 'selected', label: 'Selected' },
  sorted: { key: 'sorted', label: 'Sorted' },
} satisfies Record<string, GridColumn>

export const PARTS_STUDIO: Record<string, PartsStudio> = {
  datatable: {
    parts: [
      {
        key: 'headercells',
        label: 'Column headers',
        columns: [STATE.default, STATE.hover, STATE.sorted, STATE.focus],
        rows: [
          { key: 'background', label: 'Background', cells: { default: 'headerCell.background', hover: 'headerCell.hoverBackground', sorted: 'headerCell.selectedBackground' } },
          { key: 'text', label: 'Text', cells: { default: 'headerCell.color', hover: 'headerCell.hoverColor', sorted: 'headerCell.selectedColor' } },
          { key: 'sorticon', label: 'Sort icon', cells: { default: 'sortIcon.color', hover: 'sortIcon.hoverColor' } },
          { key: 'border', label: 'Border', cells: { default: 'headerCell.borderColor' } },
          { key: 'focusring', label: 'Focus ring', cells: { focus: 'headerCell.focusRing.color' } },
        ],
      },
      {
        key: 'rows',
        label: 'Rows',
        columns: [STATE.default, STATE.hover, STATE.selected, STATE.focus],
        rows: [
          { key: 'background', label: 'Background', cells: { default: 'row.background', hover: 'row.hoverBackground', selected: 'row.selectedBackground' } },
          { key: 'striped', label: 'Striped rows', cells: { default: 'row.stripedBackground' } },
          { key: 'text', label: 'Text', cells: { default: 'row.color', hover: 'row.hoverColor', selected: 'row.selectedColor' } },
          { key: 'border', label: 'Cell border', cells: { default: 'bodyCell.borderColor', selected: 'bodyCell.selectedBorderColor' } },
          { key: 'focusring', label: 'Focus ring', cells: { focus: 'row.focusRing.color' } },
          { key: 'lines', label: 'Table lines', cells: { default: 'root.borderColor' } },
        ],
      },
      {
        key: 'bars',
        label: 'Header and footer',
        columns: [{ key: 'header', label: 'Table header' }, { key: 'footercell', label: 'Column footer' }, { key: 'footer', label: 'Table footer' }],
        rows: [
          { key: 'background', label: 'Background', cells: { header: 'header.background', footercell: 'footerCell.background', footer: 'footer.background' } },
          { key: 'border', label: 'Border', cells: { header: 'header.borderColor', footercell: 'footerCell.borderColor', footer: 'footer.borderColor' } },
          { key: 'text', label: 'Text', cells: { header: 'header.color', footercell: 'footerCell.color', footer: 'footer.color' } },
        ],
      },
      {
        key: 'expand',
        label: 'Expand button',
        description: 'The button that opens a row\'s details.',
        columns: [STATE.default, STATE.hover, { key: 'selectedhover', label: 'Hover, selected row' }, STATE.focus],
        rows: [
          { key: 'background', label: 'Background', cells: { hover: 'rowToggleButton.hoverBackground', selectedhover: 'rowToggleButton.selectedHoverBackground' } },
          { key: 'icon', label: 'Icon', cells: { default: 'rowToggleButton.color', hover: 'rowToggleButton.hoverColor', selectedhover: 'rowToggleButton.selectedHoverColor' } },
          { key: 'focusring', label: 'Focus ring', cells: { focus: 'rowToggleButton.focusRing.color' } },
        ],
      },
    ],
    related: [
      { section: 'selection', label: 'Selection', text: 'Selected rows and sorted columns use the selection colors. Change them for every component in' },
      { section: 'container', label: 'Containers', text: 'Rows, headers and footers use the container colors. Change them for every component in' },
    ],
    sections: [
      {
        key: 'size',
        title: 'Size and spacing',
        description: 'Also follows Density.',
        sizes: ['sm', 'normal', 'lg'],
        controls: [
          { label: 'Cell padding', path: { normal: 'bodyCell.padding', sm: 'bodyCell.sm.padding', lg: 'bodyCell.lg.padding' } },
          { label: 'Column header padding', path: { normal: 'headerCell.padding', sm: 'headerCell.sm.padding', lg: 'headerCell.lg.padding' } },
          { label: 'Column footer padding', path: { normal: 'footerCell.padding', sm: 'footerCell.sm.padding', lg: 'footerCell.lg.padding' } },
          { label: 'Table header padding', path: { normal: 'header.padding', sm: 'header.sm.padding', lg: 'header.lg.padding' } },
          { label: 'Table footer padding', path: { normal: 'footer.padding', sm: 'footer.sm.padding', lg: 'footer.lg.padding' } },
          { label: 'Gap between title and sort icon', path: { normal: 'headerCell.gap' }, max: 24 },
        ],
      },
      {
        key: 'icons',
        title: 'Icons and buttons',
        controls: [
          { label: 'Sort icon size', path: 'sortIcon.size', min: 8, max: 24 },
          { label: 'Expand button size', path: 'rowToggleButton.size', min: 16, max: 48 },
        ],
      },
      {
        key: 'text',
        title: 'Text',
        controls: [
          { label: 'Column title weight', path: 'columnTitle.fontWeight' },
          { label: 'Column footer weight', path: 'columnFooter.fontWeight' },
        ],
      },
    ],
  },
}

export function partsStudio(component: string): PartsStudio | undefined {
  return Object.hasOwn(PARTS_STUDIO, component) ? PARTS_STUDIO[component] : undefined
}

const matchesPath = (t: TokenDescriptor, component: string, path: string) =>
  t.layer === 'component' && t.component === component && componentPath(t).join('.') === path

/** Light and dark tokens at a component path ('row.hoverBackground'); shared tokens fill both. */
export function componentCell(descriptors: TokenDescriptor[], component: string, path: string): CellTokens {
  const cell: CellTokens = {}
  for (const t of descriptors) {
    if (!matchesPath(t, component, path)) continue
    if (t.scheme === 'light') cell.light = t
    else if (t.scheme === 'dark') cell.dark = t
    else {
      cell.light ??= t
      cell.dark ??= t
    }
  }
  return cell
}

/** Shared token at a component path, or the light and dark ones (`schemes` controls). */
export function componentTokens(descriptors: TokenDescriptor[], component: string, path: string): TokenDescriptor[] {
  const matches = descriptors.filter(t => matchesPath(t, component, path))
  const shared = matches.find(t => t.scheme === null)
  if (shared) return [shared]
  const order: Record<ColorScheme, number> = { light: 0, dark: 1 }
  return matches.sort((a, b) => order[a.scheme!] - order[b.scheme!])
}
