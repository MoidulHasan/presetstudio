# Changelog

Notable changes, newest first. Versions follow [Semantic Versioning](https://semver.org/).

## Unreleased

- **DataTable visual editor:** its header, column headers, sort icon, rows (hover, selected, striped), borders, row toggle and footer as one colors grid, plus padding for three sizes, title weights and icon sizes, on a stage with every state. Built on a reusable "parts" editor for components made of parts.
- The spacing readout rounds like the other controls (15px, not 15.008px).

## 1.0.0 (2026-10-29)

The first release: a free, open-source visual theme editor for PrimeVue 4 (styled mode).

### Make a theme

- **Guided setup:** base style (Aura, Lara, Nora or Material), brand color, corners and neutrals, or start from one of four example themes.
- **Overview:** each decision of the theme at a glance, drawn in its own colors, one click from where it's set.
- **Look & feel for the whole library:** brand color (22 built-in palettes or any color, with a perceptual 50–950 scale you can fine-tune), neutrals for light and dark, status colors, text, corner radius, density and the focus ring. Every choice reaches every component of every base style.
- **Shared styles:** form fields, lists, menus, overlays, containers and selection, each edited once for all the components that use it.
- **Components:** the tokens of all 88 components, searchable. Button, Message, Toast, Tag and Badge have visual editors with a stage showing every variant in every state.

### See it

- A live preview in its own PrimeVue instance: stages ("All states") or sample pages ("In an app"), in light, dark or both side by side.
- Pick anything in the preview to edit it; the spotlight highlights what a section changes.

### Check it

- Every change listed, each one revertible on its own.
- Contrast checks in light and dark, counting the base style's own failures, with a one-click fix for each.
- Undo and redo, kept across reloads.

### Take it home

- Export: one `definePreset` file with only what you changed, plus the setup for Nuxt or Vue (verified in fresh Nuxt 4 and Vite + Vue apps).
- Share links and theme files; several themes in one workspace, synced across tabs. Everything stays in your browser.

### Site

- Home page with a live try-out, docs, a social card, and anonymous page counts (Vercel Web Analytics, no cookies).
