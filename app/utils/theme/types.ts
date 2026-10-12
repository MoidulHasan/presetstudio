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

/** A (partial) design token tree, e.g. `{ semantic: { primary: { 500: '#10b981' } } }`. */
export interface TokenTree {
  [key: string]: TokenValue
}
export type TokenValue = string | number | TokenTree

export const THEME_STATE_VERSION = 1

export interface ThemeState {
  version: typeof THEME_STATE_VERSION
  basePreset: BasePresetName
  /** Source color for the generated primary palette (`#rrggbb`). */
  primaryColor: string
  /** Token overrides applied on top of the base preset (win over generated values). */
  overrides: TokenTree
  /** Preview color scheme. Not part of the exported preset. */
  colorScheme: ColorScheme
}

export function createDefaultThemeState(): ThemeState {
  return {
    version: THEME_STATE_VERSION,
    basePreset: 'aura',
    primaryColor: '#10b981',
    overrides: {},
    colorScheme: 'light',
  }
}
