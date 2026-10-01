# Tours & Coachmarks — Responsive Audit

Category: `tours` · 6 screens · Route: `/c/tours/<slug>`

> Severity: **P0** unusable · **P1** major degradation · **P2** usability / a11y gap · **P3** polish. Metrics: see `docs/README.md`.

## Category summary

Tour components are positioned with **hard-coded pixel coordinates** (`style={{ left: 240, top: 180 }}`) over a fake desktop app (`grid-cols-[220px_1fr]`, `main p-10`). Nothing is anchored to a real target element, nothing measures the viewport, and every page root is `overflow-hidden`, so off-screen popovers are silently clipped (beacon hint card is entirely invisible at 375px). For production, tours must anchor to DOM targets via a positioning engine (Base UI `Popover`/`Positioner` with `collisionAvoidance`, or floating-ui), and on mobile switch to **bottom-sheet coachmarks** that don't need side space.

| # | Screen | File | Worst | Primary issue |
|---|--------|------|-------|---------------|
| 1 | Welcome carousel | `tours-welcome-carousel.tsx` | P2 | Fine (has `p-4` gutter); 4/6 targets < 24px (dots) ; no swipe |
| 2 | Spotlight tour | `tours-spotlight.tsx` | P0 | Cutout `left:240 top:120` + card `left:240` → card off-screen right; mask misaligned |
| 3 | Arrow tooltip | `tours-arrow-tooltip.tsx` | P1 | Tooltip `left:240` `w-72` → clipped (528/375) |
| 4 | Beacon hint | `tours-beacon.tsx` | P0 | Hint card positioned off-screen — **not visible at all** at 375 (only the dot) |
| 5 | Inline hint | `tours-inline-hint.tsx` | P2 | `w-80 right-6 bottom-6` — fits; fake app behind crushed |
| 6 | Onboarding checklist | `tours-checklist.tsx` | P1 | `w-96 right-6 bottom-6` → left edge cut; covers the screen |

### Patterns
1. **Absolute pixel coordinates** for targets, cutouts and popovers (spotlight L43/L54, arrow-tooltip L17/L22, beacon L55).
2. **Fixed widths** `w-72`, `w-80`, `w-96` with `right-6` offsets.
3. **Fake app background** (`grid-cols-[220px_1fr]`, `p-10`) never adapts — the "target" elements move but coordinates don't.
4. **Keyboard hints** ("Press ⌘K") in tour copy shown on touch.
5. **No dialog semantics / focus management** for spotlight & carousel; no Esc to skip.

---

## 1. Welcome carousel
- **Route:** `/c/tours/welcome-carousel` · **File:** `apps/www/src/pages/showcase/tours-welcome-carousel.tsx`
- **Measured:** clean (overlay `flex … p-4`, L53 — good). 4/6 targets < 24px (pagination dots).
- **P2 — Dots** are tiny buttons — enlarge hit area (`p-2`), add `aria-label="Go to step n"`, `aria-current`.
- **P2 — No swipe gesture** between steps on touch.
- **P2 — Hero `h-44`** (L55) fixed — fine; `max-h-[30svh]` for landscape.
- **P2 — Not a real Dialog** (focus trap / Esc).

## 2. Spotlight tour
- **Route:** `/c/tours/spotlight` · **File:** `apps/www/src/pages/showcase/tours-spotlight.tsx`
- **Measured:** root clips 588px content. Screenshot @375: dimmed screen; cutout ring partially visible at the right edge; step card starts at x=240 and is cut off ("Press ⌘K to op…").
- **P0 — `style={{ left: 240, top: 120, width: 240, height: 44 }}`** (L43) cutout and **`left: 240, top: 180`** card `w-80` (L53–54): 240 + 320 = 560px.
- **P1 — SVG mask** (L16–40) with fixed rect coordinates — must be computed from target `getBoundingClientRect()` + resize/scroll observers.
- **Mobile target:** keep the dim + cutout, but render the step card as a bottom sheet (`fixed inset-x-0 bottom-0`), and scroll the target into view.
- **P2 — Copy references ⌘K.**

## 3. Arrow tooltip
- **Route:** `/c/tours/arrow-tooltip` · **File:** `apps/www/src/pages/showcase/tours-arrow-tooltip.tsx`
- **Measured:** root clips 528px. Screenshot @375: tooltip box cut at the right edge.
- **P1 — Target highlight `left:100 top:220`** (L17) + tooltip `left:240 top:200 w-72` (L21–22) with a left-pointing caret (L24) — no flip to top/bottom when there's no room on the right.
- **P2 — Prev/Next `text-xs` buttons** small; step counter fine.

## 4. Beacon hint
- **Route:** `/c/tours/beacon` · **File:** `apps/www/src/pages/showcase/tours-beacon.tsx`
- **Measured:** root clips 832px at mobile **and** 768px tablet (clip at T too). Screenshot @375: only the pulsing dot is visible; the hint card is outside the viewport.
- **P0 — Beacon placed at `{ left: x, top: y }`** (L55) with desktop coordinates; hint card `absolute w-72` relative to beacon with fixed side (L71).
- **P2 — `animate-ping`** (L63) infinite; no reduced-motion guard.
- **P2 — Beacon is the only trigger — a 16px dot** (fails 24px target); on touch, tap area ≥ 44px.

## 5. Inline hint
- **Route:** `/c/tours/inline-hint` · **File:** `apps/www/src/pages/showcase/tours-inline-hint.tsx`
- **Measured:** 2/4 targets < 24px. Screenshot @375: hint card fits bottom-right; background "All projects" heading crushed by the 220px fake sidebar.
- **P2 — `absolute right-6 bottom-6 z-50 w-80`** (L13) — mobile: `inset-x-4 bottom-4`.
- **P2 — "Tip 1 of 8 · See all tips" footer `text-[10px]`** (L45).
- **P3 — Background mock `grid-cols-[220px_1fr]`** (L63) decorative.

## 6. Onboarding checklist
- **Route:** `/c/tours/checklist` · **File:** `apps/www/src/pages/showcase/tours-checklist.tsx`
- **Measured:** root clip (384/375); intro text squeezed to 84px. Screenshot @375: checklist panel (`w-96`) covers ~70% of the screen with its left edge cut ("t set up" for "Get set up").
- **P1 — `absolute right-6 bottom-6 z-50 w-96`** (L76).
- **P1 — On mobile the expanded checklist should be a bottom sheet** with collapsed "Get set up · 2/5" pill as default state.
- **P2 — Progress ring** (L90–110) good; text `text-[10px]`.
- **P2 — Item action icons** right-aligned small.
