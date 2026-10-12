import { describe, expect, it } from 'vitest'
import EditorTheme from './editor-theme'

// `primevue.importTheme` hands this module to PrimeVue as the `theme` option.
// A bare preset here silently renders no CSS variables (the app looks unstyled).
describe('editor theme module', () => {
  it('exports { preset, options } with the dark-mode selector and CSS layer', () => {
    expect(EditorTheme.preset).toHaveProperty('semantic')
    expect(EditorTheme.preset).toHaveProperty('components')
    expect(EditorTheme.options.darkModeSelector).toBe('.ps-dark')
    expect(EditorTheme.options.cssLayer).toMatchObject({ name: 'primevue' })
  })
})
