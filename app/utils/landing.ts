import { createDefaultThemeState, type BasePresetName, type Density, type NeutralColorName, type RadiusScale, type ThemeState } from './theme/types'

/** Components the landing page's specimen uses: their tokens go into its CSS variables. */
export const SPECIMEN_COMPONENTS = ['card', 'inputtext', 'selectbutton', 'togglebutton', 'toggleswitch', 'button', 'avatar', 'tag', 'message'] as const

export type LandingCorners = Extract<RadiusScale, 'none' | 'base' | 'large' | 'xlarge'>

export interface LandingChoices {
  base: BasePresetName
  brand: string
  corners: LandingCorners
  neutral?: NeutralColorName
  density?: Exclude<Density, 'custom'>
}

/** A theme from the few choices the landing page offers (the same ones the setup starts with). */
export function landingTheme(choices: LandingChoices): ThemeState {
  const state = createDefaultThemeState(choices.base)
  state.design.primary = { kind: 'custom', color: choices.brand, algorithm: 'oklch', shades: {} }
  state.design.radius = choices.corners
  if (choices.neutral) state.design.surface = { light: { kind: 'palette', name: choices.neutral }, dark: { kind: 'palette', name: choices.neutral } }
  if (choices.density) state.design.density = choices.density
  return state
}

export interface ExampleTheme {
  name: string
  description: string
  choices: LandingChoices
}

/** Ready-made themes on the landing page; each opens in the editor as a new theme. */
export const EXAMPLE_THEMES: readonly ExampleTheme[] = [
  { name: 'Harbor', description: 'Aura, deep blue, cool grays, rounded corners.', choices: { base: 'aura', brand: '#1d4ed8', corners: 'large', neutral: 'slate' } },
  { name: 'Ledger', description: 'Lara, green, warm grays, square corners, compact.', choices: { base: 'lara', brand: '#15803d', corners: 'none', neutral: 'stone', density: 'compact' } },
  { name: 'Kiln', description: 'Nora, burnt orange, neutral grays, default corners.', choices: { base: 'nora', brand: '#c2410c', corners: 'base', neutral: 'neutral' } },
  { name: 'Tidal', description: 'Material, teal, soft corners, roomy.', choices: { base: 'material', brand: '#0f766e', corners: 'xlarge', density: 'comfortable' } },
]
