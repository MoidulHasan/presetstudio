# Security

## Reporting a problem

Please report security problems privately, not in a public issue: use
[Report a vulnerability](https://github.com/MoidulHasan/presetstudio/security/advisories/new) on GitHub.
Include what you found, how to reproduce it, and what it lets someone do. You'll get an answer
within a week.

Fixes go to the live site ([presetstudio.vercel.app](https://presetstudio.vercel.app)) and the `main`
branch; there are no older versions to patch.

## What's worth a close look

Preset Studio runs entirely in the browser, with no accounts and no server-side data. The places
where outside input comes in are:

- **Share links** (`/editor#theme=…`) and **theme files** (`.presetstudio.json`). Both are untrusted.
  Decoding is size-limited (512 KB; inflating stops early), the theme is validated against the
  schema, and every token value is sanitized before it can reach a CSS custom property.
- **The preview iframe.** The editor and the preview talk through `postMessage`, with same-origin
  checks on both sides and a typed message protocol.
- **Analytics** (Vercel Web Analytics) counts page views without cookies, and the part of the URL
  after `#`, where share links carry a theme, is never sent.

A way to run script, read another theme or break out of these checks through a crafted link,
file or message is exactly what we want to hear about.
