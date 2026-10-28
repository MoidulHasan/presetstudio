# Contributing to Preset Studio

Thanks for helping. Bug reports, ideas and pull requests are all welcome.

## Reporting a bug

[Open an issue](https://github.com/MoidulHasan/presetstudio/issues/new/choose) with what you did, what you expected and what happened instead. A share link of the theme (Export → Share) makes most bugs easy to reproduce: it opens your theme as a copy, and nothing in it identifies you.

Security problems go through private reporting instead; see [SECURITY.md](./SECURITY.md).

## Working on the code

Requires Node 24 (`nvm use`) and pnpm.

```bash
pnpm install
pnpm dev              # http://localhost:3000
```

Before you open a pull request, all of these must pass (CI runs them too):

```bash
pnpm lint
pnpm exec vue-tsc --noEmit -p .nuxt/tsconfig.app.json
pnpm test
pnpm build
pnpm license:check
```

- Keep pull requests small and about one thing. Use [Conventional Commits](https://www.conventionalcommits.org/) (`fix(contrast): …`, `feat(editor): …`).
- For UI changes, add a screenshot, and check light and dark mode and a phone width.
- Logic that doesn't need Vue (colors, palettes, tokens, export, sharing) lives in `app/utils/theme/` with unit tests next to it.
- Interactive controls are PrimeVue components (Button, Select, SelectButton…), not native elements.
- [CLAUDE.md](./CLAUDE.md) describes the architecture and conventions in detail. It's written for AI coding agents, and it's the best map of the code for people too.

## Ground rules

These keep the project free to use. Pull requests that break them can't be merged.

- **PrimeTek packages stay on their last MIT versions**, pinned exactly: `primevue` 4.5.5, `@primevue/*` 4.5.5, `@primeuix/themes` 2.0.3, `primeicons` 7.0.0. Newer majors are proprietary. `pnpm license:check` enforces this.
- **New dependencies must be MIT, ISC, BSD or Apache-2.0.** Check with `npm view <package> license`, and run `pnpm license:check` afterwards.
- **Nothing from PrimeTek's paid products**: no code, UI, text or assets from the Theme Designer, PrimeBlocks or primeui.dev. The public MIT source of PrimeVue and `@primeuix/themes` is fine as a reference.
- **Naming:** the product is Preset Studio. PrimeVue is mentioned only descriptively ("for PrimeVue"), never in a name or logo.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](./LICENSE).
