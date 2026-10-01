# Cards — Responsive Audit

Category: `cards` · 10 screens · Route: `/c/cards/<slug>`

> Severity: **P0** unusable · **P1** major degradation · **P2** usability / a11y gap · **P3** polish. Metrics: see `docs/README.md`.

## Category summary

Second-best category. Grids step `grid-cols-1 → sm/md:2 → lg:3/4`, pages use `px-6` + `max-w-*`, cards use `min-w-0` + `truncate`. Issues are local: one horizontal card (Event) whose action row overflows, compact list cards that truncate their most important text, tiny switches, and hover-only shadow affordances.

| # | Screen | File | Worst | Issue |
|---|--------|------|-------|-------|
| 1 | Stat tile | `card-stat-tile.tsx` | P3 | Clean; sparkline SVG scaling |
| 2 | Profile | `card-profile.tsx` | P3 | Clean; `grid-cols-3` stats tight at 320 |
| 3 | Pricing | `card-pricing.tsx` | P2 | `md:grid-cols-3` at 768 → 3 cramped cards (~220px) |
| 4 | Product | `card-product.tsx` | P3 | Wishlist button hover-ish; fine |
| 5 | Invoice | `card-invoice.tsx` | P2 | Customer name truncated to ~8 chars at 375 |
| 6 | Task | `card-task.tsx` | P2 | 18/34 text < 12px; meta row crowding |
| 7 | Event | `card-event.tsx` | P1 | Card content clipped (325→343px): RSVP/Join button cut off |
| 8 | Integration | `card-integration.tsx` | P2 | 6/10 targets < 24px (switches, configure links) |
| 9 | Media | `card-media.tsx` | P3 | Clean |
| 10 | Payment method | `card-payment-method.tsx` | P2 | Row meta wraps; "Make primary" crowding |

### Patterns
1. **Horizontal "list cards"** (invoice, integration, event, payment method): leading icon/date + `min-w-0 flex-1` text + trailing value/action. At 375 the trailing block wins and the primary text truncates to a few characters. Mobile: move trailing value under title or reduce trailing block.
2. **Hover-only feedback** (`hover:shadow-md`, `transition-shadow`) — fine, but make the whole card a link/button with visible focus ring when clickable.
3. **Micro type** on meta (`text-[10px]` mono uppercase).

---

## 1. Stat tile
- **Route:** `/c/cards/stat-tile` · **File:** `apps/www/src/pages/showcase/card-stat-tile.tsx`
- **Measured:** clean; `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` (L55).
- **P3 — Sparkline** inline SVG — ensure `preserveAspectRatio` + `vector-effect: non-scaling-stroke`.
- **P3 — Header `justify-between`** (L43) with date pill — fine.

## 2. Profile
- **Route:** `/c/cards/profile` · **File:** `apps/www/src/pages/showcase/card-profile.tsx`
- **Measured:** clean.
- **P3 — Stats `grid-cols-3`** (L48) labels `text-[10px]` uppercase ("REVIEWS / PRS MERGED / ON-CALL") wrap at 320.

## 3. Pricing
- **Route:** `/c/cards/pricing` · **File:** `apps/www/src/pages/showcase/card-pricing.tsx`
- **Measured:** clean at 375.
- **P2 — `grid-cols-1 md:grid-cols-3`** (L81): at 768 three cards of ~220px — feature lists wrap heavily; prefer `md:grid-cols-2 lg:grid-cols-3` or horizontal snap carousel on tablet.
- **P2 — Featured ("Most popular") card appears 2nd on mobile** — consider ordering featured first on mobile (`order-first md:order-none`).

## 4. Product
- **Route:** `/c/cards/product` · **File:** `apps/www/src/pages/showcase/card-product.tsx`
- **Measured:** clean.
- **P3 — Wishlist icon button** overlaid on image — ensure ≥ 32px and labelled.
- **P3 — Colour dots** decorative.

## 5. Invoice
- **Route:** `/c/cards/invoice` · **File:** `apps/www/src/pages/showcase/card-invoice.tsx`
- **Measured:** clean; 8/31 text nodes < 12px. Screenshot @375: "Foundry Labs · D…" truncated; amount + "Open ↗" right column dominates.
- **P2 — Row `flex items-center gap-4 p-4`** (L80–98): avatar + truncating text + right-aligned amount/action. Put amount on line 1 right, status/action on line 2.
- **P2 — Header `flex items-end justify-between`** (L63) fine at 375.

## 6. Task
- **Route:** `/c/cards/task` · **File:** `apps/www/src/pages/showcase/card-task.tsx`
- **Measured:** clean; 18/34 text < 12px.
- **P2 — Meta row** (L165–190): avatars + date + comments + attachments `justify-between` — tight at 320.
- **P2 — Labels `text-[10px]`**, priority badge small.
- **P3 — Grid `md:grid-cols-2 lg:grid-cols-3`** (L94) good (Kanban columns stack).

## 7. Event
- **Route:** `/c/cards/event` · **File:** `apps/www/src/pages/showcase/card-event.tsx`
- **Measured:** card clipped (clientW 325, scrollW 343). Screenshot @375: right-hand "RSVP"/"Join" buttons cut at the card border.
- **P1 — Footer `flex items-center justify-between`** (L134): avatar stack + Decline + RSVP/Join buttons can't fit next to the date column (`CardPanel flex items-stretch`, L92). Stack buttons or make them icon-only on mobile; `flex-wrap`.
- **P2 — Date column** fixed width with `text-3xl` day — fine.
- **P2 — Meta `flex-wrap gap-x-4`** (L120) good.

## 8. Integration
- **Route:** `/c/cards/integration` · **File:** `apps/www/src/pages/showcase/card-integration.tsx`
- **Measured:** 6/10 targets < 24px.
- **P2 — Switch + "Configure ›" link** small targets; switch needs label (integration name).
- **P2 — Blurb `truncate`** (L123) loses info on mobile — `line-clamp-2`.
- **P3 — Scope chips** `flex-wrap` (L124) good.

## 9. Media
- **Route:** `/c/cards/media` · **File:** `apps/www/src/pages/showcase/card-media.tsx`
- **Measured:** clean; `md:grid-cols-2 lg:grid-cols-3` (L73), `aspect-[16/9]` (L132) — good fluid media.
- **P3 — Bookmark button** small.

## 10. Payment method
- **Route:** `/c/cards/payment-method` · **File:** `apps/www/src/pages/showcase/card-payment-method.tsx`
- **Measured:** clean; 9/20 text < 12px.
- **P2 — Saved-card rows** (L70–110): brand + number + expiry + "Make primary" button — meta wraps to 3 lines at 375; move action into `⋯` menu on mobile.
- **P3 — Visual card `h-44`** (L139) fixed height fine (`w-full`).
