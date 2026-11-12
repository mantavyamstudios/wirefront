# Contributing to Wirefront

Thanks for helping. Wirefront's goal is UI screens that are **ready to wire**: a builder installs a screen, passes it data and callbacks from their own backend, and never edits the screen's UI. Every change should move a screen, or the tooling around screens, towards that goal.

- **Roadmap:** [wiki](https://github.com/mantavyamstudios/wirefront/wiki/Roadmap) and the [project board](https://github.com/orgs/mantavyamstudios/projects/1). Every task is an issue.
- **The rules a screen must meet:** [SCREEN-CONTRACT.md](SCREEN-CONTRACT.md).
- **Decisions already made** (licence, UI kit, forms): [wiki Decisions](https://github.com/mantavyamstudios/wirefront/wiki/Decisions).

## Before you start

1. Pick an open issue, or open one describing what you want to change, and comment that you're taking it.
2. Sign the [Contributor License Agreement](CLA.md). The CLA check comments on your first pull request with the one line to reply with; it covers all your future contributions.

## Set up

```bash
npm install        # also installs the pre-push hook
npm run dev        # http://localhost:4000
```

Requires Node 24 and npm 10 or later.

## Checks

| Command | What it checks |
|---|---|
| `npm run typecheck` | TypeScript across all workspaces and the tests |
| `npm test` | Catalogue integrity, panel navigation, server render of every screen, registry installability, licence headers |
| `npm run spdx:check` | Every source file has its licence header (`npm run spdx` adds missing ones) |
| `npm run lint` | Biome lint rules, including accessibility (full report) |
| `npm run lint:gate` | No new lint problems: existing ones are recorded per file in `lint-baseline.json` and may only go down. After fixing some, run `npm run lint:baseline` and commit the file |
| `npm run audit:responsive` | Every screen at 375 / 768 / 1024 / 1440px (needs `npm run dev` running) |

`git push` runs the pre-push hook: typecheck, licence headers, the lint gate and tests. If it fails, fix the cause rather than skipping the hook; CI runs the same checks on every pull request.

## Adding or changing a screen

1. Follow [SCREEN-CONTRACT.md](SCREEN-CONTRACT.md).
2. Map the screen in `apps/www/src/pages/showcase/source-files.ts` and list it in `apps/www/src/lib/designs.ts`.
3. Add its previews: `SNAPSHOT_ONLY_MISSING=1 npm run snapshot` with the dev server running.
4. Run `npm run spdx` so the new file gets its licence header.

## Pull requests

- One issue per pull request, and say `Closes #<number>` in the description.
- Keep the change focused: no unrelated reformatting or refactors.
- Describe how you checked it, and include screenshots for visual changes (light and dark).
- Don't silence a warning, skip a test or disable a lint rule to get green; explain the problem in the pull request instead.

## Licence

Wirefront is [AGPL-3.0](LICENSE). By contributing you agree to the [CLA](CLA.md). Code from devl.dev and shadcn/ui keeps its original notice, listed in [NOTICE.md](NOTICE.md).
