# Third-party notices

Wirefront is Copyright (c) 2026 Mantavyam Studios and licensed under AGPL-3.0 (see LICENSE). It includes code from the projects below, which keeps its original license and copyright notice.

## devl.dev: MIT

- **Files:** the screens in `apps/www/src/pages/showcase/` that begin with a `Ported from devl.dev` comment, and code derived from the original devl.dev scratchpad that Wirefront started from.
- **Source:** https://github.com/sean-brydon/devl.dev
- **License:** MIT, reproduced below. The author confirmed that all earlier devl.dev work, including the scratchpad Wirefront started from, is MIT.

```
MIT License

Copyright (c) 2026 Sean Brydon

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## shadcn/ui: MIT

- **Files:** the components in `packages/ui/src/components/ui/` whose header reads `SPDX-License-Identifier: MIT` and credits shadcn/ui (installed with the shadcn CLI, base-nova style), and the theme-token layout in `packages/ui/src/styles.css`.
- **Source:** https://ui.shadcn.com (https://github.com/shadcn-ui/ui)
- **License:** MIT, reproduced below.

When a Wirefront screen is installed with the shadcn CLI, the shadcn/ui components it needs come from the builder's own shadcn setup under shadcn/ui's license.

```
MIT License

Copyright (c) 2023 shadcn

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Base UI: MIT

- **Package:** `@base-ui/react`, a dependency (not vendored). Wirefront's own components in `packages/ui/src/components/ui/` (`autocomplete`, `checkbox-group`, `command`, `otp-field`, `segmented-control`) are built on it.
- **Source:** https://base-ui.com (https://github.com/mui/base-ui)
