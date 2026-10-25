# Preset Studio: work plan

Hand-off for continuing the work in a new session (e.g. a Claude Code cloud session).
Read `CLAUDE.md` first: licensing rules, architecture and conventions there are binding.
This file is the task list plus everything a fresh session needs to know that isn't in the code.

Last updated: 2026-10-24.

---

## 1. Where things stand

### Product today

An editor (`/editor`) with three panes: section nav · live preview (iframe, `/preview`) · inspector.

| Area | What exists |
|---|---|
| Start | Quick start (base preset, brand color, corners, neutrals) |
| Foundations | Primary color (+ states grid), Surfaces (built-in, tinted, custom color, tinted backgrounds), Status colors, Text, Shape (scales + custom px), Density (presets + custom scale), Focus ring |
| Patterns | Form fields, Lists, Menus, Overlays (+ backdrop), Containers, Selection: each edits one semantic group |
| Components | All components (88, every token, inspect/reveal in preview) + visual editors: Button (+ SplitButton, SpeedDial, ButtonGroup family), Message, Toast, Tag, Badge |
| Advanced | All tokens (raw semantic list) |
| Review | Accessibility (contrast pairs) |

Every foundation, pattern and visual component has a **stage**: a preview page showing every
relevant state (hover/pressed/focus forced via copied CSS rules), light and dark side by side,
where clicking an element selects its exact control. The preview toolbar has **Stage | In
context**; panels have **Design | All tokens**. Cross-links use **"Used by N components"** chips.

### Git / deploy state (verify with `git log`, `git status`)

- `origin/main` = `d942723` → this is what production (Vercel) runs.
- `origin/feat/component-studio` = `c97c7ec` → an older preview.
- Local `main` = 20+ commits ahead of `origin/main`, **not pushed**, ending with this plan.
  A cloud session only sees what's on GitHub: the owner must push first (see task P0).
- Vercel builds every pushed branch; previews need a Vercel login (Deployment Protection).
  The latest preview URL is shown in GitHub's commit status (`gh api repos/MoidulHasan/presetstudio/commits/<sha>/statuses`).

### Health

- `pnpm test`: 17 files, 140 tests, all passing (pure logic in `app/utils/theme/`).
- `pnpm lint` and `vue-tsc --noEmit -p .nuxt/tsconfig.app.json`: clean.
- `pnpm build`: last run green on Vercel for `c97c7ec`; **not run since**. Run it (P0).
- No new dependencies since the license check.

---

## 2. How to work

### Setup

```bash
nvm use 24            # .nvmrc
pnpm install
pnpm dev              # http://localhost:3000/editor
```

### Before every commit (CLAUDE.md requires all four)

```bash
pnpm lint
pnpm test
pnpm build
pnpm license:check
npx vue-tsc --noEmit -p .nuxt/tsconfig.app.json   # also typecheck, the build doesn't fail on all type errors
```

### Owner's working preferences (follow them)

- **Never push or merge without the owner's review.** Commit freely; ask before pushing. Preview branches are fine once the owner has said so for that work.
- Small, logical Conventional Commits, ending with the `Co-Authored-By` line the session gives you.
- **Interactive UI = PrimeVue components** (Button, Select, SelectButton, Slider, …), never native `<button>`/`<select>`; natives only for semantic markup.
- **Verify UI in a real browser**, not just tests: the owner judges by what they see. Check light and dark, and widths 1920 / 1100 / 390.
- UX bar is high: one home per concept, plain labels ("Pill radius · buttons with rounded", not token names), no floating popups in odd places, no overflow out of panels/cards, preview always shows what's being edited.
- Before deep restructures, propose briefly (with a recommendation) and wait for "go"; for clear fixes just do them.
- The owner's laptop struggles with heavy commands: avoid running `pnpm build` repeatedly on their machine (fine in the cloud).
- Don't change the owner's saved theme while testing (see gotchas).

### Verifying UI without a person

If the session has a browser tool: open `/editor`, use the store from the console:

```js
const s = document.querySelector('#__nuxt').__vue_app__.config.globalProperties.$pinia._s.get('editor')
s.prefs.section = 'formfield'      // open a section
s.openComponent('button')          // open a visual editor
document.querySelector('iframe').contentDocument  // the preview
```

Overflow check used for every panel (paste in the console; returns offending elements):

```js
(() => { const aside = document.querySelector('aside[aria-label=Inspector]'); const out = []
  const isBox = el => { const cs = getComputedStyle(el); return parseFloat(cs.borderLeftWidth) > 0 || el.tagName === 'BUTTON' || el.tagName === 'LABEL' || cs.overflow !== 'visible' }
  const ar = aside.getBoundingClientRect()
  for (const el of aside.querySelectorAll('*')) { const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue
    if (r.right > ar.right + 1) { out.push('PAST PANEL ' + el.tagName); continue }
    if (el.closest('[data-pc-name=slider]')) continue
    let box = el.parentElement; while (box && box !== aside && !isBox(box)) box = box.parentElement
    if (!box || box === aside) continue; const b = box.getBoundingClientRect(); const cs = getComputedStyle(box)
    if (cs.overflow !== 'visible' && cs.overflowX !== 'visible') continue
    if (r.left < b.left - 1 || r.right > b.right + 1) out.push(el.tagName + ' [' + el.textContent.trim().slice(0, 25) + ']') }
  return out })()
```

Narrow widths: load `/editor` in fixed-width iframes (390 / 1100) inside the page and run the
same check on `iframe.contentDocument`.

### Gotchas (cost real time before)

- **Background tab**: browser automation often runs with `document.visibilityState === 'hidden'`. `requestAnimationFrame` and timers stall, so the preview doesn't update and scripted waits time out. Take a screenshot (makes the tab visible) before checking the preview, and run long scripted checks in small chunks.
- **Pinia store changes don't hot-reload**: after editing a store in `app/stores/`, reload the page, otherwise new actions are "not a function".
- **Nuxt dev overlay replays old errors** after a reload; check the console for new ones before believing them.
- **Owner's data**: the workspace lives in `localStorage['presetstudio:workspace']`, prefs in `presetstudio:prefs`. Back both up before testing on their machine and restore after; leave edits you didn't make.
- **vue-tsc in templates**: assigning to a ref or indexing a const map inside a template expression (`x = {...}`, `MAP[key]` inside `.map()`) gives "Property 'value' does not exist". Move it into a script function.
- **PrimeVue states**: hover/pressed/focus-visible are pseudo-classes (forceable via `preview-css.ts`), but list/menu focus and selection are classes (`.p-focus`, `.p-*-option-selected`, `.p-tieredmenu-item-active`). Stages show those with PrimeVue's own markup and classes.
- **Static markup needs the component CSS**: PrimeVue loads a component's styles only when an instance mounts. Stages that use static markup (toast, popover, dialog, listbox, menus) also render a hidden real instance (`<div class="hidden"><Dialog :visible="false" /></div>`).
- **Light and dark on one page** works only inside `.ps-scheme` areas (`schemeScopeCss`), which re-declare the theme variables. Use `PreviewStageSchemes` for stages.
- **Stage pick targets** must match `/^[a-z]+(?::[a-z]+){0,3}$/` (lowercase, colons). Grid row/column keys are lowercase for this reason.
- **Recoloring** moves only a variant's main palette (`mainPalette` in `recolor.ts`), so neutral parts stay neutral.
- **Design vs overrides**: foundations write `theme.design` (mapped by `designToTokens`); everything else writes `theme.overrides`. Overrides win.

---

## 3. Tasks (in recommended order)

Each task: goal · where · approach · done when.

### P0. Ship what's built

1. Run the full checks above (`pnpm build` included) on local `main`; fix anything that fails.
2. Ask the owner to push `main` to a preview branch (or push with their OK): `git push origin main:feat/foundations-patterns`.
3. Owner reviews the Vercel preview; merge to `main` with their OK.

Done when production runs the current editor.

### P1. Fixes

**Status (2026-10-25): all five done** on `fix/review-findings`, verified in a browser:
P1.1 translucent colors show over the scheme's content background (`opaqueOver` in `color.ts`) with an opacity hint;
P1.2 no overflow in any section at 1920 / 1100 / 390 (Status, Tag, Badge and Form fields stages scroll inside their cards on phones);
P1.3 below xl a stage shows one scheme with a Light | Dark switch that starts at the editor's scheme (`Schemes.vue`, `PREVIEW_SCHEME`);
P1.4 `.p-focus` on component roots is forced, options and menu items are not (`preview-css.ts`);
P1.5 the hover box follows the pointer, also side by side and after scrolling (it re-targets what's under the pointer).

**P1.1 Color picker shows black for mixed colors**
- Where: `app/components/editor/TokenRow.vue` (`swatch`, `pickerColor`); helpers in `app/utils/theme/color.ts` (`parseColor`, `composite`, `toHex`).
- Cause: values like `color-mix(in srgb, {primary.400}, transparent 96%)` resolve to colors with alpha (or don't parse), so the swatch is null and the picker falls back to `#000000`.
- Approach: parse the resolved value with `parseColor`; if it has alpha, `composite` it over the scheme's content background for the swatch and picker. Picking a color should write an opaque hex only after the user changes it; leave the original `color-mix` until then. Show a small "mixed" hint next to the value.
- Done when: Aura dark Button "outlined primary hover background" shows its real tint in the picker and swatch; a unit test covers parsing/compositing.

**P1.2 Phone-width pass for the new sections**
- Where: Foundations, Patterns, visual component panels and stages at 390px (and 1100px).
- Approach: run the overflow check (section 2) on every section with a grid cell selected; screenshot each stage in the Preview pane.
- Done when: no overflow anywhere; stages are readable on a phone (see P1.3).

**P1.3 Stages below 1280px**
- Where: `app/components/preview/stage/Schemes.vue`.
- Problem: below `xl` the dark column sits under the light column (long scroll); on phones, wide grids (Form fields: 5 states) get cramped.
- Approach: below `xl`, show a small Light | Dark switch at the top of the stage instead of stacking both (keep both side by side from `xl` up); for `stacked` stages (Form fields) let the grid scroll horizontally inside its card on phones.
- Done when: every stage is usable at 390 / 768 / 1100 without long scrolling.

**P1.4 "Show focus states" (In context) misses JS-focused components**
- Where: `app/utils/theme/preview-css.ts` (`forcedStateSelector`), `usePreviewForcedStyles.ts`.
- Problem: Select, CascadeSelect, TreeSelect, MultiSelect… mark focus with a `.p-focus` class, not `:focus`, so the copied rules don't apply.
- Approach: in the focus rewrite also handle `.p-focus` on component roots (e.g. `.p-select.p-focus` → `.ps-show-focus .p-select`), but not on list options/menu items (`.p-*-option.p-focus`, `.p-*-item.p-focus`): those would highlight every option. Add tests next to the existing ones.
- Done when: Focus ring → In context shows rings on selects too.

**P1.5 Inspect hover highlight**
- Where: `app/composables/usePreviewInspector.ts`.
- Clicking works; hovering wasn't verifiable with automation. Manually verify the hover box and label follow the pointer, including in side-by-side mode and while scrolling; fix if not.

### P2. Features

**P2.1 More visual editors** (highest user value)
- Next components, by usage: DataTable · Tabs + Accordion · Checkbox / RadioButton / ToggleSwitch · Menu family (Menu, Menubar, TieredMenu, ContextMenu, PanelMenu) · Card + Panel + Fieldset.
- Two recipes exist:
  - **Severity components** (variants keyed by severity): add the name to `STUDIO_COMPONENTS` and `STUDIO_ICONS` (`app/utils/theme/components.ts`), its controls to `STUDIO_CONFIG` (`app/utils/theme/studio-controls.ts`; the test checks paths in all presets), a stage in `app/components/preview/stage/<Name>.vue` (use `PreviewStageSchemes`, emit `pick` targets `<style>:<severity>:<state>` or `section:<key>[:<size>]`), dispatch it in `app/pages/preview.vue`, and a subtitle in `STUDIO_SUBTITLES` (`ComponentsPanel.vue`). `Severity.vue` does the rest.
  - **Hand-built** (Button): `components/editor/studio/Button.vue`, using `VariantColors`, `Control`, `Length`, `Weight`, `Shadow`.
- Most of the next components aren't severity-shaped. Build a third generic recipe: **parts studio**. Rows = the component's parts (`groupComponentTokens` in `components.ts`, e.g. DataTable header, headerCell, row, bodyCell, footer), each with a state grid from `stateMatrix` (`studio.ts`; extend `propertyState` for `selected*`, `striped*`, `focus*` prefixes), plus `STUDIO_CONFIG`-style controls. Reuse `TokenGrid` / `VariantColors`.
- Stages must show the component's real states (DataTable: header, sorted column, hover row (force), selected row, striped rows, small/large; Tabs: active, hover, disabled, scroll buttons; etc.).
- Done when each new editor has a stage with clickable cells, a Design view, tests for its paths, and appears in the sidebar/pinned list automatically.

**P2.2 Typography**
- PrimeVue tokens don't cover the base font family or size; components use `1rem` and inherit the root size.
- Approach: a Foundations → Typography section: font family (system stack options + custom text), base size (13–16px). Apply to the preview root (`/preview` html style); scale the ~40 component `fontSize` tokens proportionally (like density does for spacing); the export adds a CSS snippet (`html { font-size: …; font-family: … }`) next to the preset code (`app/utils/theme/export.ts`, Export panel). New optional design fields → defaults in `parseDesign` (`serialize.ts`), no version bump.
- Done when the preview, stages and export all reflect it, with tests for the mapping.

**P2.3 Cmd+K search**
- A command palette (PrimeVue Dialog + AutoComplete or Listbox) over: sections, components (88), semantic tokens and component tokens (`store.descriptors`), and actions (export, reset, new theme). Selecting a token opens its section/component with the token expanded.
- Done when every section, component and token is reachable by typing.

**P2.4 Import and share**
- Theme file: export the `ThemeState` as JSON (`serializeThemeState`) and import it (validated by `parseThemeState`, which sanitizes values).
- Share link: compress the serialized state (`CompressionStream('deflate-raw')` + base64url) into the URL hash; on load, offer to import it as a new theme. No server.
- Importing an existing PrimeVue preset `.ts` file is out of scope unless the owner asks (needs parsing JS safely).
- Done when a theme round-trips through file and link, with tests for encode/decode and malicious input.
- **Done (2026-10-25):** Export → Share (copy link, download `.presetstudio.json`), Theme actions → Import theme file, and `/editor#theme=…` asks before adding the theme. `share.ts` + tests (round trips, tampered/oversized tokens, a deflate bomb, injected keys and names).

**P2.5 Accessibility coverage**
- Where: `app/utils/theme/contrast.ts` (`CONTRAST_PAIRS`), Accessibility panel.
- Add pairs for what the new editors change: severity buttons (`button-<sev>-color` on `-background`), messages, toasts, tags, selection highlight, form field text/placeholder, list option selected text. Keep the introduced vs inherited classification (presets' own severities often fail).
- Done when recoloring a severity or selection to a low-contrast color shows up as an introduced issue.

**P2.6 Compare for foundations**
- Compare (hold) exists for patterns and components (`store.compareOverrides`). Foundations change `theme.design`, not overrides.
- Approach: generalise to `compareState()`: for design sections return `resetSection(theme, section)` (`sections.ts`); add the Compare button to foundation panels.

**P2.7 Undo across reloads**
- History is in memory (`app/utils/theme/history.ts`, store), so a reload loses it (an accidental "Reset theme" became permanent once).
- Approach: persist the last ~30 snapshots per theme in `sessionStorage` (or localStorage, size-capped); confirm before "Reset theme" or make reset clearly undoable after reload.
- **Done (2026-10-25):** the last 30 undo/redo steps per theme live in the tab's sessionStorage (~1 MB cap, validated on load), so Undo works after a reload, Reset included.

### P3. Quality

**P3.1 Browser smoke tests**: Playwright (Apache-2.0; check license, add as dev dependency, run `pnpm license:check`). For each section: open it, no console errors, change one value, assert the preview's CSS variable changed; stage click selects a cell. Run in CI, not on the owner's laptop by default.

**P3.2 Docs, landing page, README**: `app/pages/index.vue`, `app/pages/docs/index.vue`, `README.md` don't describe foundations/patterns/visual editors/stages yet. Keep the trademark disclaimer (CLAUDE.md).

**P3.3 Keep `CLAUDE.md` current** with every architectural change (it's the shared memory between sessions).

---

## 4. Code map (where to look)

| Concern | Files |
|---|---|
| Theme state, design → tokens | `app/utils/theme/types.ts`, `design.ts`, `build.ts`, `serialize.ts`, `sections.ts` |
| Tokens, resolver, schema | `tokens.ts`, `schema.ts`, `semantic.ts`, `components.ts` |
| Visual editor model | `studio.ts` (variants, state matrix), `studio-controls.ts` (component controls), `semantic-studio.ts` (patterns, `PATTERN_SECTIONS`), `recolor.ts`, `stages.ts` |
| Preview protocol + CSS | `messages.ts`, `preview-css.ts`, `app/composables/usePreviewForcedStyles.ts`, `usePreviewInspector.ts`, `app/pages/preview.vue` |
| Stores | `app/stores/workspace.ts` (themes, history, persistence), `preset.ts` (resolvers, contrast, token edits, export), `editor.ts` (prefs, sections, stages, compare, open helpers) |
| Editor shell | `app/pages/editor.vue`, `components/editor/SectionNav.vue`, `Inspector.vue`, `PreviewToolbar.vue`, `PreviewStage.vue`, `PreviewFrame.vue` |
| Panels | `components/editor/panels/*` (Primary, Surface, Status, Shape, Density, Focus, Pattern, Components, Semantic, Accessibility, QuickStart) |
| Visual editor UI | `components/editor/studio/*` (VariantColors, TokenGrid, ColorPair, PalettePicker, Control, Length, Spacing, Weight, Shadow, Number, Button, Severity, SemanticGroup), `components/editor/UsedBy.vue`, `TokenRow.vue`, `SemanticTokenList.vue` |
| Stages | `components/preview/stage/*` (Schemes, Button, Message, Toast, Tag, Badge, Foundation + `foundation/*`, Semantic + `semantic/*`) |
