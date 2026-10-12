import Aura from '@primeuix/themes/aura'
import { definePreset } from '@primeuix/themes'

// Fixed preset for the editor chrome. Never changed at runtime.
const EditorPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{violet.50}',
      100: '{violet.100}',
      200: '{violet.200}',
      300: '{violet.300}',
      400: '{violet.400}',
      500: '{violet.500}',
      600: '{violet.600}',
      700: '{violet.700}',
      800: '{violet.800}',
      900: '{violet.900}',
      950: '{violet.950}',
    },
  },
})

// `importTheme` passes this object as PrimeVue's `theme` option, so it must be
// `{ preset, options }`, not a bare preset. Options here replace `options.theme`.
export default {
  preset: EditorPreset,
  options: {
    darkModeSelector: '.ps-dark',
    cssLayer: { name: 'primevue', order: 'theme, base, primevue' },
  },
}
