import Aura from '@primeuix/themes/aura'
import { describe, expect, it } from 'vitest'
import { BRAND_SUGGESTIONS } from './brand-suggestions'
import { contrastRatio, parseColor } from './color'
import { tokenContrast } from './contrast'
import { themeResolver } from './specimen'
import { createDefaultThemeState, type TokenTree } from './types'

describe('brand suggestions', () => {
  it('each passes AA with white text', () => {
    const white = parseColor('#ffffff')!
    for (const { name, value } of BRAND_SUGGESTIONS) {
      expect(contrastRatio(white, parseColor(value)!), name).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('each keeps primary buttons readable once it is the brand color', () => {
    for (const { name, value } of BRAND_SUGGESTIONS) {
      const state = createDefaultThemeState()
      state.design.primary = { kind: 'custom', color: value, algorithm: 'oklch', shades: {} }
      const ratio = tokenContrast(themeResolver(state, Aura as unknown as TokenTree), 'primary-contrast-color', 'primary-color')
      expect(ratio, name).toBeGreaterThanOrEqual(4.5)
    }
  })
})
