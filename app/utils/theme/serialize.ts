import { DENSITY_SCALE_RANGE, MAX_RADIUS } from './design'
import { isTokenTree, mergeOverrides } from './merge'
import { normalizeHex } from './palette'
import { sanitizeTokenTree } from './values'
import {
  BASE_PRESETS,
  DENSITIES,
  NEUTRAL_COLORS,
  PRIMITIVE_COLORS,
  RADIUS_SCALES,
  RADIUS_STEPS,
  SHADES,
  THEME_STATE_VERSION,
  WORKSPACE_VERSION,
  createDefaultDesign,
  createDefaultThemeState,
  type CustomRadius,
  type DesignSettings,
  type FocusRingDesign,
  type PrimaryDesign,
  type SurfaceDesign,
  type ThemeDocument,
  type ThemeState,
  type Workspace,
} from './types'

// All parsing here treats input as untrusted (localStorage, postMessage, imports).

const oneOf = <T extends string>(list: readonly T[], value: unknown): value is T =>
  typeof value === 'string' && (list as readonly string[]).includes(value)

const finite = (value: unknown, min: number, max: number, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback

function parsePrimary(input: unknown): PrimaryDesign {
  if (!isTokenTree(input)) return { kind: 'base' }
  if (input.kind === 'palette' && oneOf(PRIMITIVE_COLORS, input.name)) return { kind: 'palette', name: input.name }
  if (input.kind === 'custom' && typeof input.color === 'string') {
    const color = normalizeHex(input.color)
    if (!color) return { kind: 'base' }
    const shades: Partial<Record<(typeof SHADES)[number], string>> = {}
    if (isTokenTree(input.shades)) {
      for (const shade of SHADES) {
        const value = input.shades[shade]
        const hex = typeof value === 'string' ? normalizeHex(value) : null
        if (hex) shades[shade] = hex
      }
    }
    return { kind: 'custom', color, algorithm: input.algorithm === 'classic' ? 'classic' : 'oklch', shades }
  }
  return { kind: 'base' }
}

function parseSurface(input: unknown): SurfaceDesign {
  if (!isTokenTree(input)) return { kind: 'base' }
  if (input.kind === 'palette' && oneOf(NEUTRAL_COLORS, input.name)) return { kind: 'palette', name: input.name }
  if (input.kind === 'tinted') return { kind: 'tinted', chroma: finite(input.chroma, 0, 0.04, 0.012) }
  return { kind: 'base' }
}

function parseFocusRing(input: unknown): FocusRingDesign {
  if (!isTokenTree(input) || input.kind !== 'outline') return { kind: 'base' }
  const color = typeof input.color === 'string' && input.color !== 'primary' ? normalizeHex(input.color) : 'primary'
  return {
    kind: 'outline',
    width: finite(input.width, 0, 8, 2),
    offset: finite(input.offset, -4, 8, 2),
    color: color ?? 'primary',
  }
}

function parseCustomRadius(input: unknown, fallback: CustomRadius): CustomRadius {
  const source = isTokenTree(input) ? input : {}
  return Object.fromEntries(RADIUS_STEPS.map(step => [step, Math.round(finite(source[step], 0, MAX_RADIUS, fallback[step]))])) as CustomRadius
}

function parseDesign(input: unknown): DesignSettings {
  const defaults = createDefaultDesign()
  if (!isTokenTree(input)) return defaults
  const surface = isTokenTree(input.surface) ? input.surface : {}
  return {
    primary: parsePrimary(input.primary),
    surface: { light: parseSurface(surface.light), dark: parseSurface(surface.dark) },
    tintedBackgrounds: (input as Record<string, unknown>).tintedBackgrounds === true,
    radius: oneOf(RADIUS_SCALES, input.radius) ? input.radius : defaults.radius,
    customRadius: parseCustomRadius(input.customRadius, defaults.customRadius),
    density: oneOf(DENSITIES, input.density) ? input.density : defaults.density,
    densityScale: finite(input.densityScale, DENSITY_SCALE_RANGE.min, DENSITY_SCALE_RANGE.max, defaults.densityScale),
    focusRing: parseFocusRing(input.focusRing),
  }
}

/** Migrates a v1 state ({ basePreset, primaryColor, overrides, colorScheme }). */
function migrateV1(input: Record<string, unknown>): ThemeState {
  const state = createDefaultThemeState(oneOf(BASE_PRESETS, input.basePreset) ? input.basePreset : 'aura')
  const color = typeof input.primaryColor === 'string' ? normalizeHex(input.primaryColor) : null
  // v1 always used PrimeTek's palette(); keep the exact same colors.
  if (color) state.design.primary = { kind: 'custom', color, algorithm: 'classic', shades: {} }
  if (isTokenTree(input.overrides)) state.overrides = sanitizeTokenTree(mergeOverrides(input.overrides))
  return state
}

/**
 * Validates untrusted input into a ThemeState (v2, or v1 migrated).
 * Invalid fields fall back to defaults; returns null for non-objects or unknown versions.
 */
export function parseThemeState(input: unknown): ThemeState | null {
  if (!isTokenTree(input)) return null
  if (input.version === 1) return migrateV1(input)
  if (input.version !== THEME_STATE_VERSION) return null
  return {
    version: THEME_STATE_VERSION,
    basePreset: oneOf(BASE_PRESETS, input.basePreset) ? input.basePreset : 'aura',
    design: parseDesign(input.design),
    overrides: isTokenTree(input.overrides) ? sanitizeTokenTree(mergeOverrides(input.overrides)) : {},
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

// --- Workspace (multiple themes) -------------------------------------------------

export function createThemeId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function createThemeDocument(name: string, theme: ThemeState = createDefaultThemeState(), now = Date.now()): ThemeDocument {
  return { id: createThemeId(), name, createdAt: now, updatedAt: now, theme }
}

export function createWorkspace(theme?: ThemeState): Workspace {
  const doc = createThemeDocument('My theme', theme)
  return { version: WORKSPACE_VERSION, activeId: doc.id, themes: [doc] }
}

const MAX_NAME_LENGTH = 60

export function sanitizeThemeName(name: unknown, fallback = 'Untitled theme'): string {
  if (typeof name !== 'string') return fallback
  // eslint-disable-next-line no-control-regex
  const clean = name.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, MAX_NAME_LENGTH)
  return clean || fallback
}

function parseThemeDocument(input: unknown): ThemeDocument | null {
  if (!isTokenTree(input) || typeof input.id !== 'string' || !input.id) return null
  const theme = parseThemeState(input.theme)
  if (!theme) return null
  const now = Date.now()
  return {
    id: input.id.slice(0, 64),
    name: sanitizeThemeName(input.name),
    createdAt: finite(input.createdAt, 0, Number.MAX_SAFE_INTEGER, now),
    updatedAt: finite(input.updatedAt, 0, Number.MAX_SAFE_INTEGER, now),
    theme,
  }
}

export function parseWorkspace(input: unknown): Workspace | null {
  if (!isTokenTree(input) || input.version !== WORKSPACE_VERSION) return null
  const raw = (input as unknown as { themes?: unknown }).themes
  if (!Array.isArray(raw)) return null
  const seen = new Set<string>()
  const themes = raw.map(parseThemeDocument).filter((d): d is ThemeDocument => {
    if (!d || seen.has(d.id)) return false
    seen.add(d.id)
    return true
  })
  if (!themes.length) return null
  const activeId = typeof input.activeId === 'string' && seen.has(input.activeId) ? input.activeId : themes[0]!.id
  return { version: WORKSPACE_VERSION, activeId, themes }
}

export function deserializeWorkspace(raw: string | null | undefined): Workspace | null {
  if (!raw) return null
  try {
    return parseWorkspace(JSON.parse(raw))
  }
  catch {
    return null
  }
}
