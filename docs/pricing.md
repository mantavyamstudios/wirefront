# Pricing — Responsive Audit

Category: `pricing` · 6 screens · Route: `/c/pricing/<slug>`

> Severity: **P0** unusable · **P1** major degradation · **P2** usability / a11y gap · **P3** polish. Metrics: see `docs/README.md`.

## Category summary

Marketing-style pages with `px-6`, `max-w-6xl`, `md:`/`lg:` type and grid steps — generally responsive. One P0: the **feature comparison table** has no mobile strategy and is clipped by `overflow-hidden` (713px of content in 325px).

| # | Screen | File | Worst | Primary issue |
|---|--------|------|-------|---------------|
| 1 | Three-tier | `pricing-three-tier.tsx` | P2 | Jumps 1→3 columns at `lg`; tablet gets 3 tall stacked cards; featured not first |
| 2 | Feature matrix | `pricing-comparison-table.tsx` | P0 | `<table>` in `overflow-hidden` → only plan "Starter" visible; no scroll |
| 3 | Seat slider | `pricing-slider-seats.tsx` | P2 | Billing toggle +2px overflow; slider thumb size |
| 4 | Single plan | `pricing-simple-card.tsx` | P3 | Clean |
| 5 | Contact sales | `pricing-contact-sales.tsx` | P2 | Form after long value-prop column; `grid-cols-2` name fields at 375 |
| 6 | Billing toggle | `pricing-monthly-yearly.tsx` | P2 | `lg:grid-cols-3` only; savings badge tiny |

### Patterns
1. **Breakpoint jump straight from 1 to 3 columns at `lg`** — tablets (768–1023) get very long single-column stacks. Use `md:grid-cols-2 lg:grid-cols-3` or a horizontal snap carousel on `sm–md`.
2. **Featured plan order** — highlighted plan appears 2nd on mobile; consider `order-first` on mobile or a plan switcher.
3. **Feature lists repeat per card** — on mobile, collapse "All features" behind a disclosure.

---

## 1. Three-tier
- **Route:** `/c/pricing/three-tier` · **File:** `apps/www/src/pages/showcase/pricing-three-tier.tsx`
- **Measured:** clean. Screenshot @375: good typography; "Most popular" badge overlaps card border as designed.
- **P2 — `grid-cols-1 lg:grid-cols-3`** (L67) — add `md:` step (e.g. 2 + 1 or carousel).
- **P2 — `-translate-x-1/2 absolute -top-3` badge** (L78) fine.
- **P3 — Heading `text-4xl md:text-5xl`** (L58) good.

## 2. Feature matrix
- **Route:** `/c/pricing/comparison-table` · **File:** `apps/www/src/pages/showcase/pricing-comparison-table.tsx`
- **Measured:** table container clipped — **clientW 325 / scrollW 713**. Screenshot @375: Feature column + "Starter" visible; "Pro", "Business", "Enterprise" cut off with no way to scroll.
- **P0 — `mt-10 overflow-hidden rounded-xl border`** (L56) wrapping a raw `<table className="w-full">` (L57); feature column `w-[28%]` (L60).
- **Target:** `< md` → plan switcher (segmented control / tabs) showing *one* plan column beside the feature names, or per-plan accordion of features; `md` → `overflow-x-auto` with sticky feature column + sticky plan header; `lg` → full table.
- **P2 — Section rows (WORKSPACE / SECURITY)** `text-[10px]` uppercase.
- **P2 — Check / dash glyphs** need SR text ("Included" / "Not included").

## 3. Seat slider
- **Route:** `/c/pricing/slider-seats` · **File:** `apps/www/src/pages/showcase/pricing-slider-seats.tsx`
- **Measured:** **mobile page overflow 2px** — Monthly/Yearly toggle at x=208–377.
- **P2 — Price + toggle row `flex justify-between`** (L28) — toggle pushes past edge; wrap below price on mobile.
- **P2 — Slider** — verify thumb ≥ 24px and that value is announced (`aria-valuetext="8 seats, $192"`).
- **P2 — Tick labels `justify-between text-[10px]`** (L88) "1 10 20 30 40 50+" collide at 320.
- **P3 — Features `grid-cols-2`** (L98) at 375 wrap to 2 lines each; OK.

## 4. Single plan
- **Route:** `/c/pricing/simple-card` · **File:** `apps/www/src/pages/showcase/pricing-simple-card.tsx`
- **Measured:** clean.
- **P3 — `min-h-svh … justify-center`** (L25) — tall card in landscape; fine since page scrolls.
- **P3 — Card `px-7`** — `px-5 sm:px-7`.

## 5. Contact sales
- **Route:** `/c/pricing/contact-sales` · **File:** `apps/www/src/pages/showcase/pricing-contact-sales.tsx`
- **Measured:** clean. Screenshot @375: long value-prop section + logo row first; form only after ~1.5 screens.
- **P2 — `grid-cols-1 lg:grid-cols-[1.1fr_1fr]`** (L20) — on mobile put a short pitch + **form first**, benefits after (or "Talk to sales" anchor button at top).
- **P2 — Name fields `grid-cols-2 gap-3`** (L59, L70) — at 375 each ~150px; `grid-cols-1 sm:grid-cols-2`.
- **P2 — Sections `px-8 py-16`** (L21, L52) — `px-6`.

## 6. Billing toggle
- **Route:** `/c/pricing/monthly-yearly` · **File:** `apps/www/src/pages/showcase/pricing-monthly-yearly.tsx`
- **Measured:** clean; 10/37 text < 12px.
- **P2 — `grid-cols-1 lg:grid-cols-3`** (L97) — same tablet gap.
- **P2 — "Save 20%" badge** inside toggle `text-[10px]` (screenshot: barely legible).
- **P2 — Toggle should be a `radiogroup`/`ToggleGroup`** with `aria-checked`.
- **P3 — Struck-through monthly price** (`was $24`) needs SR text.
