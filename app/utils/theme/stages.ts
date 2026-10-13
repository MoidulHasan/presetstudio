import { isComponentName } from './components'
import { SEMANTIC_STAGE_NAMES } from './semantic-studio'

// Preview stages: what the preview shows for a section instead of the pages (every relevant
// state, light and dark). Components with a visual editor use their own name; pattern sections
// use 'semantic-<group>'; foundations use these.
export const FOUNDATION_STAGES = {
  primary: 'foundation-primary',
  surface: 'foundation-surface',
  status: 'foundation-status',
  shape: 'foundation-shape',
  density: 'foundation-density',
  focus: 'foundation-focus',
} as const
export type FoundationSection = keyof typeof FOUNDATION_STAGES

const FOUNDATION_STAGE_NAMES: readonly string[] = Object.values(FOUNDATION_STAGES)

export function isStageName(value: unknown): value is string {
  return isComponentName(value)
    || (typeof value === 'string' && (SEMANTIC_STAGE_NAMES.includes(value) || FOUNDATION_STAGE_NAMES.includes(value)))
}
