# Toasts & Banners — Responsive Audit

Category: `toasts` · 6 screens · Route: `/c/toasts/<slug>`

> Severity: **P0** unusable · **P1** major degradation · **P2** usability / a11y gap · **P3** polish. Metrics: see `docs/README.md`.

## Category summary

All six are **static mock toasts**: `absolute`-positioned boxes inside a `relative min-h-svh overflow-hidden` page, over a fake app background (`grid-cols-[200px_1fr]`/`[220px_1fr]`). The UI package ships `@orbit/ui/toast` (Base UI Toast: viewport, stacking, swipe-to-dismiss, live-region announcements) — **unused**. None of the screens has `role="status"`/`role="alert"`/`aria-live`.

Responsive failures: fixed toast widths (`w-80`, `w-96`, `w-[380px]`) with `right-6` / centred positioning — on a 375px phone the toast is wider than the space and the root `overflow-hidden` silently cuts it off (root reports 568px content in 375px for success/error).

| # | Screen | File | Worst | Primary issue |
|---|--------|------|-------|---------------|
| 1 | Success | `toasts-success.tsx` | P2 | `w-80` `top-6 right-6` — fits at 375, clips at ≤ 350; no live region |
| 2 | Error with retry | `toasts-error-retry.tsx` | P1 | `w-96` + `right-6` → 33px cut off on the left |
| 3 | System banner | `toasts-info-banner.tsx` | P1 | Message truncated to "Scheduled main…"; demo app `grid-cols-[220px_1fr]` crushes |
| 4 | Progress | `toasts-progress.tsx` | P1 | `w-96 right-6 bottom-6` → left cut off; 3/3 targets < 24px |
| 5 | Undo | `toasts-undo.tsx` | P1 | `w-96` centred → overflows both sides at 375 |
| 6 | Rich (stacked) | `toasts-rich.tsx` | P1 | `w-[380px] right-6` → left edge cut |

### Target pattern (all toasts)
- Use `@orbit/ui/toast` with a responsive viewport:
  - `< sm`: `fixed inset-x-0 bottom-0` (or top) with `px-4 pb-[env(safe-area-inset-bottom)]`, toasts `w-full`; swipe to dismiss; max 1–3 visible.
  - `≥ sm`: `fixed bottom-4 right-4 w-[min(24rem,calc(100vw-2rem))]`.
- `role="status"` (info/success) vs `role="alert"` (error) via the toast's priority.
- Pause timers on hover **and** focus; action buttons ≥ 44px on touch.

---

## 1. Success
- **Route:** `/c/toasts/success` · **File:** `apps/www/src/pages/showcase/toasts-success.tsx`
- **Measured:** root clips 568px of content (the 200px fake sidebar + main); 1/1 targets < 24px (close ×).
- **P2 — `absolute top-6 right-6`** (L7) + `w-80` (L16): fits at 375 (320 + 24) but not at ≤ 343. Use responsive viewport (above).
- **P2 — Close button < 24px**; no `aria-label` check.
- **P2 — No live region.**
- **P3 — Background mock `grid-cols-[200px_1fr]`** (L39) decorative.

## 2. Error with retry
- **Route:** `/c/toasts/error-retry` · **File:** `apps/www/src/pages/showcase/toasts-error-retry.tsx`
- **Measured:** screenshot @375 — toast's left edge is cut off (384px wide + 24px right offset in 375px).
- **P1 — `absolute top-6 right-6 z-50 w-96`** (L8).
- **P2 — Error toast should be `role="alert"`** and not auto-dismiss while it has a Retry action.
- **P2 — Dismiss / Retry `text-xs` buttons** ~28px.

## 3. System banner
- **Route:** `/c/toasts/info-banner` · **File:** `apps/www/src/pages/showcase/toasts-info-banner.tsx`
- **Measured:** root clip (432/375). Screenshot @375: banner text "Scheduled main…" truncated to 2 words + "Learn more" + ×; page below has 220px sidebar and a main column ~150px wide ("Welcome / back, / Sean").
- **P1 — Banner message `truncate`** (≈L8–30) — the whole point of the banner is lost. On mobile allow 2-line wrap, put "Learn more" below.
- **P1 — Demo layout `grid min-h-[calc(100svh-44px)] grid-cols-[220px_1fr]`** (L41) and `main p-10` (L54), `grid-cols-3` cards (L63) — same non-responsive shell as Layouts; and the `44px` banner height is hard-coded into the calc.
- **P2 — Sticky banner** good (`sticky top-0`), but add `pt-[env(safe-area-inset-top)]` for notched devices in standalone mode.

## 4. Progress
- **Route:** `/c/toasts/progress` · **File:** `apps/www/src/pages/showcase/toasts-progress.tsx`
- **Measured:** 3/3 targets < 24px (Cancel links, collapse). Screenshot @375: panel's left edge cut ("Uploading 0 of 2" starts at x≈−9).
- **P1 — `absolute right-6 bottom-6 z-50 w-96`** (L36).
- **P2 — Per-file "CANCEL" `text-[10px]`** links tiny; progress bars without `role="progressbar"`.
- **P2 — Upload panel on mobile** should be a bottom sheet / full-width dock.

## 5. Undo
- **Route:** `/c/toasts/undo` · **File:** `apps/www/src/pages/showcase/toasts-undo.tsx`
- **Measured:** root clip (380/375). Screenshot @375: snackbar touches/cuts at both edges.
- **P1 — `-translate-x-1/2 absolute bottom-8 left-1/2 w-96`** (L19) — centred fixed width. Use `inset-x-4` on mobile.
- **P2 — Countdown text below toast ("6.9s left to undo")** — announce politely once, not every tick.
- **P2 — Undo button small** (`h-6`-ish).
- **P3 — Bottom offset should respect safe-area + any bottom nav.**

## 6. Rich (stacked)
- **Route:** `/c/toasts/rich` · **File:** `apps/www/src/pages/showcase/toasts-rich.tsx`
- **Measured:** 3/8 targets < 24px. Screenshot @375: three stacked cards with left edge clipped (avatar cut).
- **P1 — `absolute top-6 right-6 flex w-[380px] flex-col gap-2`** (L48).
- **P2 — Stacking all three expanded** — on mobile, collapse to a stack (Sonner-style) showing 1 + count; expand on tap.
- **P2 — Close × buttons small;** action buttons `h-6`.
