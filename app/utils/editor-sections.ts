import type { EditorSection } from '~/stores/editor'

export interface SectionMeta {
  label: string
  icon: string
  description: string
}

export const SECTION_META: Record<EditorSection, SectionMeta> = {
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
    description: 'The keyboard focus indicator. Press Tab inside the preview to see it.',
  },
  accessibility: {
    label: 'Accessibility',
    icon: 'pi pi-eye',
    description: 'WCAG 2.2 contrast checks for key color pairs in light and dark mode.',
  },
}
