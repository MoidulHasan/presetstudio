# Preset Studio

Open-source (MIT) web-based visual theme/preset generator for PrimeVue 4. Deployed on Vercel.

## Licensing rules (CRITICAL)

PrimeVue 5+ and the latest versions of several PrimeTek packages are proprietary. Only the last MIT versions are allowed, pinned EXACTLY (no `^`/`~`):

- `primevue` 4.5.5, `@primevue/nuxt-module` 4.5.5, `@primevue/forms` 4.5.5 (only if needed)
- `@primeuix/themes` 2.0.3, `primeicons` 7.0.0
- Transitives are also frozen via `pnpm.overrides` + `overrides` in package.json (`@primevue/*` 4.5.5, `@primeuix/styled` 0.7.4, `@primeuix/styles` 2.0.3, `@primeuix/utils` 0.6.4). Keep both blocks in sync.

Never install primevue 5.x, any `@primevue/*` 5.x, `@primeuix/themes` 3.x, `@primeuix/styled` 1.x, `@primeuix/styles` 3.x or primeicons 8.x. Never add a PrimeTek package without an explicit exact version (`pnpm add -E pkg@x.y.z`).

Any other new dependency must be MIT, ISC, BSD or Apache-2.0. Check with `npm view <pkg> license` before installing. Run `pnpm license:check` after dependency changes.

Don't copy code, UI, text or assets from PrimeTek's paid Theme Designer, PrimeBlocks or primeui.dev. Only the public MIT source of primevue / @primeuix/themes may be used as reference.

Trademark: the product is "Preset Studio" (`presetstudio` in code/URLs). Never use "PrimeVue"/"Prime" in the product name, logo or package name; mention PrimeVue only descriptively ("for PrimeVue"). No PrimeVue logo.

## Stack

- Nuxt 4 (`app/` dir), TypeScript strict, Node 24 (`.nvmrc`), **pnpm**
- PrimeVue 4.5.5 styled mode via `@primevue/nuxt-module`; `@primeuix/themes` 2.0.3
- Pinia (`@pinia/nuxt`) for editor state
- Tailwind CSS v4 (`@tailwindcss/vite`) + `tailwindcss-primeui` for editor layout
- `@nuxt/eslint` (lint), Vitest (unit tests)

## Architecture

- Routes (`routeRules`): `/` prerender (landing), `/docs/**` prerender, `/editor` `ssr: false`, `/preview` `ssr: false` (only ever rendered in an iframe inside `/editor`, no layout).
- Preview isolation: the editor UI uses its own fixed PrimeVue theme. The theme being designed is applied only inside the `/preview` iframe (its own PrimeVue instance) via `usePreset`. Editor → iframe communication is a typed postMessage protocol (`app/utils/theme/messages.ts`) with same-origin checks on both sides. Preview dark mode = `.ps-dark` class on the iframe's `<html>` (`darkModeSelector`).
- Theming model (from the preset source): 3 layers (primitive → semantic → components, ~3k tokens/preset), `{a.b}` references compile to `--p-a-b` CSS vars, light/dark values under `colorScheme` at any layer. Token naming rules live in `tokens.ts`; `tokens.test.ts` checks the resolver against the engine's `$dt` for every token of all 4 presets.
- State (`ThemeState` v2): `basePreset` + `design` (high-level decisions: primary, surface per scheme, radius, density, focus ring; each defaults to `{ kind: 'base' }`/`'base'` = inherit) + raw `overrides` (win last). `build.ts`: `designToTokens` → merge overrides → `definePreset(base, …)`. Bump the version and add a migration in `serialize.ts` for any shape change.
- Editor store (`app/stores/editor.ts`): workspace of multiple themes (localStorage, v1 key migrated), snapshot undo/redo per theme with key-based coalescing for drags, derived resolvers/contrast/export. Preview color scheme and section are editor prefs, not theme data. Change themes only through `store.update(mutator, coalesceKey)`.
- Token values are untrusted (they end up in CSS custom properties): always pass them through `sanitizeTokenValue`/`sanitizeTokenTree` (`values.ts`); `serialize.ts` does this on load and on postMessage.
- Editor UI: three panes (section nav · preview iframe · inspector). Panels live in `app/components/editor/panels/`.
- Pure logic (color/OKLCH, palettes, resolver, schema, design mapping, merging, export, serialization, history, contrast) lives in framework-free TS modules in `app/utils/theme/` with unit tests next to them (`*.test.ts`). These must not import Vue/Nuxt.

## Conventions

- Commands: `pnpm dev`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm license:check`. All four must pass before committing.
- UI: use PrimeVue components for every interactive control (Button, RadioButton, Menu, SelectButton, …), including links styled as buttons (`Button :as="NuxtLink"` / `as="a"`). Native elements only for semantic markup (lists, fieldset, inline text links, the `<a v-bind="props.action">` inside Menu item templates). Shared editor controls: `EditorOptionCard` (radio card), `EditorColorSwatch`.
- The `primevue.importTheme` module must export `{ preset, options }`, not a bare preset (otherwise no CSS variables are generated).
- Conventional Commits, small and logical. Don't push without the owner's review.
- Footer/README disclaimer must stay: "PrimeVue is a trademark of PrimeTek Informatics. Preset Studio is an independent open-source project and is not affiliated with or endorsed by PrimeTek."
