import { componentPath } from './components'
import type { TokenDescriptor } from './schema'
import type { GridColumn, GridRow } from './semantic-studio'
import type { StudioSection } from './studio-controls'
import type { ColorScheme } from './types'

// Visual editors for components built from parts (DataTable: its header, column headers, rows,
// footer), the third recipe beside severity components (studio-controls.ts) and Button. Colors
// are a grid of parts × states with light|dark pairs, like the shared styles; the rest are the
// component's controls by purpose. Paths are below `components.<name>` (or below its
// `colorScheme.<scheme>`: Lara keeps some colors per mode that the others share).
// `parts-studio.test.ts` checks every path against all four presets.

export interface PartsStudio {
  /** Explains the colors grid (the group's ⓘ). */
  colorsDescription: string
  columns: GridColumn[]
  /** Row keys are lowercase letters only: they travel in stage picks ('cell:<row>:<column>'). */
  rows: GridRow[]
  sections: StudioSection[]
}

const COLUMN = {
  default: { key: 'default', label: 'Default' },
  hover: { key: 'hover', label: 'Hover' },
  selected: { key: 'selected', label: 'Selected' },
  striped: { key: 'striped', label: 'Striped' },
} satisfies Record<string, GridColumn>

export const PARTS_STUDIO: Record<string, PartsStudio> = {
  datatable: {
    colorsDescription: 'Each color shows in the mode the preview shows (both with Both). For column headers, Selected is the sorted column. Select a color to change it in light and dark.',
    columns: [COLUMN.default, COLUMN.hover, COLUMN.selected, COLUMN.striped],
    rows: [
      { key: 'header', label: 'Table header', cells: { default: 'header.background' } },
      { key: 'headertext', label: 'Table header text', cells: { default: 'header.color' } },
      { key: 'headercell', label: 'Column header', cells: { default: 'headerCell.background', hover: 'headerCell.hoverBackground', selected: 'headerCell.selectedBackground' } },
      { key: 'headercelltext', label: 'Column title', cells: { default: 'headerCell.color', hover: 'headerCell.hoverColor', selected: 'headerCell.selectedColor' } },
      { key: 'sorticon', label: 'Sort icon', cells: { default: 'sortIcon.color', hover: 'sortIcon.hoverColor' } },
      { key: 'row', label: 'Row', cells: { default: 'row.background', hover: 'row.hoverBackground', selected: 'row.selectedBackground', striped: 'row.stripedBackground' } },
      { key: 'rowtext', label: 'Row text', cells: { default: 'row.color', hover: 'row.hoverColor', selected: 'row.selectedColor' } },
      { key: 'border', label: 'Borders', cells: { default: 'root.borderColor', selected: 'bodyCell.selectedBorderColor' } },
      { key: 'toggle', label: 'Row toggle', cells: { default: 'rowToggleButton.color', hover: 'rowToggleButton.hoverColor' } },
      { key: 'footer', label: 'Footer', cells: { default: 'footer.background' } },
      { key: 'footertext', label: 'Footer text', cells: { default: 'footer.color' } },
    ],
    sections: [
      {
        key: 'size',
        title: 'Size and spacing',
        sizes: ['sm', 'normal', 'lg'],
        controls: [
          { label: 'Cell padding', path: { normal: 'bodyCell.padding', sm: 'bodyCell.sm.padding', lg: 'bodyCell.lg.padding' } },
          { label: 'Column header padding', path: { normal: 'headerCell.padding', sm: 'headerCell.sm.padding', lg: 'headerCell.lg.padding' } },
          { label: 'Table header padding', path: { normal: 'header.padding', sm: 'header.sm.padding', lg: 'header.lg.padding' } },
          { label: 'Footer padding', path: { normal: 'footer.padding', sm: 'footer.sm.padding', lg: 'footer.lg.padding' } },
          { label: 'Gap in column headers', hint: 'title and sort icon', path: { normal: 'headerCell.gap' }, max: 24 },
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
      {
        key: 'icons',
        title: 'Icons and buttons',
        controls: [
          { label: 'Sort icon size', path: 'sortIcon.size', min: 8, max: 24 },
          { label: 'Row toggle size', path: 'rowToggleButton.size', min: 16, max: 48 },
        ],
      },
    ],
  },
}

const inComponent = (t: TokenDescriptor, component: string, path: string) =>
  t.component === component && componentPath(t).join('.') === path

/** The light and dark tokens at a component path: one shared token for both, or one per mode. */
export function componentCell(descriptors: TokenDescriptor[], component: string, path: string): { light?: TokenDescriptor, dark?: TokenDescriptor } {
  const cell: { light?: TokenDescriptor, dark?: TokenDescriptor } = {}
  for (const t of descriptors) {
    if (!inComponent(t, component, path)) continue
    if (t.scheme === 'light') cell.light = t
    else if (t.scheme === 'dark') cell.dark = t
    else {
      cell.light ??= t
      cell.dark ??= t
    }
  }
  return cell
}

/** The shared token at a component path, or its light and dark ones (one control each). */
export function componentTokens(descriptors: TokenDescriptor[], component: string, path: string): TokenDescriptor[] {
  const matches = descriptors.filter(t => inComponent(t, component, path))
  const shared = matches.find(t => t.scheme === null)
  if (shared) return [shared]
  const order: Record<ColorScheme, number> = { light: 0, dark: 1 }
  return matches.sort((a, b) => order[a.scheme!] - order[b.scheme!])
}
