# Wirefront — Responsive Readiness Audit

Audit of all **158 catalogued screens** (18 categories) for responsive, production-ready behaviour. This round documents the problems only; fixing starts in the next round.

- Audit date: 2026-10-01 · Base commit: `ef891b6`
- One file per category, one section per screen. Each section gives the route, source file, intent, what was measured, flaws with severity and `L<line>` references, the target behaviour, and (for most) acceptance checks.

## Re-running the audit

The measurements in these docs come from `scripts/responsive-audit.ts`. Re-run it after each fix to confirm the screen improved and nothing else regressed.

```bash
npm run dev:www                    # terminal 1: start the app on :4000
npm run audit:responsive           # terminal 2: all screens, all viewports (~5 min)
```

| Flag | Effect |
|------|--------|
| `--category=layouts,forms` | Only these categories |
| `--design=layouts/app-shell` | Only these screens (comma separated) |
| `--viewports=mobile,tablet` | Subset of `mobile` (375), `tablet` (768), `laptop` (1024), `desktop` (1440) |
| `--screenshots` | Save a screenshot per screen and viewport to `.audit/responsive/shots/` |
| `--strict` | Exit with code 1 if any screen fails the gates |

Env: `AUDIT_BASE_URL` (default `http://localhost:4000`), `AUDIT_CONCURRENCY` (default 4).

**Output:** one ✓/✗ line per screen in the terminal (e.g. `layouts/three-pane ✗ mobile: pageOverflowX=288, tablet: pageOverflowX=127`), plus the full metrics in `.audit/responsive/report.json` (git-ignored). Metric definitions are under [Method](#method).

**What `--strict` checks:** at 375, 768 and 1024px, a screen fails if it has horizontal page overflow, elements running off the screen edge, or text squeezed into a very narrow box.

**Limitations to keep in mind:**
- Content cut off inside an `overflow-hidden` container and tap targets under 24px are **reported but not gated**, because some decorative clipping is intentional. A few screens these docs rate as broken therefore still pass `--strict` (Docs tree, Split resizable, Canvas tools, Calendars → Timezone). Check `report.json` and the screenshots too, not just pass/fail.
- The mobile viewport deliberately uses `isMobile: false` with touch enabled. Chromium's mobile emulation widens the layout viewport to fit overflowing content, which would hide the overflow being measured.
- Screens are loaded with `?preview=%221%22` to hide the viewer's shortcut bar. Plain `?preview=1` doesn't work (see [Viewer issues](#viewer-showcase-chrome-issues)); `scripts/snapshot.ts` still uses `?preview=1`, so its preview images may include the bar.
- `calendars/availability` is skipped with a warning: it's mapped in `source-files.ts`, but the file doesn't exist.
- Editors flag missing Node types in `scripts/*.ts` because no tsconfig covers `scripts/`. This doesn't affect running the scripts with `tsx`.

## Fix progress

| Category | Status | `--strict` before → after | Notes |
|----------|--------|---------------------------|-------|
| Foundations | Done | — | `use-media-query` `md` = 768 (matches Tailwind); viewer accepts `?preview=1`/`true`; shortcut bar hidden below `md` and on touch |
| Layouts | Done | 3/12 → 12/12 | Off-canvas `Sheet` nav, list→detail views, bottom tab bars, pointer-event resizer/canvas (pinch-zoom), toolbar collision handling. Canvas "clipped" = infinite canvas (intentional) |
| Forms | Done | 2/4 → 4/4 | Settings nav → scroll tabs on mobile, stacked sections, labelled switches with full-cell hit areas, stacked footers; fixed `<button>`-in-`<button>` (hydration error) in invite field |
| Auth & Onboarding | Done | 14/14 → 14/14 (gates already passed) | Shared: `AuthSplitLayout` safe-centred column (no clipped heading in landscape), `ThemeToggle` icon via `.dark` class (fixes 3 hydration errors), `ParticleField` + inset-login WebGL pause when hidden/background tab and honour reduced motion. Per-screen: wrapping footers, edge-to-edge cards on phones, touch-size reveal/links, keyboard hints hidden on touch, `mailto:` mail button |
| Dashboards | Done | 4/9 → 9/9 | Responsive page padding + stacking headers, 2-line rows / priority columns instead of fixed-track grids (support, engineering, market), labelled range tabs and menus, bar/area charts fixed (percentage heights, non-scaling strokes, unique gradient ids, undistorted markers), `⌘K` hint hidden on touch. Clipped/squeezed/sub-24px targets at 375px: now 0 on all 9 |
| Tables | Done | 3/9 → 9/9 | Priority columns per breakpoint with secondary data folded into the primary cell (no table needs horizontal scroll at 375/768/1024/1440), wrapping/iconified header actions, per-breakpoint footer rows, real selection state + bottom bulk-action bar on phones (orders), role editing via row menu (members), keyboard-openable log rows + bottom sheet on phones, copy buttons visible on touch/focus. Remaining "<24px" hits are checkbox/select internals inside larger label hit areas |
| Filters | Done | 3/4 → 4/4 | Phones get a single "Filters (n)" trigger opening the same controls in a sheet (toolbar: bottom sheet; sidebar: left sheet below `lg` with "Show N results" closing it); 2-up/3-up product grid; facet/chip popovers clamp to viewport width, chip segments and facet rows sized for touch, selected facet values announced. |
| Empty states | Done | 9/10 → 10/10 | Maintenance buttons wrap instead of clipping; safe-centred columns (no clipped top in landscape); inbox-zero/offline use `min-h-dvh`/`w-full` and in-flow content; decorative layers clip themselves (not the page); infinite pings are `motion-safe`; drag/paste copy swapped for tap copy on touch; larger chip remove targets; invite link truncates. |
| Settings | Done | 10/12 → 12/12 | Responsive page padding; long-label button rows stack (security, billing, webhooks); fixed meta columns moved under labels (privacy, billing invoices); webhooks deliveries become 2-line rows and the endpoints table uses priority columns; permissions matrix: horizontal role chips, narrower opaque sticky column (fixes see-through cells); SSO compact stepper + stacked attribute mapping; full-row labels for switches/checkboxes; appearance OS-scheme read via `useSyncExternalStore` (fixes hydration error); popovers clamp to viewport. |
| Cards | Done | 10/10 → 10/10 (gates already passed) | Event card actions wrap (no clipped RSVP), list cards give primary text room on phones (invoice status tile hidden, integration "Configure" iconified, blurbs 2-line), pricing 1→2→3 columns with featured plan first until 3-up, card art uses aspect ratio, labelled switches/icon buttons. |
| Modals | Done | 9/10 → 10/10 | All 10 mock overlays rebuilt on real primitives (`Dialog`, `AlertDialog`, `Command`): focus trap, Esc, scroll lock, labelled titles, open by default with a trigger to reopen. On phones they become bottom sheets with a scrolling body, so tall content (upgrade, create workspace, 2FA) never loses its heading or footer. 2FA offers an `otpauth://` deep link on phones and uses `OTPField`; keyboard-only legends and triggers hidden on touch. |
| Charts | Done | 6/9 → 9/9 | `ChartAxis` passes real tick metrics to Recharts, auto-sizes Y axes (fixes truncated values on scatter and revenue-area at every width) and drops colliding X labels by default; new `angle`/`height` props (waterfall angles every category on phones). Legends/range controls wrap, shorter charts on phones, funnel rows stack, cohort grid scrolls with a sticky cohort column and labelled cells, crowded value/point labels hidden on phones. |
| Timelines | Done | 12/12 → 12/12 | Deploys rows reflow from a 5-track grid to status/env, message, author · time lines (P0 clipping gone); commits move tag/scope/diffstat out of the message line on phones; changelog and inbox stack their aside/avatar gutters below md/sm; pr-ops notices drop the action under the message; status page gets a 30-day uptime strip on phones; notifications is full-screen on phones with working filters; approvals lead with reviewers/checks below lg. Larger hit areas, labelled icon buttons, `motion-safe` pings, no 9px text. |
| Calendars | Done | 9/9 → 9/9 | Timezone and holidays put the ruler and every row in **one** horizontal scroller with a pinned label column (P0 desync gone); remove buttons visible on touch; holiday cells grow to 36px on coarse pointers. Date-range picker becomes a full-screen sheet on phones (chip presets, stacked months, sticky Apply) and is now interactive. Month view shows dots + a tapped-day agenda on phones with a FAB; week view scroll-snaps two days per screen with a pinned hour rail; agenda/recurring stack label and control. Heatmap renders a seeded, SSR-safe sample by default (live GitHub fetch is opt-in) and starts scrolled to recent weeks. Removed the dead `calendars.availability` mapping. Audit: `squeezedCount` now only flags boxes whose text actually wraps. |

## Index

| Category | File | Screens | Worst-severity spread (P0 / P1 / P2 / P3) | Headline |
|----------|------|--------:|:-----------------------------------------:|----------|
| Layouts | [layouts.md](layouts.md) | 12 | 6 / 5 / 1 / 0 | Fixed sidebar grids crush the main pane; no drawer navigation |
| Forms | [forms.md](forms.md) | 4 | 1 / 1 / 2 / 0 | Settings form overflows by 372px; unlabeled switches |
| Auth & Onboarding | [auth.md](auth.md) | 14 | 0 / 4 / 9 / 1 | Mostly responsive; vertical clipping, always-running animations, hydration errors |
| Dashboards | [dashboards.md](dashboards.md) | 9 | 1 / 7 / 1 / 0 | Headers overflow; fixed-track rows clipped by `overflow-hidden` |
| Tables | [tables.md](tables.md) | 9 | 0 / 9 / 0 / 0 | Horizontal scroll is the only mobile strategy; headers overflow by up to 250px |
| Filters | [filters.md](filters.md) | 4 | 0 / 2 / 2 / 0 | No mobile filter drawer; tiny targets |
| Empty states | [empty-states.md](empty-states.md) | 10 | 0 / 1 / 4 / 5 | Best category; one button row clips |
| Settings | [settings.md](settings.md) | 12 | 1 / 5 / 5 / 1 | Long-label buttons and fixed meta columns; no settings shell |
| Cards | [cards.md](cards.md) | 10 | 0 / 1 / 5 / 4 | Good; list-cards truncate their primary text |
| Modals | [modals.md](modals.md) | 10 | 2 / 2 / 6 / 0 | Mock overlays rather than real dialogs; no gutters or max-height |
| Charts | [charts.md](charts.md) | 9 | 2 / 3 / 3 / 1 | Y-axis labels show the wrong values; fixed tick density |
| Timelines | [timelines.md](timelines.md) | 12 | 1 / 4 / 5 / 2 | Fixed-track rows clipped; heavy micro type |
| Calendars | [calendars.md](calendars.md) | 9 | 3 / 4 / 2 / 0 | No view switching by width; header/body scroll desync |
| Profile | [profile.md](profile.md) | 10 | 2 / 5 / 2 / 1 | Overlapping text in compact rows; side-by-side layouts with no breakpoint |
| Toasts & banners | [toasts.md](toasts.md) | 6 | 0 / 5 / 1 / 0 | Fixed-width mock toasts clipped; `@orbit/ui/toast` unused |
| Pricing | [pricing.md](pricing.md) | 6 | 1 / 0 / 4 / 1 | Comparison table clipped with no scroll |
| Tours & coachmarks | [tours.md](tours.md) | 6 | 2 / 2 / 2 / 0 | Hard-coded pixel positions; popovers off-screen |
| Threads & comments | [threads.md](threads.md) | 6 | 1 / 4 / 1 / 0 | Margin-thread layout crushes the document; hover-only actions |
| **Total** | | **158** | **23 / 64 / 55 / 16** | |

The spread counts each screen once, at its **worst** finding. A P2 screen can still have several P2 issues.

## Severity rubric

| Level | Meaning | Examples |
|-------|---------|----------|
| **P0** | Content or function can't be reached or used, or the screen shows wrong information | Main pane 15–48px wide; dialog top unreachable; chart axis shows "0%" for "100%" |
| **P1** | Major degradation: page-level horizontal overflow, clipped controls, crushed columns, desktop-only interaction | Header buttons push the page 100px wider; mouse-only resizer |
| **P2** | Usability or accessibility gap: targets under 24px, text under 12px, hover-only affordances, missing semantics | Unlabeled switches; `opacity-0 group-hover` menus |
| **P3** | Polish | Excess padding on mobile; fixed decorative sizes |

## Method

1. **Architecture review.** Read `CLAUDE.md`, `apps/www/src/lib/designs.ts` (the catalogue), `pages/showcase/source-files.ts` and `registry.tsx` (routing), the design route `routes/c.$category.$design.tsx`, the shared pieces (`auth-shell.tsx`, `components/chart.tsx`) and the UI package (`packages/ui`: `table`, `sidebar`, `sheet`, `drawer`, `auth-split-layout`, `use-media-query`, `particle-field`).
2. **Source inspection.** Read every showcase file (about 37k lines), concentrating on layout classes, fixed sizes, breakpoint prefixes, overflow handling, pointer events and hover-only patterns.
3. **Automated viewport audit.** `scripts/responsive-audit.ts` (Playwright, Chromium) loads every screen at four viewports. Run it with `npm run dev:www` in one terminal and `npm run audit:responsive` in another; see the header of the script for flags (`--category`, `--design`, `--viewports`, `--screenshots`, `--strict`). Output goes to `.audit/responsive/report.json` (git-ignored).

   | Name | Size | Notes |
   |------|------|-------|
   | mobile | 375×812 | touch on; layout viewport fixed at 375 (`isMobile: false`, so the browser can't widen the viewport to fit overflowing content) |
   | tablet | 768×1024 | touch on |
   | laptop | 1024×768 | |
   | desktop | 1440×900 | |

   **Metrics** (these are the "Measured" lines in each section):
   - **page overflow**: `documentElement.scrollWidth − viewport width`. Content outside the viewport makes the page scroll sideways.
   - **off-screen elements**: visible elements that extend past the left or right edge with no clipping ancestor. A negative left edge means the content is unreachable.
   - **clipped**: an `overflow:hidden` container whose content is wider than its box, so content is cut silently. Reported as `clientW/scrollW`.
   - **squeezed**: an element holding 60+ characters of text squeezed into a box under 90px wide and over 80px tall.
   - **inner h-scroll**: an `overflow-x:auto` container that actually scrolls (expected for tables).
   - **targets < 24px**: interactive elements whose smaller side is under 24px (WCAG 2.2 AA 2.5.8). Nearly every target is under the 44px touch guideline, so that count isn't repeated per screen.
   - **text < 12px**: text-bearing elements with a computed font size under 12px.
   - console errors (hydration mismatches).
4. **Visual review.** Mobile screenshots of all 158 screens, plus tablet shots where needed, were checked against the numbers. Several findings were only visible on screen: overlapping text in Profile → Compact card, wrong axis labels in Charts, the header/row scroll desync in Calendars.

> **Caveat:** `overflow-hidden` on page roots and cards hides overflow from the page-overflow metric. That's why the clipped and squeezed metrics, and the screenshots, matter as much as page overflow.

## Cross-cutting findings (fix once, benefit everywhere)

These root causes account for most per-screen issues. Fixing them first makes the per-screen work much smaller.

### 1. No mobile navigation or container primitives in use
`@orbit/ui` already ships what's needed, but no screen uses it:
- `sidebar.tsx`: switches to a `Sheet` below `md` via `useMediaQuery("max-md")`. **Used by 0 screens.**
- `sheet.tsx` (1 usage: the logs detail panel), `drawer.tsx` (0), `dialog.tsx` (1), `toast.tsx` (0), `tabs.tsx` (0), `command.tsx` (0), `preview-card.tsx` (0).
- `hooks/use-media-query.ts`: **used by 0 screens.**

→ Build shared shells (`AppShell`, `SettingsLayout`, `ListDetailLayout`, `FilterDrawer`, `ResponsiveDialog` = Dialog on ≥ sm and Drawer on < sm) and rebuild screens on top of them.

### 2. Fixed grid tracks without breakpoints
For example `grid-cols-[260px_1fr]`, `[360px_1fr]`, `[64px_240px_1fr]`, `[220px_1fr]`, `[44px_1fr_140px_120px_28px]`, `[24px_120px_1fr_180px_auto]`, `[64px_160px_1fr_56px_64px_24px]`. These appear across Layouts, Forms, Dashboards, Timelines, Profile, Calendars, Settings, Threads, Toasts and Tours.
→ Rule: any fixed track must sit behind a breakpoint (`md:grid-cols-[…]`), and `1fr` tracks should be `minmax(0,1fr)` with `min-w-0` children.

### 3. `overflow-hidden` hides overflow bugs
It's used on page roots (`relative min-h-svh overflow-hidden`) and on cards (`grid gap-px overflow-hidden rounded-2xl`) mainly to clip decoration and rounded corners. It also hides real overflow: trailing columns, buttons and toasts disappear without a scrollbar.
→ Clip only decorative layers (`absolute inset-0 overflow-hidden` on the backdrop). Use `overflow-clip` plus `isolate` for rounded cards, and add `min-w-0` to fix the overflow underneath.

### 4. Header and action rows never wrap
The pattern `flex items-end justify-between` with 1–4 buttons appears on most page headers (Tables, Dashboards, Settings, Charts, Profile, Calendars). The coss `Button` base class includes **`shrink-0 whitespace-nowrap`**, so buttons never give way and long labels push the page wider. Examples: "Sign out of all other sessions" adds 87px of overflow; the Orders bulk bar adds 250px.
→ Standard `PageHeader` component: `flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between`, with actions moving to an overflow `Menu` below `sm`.

### 5. Fixed desktop page padding
`px-10 py-10` (or `px-8`) appears on about 70 screens, wasting 64–80px of a 375px screen.
→ `px-4 sm:px-6 lg:px-10` (put it in the shells).

### 6. Hover-only and keyboard-only interaction
- `opacity-0 group-hover:opacity-100` reveals in 9 files (calendars-holidays, calendars-timezone, threads-resolved, threads-comment-row, table-logs, layouts-split-resizable, forms-invite-teammates, profile-directory, timelines-pr-ops-console). These are invisible on touch and for keyboard users.
- `title=` used as the only label (mini rail, three-pane).
- Mouse-only drag (`onMouseDown`/`mousemove`) in split-resizable and canvas-tools. There are no Pointer Events.
- `⌘K` / `⌘↵` / `Esc` hints shown on touch devices (login, dashboards-home, modals, focus-mode, docs-tree…).
→ Add `focus-visible:` and `group-focus-within:` reveals plus always-visible actions on `(pointer: coarse)`, use Pointer Events, and hide keyboard hints with `[@media(pointer:coarse)]:hidden` (or a `pointer-coarse:` custom variant).

### 7. Mock overlays instead of real overlay components
Modals, toasts, tours, the side panel and the mention popover are `absolute` boxes with fixed widths (`w-80`, `w-96`, `w-[380px]`, `w-[420px]`) and hard-coded coordinates. On mobile they get clipped or end up off-screen, and they have no ARIA, focus management or scroll lock.
→ Use the real Base UI components (Dialog, Drawer, Sheet, Toast, Popover with collision handling) with responsive sizes (`w-[min(24rem,calc(100vw-2rem))]`).

### 8. Touch targets and micro typography
- Measured **targets < 24px**: 481 across the catalogue at 375px (worst: filters/sidebar 45/49, settings/developer 34/35, forms/notifications 28/29).
- Measured **text < 12px**: every category. Worst: calendars/timezone 198/209, settings/webhooks 123/162, timelines/commits 76/83. The house style of `font-mono text-[9px]/[10px] uppercase tracking-[0.2–0.3em]` labels reads as decoration on desktop but is illegible on phones.
→ Tokens: mobile minimum 11px for labels and 12px for meta. Reduce tracking below `md`. Row height ≥ 44px on coarse pointers.

### 9. Vertical fit and viewport units
- `h-svh overflow-hidden` shells (`AuthSplitLayout`, split-resizable, canvas) and `h-dvh w-dvw` (waitlist, inbox-zero). `w-dvw` includes the scrollbar width on desktop, and these shells can't scroll in landscape.
- Centring (`items-center justify-center` / `place-items-center`) content that is taller or wider than its container pushes the start of the content out of reach: date-range picker (left 38px), maintenance buttons, upgrade modal (top), bottom-nav phone mockup.
- No `env(safe-area-inset-*)` anywhere: fixed save bars, bottom nav and toasts sit under iOS home indicators.
→ Use `min-h-dvh` and allow scrolling. Centre with `my-auto` or `safe center`. Add safe-area padding to fixed bars.

### 10. Charts and data visualisation
Recharts plots are fluid via `ResponsiveContainer`, but the axis config is fixed: Y `width={36}` with tracked mono ticks **truncates labels into wrong values**, and `interval={4}` makes labels overlap. Hand-rolled SVGs use `preserveAspectRatio="none"` without `vector-effect`, and colours are hard-coded RGB.
→ Make `ChartAxis` width- and breakpoint-aware, reduce tick tracking, and use theme tokens.

### 11. Animation, performance and reduced motion
`ParticleField` (packages/ui) and the WebGL `MeshShader` (inset-login) run `requestAnimationFrame` loops even when hidden with `hidden lg:block`. `animate-ping` and floating keyframes run indefinitely. `prefers-reduced-motion` is respected in only 2 places repo-wide (`orbit-avatar-field.tsx`, `auth-glass-signup.tsx`).
→ Pause on `display:none` or off-screen (IntersectionObserver plus a visibility check), add `motion-safe:` prefixes, and show a static frame when reduced motion is requested.

### 12. Breakpoint system mismatch
`packages/ui/src/hooks/use-media-query.ts` defines `md: 800`, while Tailwind v4's default `md` is **768px** (`styles.css` has no `--breakpoint-*` override). Between 768 and 799px, CSS treats the viewport as `md` and JS doesn't, which matters as soon as `Sidebar` is adopted (it uses `useMediaQuery("max-md")`).
→ Pick one set of values and define it in both `@theme` (`--breakpoint-md`) and the hook.

### 13. Production-readiness issues outside layout (found along the way)
- **Hydration mismatches** (console errors) on auth/login, auth/onboarding, auth/check-email, forms/invite-teammates and settings/appearance. Likely causes are the `ThemeToggle` theme-dependent render in `AuthSplitLayout` and `window.matchMedia` during render in settings-appearance.
- **Live third-party fetches** in calendars/year-heatmap (GitHub API, deno.dev). These fail offline or when rate-limited ("Failed to fetch" in the audit).
- **`new Date()` / random data in render** (calendars-holidays, -timezone, -year-heatmap, settings-localization, settings-sso, toasts-progress, inset-login, forms-api-key) risks SSR/CSR mismatch.
- **Catalogue inconsistency:** `source-files.ts` maps `calendars.availability → calendars-availability`, but the file doesn't exist and `designs.ts` doesn't list it.
- **Fake inputs:** several search fields are `<span>`s styled as inputs (sidebars, focus mode).

## Viewer (showcase chrome) issues

These aren't part of the screens, but they affect how screens are reviewed on mobile:
- `ShortcutHints` (`routes/c.$category.$design.tsx`) is a `fixed bottom-4 right-4` bar of keyboard shortcuts. It's 569px wide, so on a 375px phone it overflows to x=−210 and covers content. It's also meaningless on touch, and there's no touch navigation (no prev/next buttons or swipe).
- **`?preview=1` doesn't work:** TanStack Router JSON-parses search params, so `preview=1` arrives as the number `1`, and `validateSearch` only accepts strings. Only `?preview="1"` hides the chrome. Accept `true`, `1` and `"1"`.
- The code viewer (`_code-viewer.tsx`) opens with the `c` key only; there's no touch trigger.

## Recommended order for the fix round

1. **Foundations** (cross-cutting 1, 4, 5, 9, 12): breakpoint tokens, `PageHeader`, page padding scale, `AppShell` on `Sidebar`, `ListDetailLayout`, `ResponsiveDialog`, `FilterDrawer`, and a toast viewport. Fix the viewer's `ShortcutHints` and `preview` param.
2. **P0 screens (23)**: layouts (6), calendars (3), modals (2), charts (2, wrong data), profile (2), tours (2), forms, dashboards, settings, pricing, timelines and threads (1 each).
3. **P1 screens (64)**, category by category. Tables and Dashboards benefit most from the shared header and stacked-row patterns.
4. **P2/P3 sweep**: targets, typography tokens, hover-to-focus reveals, reduced motion, ARIA.
5. **Regression gate**: `npm run audit:responsive -- --strict` exits 1 if any screen has page overflow, off-screen elements or squeezed text at 375 / 768 / 1024. Clipped containers and small targets are reported but not gated (decorative clipping is intentional in places), so check those in `report.json` and the screenshots too.

## Responsive principles applied (from the brief)

- **Fluid grids**: `minmax(0,1fr)`, `auto-fit` grids, no unguarded fixed tracks.
- **Fluid media**: `aspect-*` and `w-full` images, SVGs with `viewBox` and non-scaling strokes.
- **Media queries**: at least three breakpoints (`sm` 640, `md` 768, `lg` 1024, plus `xl` where needed), mobile-first classes (base = mobile, prefixes add desktop).
- **Prioritise and hide**: priority columns, progressive disclosure (drawers, sheets, accordions), master→detail navigation.
- **Design patterns**: column drop (multi-pane → stacked), off-canvas navigation, bottom sheets, bottom nav.
- **Accessibility**: WCAG 2.2 target size (24px minimum, 44px recommended), readable type, focus-visible reveals, real dialog and toast semantics, reduced motion.
