# Testing

Wirefront's checks are designed from the ways Wirefront can fail, not added after something breaks. Every failure mode below has a check, and every check runs in one of two tiers:

- **Fast (every commit):** the pre-push hook and CI. About a minute. Nothing here needs a browser.
- **Phase (end of each roadmap phase, and in CI):** the browser and install checks. Several minutes.

A check that fails is fixed at the cause. Nothing is skipped, silenced or retried until it passes.

## Failure modes and their checks

| # | What can go wrong | Check | Tier |
|---|---|---|---|
| 1 | Type errors in the app, tests or tooling | `npm run typecheck` (app, tests, `scripts/`) | Fast |
| 2 | Shipped code that compiles here but fails in a builder's stricter project (unused code, newer JS APIs, type-only imports) | `tsconfig.shipped.json`: every shipped file under the strictest settings of the shadcn Next.js, Vite and TanStack Start templates | Fast |
| 3 | A file without its licence header | `npm run spdx:check` and `tests/spdx.test.ts` | Fast |
| 4 | New lint or accessibility-lint problems | `npm run lint:gate` (per-file baseline that may only shrink) | Fast |
| 5 | The catalogue's lists disagree (designs, source files, previews) | `tests/catalogue.test.ts` | Fast |
| 6 | Panel navigation breaks (previous/next, group, random) | `tests/navigation.test.ts` | Fast |
| 7 | A screen throws while rendering on the server | `tests/render.test.tsx` (all 200, inside the app's providers) | Fast |
| 8 | A registry item wouldn't install: bad shape, unresolved import, undeclared dependency, missing tokens, missing `"use client"`, showcase-only code, files outside `wirefront/` | `tests/registry.test.ts` (validated with shadcn's own schemas) | Fast |
| 9 | Items install but fail to typecheck or build in a real project, or overwrite a builder's files | `npm run test:install`: every item into fresh shadcn Next.js, Vite and TanStack Start projects | Phase |
| 10 | A screen crashes, logs errors or mismatches between server and client in the browser | `npm run test:browser`: loads every screen from a fresh production build and fails on page errors, console errors, hydration warnings and route errors, reporting the message | Phase |
| 11 | Layout breaks at some width: overflow, clipping, squeezed text, small tap targets | `npm run audit:responsive -- --strict` at 375 / 768 / 1024 / 1440px | Phase |
| 12 | A change accidentally alters how a screen looks | `npm run test:visual`: compares every screen against its committed preview and fails on unintended pixel changes | Phase |
| 13 | Accessibility regressions a linter can't see (contrast, names, roles, landmarks) | axe in `npm run test:browser`, with a per-screen baseline that may only shrink | Phase |
| 14 | A screen quietly grows what it costs a builder's bundle | `npm run test:bundle`: bundles each shipped screen like an app would (minified, React external) and fails when its gzipped size grows past `bundle-budget.json` by more than 10% + 2 KB; `--update` records new sizes | Fast (CI) |
| 15 | Screens read the wall clock, animate under reduced motion, crash the page or miss tap-target size | `tests/catalogue.test.ts` (clock and motion rules), the contract checker (`ScreenBoundary`, placeholder links, autofill) and WCAG 2.5.8 in the responsive audit | Fast / Phase |
| 14 | A browser check measures a screen before it's ready, or waits forever on one that crashed | The settle trigger (`scripts/lib/settle.ts`) measures only settled layouts and fails immediately when the design reports an error | Phase |
| 15 | A browser check runs against stale code, or leaves servers behind | Browser checks start their own fresh dev server (dependencies re-optimised), warm it up, and retire it when they finish (`scripts/lib/app-server.ts`) | Phase |

## Rules for browser checks

1. **Fresh server, own port, always retired.** Each run starts a fresh dev server on a free port and stops it when done.
2. **Measure only prepared layouts.** Every screen waits for the settle trigger; time never decides when to measure.
3. **Fail fast and say why.** A crashed screen fails with its error message, not a timeout.
4. **Watch long runs.** Long runs print progress, and every external tool runs with a step limit so a stuck tool fails instead of hanging.

## Running the checks

| Command | What it runs |
|---|---|
| `git push` (pre-push hook) | The fast tier: typecheck, licence headers, lint gate, unit tests |
| `npm run test:phase` | The phase tier, one check after another: bundle budget, install, browser, responsive, visual, with a summary |
| `npm run test:install` | Failure mode 9 (`--templates=`, `--items=` for a sample) |
| `npm run test:browser` | Failure modes 10 and 13 (`--design=` for a sample; `--update-a11y-baseline` after fixing accessibility problems) |
| `npm run audit:responsive -- --strict` | Failure mode 11 (`--design=`, `--viewports=`) |
| `npm run test:visual` | Failure mode 12 (`--design=`). When a visual change is intended: `npm run snapshot`, review and commit the previews |

## Servers

Every browser check starts its own fresh dev server (`vite dev --force`, so dependencies are re-optimised every time) on a free port, warms it up until pages load without reloads, and retires it as soon as the check finishes, including when it fails, crashes or is interrupted. Checks never reuse a server you have running, and never leave one behind. Set `APP_URL` to point a check at an existing server instead.

## Progress and alerts

Long checks report progress through `scripts/lib/progress.ts`:

- `.test-status/<check>.json` always shows how far a run is, what is running and for how long, and recent alerts;
- an `[alert]` line is printed when one screen takes longer than its threshold or nothing has finished for a while; a `[done]` line ends every check.

Follow a run with `tail -F <log> | grep --line-buffered "\[alert\]\|\[done\]\|✗"`. Every external tool also runs with a step limit, so a stuck tool fails instead of hanging.

## Determinism

Previews and visual captures (`scripts/lib/capture.ts`) give the same pixels on every run:

- `Math.random` is a seeded generator, installed before any page code runs.
- The page runs on **virtual time** (Playwright's clock drives `Date`, timers, `requestAnimationFrame` and `performance.now`), paused from the start. Loading happens with virtual time stopped; then the capture advances it in 100ms steps and checks the layout after each step. Every run sees the same timeline from the same instant, and timer-driven demos (an agent replay, a courier ride) are fast-forwarded instead of waited out.
- Animations that run on real time rather than the virtual clock (CSS transitions and animations, and Web Animations API animations, which Motion uses for transforms and opacity) are made instant, so their completions can't interleave differently with the virtual timeline. Previews show each animation's end state.
- A capture is taken only once the layout has settled in virtual time. An element changing in every step for 5 virtual seconds is in continuous motion and is treated as steady state, like a spinner; anything else still changing after 60 virtual seconds fails.
- Canvas animations (the particle fields) have no stable frame and are left out of the comparison.

Real-time checks (browser, responsive audit) don't use any of this: they test behaviour on the real clock and use the real-time settle trigger (`scripts/lib/settle.ts`).

## Known limits

- **Visual comparisons are platform-specific.** Font rendering differs between macOS and Linux, so `npm run test:visual` compares against previews captured on the same platform and runs locally at the end of each phase, not in Linux CI. Every other check runs in CI.
