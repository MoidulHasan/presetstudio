import type { EditorSection } from '~/stores/editor'

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
  semantic: {
    label: 'Semantic tokens',
    icon: 'pi pi-sitemap',
    description: 'Every semantic token of the preset. Edit a value or point it at another token.',
  },
  components: {
    label: 'Component tokens',
    icon: 'pi pi-box',
    description: 'Fine-tune a single component. Click Inspect in the preview, then any component, to jump to its tokens.',
  },
  accessibility: {
    label: 'Accessibility',
    icon: 'pi pi-eye',
    description: 'WCAG 2.2 contrast checks for key color pairs in light and dark mode.',
  },
}
