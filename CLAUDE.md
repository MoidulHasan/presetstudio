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
- State (`ThemeState` v2): `basePreset` + `design` (high-level decisions: primary, surface per scheme (built-in, tinted or any custom color), status colors per severity, tinted light backgrounds, radius scale or custom px steps, density preset or custom scale, focus ring; each defaults to `{ kind: 'base' }`/`'base'` = inherit) + raw `overrides` (win last). `build.ts`: `designToTokens` → merge overrides → `definePreset(base, …)`. Design decisions must reach every component in all 4 presets: density scales every literal padding/gap/gutter/margin token, a custom focus outline rewrites every component `focusRing` (except form fields and inset rings), status colors add `primitive.status.<kind>` palettes and repoint chromatic references inside each severity's component tokens (keeping the shade). New optional design fields only need defaults in `parseDesign`; bump the version and add a migration in `serialize.ts` for any other shape change.
- Preview CSS (`preview-css.ts`, `usePreviewForcedStyles`): focus/hover/pressed styles are copied from the stylesheet source text and scoped to classes (`.ps-show-focus`, `.ps-force-hover`, `.ps-force-active`) to show states without interaction; `schemeScopeCss` re-declares the `:root` and `.ps-dark` variables inside `.ps-scheme` areas so light and dark can sit side by side on one page.
- Component studios (`STUDIO_COMPONENTS`: Button, Message, Toast, Tag, Badge): a stage in the preview (`components/preview/stage/`) shows every variant × state in light and dark; the inspector's Design view (`components/editor/studio/`) has purpose-grouped controls. Colors are shared (`VariantColors`); Button's editor is hand-built, severity components (`Severity`) are driven by `studio-controls.ts` (paths checked against all presets by its test), with stages in `components/preview/stage/` sharing `Schemes` (light/dark columns). Recoloring only moves a variant's main palette, so neutral parts (Toast detail text) stay. A variant's palette is changed by recoloring its tokens to another palette at the same shades (`recolor.ts`), so each preset's light/dark shade choices are kept; custom colors generate a palette under `primitive.ps.<component>.<group>`. Clicks on the stage arrive as `preview:stage-pick`. Studio components are listed by name in the sidebar's Components group and pinned in the component list; `editor.openComponent` always opens them in the Design view with their stage. Components built from a studio component with only a few tokens of their own (`STUDIO_FAMILY`: SplitButton, SpeedDial → Button) are edited in that studio's family section; ButtonGroup has no tokens. Foundations and patterns show what they reach with `EditorUsedBy` ("Used by N components" chips, visual editors first), and gallery demos of studio components show a Customize link (sends `preview:inspect`).
- Stores (Pinia, one-way: editor → workspace ← preset). Components use the one(s) they need (`const workspace = useWorkspaceStore()` etc.):
  - `workspace` (`app/stores/workspace.ts`): the saved themes (localStorage, v1 key migrated; tabs share it: every save and every other tab's save (`storage` event) is merged per theme by `mergeWorkspaces`, newest `updatedAt` wins, deletes leave tombstones in `state.deleted`; anything that changes a theme document must bump its `updatedAt`), the open `theme`, snapshot undo/redo per theme with key-based coalescing for drags. Change themes only through `workspace.update(mutator, coalesceKey)`; `theme` is deep-frozen in dev so direct writes throw.
  - `preset` (`app/stores/preset.ts`): the open theme as a preset: base preset loading, resolvers (theme and untouched base), descriptors, contrast, counts, export, and token edits (`setToken`, `recolorGroup`, resets). Every edit rebuilds the resolvers, so this is the hot path of drags: `buildEffectivePreset` shares the base preset's untouched subtrees (`overlayTree`) and `flattenPreset` caches per subtree, so preset trees must never be mutated; derived objects and lists that many components read use `stableComputed` (kept while their content is equal) so a drag only re-renders what shows the edited value.
  - `editor` (`app/stores/editor.ts`): UI only: prefs (section, preview options, views; the preview color scheme and section are prefs, not theme data), stage, navigation (`openComponent`, reveal, stage picks, Compare). UI constants (`EDITOR_SECTIONS`, …) live in `app/utils/editor-sections.ts`.
- Token values are untrusted (they end up in CSS custom properties): always pass them through `sanitizeTokenValue`/`sanitizeTokenTree` (`values.ts`); `serialize.ts` does this on load and on postMessage.
- Component tokens: `components.ts` lists every component of the presets (official name, PrimeVue docs category, deprecations); `components.test.ts` fails if a preset gains or loses one. Tokens are grouped by the preset's own top-level parts (root, header, option, primary, outlined…). The preview finds components by PrimeVue's `data-pc-name` (nested instances are `pc*`, reported as "also uses"); on-demand overlays are found through their gallery demo (`data-ps-demo`, derived from the demo title). Inspect mode and reveal live in `usePreviewInspector`.
- Inspector content must never be wider than the panel: flex/grid children that hold long values need `min-w-0` (PrimeVue's AccordionContent is a grid, so it needs a `minmax(0,1fr)` column).
- Editor sections (`EDITOR_SECTIONS`): Quick start; Foundations (primary, surface, status, text, shape, density, focus); Patterns (form fields, lists, menus, overlays, containers, selection: shared looks many components use, each editing one semantic group via `PATTERN_SECTIONS`, with a stage); Components (all + visual editors); Advanced → All tokens (raw semantic list); Review. Each concept has exactly one home: semantic groups that aren't patterns are set by foundations (surface, focus ring, primary's state grid in Primary color) or are part of a pattern (mask → overlays); see `SEMANTIC_ELSEWHERE`.
- Preview per section: foundations, Text, patterns and visual components have a stage (`stages.ts`: `foundation-*`, `semantic-*`, component names); overview sections (Quick start, All components, All tokens, Accessibility) show the whole gallery. The preview toolbar's Stage | In context switch (remembered) picks stage vs pages; the panel's Design | All tokens switch only changes the panel.
- Editor UI: three panes (section nav · preview iframe · inspector). Panels live in `app/components/editor/panels/`. Below `xl` the section nav becomes a select in the inspector header; below `lg` only one pane (Edit / Preview) is shown at a time.
- Pure logic (color/OKLCH, palettes, resolver, schema, design mapping, merging, export, serialization, history, contrast) lives in framework-free TS modules in `app/utils/theme/` with unit tests next to them (`*.test.ts`). These must not import Vue/Nuxt.

## Conventions

- Commands: `pnpm dev`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm license:check`. All four must pass before committing.
- UI: use PrimeVue components for every interactive control (Button, RadioButton, Menu, SelectButton, …), including links styled as buttons (`Button :as="NuxtLink"` / `as="a"`). Native elements only for semantic markup (lists, fieldset, inline text links, the `<a v-bind="props.action">` inside Menu item templates). Shared editor controls: `EditorOptionCard` (radio card), `EditorColorSwatch`.
- The `primevue.importTheme` module must export `{ preset, options }`, not a bare preset (otherwise no CSS variables are generated).
- Conventional Commits, small and logical. Don't push without the owner's review.
- Footer/README disclaimer must stay: "PrimeVue is a trademark of PrimeTek Informatics. Preset Studio is an independent open-source project and is not affiliated with or endorsed by PrimeTek."
