# Empty States — Responsive Audit

Category: `empty-states` · 10 screens · Route: `/c/empty-states/<slug>`

> Severity: **P0** unusable · **P1** major degradation · **P2** usability / a11y gap · **P3** polish. Metrics: see `docs/README.md`.

## Category summary

**Best-behaved category.** Single centred column, `max-w-*`, `text-balance`, `md:` type steps. Only two screens have measurable layout defects (Maintenance, Offline); the rest need small touch/motion/vertical-fit refinements.

| # | Screen | File | Worst | Issue |
|---|--------|------|-------|-------|
| 1 | Inbox zero | `empty-inbox-zero.tsx` | P2 | `h-dvh w-dvw overflow-hidden` + absolute bottom copy over particle art; landscape clipping |
| 2 | No results | `empty-no-results.tsx` | P3 | Small filter-chip × targets |
| 3 | First project | `empty-first-project.tsx` | P3 | Clean |
| 4 | End of feed | `empty-end-of-feed.tsx` | P3 | Clean; header meta crowds at 320 |
| 5 | No team | `empty-no-team.tsx` | P2 | Invite-link row overflows at ≤ 360 (URL + Copy) |
| 6 | Trash | `empty-trash.tsx` | P3 | Header button wraps |
| 7 | 404 | `empty-404.tsx` | P3 | Clean |
| 8 | Maintenance | `empty-maintenance.tsx` | P1 | Button row overflows both sides (−10…385px) → left edge clipped |
| 9 | No files | `empty-no-files.tsx` | P2 | Drop-zone copy mentions drag/paste — not possible on mobile |
| 10 | Offline | `empty-offline.tsx` | P2 | `60vmin` pinging ring overflows (clipped by root `overflow-hidden`); infinite animation |

### Patterns shared across this category
1. **Centred `min-h-svh … justify-center` columns** — fine; at short heights (landscape phones) content taller than viewport is pushed above the fold in absolute/`overflow-hidden` variants (Inbox zero, Offline, No team, 404).
2. **Root `overflow-hidden`** used to clip decorative layers (`empty-404`, `empty-no-team`, `empty-offline`) — also hides real overflow; clip only the decoration layer.
3. **Action rows `flex items-center gap-2`** without wrap — two buttons at ~180px each overflow at 375 (Maintenance).
4. **Infinite animations** (`animate-ping`) without `motion-safe:`.
5. **Desktop-only copy** ("Drop files", "paste from clipboard", `⌘K`).

---

## 1. Inbox zero
- **Route:** `/c/empty-states/inbox-zero` · **File:** `apps/www/src/pages/showcase/empty-inbox-zero.tsx`
- **Measured:** clean at 375. Screenshot: headline "You're all caught up." overlaps lower part of particle figure (readable).
- **P2 — `h-dvh w-dvw overflow-hidden`** (L10): `w-dvw` adds horizontal overflow on desktop with classic scrollbars; content can't scroll in landscape (bottom block `absolute inset-x-0 bottom-0 pb-20`, L50, overlaps top labels when viewport is ~375px tall).
- **P2 — Corner labels `absolute top-6 left-6` / `top-6 right-6`** (L38, L43) can collide at 320px.
- **P2 — Particle field animates continuously; no reduced-motion fallback.**
- **P3 — Headline `text-4xl md:text-5xl`** (L54) OK.

## 2. No results
- **Route:** `/c/empty-states/no-results` · **File:** `apps/www/src/pages/showcase/empty-no-results.tsx`
- **Measured:** clean; 3/7 targets < 24px (filter chip remove ×, "Clear all").
- **P2 — Chip remove buttons** tiny; "Clear all" plain text button.
- **P3 — Search input + chips** wrap (good, `flex-wrap` L41).

## 3. First project
- **Route:** `/c/empty-states/first-project` · **File:** `apps/www/src/pages/showcase/empty-first-project.tsx`
- **Measured:** clean. Uses `@orbit/ui/empty` — good reference.
- **P3 — Header `justify-between`** (L17) breadcrumb + "DAY 1" — fine.
- **P3 — Buttons `w-full max-w-xs`** (L42, L51) good.

## 4. End of feed
- **Route:** `/c/empty-states/end-of-feed` · **File:** `apps/www/src/pages/showcase/empty-end-of-feed.tsx`
- **Measured:** clean.
- **P3 — Header meta `text-[10px] tracking-[0.3em]`** (L16) next to title — crowds at 320.
- **P3 — Feed timestamps inline** fine.

## 5. No team
- **Route:** `/c/empty-states/no-team` · **File:** `apps/www/src/pages/showcase/empty-no-team.tsx`
- **Measured:** clean at 375; 1/4 targets < 24px. Screenshot: invite-link field "https://orbit.so/i…" + Copy button just fits.
- **P2 — Invite-link row** (L29–60) label + URL + Copy in one row — overflows at ≤ 360px; truncate URL with `min-w-0` + `truncate`.
- **P2 — Root `overflow-hidden`** (L12) + `min-h-svh justify-center` (L14) — landscape clipping.
- **P3 — Avatar stack `-space-x-2`** fine.

## 6. Trash
- **Route:** `/c/empty-states/trash` · **File:** `apps/www/src/pages/showcase/empty-trash.tsx`
- **Measured:** clean; 2/4 targets < 24px.
- **P3 — Card header `flex justify-between`** (L18): title+desc vs "Empty trash" button — description wraps to 3 lines at 375; acceptable. Stack below 360.
- **P3 — Breadcrumb `text-[11px] tracking-[0.2em]`** (L55).

## 7. 404
- **Route:** `/c/empty-states/404` · **File:** `apps/www/src/pages/showcase/empty-404.tsx`
- **Measured:** clean.
- **P3 — Root `overflow-hidden`** (L6); giant "404" glyph decorative — ensure `aria-hidden`, real heading is the h1 (it is).
- **P3 — Buttons row** (L23) fits at 375; add `flex-wrap justify-center` for 320.

## 8. Maintenance
- **Route:** `/c/empty-states/maintenance` · **File:** `apps/www/src/pages/showcase/empty-maintenance.tsx`
- **Measured:** **mobile page overflow 10px**; button row spans x=−10…385 — because the column is `items-center`, the overflow is split and the **left 10px is unreachable**.
- **P1 — Action row `mt-8 flex items-center gap-2`** (L61) "Subscribe to updates" + "View status page" ≈ 395px. Fix: `flex-wrap justify-center` or `flex-col sm:flex-row w-full`.
- **P2 — ETA progress row** (L50–60) fine; progress bar lacks `role="progressbar"`.
- **P2 — `animate-ping` status dot** (L33) no reduced-motion guard.

## 9. No files
- **Route:** `/c/empty-states/no-files` · **File:** `apps/www/src/pages/showcase/empty-no-files.tsx`
- **Measured:** clean.
- **P2 — Copy "Drop files to upload… Or paste from clipboard with ⌘V"** — irrelevant on touch; switch copy on `pointer: coarse` ("Tap to choose files").
- **P2 — Hidden file input** (L81 `className="hidden"`) — ensure the "Choose files" button triggers it and the drop zone is keyboard accessible.
- **P3 — Header meta `0 FILES · 0 KB`** wraps next to title at 375.

## 10. Offline
- **Route:** `/c/empty-states/offline` · **File:** `apps/www/src/pages/showcase/empty-offline.tsx`
- **Measured:** root clips content at mobile (scrollW 401/375) and tablet (824/768) — the `h-[60vmin] w-[60vmin]` `animate-ping` ring scales beyond the viewport.
- **P2 — Decorative ring** (L72) overflows; root `overflow-hidden` (L29) masks it. Size with `min(60vmin, 90vw)`.
- **P2 — Infinite ping animation**, no `motion-safe:`.
- **P2 — Status ticker `h-8 overflow-hidden`** (L58) vertical marquee — reduced-motion.
- **P3 — "Try again" full-width `max-w-xs`** (L50) good.
