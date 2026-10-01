# Filters — Responsive Audit

Category: `filters` · 4 screens · Route: `/c/filters/<slug>`

> Severity: **P0** unusable · **P1** major degradation · **P2** usability / a11y gap · **P3** polish. Metrics: see `docs/README.md`.

## Category summary

Filter screens are in decent shape at 375px (toolbars use `flex-wrap`, result grids have `sm:`/`lg:` steps). The production gap is **pattern choice**: on phones, filters should collapse behind a single "Filters (n)" trigger opening a `Drawer`/`Sheet`, with an applied-filters summary — not render the full desktop filter UI inline above the results. Popovers anchored to small chips are also hard to use on touch.

| # | Screen | File | Worst | Primary issue |
|---|--------|------|-------|---------------|
| 1 | Toolbar | `filter-toolbar.tsx` | P2 | Toolbar wraps into 4 rows (search, 2 selects, date, "more", view toggles) before results; +1px overflow |
| 2 | Faceted | `filter-faceted.tsx` | P2 | Facet popovers (`w-64`) from small triggers; labels/meta hidden on mobile |
| 3 | Chips | `filter-chips.tsx` | P1 | Chip segments ~20px targets; customer rows crush (`w-20` + `w-16` fixed cols) |
| 4 | Sidebar | `filter-sidebar.tsx` | P1 | Entire 280px filter panel stacks *above* results on mobile; **45/49 targets < 24px** |

### Patterns shared across this category
1. **No mobile filter container.** UI package has `Drawer` and `Sheet`; none used. Target: `< md` → "Filters" button with count badge → bottom Drawer (full-height, sticky "Show N results" footer). `≥ md` → current inline UI.
2. **Popover editors on tiny triggers** (chip value segments, facet buttons). On touch, use Drawer-based editors or ensure Popover triggers ≥ 44px and `collisionPadding`.
3. **Checkbox/radio rows** are `py-1.5 text-sm` with 16px controls — make the whole row the label and ≥ 44px tall on coarse pointers.
4. **Result rows with fixed-width numeric columns** (`w-20`, `w-16`) — fine on desktop, crush text on phones.
5. **Keyboard hints (`/`, `⌘K`) in search fields** irrelevant on touch.

---

## 1. Toolbar filters

- **Route:** `/c/filters/toolbar` · **File:** `apps/www/src/pages/showcase/filter-toolbar.tsx`
- **Intent:** One-row toolbar: search, scoped selects, date range, density toggle, saved views.
- **Measured:** mobile page overflow 1px; 3/13 targets < 24px; 10/42 text nodes < 12px. Screenshot @375: toolbar wraps into 4 rows; saved-view row "Saved view: Q2 — Active · + New view · Showing 10 of 16 projects" wraps awkwardly in 3 columns.

**Flaws**
- **P2 — Fixed control widths** `InputGroup w-64` (L134), `SelectTrigger w-36 / w-32 / w-44` (L156, L173, L190). At 375 they wrap unevenly. Use `w-full sm:w-64` and 2-up grid for selects on mobile, or move selects into a Drawer.
- **P2 — Saved-views row** (≈L240–265) with `-mr-2 h-6 px-1.5` button (L258) — 24px target; row needs `flex-wrap` with stacked count.
- **P2 — Density toggle (rows/grid)** shown on mobile where grid is already 1-col (`grid-cols-1 sm:grid-cols-2`, L297) — hide below `sm`.
- **P3 — `/` kbd hint** in search.

---

## 2. Faceted filters

- **Route:** `/c/filters/faceted` · **File:** `apps/www/src/pages/showcase/filter-faceted.tsx`
- **Intent:** Facet buttons opening multi-select popovers with counts.
- **Measured:** clean; 6/22 text nodes < 12px. Screenshot @375: facets wrap (good); issue rows show title + assignee initials, tags hidden (`hidden sm:flex`, L497 — good responsive choice).

**Flaws**
- **P2 — Selected values hidden on mobile** in facet trigger (`hidden gap-1 lg:inline-flex`, L357) → only a count badge shows; fine, but trigger should expose selected labels via `aria-label`.
- **P2 — `PopoverPopup w-64`** (L375) with `max-h-72` list (L428) — on phones prefer Drawer; ensure collision handling at right edge (facets wrap to the right side).
- **P2 — `FacetRow` labels `py-1.5`** (L447) < 44px.
- **P3 — Footer "5 filters · 3 of 18 issues | Reset filters"** (L279) OK.

---

## 3. Active filter chips

- **Route:** `/c/filters/chips` · **File:** `apps/www/src/pages/showcase/filter-chips.tsx` (687 lines)
- **Intent:** Field · operator · value chips with inline editors, saved views, customer list.
- **Measured:** clean overflow; 4/13 targets < 24px; 14/38 text nodes < 12px. Screenshot @375: chips wrap; customer rows: name "Foundry Labs" wraps, meta "UK · pro · enterprise, design" wraps into 3 lines next to fixed MRR (`w-20`) and last-seen (`w-16`) columns.

**Flaws**
- **P1 — Chip segments** (`ChipShell`, L365–436): field / op (`text-[11px]`) / value trigger / remove — each `px-2 py-1` ≈ 22px tall; the value segment opens a `PopoverPopup w-56` editor (L426). Touch-hostile.
- **P1 — `CustomerList` rows** (L635–685): avatar + `min-w-0 flex-1` text + status badge + `w-20` MRR + `w-16` last seen → ~150px left for name/meta at 375. Mobile: put MRR / last-seen on the meta line.
- **P2 — Search `InputGroup w-72`** (L159) — fits 375 barely; at 320 overflows. `w-full sm:w-72`.
- **P2 — Range editors (MRR/LastSeen)** use sliders (L554–610) — check thumb size ≥ 24px.
- **P2 — "FILTERS" label `text-[10px]`** prefixing chip row wastes width.

---

## 4. Sidebar filters

- **Route:** `/c/filters/sidebar` · **File:** `apps/www/src/pages/showcase/filter-sidebar.tsx` (557 lines)
- **Intent:** E-commerce style filter sidebar (categories, price, colour, rating, toggles) + product grid.
- **Measured:** **45/49 targets < 24px** (checkboxes, colour swatches, toggles); 28/159 text nodes < 12px. Screenshot @375: the full filter panel (Category, Price, Color, Rating, More options…) occupies the first ~2 screens; products appear only after scrolling past it.

**Flaws**
- **P1 — `grid-cols-1 lg:grid-cols-[280px_1fr]`** (L178) — below `lg` the aside simply stacks above results. Mobile/tablet need a Drawer: "Filters (3)" button + sort select in a sticky bar above results.
- **P1 — Aside `lg:sticky lg:h-[calc(100svh-6rem)]`** (L179) good for desktop only.
- **P2 — Colour swatches `grid-cols-3 gap-1.5`** (L287) small buttons; ToggleRow (L440–455) switch hit area small.
- **P2 — Price slider** dual-thumb — verify thumb size and that values are announced.
- **P2 — Collapsible sections** (L411–438) good; default-collapse most sections on mobile.
- **P3 — Product grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`** (L478) — at 375 a 2-col compact card grid is the e-commerce norm; consider `grid-cols-2` with smaller cards.
