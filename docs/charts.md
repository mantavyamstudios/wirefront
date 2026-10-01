# Charts — Responsive Audit

Category: `charts` · 9 screens · Route: `/c/charts/<slug>`

> Severity: **P0** unusable · **P1** major degradation · **P2** usability / a11y gap · **P3** polish. Metrics: see `docs/README.md`.

## Category summary

Most charts use `ChartContainer` (`apps/www/src/components/chart.tsx`), which wraps Recharts' `ResponsiveContainer` — so **plot areas are fluid** (good). What isn't responsive is everything that Recharts doesn't manage: tick density, axis widths, legends and header controls, plus the two hand-built HTML charts (funnel, cohort heatmap).

| # | Screen | File | Worst | Primary issue |
|---|--------|------|-------|---------------|
| 1 | Revenue area | `charts-revenue-area.tsx` | P0 | Y-axis labels truncated ("150k" → "0k", reads 0k/5k/0k/5k); legend row overflows (+44px) |
| 2 | Cohort heatmap | `charts-cohort-heatmap.tsx` | P2 | Table h-scroll without sticky cohort column; 97/123 text < 12px |
| 3 | Funnel | `charts-funnel.tsx` | P1 | `grid-cols-[200px_1fr_120px]` → counts clipped (+17px) |
| 4 | Gauges | `charts-gauges.tsx` | P3 | Clean (`sm:grid-cols-3`) |
| 5 | Bar grouped | `charts-bar-grouped.tsx` | P2 | Legend collides with "vs prev year" stat |
| 6 | Line multi | `charts-line-multi.tsx` | P1 | X-axis labels overlap ("AprAprAprApr"); range buttons +112px overflow |
| 7 | Donut | `charts-donut.tsx` | P2 | Fixed 224px donut; legend value columns crowd |
| 8 | Scatter | `charts-scatter.tsx` | P0 | Y-axis `width={36}` truncates labels: "100%/75%/25%" render as "0%/5%/5%" — **misleading data** |
| 9 | Waterfall | `charts-waterfall.tsx` | P1 | Recharts auto-drops 5 of 7 category labels; value labels overlap |

### Patterns shared across this category
1. **Page `px-10 py-10`** on all 9 screens → chart width ≈ 255px at 375 after card padding.
2. **Fixed tick configuration** — `interval={4}`, explicit `ticks=[…]`, fixed Y `width={36}` — chosen for ~900px plots. Need width-aware ticks (`interval="preserveStartEnd"`, `minTickGap`, `tickCount` by breakpoint via `useMediaQuery`) and Y width computed from the longest label.
3. **Axis style** in `ChartContainer` (`chart.tsx`): `text-[10px] uppercase tracking-[0.2em]` mono ticks — the 0.2em letter-spacing makes every label ~40% wider, amplifying overlap/truncation on mobile. Reduce tracking below `md`.
4. **Hand-made legends/controls** in header rows with `justify-between` and no wrap.
5. **Tooltips are hover-driven** (Recharts `Tooltip`). Recharts does respond to touch, but there's no persistent selected-point readout on mobile; consider an "active datum" summary above the chart.
6. **Fixed heights** (`h-72`, `h-80`, `h-96`) — fine on desktop; on mobile landscape a `h-96` chart exceeds the viewport. Use `h-56 sm:h-72`.
7. **No data table / text alternative** for screen readers on any chart.

---

## 1. Revenue area
- **Route:** `/c/charts/revenue-area` · **File:** `apps/www/src/pages/showcase/charts-revenue-area.tsx`
- **Measured:** **mobile page overflow 44px** — legend row "Subscriptions · Add-ons · Services" spans x=173–419.
- **P1 — Header `flex items-end justify-between`** (L46): KPI block + legend in one row; legend needs to wrap below KPI on mobile.
- **P0 — Y axis `width={36}` + `tickFormatter v=>`${v}k``** (L93–94): 4-character labels ("100k", "150k") are clipped to "0k"/"5k" by the 36px axis + 0.2em tracking — screenshot @375 reads "0k, 5k, 0k, 5k, 0k". Same root cause as Scatter (#8).
- **P2 — Stacked areas 3 series** fine; X ticks auto.
- **P2 — `px-10`** (L38).

## 2. Cohort heatmap
- **Route:** `/c/charts/cohort-heatmap` · **File:** `apps/www/src/pages/showcase/charts-cohort-heatmap.tsx`
- **Measured:** inner h-scroll (expected); **97/123 text nodes < 12px**. Screenshot @375: M0–M4 visible; later months behind scroll.
- **P2 — `overflow-x-auto` table** (L36–37) — add sticky first two columns (Cohort, Size) so rows stay identifiable while scrolling; add edge-fade scroll hint.
- **P2 — Cells `w-12 text-[10px]`** (L49) — tap to reveal value on mobile (no hover).
- **P2 — Colour-only encoding**; legend gradient (L88–95) OK; values shown in cells (good) but tiny.
- **P3 — `border-spacing-1`** OK.

## 3. Funnel
- **Route:** `/c/charts/funnel` · **File:** `apps/www/src/pages/showcase/charts-funnel.tsx`
- **Measured:** **mobile page overflow 17px**; 18 elements off-screen (right-hand counts "48,214 baseline" at x=272–392). 35/53 text < 12px.
- **P1 — Row grid `grid-cols-[200px_1fr_120px] gap-4`** (L33): 320px fixed + gaps → the bar track (`1fr`) is ~0 at 375 and the count column is clipped. Mobile: stack (label + count line, full-width bar below).
- **P2 — Drop-off chips** (`−74.5% (35,714)`) between steps wrap awkwardly.
- **P2 — Summary `grid-cols-3`** (L85) tiles at ~95px — labels wrap to 3 lines ("VISIT → SIGNUP").

## 4. Gauges
- **Route:** `/c/charts/gauges` · **File:** `apps/www/src/pages/showcase/charts-gauges.tsx`
- **Measured:** clean. `grid-cols-1 sm:grid-cols-3` (L27).
- **P3 — Fixed `h-44 w-44` radial** (L58) — fine; at `sm` (640) three 176px gauges in ~190px cards — tight but OK.
- **P3 — Footer `justify-between text-[10px]`** (L94).

## 5. Bar grouped
- **Route:** `/c/charts/bar-grouped` · **File:** `apps/www/src/pages/showcase/charts-bar-grouped.tsx`
- **Measured:** clean overflow. Screenshot @375: legend "2024 · 2025 · 2026" collides with "VS PREV YEAR +44%".
- **P2 — Header `flex justify-between`** (L33) legend + delta — wrap.
- **P2 — 3 bars × 4 quarters** fine at 255px; bar labels absent (good).
- **P3 — `margin={{ left: 0 }}` + Y width 36** OK.

## 6. Line multi
- **Route:** `/c/charts/line-multi` · **File:** `apps/www/src/pages/showcase/charts-line-multi.tsx`
- **Measured:** **mobile page overflow 112px** (range buttons "7d/30d/90d" at x=363–487); 3/6 targets < 24px. Screenshot @375: X axis labels overlap into "AprAprAprAprApr 26".
- **P1 — `ChartAxis dataKey="day" interval={4}`** (L79): fixed interval → ~7 labels in 255px with 0.2em tracking. Use `interval="preserveStartEnd"` + `minTickGap={24}` or breakpoint-based interval.
- **P1 — Header controls `ml-auto flex gap-1`** (L~60–74) with legend + range toggle in a non-wrapping row.
- **P2 — Range buttons `px-2 py-1 text-[10px]`** — < 24px.

## 7. Donut
- **Route:** `/c/charts/donut` · **File:** `apps/www/src/pages/showcase/charts-donut.tsx`
- **Measured:** clean. Screenshot @375: donut OK; legend rows "Subscriptions 64.4% $1,184,960" crowd (`w-16` value column, L85).
- **P2 — `ChartContainer h-56 w-56`** (L26) + fixed `innerRadius={60} outerRadius={96}` (L33–34) — fine at 375; doesn't scale up on large screens either (fixed).
- **P2 — Legend row** name + share + bar + `w-16` amount — stack amount under name on mobile.
- **P3 — `lg:grid-cols-[260px_1fr]`** (L24) good.

## 8. Scatter
- **Route:** `/c/charts/scatter` · **File:** `apps/www/src/pages/showcase/charts-scatter.tsx`
- **Measured:** clean overflow. **Screenshot @375: Y-axis reads "0%, 5%, 0%, 5%, 0%"** — labels "100%", "75%", "50%", "25%" are clipped to their last two characters by `width={36}` (L75) combined with tracked mono ticks. This is a data-integrity bug, not just cosmetics — **confirmed at 768px too** (screenshot shows 0%/5%/0%/5%/0%), so it affects every width.
- **P0 — Y axis width** (wrong values shown at all widths) — compute from label length or `width={48}` and reduce tracking.
- **P2 — `h-96`** (L59) — tall on landscape mobile.
- **P2 — Point labels ("Acme", "Pied Piper", "Soylent")** overlap bubbles at 255px width; hide labels < `sm`, rely on tap tooltip.
- **P2 — Quadrant footer** `justify-between text-[10px]` (L132).

## 9. Waterfall
- **Route:** `/c/charts/waterfall` · **File:** `apps/www/src/pages/showcase/charts-waterfall.tsx`
- **Measured:** clean overflow; 13/22 text < 12px. Screenshot @375: only "Expansion" and "Q1 ARR" category labels remain (Recharts hides colliding ticks); value labels "+412, +184, +38, −94, −126" crowd above bars.
- **P1 — Category axis** — on mobile, rotate labels (`angle={-45}`), abbreviate, or switch to a **horizontal** waterfall (categories on Y) which reads well on narrow screens.
- **P2 — Value `LabelList`** text overlaps at narrow widths; hide or shrink below `sm`.
- **P2 — Legend + NRR stat** header row crowds.
