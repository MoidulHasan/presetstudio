# Preset Studio: work plan

Hand-off for continuing the work in a new session. Read `CLAUDE.md` first: licensing rules,
architecture and conventions there are binding. This file is the task list plus what a fresh
session needs to know that isn't in the code.

Last updated: 2026-10-29 (version 1.0.0).

---

## 1. Where things stand

### Product

Live at [presetstudio.vercel.app](https://presetstudio.vercel.app). The editor (`/editor`) has one
layout: a destination rail and one panel beside the live preview (an iframe, `/preview`).

| Destination | Sections |
|---|---|
| Overview | The theme at a glance (tiles drawn in its colors), base style, ready-to-ship checklist |
| Colors | Primary, Surfaces, Status, Text, Selection |
| Shape & spacing | Shape, Density, Focus ring |
| Components | All 88 components (tokens) + visual editors (Button with its family, Message, Toast, Tag, Badge); shared styles: Form fields, Lists, Menus, Overlays, Containers |
| Review | What you changed, Accessibility (contrast, Fix / Fix all), All tokens |

New themes go through the guided setup (four questions, or one of four example themes). The site
has a home page with a live try-out, `/docs`, a social card and Vercel Web Analytics.

### Deploy and repo

- GitHub `main` is production: Vercel deploys every push (about 2 minutes); CI runs license check,
  lint, type check, tests and build on every push and pull request.
- Check what's unpushed with `git log origin/main..main`.
- Repo basics: `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md`, issue and pull request
  templates.

### Health (2026-10-29)

- 28 test files, 219 tests; lint, types, build and license check green.
- Full browser sweep (Chrome only): 180 views (18 sections × 4 base styles, light / dark / both,
  1440 / 1100 / 390 px), all 88 component editors, every token validated as CSS under extreme
  settings, and the main flows (setup, undo across reloads, two tabs, share link and file round
  trips, search, Pick, Compare, contrast Fix all, theme menu, phone preview). All clean.
- The export was checked in fresh Nuxt 4 and Vite + Vue apps: every checked token matched in light
  and dark.

---

## 2. How to work

### Setup and checks

```bash
nvm use 24            # .nvmrc
pnpm install
pnpm dev              # http://localhost:3000/editor

# before every commit (CLAUDE.md requires all of them)
pnpm lint
pnpm exec vue-tsc --noEmit -p .nuxt/tsconfig.app.json
pnpm test
pnpm build
pnpm license:check
```

### Owner's working preferences (follow them)

- **Never push without the owner saying so** ("push it"). Commit freely, in small Conventional Commits ending with the `Co-Authored-By` line the session gives you.
- **Interactive UI = PrimeVue components**; natives only for semantic markup.
- **Verify UI in a real browser**, not just tests: light and dark, and wide, medium and phone widths. The owner judges by what they see.
- Quiet UI: one home per concept, plain labels, no explanatory gray text (ⓘ tooltips instead), nothing said twice.
- Propose deep restructures briefly (with a recommendation) and wait for "go"; just do clear fixes.
- The owner runs `pnpm dev` on port 3000 in their own terminal: don't stop it, and don't build in the repo while it runs (a build rewrites files it uses). Build in a copy instead (below).
- Don't change the owner's saved themes while testing; use a fresh browser context.

### Building without disturbing the dev server

```bash
B=/c/Users/<you>/AppData/Local/Temp/psb   # short path: Windows' 260-character limit breaks deep pnpm paths
rm -rf "$B" && mkdir -p "$B"
git ls-files -co --exclude-standard -z | tar --null -T - -cf - | tar -xf - -C "$B"
cd "$B" && pnpm install --frozen-lockfile --prefer-offline && pnpm build
```

### Verifying UI without a person

With a browser tool, the stores are reachable from the page:

```js
const pinia = document.querySelector('#__nuxt').__vue_app__.config.globalProperties.$pinia
const editor = pinia._s.get('editor')   // also 'workspace', 'preset'
editor.openSection('formfield')
editor.openComponent('button')
document.querySelector('iframe').contentDocument   // the preview
```

For sweeps, open a fresh browser context (empty storage), and collect `console` errors and
`pageerror`s while switching sections; check `aside[aria-label=Inspector]` for
`scrollWidth > clientWidth` (overflow).

### Gotchas (cost real time before)

- **Background tab**: browser automation may run with `document.visibilityState === 'hidden'`, which stalls `requestAnimationFrame`; take a screenshot first to make the tab visible.
- **Pinia store changes don't hot-reload**: reload the page after editing a store.
- **Hot reload between multi-step edits** logs transitional errors (half-edited files). Reload and recheck before believing them.
- **Tailwind v4 in dev** doesn't generate arbitrary classes (`h-[630px]`) from a brand-new file until the dev server restarts.
- **`nuxt.config.ts` changes restart the dev server**, and `pnpm add` reloads its dependencies once.
- **CRLF files**: scripted multi-line replacements must match the file's line endings.
- **vue-tsc in templates**: assigning to a ref or indexing a const map inside a template expression fails type checking; move it into a script function.
- **PrimeVue states**: hover, pressed and focus-visible are pseudo-classes (forced via `preview-css.ts`); list and menu focus and selection are classes (`.p-focus`, `.p-*-option-selected`). Stages show those with PrimeVue's own markup.
- **Static markup needs the component CSS**: PrimeVue loads a component's styles only when an instance mounts; stages with static markup also mount a hidden real instance.
- **Light and dark on one page** works only inside `.ps-scheme` areas (`schemeScopeCss`).
- **Stage pick targets** match `/^[a-z]+(?::[a-z]+){0,3}$/`.
- **Generated lengths never write a bare `0`**: PrimeVue adds tokens to lengths in `calc()`, where a bare 0 is invalid (it froze Material's switch handle).

---

## 3. Tasks (in recommended order)

### P0. Before announcing

1. **Owner settings:** enable Web Analytics in Vercel; enable private vulnerability reporting (GitHub → Settings → Security), which `SECURITY.md` points to; set the repo description and topics; tag `v1.0.0` and publish a GitHub release from `CHANGELOG.md`.
2. **DataTable visual editor**, on a reusable **parts studio** (below). The core audience builds admin apps.
3. **Launch:** a short demo video or GIF, then Show HN, r/vuejs, Vue Land Discord, dev.to.

### P1. After launch

- **More visual editors** with the parts studio: Tabs + Accordion · Checkbox / RadioButton / ToggleSwitch · menus (Menu, Menubar, TieredMenu, ContextMenu, PanelMenu) · Card + Panel + Fieldset.
- **"Check your AI-written preset":** paste a `definePreset` file; flag token names that don't exist, preview it, run contrast. Parse it safely (no `eval`).
- **Typography:** PrimeVue tokens don't cover the base font family or size. A Look & feel section (font family, base size 13–16px) applied to the preview root, scaling the ~40 component `fontSize` tokens like density scales spacing; the export adds a CSS snippet. New optional design fields only need defaults in `parseDesign`.
- **Compare for Look & feel:** Compare (hold) works for shared styles and components (overrides); foundations change `theme.design`, so compare against `resetSection(theme, section)`.
- **Automated browser tests in CI** (Playwright, Apache-2.0): the 2026-10-29 sweep as a base.
- **Firefox and WebKit check**: untested so far. Share links rely on `CompressionStream('deflate-raw')`.

### The parts studio (for P0.2)

Two recipes exist: **severity components** (`STUDIO_COMPONENTS`, `STUDIO_CONFIG` in `studio-controls.ts`, a stage in `components/preview/stage/`, `Severity.vue` does the rest) and **hand-built** (Button: `components/editor/studio/Button.vue`). Most remaining components aren't severity-shaped. The third recipe: rows = the component's parts (`groupComponentTokens` in `components.ts`, e.g. DataTable header, headerCell, row, bodyCell, footer), each with a state grid from `stateMatrix` (`studio.ts`; extend `propertyState` for `selected*`, `striped*`, `focus*`), plus `STUDIO_CONFIG`-style controls, reusing `TokenGrid` / `VariantColors`. Stages must show the real states (DataTable: header, sorted column, hovered row, selected row, stripes, small and large). Done when each new editor has a stage with clickable cells, a Design view, tests for its paths, and appears in the component list automatically.

### Known gaps

- Firefox, Safari, touch devices and screen readers are untested.
- Editor (needs Quill) and Ripple can't be previewed; InlineMessage, Steps, TabMenu and TabView are deprecated and not in the gallery. All by design.

---

## 4. Code map (where to look)

| Concern | Files |
|---|---|
| Theme state, design → tokens | `app/utils/theme/types.ts`, `design.ts`, `build.ts`, `serialize.ts`, `sections.ts` |
| Tokens, resolver, schema | `tokens.ts`, `schema.ts`, `semantic.ts`, `components.ts` |
| Contrast and fixes | `contrast.ts`, `app/composables/useContrastFixes.ts`, `components/editor/panels/AccessibilityPanel.vue` |
| Visual editor model | `studio.ts`, `studio-controls.ts`, `semantic-studio.ts` (`PATTERN_SECTIONS`), `recolor.ts`, `stages.ts` |
| Preview protocol and CSS | `messages.ts`, `preview-css.ts`, `app/composables/usePreviewForcedStyles.ts`, `usePreviewInspector.ts`, `usePreviewSpotlight.ts`, `app/pages/preview.vue` |
| Stores | `app/stores/workspace.ts` (themes, history, persistence), `preset.ts` (resolvers, contrast, token edits, export), `editor.ts` (prefs, sections, stages, compare) |
| Editor shell | `app/pages/editor.vue`, `components/editor/DestinationNav.vue`, `SectionTabs.vue`, `Inspector.vue`, `TopBar.vue`, `Setup.vue`, `PreviewToolbar.vue`, `PreviewStage.vue` |
| Panels | `components/editor/panels/*` (Overview, Primary, Surface, Status, Shape, Density, Focus, Pattern, Components, Semantic, Changes, Accessibility, QuickStart for the setup) |
| Visual editor UI | `components/editor/studio/*`, `UsedBy.vue`, `TokenRow.vue`, `SemanticTokenList.vue` |
| Stages | `components/preview/stage/*` |
| Site | `app/pages/index.vue`, `components/landing/*`, `utils/landing.ts`, `utils/theme/specimen.ts`, `app/pages/docs/index.vue`, `plugins/analytics.client.ts`, `public/` (og.png, landing/editor.jpg, fonts) |
