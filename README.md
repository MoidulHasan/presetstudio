# Preset Studio

A free, open-source, web-based visual theme (preset) generator for PrimeVue 4.

Pick a base preset, choose your brand color, watch real components update live in light and dark mode, then copy a ready-to-paste `definePreset(...)` module into your app.

## Why it exists

PrimeVue 5 moved to a proprietary license, and the official Theme Designer now only comes bundled with the paid Commercial Suite. Plenty of apps still run on PrimeVue 4, which is MIT-licensed, and their developers deserve a simple, free way to build presets.

Preset Studio is built only on the last MIT-licensed releases (`primevue` 4.5.5, `@primeuix/themes` 2.0.3, `primeicons` 7.0.0). These are pinned exactly and verified by a license-check script. It shares no code, UI or assets with PrimeTek's commercial products.

## Features

- **Base presets:** Aura, Lara, Nora and Material. A new theme starts identical to its base, and every control can reset back to it
- **Primary color:** use the preset default, pick one of the 22 built-in palettes, or enter a custom color. Custom colors get a perceptual (OKLCH) or classic 50–950 scale, and any shade can be fine-tuned by hand
- **Surfaces:** neutral palettes chosen separately for light and dark mode, including a neutral tinted with your primary hue
- **Shape and density:** corner-radius scales, plus compact/comfortable spacing across inputs, buttons, lists, overlays, cards and tables
- **Focus ring:** keep the preset's own style or switch to a custom outline (width, offset, color)
- **Accessibility:** live WCAG contrast checks for key color pairs in both color schemes, with a one-click fix for primary button text
- **Live, isolated preview:** the theme renders in an iframe with its own PrimeVue instance, so the editor UI never changes
- **Every component:** a gallery of about 80 PrimeVue components in 10 categories, plus realistic dashboard, form and settings pages
- **Light and dark side by side,** at desktop, tablet or mobile widths
- **Quick start:** base style, brand color, corners and neutrals in four steps
- **Multiple themes** with undo/redo (⌘Z / ⇧⌘Z), saved in your browser. The editor itself has light and dark modes
- **Code export:** a minimal `definePreset(...)` module named after your theme, plus ready-made Nuxt and Vue setup snippets, with copy and download

Planned: semantic and component token editors with an inspect mode, token search, page templates, and import/share.

## Usage of the exported preset

```ts
// my-preset.ts: paste the exported code here
import PrimeVue from 'primevue/config'
import MyPreset from './my-preset'

app.use(PrimeVue, { theme: { preset: MyPreset } })
```

With Nuxt and `@primevue/nuxt-module`, set `primevue: { importTheme: { as: 'MyPreset', from: '~/my-preset.ts' } }`.

## Stack

- [Nuxt 4](https://nuxt.com) with TypeScript in strict mode, on Node 24
- PrimeVue 4.5.5 in styled mode, with `@primeuix/themes` 2.0.3
- Pinia for editor state
- Tailwind CSS v4 with `tailwindcss-primeui`
- ESLint (`@nuxt/eslint`) and Vitest
- Deployed on Vercel

## Development

Requires Node 24 (`nvm use`) and pnpm.

```bash
pnpm install          # install dependencies
pnpm dev              # dev server at http://localhost:3000
pnpm lint             # ESLint
pnpm test             # unit tests (Vitest)
pnpm typecheck        # vue-tsc type check
pnpm build            # production build
pnpm license:check    # fail if any PrimeTek package isn't MIT / on a proprietary major
```

### Project layout

```
app/
  pages/            /, /editor, /preview (iframe only), /docs
  components/       app shell, editor panels, preview gallery
  stores/theme.ts   Pinia store (ThemeState, persisted to localStorage)
  utils/theme/      framework-free logic: palette, merge, export, serialize, messages (+ tests)
  themes/           the editor's own fixed theme
scripts/
  check-licenses.mjs
```

### Dependency policy

Never upgrade `primevue`, `@primevue/*`, `@primeuix/*` or `primeicons` past their pinned versions. Newer majors are proprietary. Dependabot ignores major updates for these packages, and `pnpm license:check` fails if one slips in. New dependencies must be MIT, ISC, BSD or Apache-2.0.

## License

[MIT](./LICENSE) © 2026 Moidul Hasan Khan. Third-party notices are in [THIRD_PARTY_LICENSES.md](./THIRD_PARTY_LICENSES.md).

## Disclaimer

PrimeVue is a trademark of PrimeTek Informatics. Preset Studio is an independent open-source project and is not affiliated with or endorsed by PrimeTek.
