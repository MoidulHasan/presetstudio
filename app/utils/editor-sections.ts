import { PREVIEW_CATEGORIES, PREVIEW_TEMPLATES, type GalleryCategory, type PreviewCategory, type PreviewTemplate } from './theme/messages'

/** Pattern sections: shared looks that many components use (each edits one semantic group). */
export const PATTERN_SECTION_KEYS = ['formfield', 'list', 'menu', 'overlay', 'container', 'selection'] as const

export const EDITOR_SECTIONS = ['start', 'primary', 'surface', 'status', 'text', 'shape', 'density', 'focus', ...PATTERN_SECTION_KEYS, 'components', 'semantic', 'changes', 'accessibility'] as const
export type EditorSection = (typeof EDITOR_SECTIONS)[number]

export const PREVIEW_VIEWPORTS = ['full', 'tablet', 'mobile'] as const
export type PreviewViewport = (typeof PREVIEW_VIEWPORTS)[number]

export const UI_THEMES = ['system', 'light', 'dark'] as const
export type UiTheme = (typeof UI_THEMES)[number]

/** 'panels': destination rail + one panel + preview. 'classic': section nav · preview · inspector. */
export const EDITOR_LAYOUTS = ['panels', 'classic'] as const
export type EditorLayout = (typeof EDITOR_LAYOUTS)[number]

export interface Destination {
  key: string
  label: string
  /** Shorter name for the phone bar, where labels stay on one line. */
  short?: string
  icon: string
  /** Its sections, in tab order; the first is where the destination opens. */
  sections: readonly EditorSection[]
}

/**
 * The editor's top-level places, named by what people want to do (the 'panels' layout).
 * Every section belongs to exactly one.
 */
export const EDITOR_DESTINATIONS: readonly Destination[] = [
  { key: 'brand', label: 'Overview', icon: 'pi pi-home', sections: ['start'] },
  { key: 'colors', label: 'Colors', icon: 'pi pi-palette', sections: ['primary', 'surface', 'status', 'text', 'selection'] },
  { key: 'shape', label: 'Shape & spacing', short: 'Shape', icon: 'pi pi-stop', sections: ['shape', 'density', 'focus'] },
  // Shared styles (form fields, lists, …) sit with the components that use them.
  { key: 'components', label: 'Components', icon: 'pi pi-th-large', sections: ['components', 'formfield', 'list', 'menu', 'overlay', 'container'] },
  { key: 'review', label: 'Review', icon: 'pi pi-check-circle', sections: ['changes', 'accessibility', 'semantic'] },
]

export function destinationOf(section: EditorSection): Destination {
  return EDITOR_DESTINATIONS.find(d => d.sections.includes(section)) ?? EDITOR_DESTINATIONS[0]!
}

export interface SectionMeta {
  label: string
  /** Shorter name for the section tabs, when the label is long ('Primary' for 'Primary color'). */
  tab?: string
  icon: string
  description: string
}

export const SECTION_META: Record<EditorSection, SectionMeta> = {
  start: {
    label: 'Overview',
    icon: 'pi pi-home',
    description: 'Your theme at a glance: each choice and where it’s set, whether it’s ready, and the way out.',
  },
  primary: {
    label: 'Primary color',
    tab: 'Primary',
    icon: 'pi pi-palette',
    description: 'The brand color behind buttons, links, selections and focus states.',
  },
  surface: {
    label: 'Surfaces',
    icon: 'pi pi-clone',
    description: 'The neutral scale used for backgrounds, borders and text.',
  },
  status: {
    label: 'Status colors',
    tab: 'Status',
    icon: 'pi pi-info-circle',
    description: 'The colors behind info, success, warning, danger and help: buttons, badges, tags, messages and toasts.',
  },
  shape: {
    label: 'Shape',
    icon: 'pi pi-stop',
    description: 'Corner radius scale shared by every component.',
  },
  density: {
    label: 'Density',
    icon: 'pi pi-arrows-v',
    description: 'How much breathing room inputs, buttons, lists and tables get.',
  },
  focus: {
    label: 'Focus ring',
    icon: 'pi pi-bullseye',
    description: 'The keyboard focus indicator. While you edit it, the preview shows every component focused.',
  },
  text: {
    label: 'Text',
    icon: 'pi pi-align-left',
    description: 'Default and muted text colors, at rest and hovered.',
  },
  formfield: {
    label: 'Form fields',
    icon: 'pi pi-pencil',
    description: 'Inputs, selects, date pickers and every other form control.',
  },
  list: {
    label: 'Lists',
    icon: 'pi pi-list',
    description: 'Options in dropdowns, listboxes, autocompletes and pick lists.',
  },
  menu: {
    label: 'Menus',
    icon: 'pi pi-bars',
    description: 'Items of menus, menubars, tiered, context and panel menus.',
  },
  overlay: {
    label: 'Overlays',
    icon: 'pi pi-clone',
    description: 'Dropdown panels, popovers and dialogs, and the backdrop behind dialogs.',
  },
  container: {
    label: 'Containers',
    icon: 'pi pi-window-maximize',
    description: 'Cards, panels, tabs, accordions and other containers.',
  },
  selection: {
    label: 'Selection',
    icon: 'pi pi-check-square',
    description: 'Selected items everywhere: list options, table rows, tree nodes.',
  },
  semantic: {
    label: 'All tokens',
    icon: 'pi pi-sitemap',
    description: 'Every semantic token of the preset, for fine control. The sections above edit most of them visually.',
  },
  components: {
    label: 'All components',
    tab: 'All',
    icon: 'pi pi-th-large',
    description: 'Customize a single component. Components marked Visual have an editor with a live stage.',
  },
  changes: {
    label: 'What you changed',
    icon: 'pi pi-list-check',
    description: 'Everything this theme changes from its base preset. Open a change where it\'s edited, or revert it.',
  },
  accessibility: {
    label: 'Accessibility',
    icon: 'pi pi-eye',
    description: 'WCAG 2.2 contrast checks for key color pairs in light and dark mode.',
  },
}

// --- What "In an app" shows --------------------------------------------------------------

/** A sample app page or a component gallery category, as the preview's page menu names it. */
export type PreviewPage = `page:${Exclude<PreviewTemplate, 'components'>}` | `gallery:${PreviewCategory}`

export function isPreviewPage(value: unknown): value is PreviewPage {
  if (typeof value !== 'string') return false
  const [kind, name] = value.split(':')
  if (kind === 'page') return PREVIEW_TEMPLATES.includes(name as PreviewTemplate) && name !== 'components'
  return kind === 'gallery' && PREVIEW_CATEGORIES.includes(name as PreviewCategory)
}

/**
 * The page each section is seen on "In an app": where what it changes shows up. A component
 * is seen in its gallery category (`pageForComponent`). The user's own pick wins.
 */
export const SECTION_PAGES: Record<EditorSection, PreviewPage> = {
  start: 'page:dashboard',
  primary: 'page:dashboard',
  surface: 'page:settings',
  status: 'page:dashboard',
  text: 'page:settings',
  shape: 'page:dashboard',
  density: 'page:dashboard',
  focus: 'page:form',
  formfield: 'page:form',
  list: 'gallery:form',
  menu: 'gallery:menu',
  overlay: 'gallery:overlay',
  container: 'page:settings',
  selection: 'gallery:data',
  components: 'gallery:all',
  semantic: 'gallery:all',
  changes: 'page:dashboard',
  accessibility: 'page:dashboard',
}

export function pageForComponent(category: GalleryCategory): PreviewPage {
  return `gallery:${category}`
}
