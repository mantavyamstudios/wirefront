# Third-party notices

Wirefront is Copyright (c) 2026 Mantavyam Studios and licensed under the MIT License (see LICENSE). It includes code from the projects below, which keeps its original license and copyright notice.

## devl.dev: MIT

- **Files:** the screens in `apps/runtime/src/pages/showcase/` that begin with a `Ported from devl.dev` comment, and code derived from the original devl.dev scratchpad that Wirefront started from.
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

## Enterprise UI Playground (the site shell): MIT

- **Files:** the site in `apps/www` and the packages `packages/shell-ui` (`@workspace/ui`) and `packages/typescript-config`, imported from the Enterprise UI Playground and adapted for Wirefront. Files Wirefront wrote for the site carry Wirefront's own SPDX header.
- **Source:** https://github.com/deveshmishra09/enterprise_ui_playground
- **License:** MIT for the site code, reproduced below. The playground's Flutter flows, which have their own terms, are not included.

```
MIT License

Copyright (c) 2026 Devesh Mishra

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

## Sora UI: MIT

- **Files:** the shell the Enterprise UI Playground is built on (the same folders as above), including the documentation toolkit in `apps/www/components/docs/`.
- **Source:** https://github.com/SoraLabsOSS/ui
- **License:** MIT for original Sora UI code, reproduced below.

```
MIT License

Copyright (c) 2026 Alexsandr Senaviev Sora UI

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

## Animate UI: MIT + Commons Clause

- **Files:** the portions of the shell that Sora UI derived from Animate UI, which Sora UI keeps under `primitives/animate/` (here `apps/www/registry/primitives/animate/` and `packages/shell-ui/src/components/primitives/animate/`).
- **Source:** https://github.com/animate-ui/animate-ui (Copyright (c) 2025 Elliot Sutton)
- **License:** those portions stay under Animate UI's own terms, the MIT License with the Commons Clause License Condition; see the upstream license for the exact text. They are part of the site only: no Wirefront screen or registry item includes them.

