// Shared (both-mode) controls of each visual editor besides colors, by purpose. Paths are below
// `components.<name>`; controls whose token a preset lacks are hidden. The control type follows
// the token kind (length → slider, padding with two values → vertical/horizontal sliders, font
// weight → select, shadow → presets). `studio-controls.test.ts` checks every path exists.

export type StudioSize = 'normal' | 'sm' | 'lg' | 'xl'
export const SIZE_LABELS: Record<StudioSize, string> = { normal: 'Normal', sm: 'Small', lg: 'Large', xl: 'XL' }

export interface StudioControl {
  label: string
  hint?: string
  /** One path, or one per size when the section has sizes (missing sizes hide the control). */
  path: string | Partial<Record<StudioSize, string>>
  min?: number
  max?: number
  /** The token is per color scheme: show one control for light and one for dark. */
  schemes?: boolean
}

export interface StudioSection {
  key: string
  title: string
  description?: string
  sizes?: StudioSize[]
  controls: StudioControl[]
}

export interface StudioConfig {
  /** What the preview stage shows, for the Colors description. */
  colorsDescription: string
  sections: StudioSection[]
}

export const STUDIO_CONFIG: Record<string, StudioConfig> = {
  message: {
    colorsDescription: 'One palette recolors a severity in all three styles and both modes, keeping the preset\'s shades.',
    sections: [
      {
        key: 'shape',
        title: 'Shape',
        controls: [
          { label: 'Corner radius', path: 'root.borderRadius', max: 24 },
          { label: 'Border width', path: 'root.borderWidth', max: 6 },
          { label: 'Border width', hint: 'outlined', path: 'outlined.root.borderWidth', max: 6 },
        ],
      },
      {
        key: 'size',
        title: 'Size and spacing',
        sizes: ['sm', 'normal', 'lg'],
        controls: [
          { label: 'Padding', path: { normal: 'content.padding', sm: 'content.sm.padding', lg: 'content.lg.padding' } },
          { label: 'Gap between icon and text', path: { normal: 'content.gap' }, max: 24 },
          { label: 'Font size', path: { normal: 'text.fontSize', sm: 'text.sm.fontSize', lg: 'text.lg.fontSize' }, min: 8, max: 28 },
          { label: 'Icon size', path: { normal: 'icon.size', sm: 'icon.sm.size', lg: 'icon.lg.size' }, min: 8, max: 32 },
          { label: 'Close icon size', path: { normal: 'closeIcon.size', sm: 'closeIcon.sm.size', lg: 'closeIcon.lg.size' }, min: 8, max: 32 },
          { label: 'Padding', hint: 'simple', path: { normal: 'simple.content.padding' } },
        ],
      },
      { key: 'text', title: 'Text', controls: [{ label: 'Weight', path: 'text.fontWeight' }] },
      {
        key: 'close',
        title: 'Close button',
        controls: [
          { label: 'Width', path: 'closeButton.width', min: 16, max: 48 },
          { label: 'Height', path: 'closeButton.height', min: 16, max: 48 },
          { label: 'Corner radius', path: 'closeButton.borderRadius', max: 24 },
        ],
      },
    ],
  },
  toast: {
    colorsDescription: 'One palette recolors a severity in both modes, keeping the preset\'s shades. Detail text stays neutral.',
    sections: [
      {
        key: 'shape',
        title: 'Shape',
        controls: [
          { label: 'Width', path: 'root.width', min: 200, max: 640, hint: 'of each toast' },
          { label: 'Corner radius', path: 'root.borderRadius', max: 24 },
          { label: 'Border width', path: 'root.borderWidth', max: 6 },
        ],
      },
      {
        key: 'size',
        title: 'Spacing',
        controls: [
          { label: 'Padding', path: 'content.padding' },
          { label: 'Gap between icon and text', path: 'content.gap', max: 24 },
          { label: 'Gap between summary and detail', path: 'text.gap', max: 24 },
          { label: 'Icon size', path: 'icon.size', min: 8, max: 32 },
        ],
      },
      {
        key: 'text',
        title: 'Text',
        controls: [
          { label: 'Summary size', path: 'summary.fontSize', min: 8, max: 28 },
          { label: 'Summary weight', path: 'summary.fontWeight' },
          { label: 'Detail size', path: 'detail.fontSize', min: 8, max: 28 },
          { label: 'Detail weight', path: 'detail.fontWeight' },
        ],
      },
      {
        key: 'close',
        title: 'Close button',
        controls: [
          { label: 'Width', path: 'closeButton.width', min: 16, max: 48 },
          { label: 'Height', path: 'closeButton.height', min: 16, max: 48 },
          { label: 'Corner radius', path: 'closeButton.borderRadius', max: 24 },
          { label: 'Close icon size', path: 'closeIcon.size', min: 8, max: 32 },
        ],
      },
    ],
  },
  tag: {
    colorsDescription: 'One palette recolors a severity in both modes, keeping the preset\'s shades.',
    sections: [
      {
        key: 'shape',
        title: 'Shape',
        controls: [
          { label: 'Corner radius', hint: 'all tags', path: 'root.borderRadius', max: 24 },
          { label: 'Pill radius', hint: 'tags with rounded', path: 'root.roundedBorderRadius', max: 48 },
        ],
      },
      {
        key: 'size',
        title: 'Size and spacing',
        controls: [
          { label: 'Padding', path: 'root.padding' },
          { label: 'Gap between icon and text', path: 'root.gap', max: 16 },
          { label: 'Font size', path: 'root.fontSize', min: 8, max: 24 },
          { label: 'Icon size', path: 'icon.size', min: 8, max: 24 },
        ],
      },
      { key: 'text', title: 'Text', controls: [{ label: 'Weight', path: 'root.fontWeight' }] },
    ],
  },
  badge: {
    colorsDescription: 'One palette recolors a severity in both modes, keeping the preset\'s shades.',
    sections: [
      { key: 'shape', title: 'Shape', controls: [{ label: 'Corner radius', path: 'root.borderRadius', max: 24 }] },
      {
        key: 'size',
        title: 'Size',
        sizes: ['sm', 'normal', 'lg', 'xl'],
        controls: [
          { label: 'Height', path: { normal: 'root.height', sm: 'sm.height', lg: 'lg.height', xl: 'xl.height' }, min: 8, max: 48 },
          { label: 'Minimum width', path: { normal: 'root.minWidth', sm: 'sm.minWidth', lg: 'lg.minWidth', xl: 'xl.minWidth' }, min: 8, max: 64 },
          { label: 'Font size', path: { normal: 'root.fontSize', sm: 'sm.fontSize', lg: 'lg.fontSize', xl: 'xl.fontSize' }, min: 6, max: 24 },
          { label: 'Padding', path: { normal: 'root.padding' } },
          { label: 'Dot size', path: { normal: 'dot.size' }, min: 4, max: 24 },
        ],
      },
      { key: 'text', title: 'Text', controls: [{ label: 'Weight', path: 'root.fontWeight' }] },
    ],
  },
}

/** A control's path for a size (sections without sizes use 'normal'). */
export function controlPath(control: StudioControl, size: StudioSize = 'normal'): string | null {
  return typeof control.path === 'string' ? (size === 'normal' ? control.path : null) : control.path[size] ?? null
}
