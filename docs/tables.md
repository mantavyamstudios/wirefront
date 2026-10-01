# Tables — Responsive Audit

Category: `tables` · 9 screens · Route: `/c/tables/<slug>`

> Severity: **P0** unusable · **P1** major degradation · **P2** usability / a11y gap · **P3** polish. Metrics: see `docs/README.md`.

## Category summary

All tables use `@orbit/ui/table`, whose container is `overflow-x-auto` and whose cells are `whitespace-nowrap` (`packages/ui/src/components/ui/table.tsx:15, :99, :115`). So tables never break the page — **they just become horizontal scrollers on mobile** (every screen reports an inner h-scroller at 375px, most also at 768px). The real breakage is in the **page headers and toolbars above the tables**, which overflow the viewport (mobile min-content: invoices +101px, orders +250px, logs +175px, inventory +149px, audit-log +76px, transactions +7px).

| # | Screen | File | Worst | Primary failure on mobile |
|---|--------|------|-------|---------------------------|
| 1 | Invoices | `table-invoices.tsx` | P1 | Header: 3 buttons overflow (+101px; "New invoice" clipped). Status/amount only via h-scroll |
| 2 | Members | `table-members.tsx` | P1 | Role `Select` + actions off-screen; 5/17 targets < 24px |
| 3 | Orders | `table-orders.tsx` | P1 | Bulk-action bar in header (+250px); 14/17 targets < 24px |
| 4 | Logs | `table-logs.tsx` | P1 | `w-72` search + controls in header (+175px); log message column needs scroll; hover-only copy |
| 5 | API keys | `table-api-keys.tsx` | P1 | Key/created/last-used/actions only via h-scroll |
| 6 | Inventory | `table-inventory.tsx` | P1 | Sort button overflows (+149px); stock bar `w-[260px]` column |
| 7 | Issues | `table-issues.tsx` | P1 | 16/24 targets < 24px; 7 columns; title truncated at 375 |
| 8 | Transactions | `table-transactions.tsx` | P1 | Summary `grid-cols-3` clips figures ("+$11,010" cut) |
| 9 | Audit log | `table-audit-log.tsx` | P1 | Filter-chip builder overflows its card; clear button outside |

### Patterns shared across this category
1. **Header row** `flex items-end justify-between gap-4` with 1–3 action buttons, never wrapping (e.g. `table-invoices.tsx:65`). Fix: `flex-col sm:flex-row`, secondary actions into an overflow `Menu` below `sm`, primary action as icon+label or FAB.
2. **Horizontal scroll is the only mobile strategy.** Production-ready alternatives:
   - **Priority columns**: hide low-value columns `< md` (`hidden md:table-cell`) — e.g. Issued/Due on invoices, SKU/Category on inventory, Request id on logs.
   - **Stacked "card rows"** for `< sm`: each row as a 2–3 line list item (primary + secondary + meta), row tap opens detail (Sheet/Drawer).
   - If keeping scroll: **sticky first column** and a visible scroll affordance (edge fade).
3. **Row actions live in the last column** (`pe-4 w-px` menu cells) → off-screen on mobile. Move to a leading swipe/long-press, or keep a visible `⋯` at the end of the primary cell on mobile.
4. **Selection checkboxes** (`Checkbox` 16px) — 14/17 targets < 24px on Orders, 16/24 on Issues. Make the whole first cell the hit target, ≥ 44px row height on touch.
5. **`whitespace-nowrap` everywhere** → long text (customer names, messages) forces width. For priority text columns allow wrapping on mobile (`max-md:whitespace-normal`).
6. **Toolbars use `flex-wrap`** (good) but contain fixed-width inputs (`w-64`, `w-72`) and selects (`w-36`, `w-40`). Use `w-full sm:w-64`.
7. **No pagination on mobile-friendly terms**: "Showing x of y" + prev/next is fine; ensure buttons ≥ 44px.

---

## 1. Invoices

- **Route:** `/c/tables/invoices` · **File:** `apps/www/src/pages/showcase/table-invoices.tsx`
- **Intent:** Invoice list with status badges, footer total.
- **Measured:** mobile min-content +101px (header); table scrolls internally. Screenshot @375: "+ New invoice" button cut off; only Invoice / Customer / Issued visible.

**Flaws**
- **P1 — Header actions** (L65–87): Filter + Export + New invoice in non-wrapping row → page overflow.
- **P1 — Status & Amount (most important for scanning) are the last columns** (L92–118) — invisible without scrolling. Mobile row: number + customer / amount + status badge.
- **P2 — Footer total row `colSpan={5}`** (L131) — fine in scroll mode; in card mode needs its own summary block.
- **P2 — Page padding `px-6 py-12`** (L63) fine; `py-12` excessive on mobile.

**Target:** `< sm` card rows; `sm–md` hide Issued/Due; `≥ md` full table.

---

## 2. Members

- **Route:** `/c/tables/members` · **File:** `apps/www/src/pages/showcase/table-members.tsx`
- **Measured:** h-scroll at mobile **and** tablet; 5/17 targets < 24px. Screenshot @375: Member + Team visible; role select, last active, menu hidden.

**Flaws**
- **P1 — Inline role `Select` `h-8 w-32`** (L125) in a scrolled column — editing a role on mobile requires horizontal scrolling + a 32px trigger. Move to row detail sheet on mobile.
- **P1 — Actions menu column `w-px`** (L90, L152) off-screen.
- **P2 — "PENDING" badge `text-[9px]`-ish** next to email; email truncation (L103) good.
- **P2 — Tablet still scrolls** at 768 — table needs priority columns at `md` too.

---

## 3. Orders

- **Route:** `/c/tables/orders` · **File:** `apps/www/src/pages/showcase/table-orders.tsx`
- **Intent:** Card-variant table with selection, bulk actions, stage tracker.
- **Measured:** mobile min-content **+250px**; 14/17 targets < 24px. Screenshot @375: bulk bar "2 selected · Mark shipped · Print…" overflows; title "Orders / Card-variant table / 6 of 248" wraps per word.

**Flaws**
- **P1 — Bulk-action bar rendered inside the header row** (L65–72) — when rows are selected it widens the header. Mobile pattern: **sticky bottom action bar** (`fixed inset-x-0 bottom-0` + safe area) when `selectedCount > 0`.
- **P1 — `StageTrack`** (L125+) multi-dot progress in a nowrap cell — wide; hide on mobile, show stage label only.
- **P2 — Checkbox targets 16px**; "Select all" header checkbox.
- **P2 — `size="xs"` ghost buttons** (L69–70) ~24px.

---

## 4. Logs

- **Route:** `/c/tables/logs` · **File:** `apps/www/src/pages/showcase/table-logs.tsx` (676 lines)
- **Intent:** Live log stream with level badges and a detail `Sheet`.
- **Measured:** mobile min-content **+175px**; h-scroll at mobile & tablet; 26/77 text nodes < 12px. Screenshot @375: search input clipped at top-right; Time/Lvl/Service/Request visible, Message (the important column) off-screen.

**Flaws**
- **P1 — Header `flex items-center justify-between`** (L313) with `InputGroup w-72` (L328) + pause/clear buttons → overflow.
- **P1 — Column order buries Message** (L355–360): Time, Lvl, Service, Request before Message. Mobile row: `time · level` line + message (2-line clamp); service/request in detail sheet.
- **P2 — Detail `SheetPopup side="right" className="!max-w-xl"`** (L450): on mobile a right sheet is OK if full-width; prefer `side="bottom"` (Drawer) below `sm`.
- **P2 — `KeyVal` copy button `opacity-0 group-hover:opacity-100`** (L668) — never visible on touch, not on keyboard focus (add `focus-visible:opacity-100` and always-visible on coarse pointers).
- **P2 — `max-w-[260px] truncate` values** (L649) — on mobile allow wrap/`break-all`.
- **P2 — Header labels `text-[10px]`** (L355–360), `text-[11px]` code blocks.

---

## 5. API keys

- **Route:** `/c/tables/api-keys` · **File:** `apps/www/src/pages/showcase/table-api-keys.tsx`
- **Measured:** h-scroll at mobile & tablet; 10/16 targets < 24px (copy/reveal on masked key). Screenshot @375: Name + Key visible; scopes, dates, actions hidden.

**Flaws**
- **P1 — Revoke/menu in last column** (L145) off-screen — destructive action discoverability.
- **P2 — Masked key pill** (L107) `font-mono text-xs` + copy icon ~20px.
- **P2 — Warning banner** (good: wraps).
- **Target:** card rows (name + env badge / masked key + copy / "Last used 2h ago" + ⋯).

---

## 6. Inventory

- **Route:** `/c/tables/inventory` · **File:** `apps/www/src/pages/showcase/table-inventory.tsx`
- **Measured:** mobile min-content **+149px**. Screenshot @375: "Sort: Stock low → h…" button clipped; SKU visible, stock/price hidden.

**Flaws**
- **P1 — Header sort button** (L44–60) doesn't wrap.
- **P1 — Stock column `w-[260px]`** (L73) with `w-32` bar (L104) — fixed widths force scroll; stock state is the key info for this screen.
- **P2 — Product thumbnail + name + variant** (L83–99) good primary cell.
- **Target:** card rows: thumb + name / stock bar + label / price.

---

## 7. Issues

- **Route:** `/c/tables/issues` · **File:** `apps/www/src/pages/showcase/table-issues.tsx`
- **Intent:** Linear-style issue table with faceted filters (Popover).
- **Measured:** 16/24 targets < 24px; 32/71 text nodes < 12px. Screenshot @375: header "Group: None" + "New issue" squeeze the title ("ENG · Cycle 14 · 7 visible of 218" on 5 lines); title column truncated after ~15 chars. Tablet: Priority/Estimate/Assignee/Updated cut (scroll).

**Flaws**
- **P1 — Header** (L85–98) title + 2 buttons, no wrap.
- **P1 — 8 columns with fixed widths** (`w-24`, `w-32`, `w-28`, L210–218) — at 768 still scrolls.
- **P2 — `InputGroup w-64`** (L101) + facet buttons wrap (good, `flex-wrap`).
- **P2 — Facet popovers `w-60`** (L349) fine; on mobile prefer Drawer with full-height list.
- **P2 — Checkbox + ID + status icon** tiny targets.

---

## 8. Transactions

- **Route:** `/c/tables/transactions` · **File:** `apps/www/src/pages/showcase/table-transactions.tsx`
- **Measured:** mobile min-content +7px; summary tiles clipped. Screenshot @375: "+$11,010" net figure cut; "−$2,120" wraps onto 2 lines.

**Flaws**
- **P1 — Summary `grid grid-cols-3 gap-3`** (L124) — 3 tiles of ~100px with `text-xl`+ currency. Use `grid-cols-1 sm:grid-cols-3` or 3-up with smaller type + `tabular-nums`.
- **P2 — Toolbar** (L132–175): `InputGroup w-64` + 3 Selects (`w-36`, `w-32`, `w-40`) wrap onto 3 rows. Mobile: search full-width + "Filters" button opening a Drawer.
- **P2 — Description cell** (L201–224) icon + 2 lines OK; amount last column hidden.
- **P2 — Pagination footer `justify-between`** (L261) fine.

---

## 9. Audit log

- **Route:** `/c/tables/audit-log` · **File:** `apps/www/src/pages/showcase/table-audit-log.tsx`
- **Measured:** mobile min-content +76px. Screenshot @375: filter chip builder (Outcome is any of …, Actor is …) overflows its card, clear "×" sits outside; Action/Resource/Outcome columns hidden.

**Flaws**
- **P1 — Filter panel** (L95–108): `FILTERS` label + vertical separator + `flex-1 flex-wrap` chips + clear button in one row; label column steals width. Stack label above chips on mobile; chips should wrap within card.
- **P1 — `Chip` segments** (L186–200) `divide-x` field/op/value/× — each segment ~20px tall; editing via tiny Popovers.
- **P2 — Header** "Export to SIEM" button wraps title (L70–90).
- **P2 — Time column `w-28 font-mono text-xs`** good; Outcome (most important for security review) last column.
