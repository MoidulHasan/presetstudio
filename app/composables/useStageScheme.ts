import type { ColorScheme } from '~/utils/theme/types'

/**
 * The scheme a stage shows below xl, where light and dark don't fit side by side.
 * The preview page sets it whenever the editor's color scheme changes; the stage's own
 * Light | Dark switch changes it locally until then.
 */
export function useStageScheme() {
  return useState<ColorScheme>('ps-stage-scheme', () => 'light')
}
