import { describe, expect, it } from 'vitest'
import { EXAMPLE_THEMES, landingTheme } from './landing'
import { parseThemeState } from './theme/serialize'

describe('landing themes', () => {
  it('builds valid themes that survive a share link round trip', () => {
    for (const example of EXAMPLE_THEMES) {
      const theme = landingTheme(example.choices)
      expect(parseThemeState(JSON.parse(JSON.stringify(theme)))).toEqual(theme)
    }
  })

  it('only sets what was chosen', () => {
    const theme = landingTheme({ base: 'nora', brand: '#c2410c', corners: 'base' })
    expect(theme.basePreset).toBe('nora')
    expect(theme.design.primary).toEqual({ kind: 'custom', color: '#c2410c', algorithm: 'oklch', shades: {} })
    expect(theme.design.surface.light).toEqual({ kind: 'base' })
    expect(theme.design.density).toBe('base')
    expect(theme.overrides).toEqual({})
  })
})
