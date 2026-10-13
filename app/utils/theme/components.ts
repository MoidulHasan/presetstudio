import type { GalleryCategory } from './messages'
import type { TokenDescriptor } from './schema'
import type { TokenGroup } from './semantic'
import type { ColorScheme, TokenTree } from './types'

// Every component the presets style (the keys of `components`), with its official PrimeVue
// name and the category it's listed under in the PrimeVue docs. `components.test.ts` checks
// this against all four base presets, so no component can be missed.

export interface ComponentMeta {
  /** Official component name, e.g. 'DatePicker'. */
  label: string
  category: GalleryCategory
  /** Replacement, for components deprecated in PrimeVue 4. */
  deprecated?: string
  /** Why the component can't be shown in the preview. */
  unpreviewable?: string
}

export const COMPONENT_META: Record<string, ComponentMeta> = {
  // Form
  autocomplete: { label: 'AutoComplete', category: 'form' },
  cascadeselect: { label: 'CascadeSelect', category: 'form' },
  checkbox: { label: 'Checkbox', category: 'form' },
  colorpicker: { label: 'ColorPicker', category: 'form' },
  datepicker: { label: 'DatePicker', category: 'form' },
  editor: { label: 'Editor', category: 'form', unpreviewable: 'Editor needs the Quill library, which the preview doesn\'t load.' },
  floatlabel: { label: 'FloatLabel', category: 'form' },
  iconfield: { label: 'IconField', category: 'form' },
  iftalabel: { label: 'IftaLabel', category: 'form' },
  inputchips: { label: 'InputChips', category: 'form', deprecated: 'AutoComplete (multiple)' },
  inputgroup: { label: 'InputGroup', category: 'form' },
  inputnumber: { label: 'InputNumber', category: 'form' },
  inputotp: { label: 'InputOtp', category: 'form' },
  inputtext: { label: 'InputText', category: 'form' },
  knob: { label: 'Knob', category: 'form' },
  listbox: { label: 'Listbox', category: 'form' },
  multiselect: { label: 'MultiSelect', category: 'form' },
  password: { label: 'Password', category: 'form' },
  radiobutton: { label: 'RadioButton', category: 'form' },
  rating: { label: 'Rating', category: 'form' },
  select: { label: 'Select', category: 'form' },
  selectbutton: { label: 'SelectButton', category: 'form' },
  slider: { label: 'Slider', category: 'form' },
  textarea: { label: 'Textarea', category: 'form' },
  togglebutton: { label: 'ToggleButton', category: 'form' },
  toggleswitch: { label: 'ToggleSwitch', category: 'form' },
  treeselect: { label: 'TreeSelect', category: 'form' },
  // Button
  button: { label: 'Button', category: 'button' },
  speeddial: { label: 'SpeedDial', category: 'button' },
  splitbutton: { label: 'SplitButton', category: 'button' },
  // Data
  datatable: { label: 'DataTable', category: 'data' },
  dataview: { label: 'DataView', category: 'data' },
  orderlist: { label: 'OrderList', category: 'data' },
  organizationchart: { label: 'OrganizationChart', category: 'data' },
  paginator: { label: 'Paginator', category: 'data' },
  picklist: { label: 'PickList', category: 'data' },
  timeline: { label: 'Timeline', category: 'data' },
  tree: { label: 'Tree', category: 'data' },
  treetable: { label: 'TreeTable', category: 'data' },
  virtualscroller: { label: 'VirtualScroller', category: 'data' },
  // Panel
  accordion: { label: 'Accordion', category: 'panel' },
  card: { label: 'Card', category: 'panel' },
  divider: { label: 'Divider', category: 'panel' },
  fieldset: { label: 'Fieldset', category: 'panel' },
  panel: { label: 'Panel', category: 'panel' },
  scrollpanel: { label: 'ScrollPanel', category: 'panel' },
  splitter: { label: 'Splitter', category: 'panel' },
  stepper: { label: 'Stepper', category: 'panel' },
  tabs: { label: 'Tabs', category: 'panel' },
  tabview: { label: 'TabView', category: 'panel', deprecated: 'Tabs' },
  toolbar: { label: 'Toolbar', category: 'panel' },
  // Overlay
  confirmdialog: { label: 'ConfirmDialog', category: 'overlay' },
  confirmpopup: { label: 'ConfirmPopup', category: 'overlay' },
  dialog: { label: 'Dialog', category: 'overlay' },
  drawer: { label: 'Drawer', category: 'overlay' },
  popover: { label: 'Popover', category: 'overlay' },
  tooltip: { label: 'Tooltip', category: 'overlay' },
  // File
  fileupload: { label: 'FileUpload', category: 'file' },
  // Menu
  breadcrumb: { label: 'Breadcrumb', category: 'menu' },
  contextmenu: { label: 'ContextMenu', category: 'menu' },
  dock: { label: 'Dock', category: 'menu' },
  megamenu: { label: 'MegaMenu', category: 'menu' },
  menu: { label: 'Menu', category: 'menu' },
  menubar: { label: 'Menubar', category: 'menu' },
  panelmenu: { label: 'PanelMenu', category: 'menu' },
  steps: { label: 'Steps', category: 'menu', deprecated: 'Stepper' },
  tabmenu: { label: 'TabMenu', category: 'menu', deprecated: 'Tabs' },
  tieredmenu: { label: 'TieredMenu', category: 'menu' },
  // Messages
  inlinemessage: { label: 'InlineMessage', category: 'messages', deprecated: 'Message' },
  message: { label: 'Message', category: 'messages' },
  toast: { label: 'Toast', category: 'messages' },
  // Media
  carousel: { label: 'Carousel', category: 'media' },
  galleria: { label: 'Galleria', category: 'media' },
  image: { label: 'Image', category: 'media' },
  imagecompare: { label: 'ImageCompare', category: 'media' },
  // Misc
  avatar: { label: 'Avatar', category: 'misc' },
  badge: { label: 'Badge', category: 'misc' },
  blockui: { label: 'BlockUI', category: 'misc' },
  chip: { label: 'Chip', category: 'misc' },
  inplace: { label: 'Inplace', category: 'misc' },
  metergroup: { label: 'MeterGroup', category: 'misc' },
  overlaybadge: { label: 'OverlayBadge', category: 'misc' },
  progressbar: { label: 'ProgressBar', category: 'misc' },
  progressspinner: { label: 'ProgressSpinner', category: 'misc' },
  ripple: { label: 'Ripple', category: 'misc', unpreviewable: 'Ripple is the ink effect on clicks; it shows only in apps that turn it on (ripple: true).' },
  skeleton: { label: 'Skeleton', category: 'misc' },
  tag: { label: 'Tag', category: 'misc' },
  terminal: { label: 'Terminal', category: 'misc' },
}

export const COMPONENT_NAMES = Object.keys(COMPONENT_META)

/** Components with a visual editor and stage (the rest use the token list). */
export const STUDIO_COMPONENTS: readonly string[] = ['button']

/** Category order of the PrimeVue docs. */
export const COMPONENT_CATEGORIES: readonly GalleryCategory[] = ['form', 'button', 'data', 'panel', 'overlay', 'file', 'menu', 'messages', 'media', 'misc']

export function isComponentName(value: unknown): value is string {
  return typeof value === 'string' && Object.hasOwn(COMPONENT_META, value)
}

/** Path below `components.<name>` (and below `colorScheme.<scheme>`), e.g. ['root', 'primary', 'background']. */
export function componentPath(token: TokenDescriptor): string[] {
  const rest = token.path.slice(2)
  return rest[0] === 'colorScheme' ? rest.slice(2) : rest
}

// Size keys read better spelled out ('Small', not 'Sm').
const SPECIAL_LABELS: Record<string, string> = { sm: 'Small', lg: 'Large', xl: 'Extra large' }

function humanize(key: string): string {
  if (SPECIAL_LABELS[key]) return SPECIAL_LABELS[key]
  const words = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/** Token path without the `root` wrapper of nested parts ('root.primary.background' → 'primary.background'). */
function localPath(token: TokenDescriptor): string[] {
  const path = componentPath(token)
  return path[0] === 'root' && path.length > 2 ? path.slice(1) : path
}

/**
 * The top-level part a token belongs to, as in the preset (e.g. 'header', 'primary', 'outlined');
 * '' for the root's own tokens.
 */
export function partOf(token: TokenDescriptor): string {
  const path = localPath(token)
  return path.length > 1 && path[0] !== 'root' ? path[0]! : ''
}

export function partLabel(part: string): string {
  return part ? humanize(part) : 'Root'
}

/** Label of a token inside its part, e.g. 'Hover background' or 'Focus ring › Color'. */
export function tokenLabel(token: TokenDescriptor): string {
  const path = localPath(token)
  const rest = path.slice(path[0] === 'root' || partOf(token) ? 1 : 0)
  return (rest.length ? rest : path.slice(-1)).map(humanize).join(' › ')
}

/**
 * A component's tokens visible when editing `scheme` (shared plus that scheme's), grouped by
 * part in preset order. A scheme value shadows a shared token with the same name.
 */
export function groupComponentTokens(tokens: TokenDescriptor[], component: string, scheme: ColorScheme): TokenGroup[] {
  const candidates = tokens.filter(t => t.layer === 'component' && t.component === component && (t.scheme === null || t.scheme === scheme))
  const schemeNames = new Set(candidates.filter(t => t.scheme === scheme).map(t => t.name))
  const visible = candidates.filter(t => t.scheme !== null || !schemeNames.has(t.name))

  const groups = new Map<string, TokenGroup>()
  for (const token of visible) {
    const part = partOf(token)
    const key = part || 'root'
    let group = groups.get(key)
    if (!group) {
      group = { key, label: partLabel(part), description: '', tokens: [] }
      groups.set(key, group)
    }
    group.tokens.push(token)
  }
  // Root first, then the preset's own order.
  return [...groups.values()].sort((a, b) => (a.key === 'root' ? -1 : b.key === 'root' ? 1 : 0))
}

const countLeaves = (node: unknown): number =>
  node && typeof node === 'object' ? Object.values(node).reduce<number>((n, v) => n + countLeaves(v), 0) : 1

/** Custom (raw override) token count per component. */
export function countComponentOverrides(overrides: TokenTree): Record<string, number> {
  const components = overrides.components
  if (!components || typeof components !== 'object') return {}
  return Object.fromEntries(Object.entries(components).map(([name, node]) => [name, countLeaves(node)]))
}
