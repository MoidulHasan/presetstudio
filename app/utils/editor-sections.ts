/** Pattern sections: shared looks that many components use (each edits one semantic group). */
export const PATTERN_SECTION_KEYS = ['formfield', 'list', 'menu', 'overlay', 'container', 'selection'] as const

export const EDITOR_SECTIONS = ['start', 'primary', 'surface', 'status', 'text', 'shape', 'density', 'focus', ...PATTERN_SECTION_KEYS, 'components', 'semantic', 'accessibility'] as const
export type EditorSection = (typeof EDITOR_SECTIONS)[number]

export const PREVIEW_VIEWPORTS = ['full', 'tablet', 'mobile'] as const
export type PreviewViewport = (typeof PREVIEW_VIEWPORTS)[number]

export const UI_THEMES = ['system', 'light', 'dark'] as const
export type UiTheme = (typeof UI_THEMES)[number]

export interface SectionMeta {
  label: string
  icon: string
  description: string
}

export const SECTION_META: Record<EditorSection, SectionMeta> = {
  start: {
    label: 'Quick start',
    icon: 'pi pi-bolt',
    description: 'Four decisions that get you most of the way. Fine-tune each one in the sections below.',
  },
  primary: {
    label: 'Primary color',
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
    icon: 'pi pi-th-large',
    description: 'Customize a single component. Components marked Visual have an editor with a live stage.',
  },
  accessibility: {
    label: 'Accessibility',
    icon: 'pi pi-eye',
    description: 'WCAG 2.2 contrast checks for key color pairs in light and dark mode.',
  },
}
