import Aura from '@primeuix/themes/aura'
import { definePreset } from '@primeuix/themes'

const zinc = (shade: number) => `{zinc.${shade}}`

// Fixed preset for the editor chrome. Deliberately neutral (no hue), so the
// theme being designed is the only real color on screen.
const EditorPreset = definePreset(Aura, {
  semantic: {
    primary: Object.fromEntries([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(s => [s, zinc(s)])),
    colorScheme: {
      light: {
        primary: { color: zinc(900), contrastColor: '#ffffff', hoverColor: zinc(800), activeColor: zinc(700) },
        highlight: { background: zinc(100), focusBackground: zinc(200), color: zinc(900), focusColor: zinc(950) },
      },
      dark: {
        primary: { color: zinc(50), contrastColor: zinc(950), hoverColor: zinc(200), activeColor: zinc(300) },
        highlight: { background: 'rgba(255,255,255,.1)', focusBackground: 'rgba(255,255,255,.16)', color: '#ffffff', focusColor: '#ffffff' },
      },
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
