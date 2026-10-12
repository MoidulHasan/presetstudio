# Third-party licenses

Preset Studio uses the following packages by PrimeTek Informatics ("PrimeTek"). They are pinned to the last versions released under the MIT license (`pnpm license:check` enforces this).

| Package | Version | License | Copyright |
| --- | --- | --- | --- |
| [primevue](https://github.com/primefaces/primevue) | 4.5.5 | MIT | PrimeTek |
| [@primevue/nuxt-module](https://github.com/primefaces/primevue) | 4.5.5 | MIT | PrimeTek |
| @primevue/core, @primevue/icons, @primevue/forms, @primevue/metadata, @primevue/auto-import-resolver (transitive) | 4.5.5 | MIT | PrimeTek |
| [@primeuix/themes](https://github.com/primefaces/primeuix) | 2.0.3 | MIT | PrimeTek |
| @primeuix/styled, @primeuix/styles, @primeuix/utils, @primeuix/forms (transitive) | 0.7.4, 2.0.3, 0.6.4, 0.1.0 | MIT | PrimeTek |
| [primeicons](https://github.com/primefaces/primeicons) | 7.0.0 | MIT | PrimeTek |

## MIT License (PrimeTek packages)

All PrimeTek packages above are distributed under the MIT License. Copyright notices as published in each package:

- primevue and @primevue/*: `Copyright (c) 2018-2025 PrimeTek`
- @primeuix/*: `Copyright (c) 2025 PrimeTek`
- primeicons: `Copyright (c) 2018-2021 PrimeTek`

```
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

Other dependencies are listed in `package.json` and `pnpm-lock.yaml`. Run `pnpm license:check` to list every installed package whose license is not on the permissive allowlist.
