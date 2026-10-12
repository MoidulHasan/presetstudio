import { isTokenTree, mergeOverrides } from './merge'
import { normalizeHex } from './palette'
import {
  BASE_PRESETS,
  COLOR_SCHEMES,
  THEME_STATE_VERSION,
  createDefaultThemeState,
  type BasePresetName,
  type ColorScheme,
  type ThemeState,
} from './types'

function isBasePreset(value: unknown): value is BasePresetName {
  return typeof value === 'string' && (BASE_PRESETS as readonly string[]).includes(value)
}

function isColorScheme(value: unknown): value is ColorScheme {
  return typeof value === 'string' && (COLOR_SCHEMES as readonly string[]).includes(value)
}

/**
 * Validates untrusted input (localStorage, postMessage) into a ThemeState.
 * Invalid fields fall back to defaults; returns null if the input isn't an object
 * or has an unknown version.
 */
export function parseThemeState(input: unknown): ThemeState | null {
  if (!isTokenTree(input)) return null
  if (input.version !== THEME_STATE_VERSION) return null
  const defaults = createDefaultThemeState()
  const primaryColor = typeof input.primaryColor === 'string' ? normalizeHex(input.primaryColor) : null
  return {
    version: THEME_STATE_VERSION,
    basePreset: isBasePreset(input.basePreset) ? input.basePreset : defaults.basePreset,
    primaryColor: primaryColor ?? defaults.primaryColor,
    overrides: isTokenTree(input.overrides) ? mergeOverrides(input.overrides) : {},
    colorScheme: isColorScheme(input.colorScheme) ? input.colorScheme : defaults.colorScheme,
  }
}

export function serializeThemeState(state: ThemeState): string {
  return JSON.stringify(state)
}

export function deserializeThemeState(raw: string | null | undefined): ThemeState | null {
  if (!raw) return null
  try {
    return parseThemeState(JSON.parse(raw))
  }
  catch {
    return null
  }
}
