export const BASE_PRESETS = ['aura', 'lara', 'nora', 'material'] as const
export type BasePresetName = (typeof BASE_PRESETS)[number]

export const BASE_PRESET_LABELS: Record<BasePresetName, string> = {
  aura: 'Aura',
  lara: 'Lara',
  nora: 'Nora',
  material: 'Material',
}

export const COLOR_SCHEMES = ['light', 'dark'] as const
export type ColorScheme = (typeof COLOR_SCHEMES)[number]

export const SHADES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] as const
export type Shade = (typeof SHADES)[number]
export type ColorPalette = Record<Shade, string>

/** Color ramps that ship as primitives in every base preset. */
export const PRIMITIVE_COLORS = [
  'emerald', 'green', 'lime', 'red', 'orange', 'amber', 'yellow', 'teal', 'cyan', 'sky', 'blue',
  'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose', 'slate', 'gray', 'zinc', 'neutral', 'stone',
] as const
export type PrimitiveColorName = (typeof PRIMITIVE_COLORS)[number]

export const NEUTRAL_COLORS = ['slate', 'gray', 'zinc', 'neutral', 'stone'] as const satisfies readonly PrimitiveColorName[]
export type NeutralColorName = (typeof NEUTRAL_COLORS)[number]

/** A (partial) design token tree, e.g. `{ semantic: { primary: { 500: '#10b981' } } }`. */
export interface TokenTree {
  [key: string]: TokenValue
}
export type TokenValue = string | number | TokenTree

export type PaletteAlgorithm = 'oklch' | 'classic'

// --- Design decisions (high-level controls mapped onto many tokens) -------------

export type PrimaryDesign
  = | { kind: 'base' }
    | { kind: 'palette', name: PrimitiveColorName }
    | { kind: 'custom', color: string, algorithm: PaletteAlgorithm, shades: Partial<ColorPalette> }

export type SurfaceDesign
  = | { kind: 'base' }
    | { kind: 'palette', name: NeutralColorName }
    /** Neutral tinted with the primary hue. `chroma` in OKLCH units (0–0.04). */
    | { kind: 'tinted', chroma: number }
    /** A surface ramp generated from any color, with optional per-shade tweaks. */
    | { kind: 'custom', color: string, shades: Partial<ColorPalette> }

/** Severities components are styled with (buttons, badges, tags, messages, toasts). */
export const STATUS_KINDS = ['info', 'success', 'warn', 'danger', 'help'] as const
export type StatusKind = (typeof STATUS_KINDS)[number]

export type StatusDesign
  = | { kind: 'base' }
    | { kind: 'palette', name: PrimitiveColorName }
    | { kind: 'custom', color: string }

export const RADIUS_SCALES = ['none', 'small', 'base', 'large', 'xlarge', 'custom'] as const
export type RadiusScale = (typeof RADIUS_SCALES)[number]

/** The borderRadius primitives a radius scale sets (`none` is always 0). */
export const RADIUS_STEPS = ['xs', 'sm', 'md', 'lg', 'xl'] as const
export type RadiusStep = (typeof RADIUS_STEPS)[number]
/** Custom radius in px per step. */
export type CustomRadius = Record<RadiusStep, number>

export const DENSITIES = ['compact', 'base', 'comfortable', 'custom'] as const
export type Density = (typeof DENSITIES)[number]

export type FocusRingDesign
  = | { kind: 'base' }
    /** Outline ring. `color` is 'primary' or a hex color. */
    | { kind: 'outline', width: number, offset: number, color: string }

export interface DesignSettings {
  primary: PrimaryDesign
  surface: { light: SurfaceDesign, dark: SurfaceDesign }
  /** Palettes behind each severity (info, success, warn, danger, help). */
  status: Record<StatusKind, StatusDesign>
  /** Light mode: tint the white backgrounds (surface.0: cards, inputs, overlays) with the surface color. */
  tintedBackgrounds: boolean
  radius: RadiusScale
  /** Used when `radius` is 'custom'. */
  customRadius: CustomRadius
  density: Density
  /** Spacing multiplier used when `density` is 'custom'. */
  densityScale: number
  focusRing: FocusRingDesign
}

export const THEME_STATE_VERSION = 2

export interface ThemeState {
  version: typeof THEME_STATE_VERSION
  basePreset: BasePresetName
  design: DesignSettings
  /** Raw token overrides; applied last, so they win over design decisions. */
  overrides: TokenTree
}

export interface ThemeDocument {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  theme: ThemeState
}

export const WORKSPACE_VERSION = 2

export interface Workspace {
  version: typeof WORKSPACE_VERSION
  activeId: string
  themes: ThemeDocument[]
  /** Deleted theme id → when (tombstones), so another tab's copy doesn't bring it back. */
  deleted: Record<string, number>
}

/** Starting point for a custom radius scale (Aura's values). */
export const DEFAULT_CUSTOM_RADIUS: CustomRadius = { xs: 2, sm: 4, md: 6, lg: 8, xl: 12 }

export function createDefaultDesign(): DesignSettings {
  return {
    primary: { kind: 'base' },
    surface: { light: { kind: 'base' }, dark: { kind: 'base' } },
    status: { info: { kind: 'base' }, success: { kind: 'base' }, warn: { kind: 'base' }, danger: { kind: 'base' }, help: { kind: 'base' } },
    tintedBackgrounds: false,
    radius: 'base',
    customRadius: { ...DEFAULT_CUSTOM_RADIUS },
    density: 'base',
    densityScale: 1,
    focusRing: { kind: 'base' },
  }
}

export function createDefaultThemeState(basePreset: BasePresetName = 'aura'): ThemeState {
  return { version: THEME_STATE_VERSION, basePreset, design: createDefaultDesign(), overrides: {} }
}
