# Dashboards — Responsive Audit

Category: `dashboards` · 9 screens · Route: `/c/dashboards/<slug>`

> Severity: **P0** unusable · **P1** major degradation · **P2** usability / a11y gap · **P3** polish. Metrics: see `docs/README.md`.

## Category summary

Dashboards have *some* breakpoints (`lg:grid-cols-*` on the card grids), so the cards stack on mobile. What breaks is everything around and inside the cards: page padding, page headers, row-grids with fixed tracks, raw tables, and hand-rolled SVG charts.

| # | Screen | File | Worst | Primary failure on mobile |
|---|--------|------|-------|---------------------------|
| 1 | Metrics overview | `dashboards-metrics-overview.tsx` | P1 | Header crushes title; `grid-cols-2` stat tiles at 375 → "vs. last 30d" wraps per word |
| 2 | Usage & billing | `dashboards-usage.tsx` | P2 | Mostly OK; `px-10`; micro type |
| 3 | Analytics | `dashboards-analytics.tsx` | P1 | +100px min-content: header range picker overflows; title wraps 1 word/line; 30 fixed-px bars |
| 4 | Home | `dashboards-home.tsx` | P1 | Task rows truncate to 3 letters; fixed "⌘K" pill overlaps content |
| 5 | Revenue | `dashboards-revenue.tsx` | P1 | +21px: header actions ("Export") clipped; SVG `preserveAspectRatio="none"` distortion |
| 6 | Services | `dashboards-services.tsx` | P1 | +19px: header filter buttons clipped; `text-[10px]` everywhere (77/108 text nodes < 12px) |
| 7 | Engineering | `dashboards-engineering.tsx` | P1 | 5-track row grid in `overflow-hidden` card → contributor rows clipped |
| 8 | Support | `dashboards-support.tsx` | P0 | 6-track agent/breach rows → ticket titles squeezed to **58px** ("T- W…") |
| 9 | Market | `dashboards-market.tsx` | P1 | Raw `<table>` (5 cols) inside `overflow-hidden` card: clipped 531→293px; no scroll |

### Patterns shared across this category
1. **Fixed `px-10 py-10` page padding** on every screen (e.g. `dashboards-revenue.tsx:39`). 80px of 375 gone. Standard should be `px-4 sm:px-6 lg:px-10`.
2. **Page header = `flex items-end justify-between` without wrap.** Title block + 2–4 buttons on one row; on mobile the title wraps one word per line and buttons are clipped. Pattern: `flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between`, actions in a horizontally-scrollable row or overflow `Menu`.
3. **Row grids with fixed tracks** — `grid-cols-[2rem_auto_1fr_auto_auto]` (engineering L146), `grid-cols-[2rem_auto_1fr_auto_auto_auto]` (support L214) — inside cards with `overflow-hidden`, so overflow is **silently clipped**. On mobile these rows need a 2-line stacked layout (primary line + meta line) or hide low-priority columns.
4. **`overflow-hidden` on card containers** (`grid … gap-px overflow-hidden rounded-2xl`) used to draw hairline gaps — this masks every overflow bug. Use `overflow-clip` only on the decorative layer, or `isolate` + `rounded` children.
5. **Hand-rolled SVG charts** with fixed viewBox and `preserveAspectRatio="none"` (revenue `AreaChart`, sparklines): strokes become non-uniform when the chart is squashed; no axes/labels adapt to width. Add `vectorEffect="non-scaling-stroke"` or use the `ChartContainer` (Recharts) wrapper from `apps/www/src/components/chart.tsx`, which is responsive.
6. **Hard-coded colours** (`rgb(16 185 129)`, `rgb(99 102 241)`) instead of `--chart-*` tokens → dark/light inconsistency.
7. **Micro type**: 26–77 text nodes per screen < 12px (mono uppercase `text-[10px] tracking-[0.25em]` labels). On mobile raise to `text-[11px]` and reduce tracking to `0.12em`.
8. **"More" menus are icon-only buttons with `MoreHorizontal` `size-4`** (≈16–20px targets, no `aria-label`).
9. **No dashboard shell**: none of the dashboards render inside a nav shell — when wiring into a real app they'll inherit layout problems from `docs/layouts.md`.

### Recommended target pattern
- Mobile: single column, KPI tiles 2-up only when value + delta fit (`min-w-[150px]` via `grid-cols-[repeat(auto-fit,minmax(150px,1fr))]`), charts full-width at `h-48`, tables → stacked list rows, filters behind a "Filter" button (Drawer).
- Tablet: 2-col card grid, charts `h-56`.
- Desktop: as today.

---

## 1. Metrics overview

- **Route:** `/c/dashboards/metrics-overview` · **File:** `apps/www/src/pages/showcase/dashboards-metrics-overview.tsx`
- **Intent:** KPI tiles + area chart + activity feed.
- **Measured:** no overflow; **8/10 targets < 24px** (tile "…" menus, range tabs); 26/53 text nodes < 12px. Screenshot @375: header title "Overview" is pushed left by a date pill that wraps to 4 lines ("Mar / 27 — / Apr / 25"); stat tiles' delta + "vs. last 30d" wrap vertically.

**Flaws**
- **P1 — Header `L30 px-10 py-6` + `L31 flex items-end justify-between`** — no wrap; DateRangePill (L248) wraps internally.
- **P1 — `grid-cols-2 lg:grid-cols-4`** (L49): at 375 each tile ≈ 140px; `text-3xl` value + delta pill + sub-text don't fit. Use `grid-cols-1 min-[420px]:grid-cols-2`.
- **P2 — Chart range tabs `px-2 py-1 text-[10px]`** (L132–148) ~20px targets; no `role="tablist"`.
- **P2 — Tile menu button** (L86) icon-only, no `aria-label`, ~16px.
- **P2 — `Sparkline` SVG** (L158–210) fixed viewBox; check `preserveAspectRatio` + stroke scaling at narrow widths.
- **P3 — Activity timestamps `text-[10px] tracking-[0.2em]`** (L237).

---

## 2. Usage & billing

- **Route:** `/c/dashboards/usage` · **File:** `apps/www/src/pages/showcase/dashboards-usage.tsx`
- **Measured:** clean; 15/46 text nodes < 12px. Screenshot @375: good stacking.

**Flaws**
- **P2 — `px-10`** header (L23) and main (L37).
- **P2 — Header `flex justify-between`** (L24) — title + "View invoice" fits at 375 but not at 320.
- **P2 — Plan card `flex justify-between`** (L40–58) price block right-aligned; ok. Renewal row `flex justify-between` (L60) "Manage" button squeezes card text.
- **P3 — Progress bars have no `role="progressbar"`/`aria-valuenow`** (L87–91, L140–146).

---

## 3. Analytics

- **Route:** `/c/dashboards/analytics` · **File:** `apps/www/src/pages/showcase/dashboards-analytics.tsx`
- **Measured:** mobile min-content **~475px (+100px)** — the `RangePicker` segmented control in the header can't shrink. Screenshot @375: title "Last 30 days" wraps one word per line; range picker clipped ("Worldwide" cut).

**Flaws**
- **P1 — Header (L37–52)**: title block + `RangePicker` (L211–240, 4 segments + separator + Globe) in a non-wrapping `justify-between` row. Mobile: stack; segmented control full-width or `Select`.
- **P1 — Bar chart = 30 `flex-1` divs with `height: b/100*160 px`** (L81–93): no axis, no tooltip, no touch interaction; label row `grid-cols-6` with **5** labels (L95–101) → mis-aligned labels at every width.
- **P2 — Hero metric row `flex items-end justify-between`** (L56) with legend — legend wraps under metric awkwardly.
- **P2 — Top pages rows** (L135) `truncate font-mono text-[12px]` paths + value + `w-12` delta: OK-ish; delta `text-[10px]`.
- **P2 — Countries grid `sm:grid-cols-2 lg:grid-cols-5`** (L160) — at `lg` 5 cols of ~180px with flag + name + share — fine; at 1024 truncates names.
- **P2 — Breakdown share bar width `s.share * 2.6%`** (L120) — magic scale.
- **P3 — Flag emoji `text-base`** (L166) renders as letters on Windows.

---

## 4. Home

- **Route:** `/c/dashboards/home` · **File:** `apps/www/src/pages/showcase/dashboards-home.tsx`
- **Measured:** 5/10 targets < 24px (task checkboxes). Screenshot @375: task titles truncated to "Review Ma…", "Ske…", "Push…" because tag pill + due label consume the row; "⌘K to jump anywhere" pill floats over the schedule card.

**Flaws**
- **P1 — Task row (L72–98)**: checkbox + `flex-1 truncate` title + tag + due text in one row. Mobile: title on line 1, tag + due on line 2.
- **P1 — Fixed `⌘K` hint pill `fixed bottom-6 right-6 z-50`** (L140) covers content on mobile, is keyboard-only, and collides with the viewer's own shortcut bar. Hide on `pointer: coarse` / `< md`.
- **P2 — `px-10 py-10`** (L36); greeting `text-4xl` (L41) — `text-3xl sm:text-4xl`.
- **P2 — Shortcut buttons `grid-cols-2 sm:grid-cols-4`** (L48) — labels wrap to 2 lines at 375 ("Invite / teammate"); acceptable, ensure equal heights.
- **P2 — Checkbox targets < 24px.**

---

## 5. Revenue

- **Route:** `/c/dashboards/revenue` · **File:** `apps/www/src/pages/showcase/dashboards-revenue.tsx`
- **Measured:** mobile min-content **+21px**; 44/70 text nodes < 12px. Screenshot @375: "Export" button clipped at right edge; title wraps.

**Flaws**
- **P1 — Header (L41–57)**: 3 `RangeButton`s + Export in a non-wrapping row.
- **P1 — `AreaChart` SVG (L252–275)** `viewBox 0 0 600 160`, `preserveAspectRatio="none"`, `strokeWidth=2` — line thickness distorts as width changes; hard-coded emerald `rgb(16 185 129)` and gradient id `rev-grad` (duplicate IDs if reused twice on a page).
- **P2 — Overflowing progress bar `width: 112%; maxWidth: 100%`** (L103) — intentional over-target, but no label explains it to SR.
- **P2 — Breakdown rows `flex justify-between text-sm`** (L125) ok.
- **P2 — `px-10 py-10`** (L39).

---

## 6. Services

- **Route:** `/c/dashboards/services` · **File:** `apps/www/src/pages/showcase/dashboards-services.tsx`
- **Measured:** mobile min-content **+19px** (header filters); **77/108 text nodes < 12px** — the densest micro-type screen in the catalogue.

**Flaws**
- **P1 — Header (L118–137)**: "All envs" + "Last 1h" outline buttons clipped at 375.
- **P2 — `ServiceCard` metrics `grid-cols-3`** (L204) at ~95px each with `text-[10px]` labels and values like "814ms" — tight; OK down to 360.
- **P2 — Summary tiles `grid-cols-2 lg:grid-cols-4`** (L138) fine.
- **P2 — Spark SVG** (L296–320) colour via prop strings — check token usage.
- **P2 — Type scale**: labels should be ≥ 11px on mobile.

---

## 7. Engineering

- **Route:** `/c/dashboards/engineering` · **File:** `apps/www/src/pages/showcase/dashboards-engineering.tsx`
- **Measured:** mobile: PR-chart panel grid clipped (scrollW 332 in 293px, `overflow-hidden`); 65/87 text nodes < 12px.

**Flaws**
- **P1 — Contributor rows `grid grid-cols-[2rem_auto_1fr_auto_auto] gap-4 px-5`** (L146) inside `overflow-hidden` card (L130): the `1fr` progress column collapses to 0 and trailing columns are clipped.
- **P1 — Panel `lg:grid-cols-[1fr_320px]`** (L86) good, but the PR chart legend (L254–271) + header `flex justify-between` (L88) overflow in the 1-col state.
- **P2 — `PrChart` bars** (L273–316) use `relative w-full overflow-hidden` stacks with fixed heights; no labels on mobile.
- **P2 — DORA tiles `sm:grid-cols-2 lg:grid-cols-4`** (L80) good.
- **P2 — `px-10`** (L59); header buttons row (L61–78).

---

## 8. Support

- **Route:** `/c/dashboards/support` · **File:** `apps/www/src/pages/showcase/dashboards-support.tsx`
- **Measured:** mobile: 4 squeezed blocks — **breach ticket title column measured 58px** ("T-8421 W… LINEAR · P0 FIRST RESPONSE" stacked letters); agent panel clipped (scrollW 317 in 293).

**Flaws**
- **P0 — `BreachRow`** (L324–348): priority chip + avatar + `min-w-0 flex-1` title + `14m over` pill in one row → title column ≈ 58px; text unreadable (see screenshot).
- **P1 — Agent rows `grid-cols-[2rem_auto_1fr_auto_auto_auto] gap-4`** (L214) — 6 tracks, clipped inside `overflow-hidden` (L205).
- **P1 — Header (L111–128)** "All teams" + "Today" selects crowd the title ("Queue overview" wraps).
- **P2 — `Donut`** (L295–322) custom SVG; legend list fine.
- **P2 — `lg:grid-cols-[320px_1fr]`, `lg:grid-cols-[1fr_280px]`** (L130, L205) correct for desktop.

**Target:** breach + agent rows as 2-line list items on mobile (title line, meta line with chip / timer).

---

## 9. Market

- **Route:** `/c/dashboards/market` · **File:** `apps/www/src/pages/showcase/dashboards-market.tsx`
- **Measured:** mobile: two panel grids clipped — **watchlist table needs 531px, gets 293px** (`overflow-hidden`), news panel 494px in 293px. 5/7 targets < 24px (timeframe tabs). Tablet renders well (screenshot).

**Flaws**
- **P1 — Raw `<table className="w-full">`** (L225) with 5 `px-5` columns, inside a card with `overflow-hidden` (L94 grid) — no horizontal scroll, columns clipped. Use `@orbit/ui/table` (has `overflow-x-auto`) **and** a mobile list layout (symbol + price on line 1, change + spark on line 2; drop Vol).
- **P1 — Featured chart header** (L107–158): price + timeframe tabs `1D/1W/1M/1Y/ALL` (`px-2 py-1 text-[10px]`, L143) in one row; on mobile price `text-3xl` + "+2.41%" pill overflow (screenshot shows "2.41" cut).
- **P2 — `PriceChart` / `Spark` SVGs** (L309–380) fixed viewBox.
- **P2 — Allocation colours hard-coded rgb** (L52+).
- **P2 — `lg:grid-cols-[1fr_300px]`, `[1.6fr_1fr]`** good for desktop.
