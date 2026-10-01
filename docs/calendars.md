# Calendars — Responsive Audit

Category: `calendars` · 9 screens (catalogue) · Route: `/c/calendars/<slug>`

> Severity: **P0** unusable · **P1** major degradation · **P2** usability / a11y gap · **P3** polish. Metrics: see `docs/README.md`.

> **Catalogue inconsistency:** `source-files.ts` maps `calendars.availability → "calendars-availability"`, but no such file exists and `designs.ts` doesn't list it. `/c/calendars/availability` renders the "design not found" page. Either add the screen or remove the mapping.

## Category summary

Calendar views are inherently grid-heavy; none of them switch view on small screens. Production calendars (Google, Fantastical, Cron) change **view** by breakpoint: month → dots + agenda list, week → 1–3 day view with horizontal swipe, two-month range picker → one month. Two screens (Timezone, Holidays) also have a **header/body scroll desync bug at every width**.

| # | Screen | File | Worst | Primary issue |
|---|--------|------|-------|---------------|
| 1 | Month view | `calendars-month.tsx` | P1 | Header toolbar +146px overflow; 7×~45px cells with unreadable event chips |
| 2 | Week schedule | `calendars-week.tsx` | P1 | 5 day columns of **49px**; event blocks clipped (19/41px) |
| 3 | Agenda list | `calendars-agenda.tsx` | P2 | `grid-cols-[80px_1fr]` + avatars → title column 72px; 54/66 text < 12px |
| 4 | Date range picker | `calendars-date-range.tsx` | P0 | ~413px fixed popover centred → **left 38px cut off** (x=−38); 2 months side by side |
| 5 | Timezone planner | `calendars-timezone.tsx` | P0 | Hour rows `overflow-hidden` (73→864px) while header scrolls → rows don't scroll; **clipped at all widths**; 198/209 text < 12px |
| 6 | Mini calendar | `calendars-mini.tsx` | P2 | `w-72`/`w-80` fixed cards; fine at 375, overflow at 320 |
| 7 | Contribution heatmap | `calendars-year-heatmap.tsx` | P1 | Depends on 3 live external APIs (GitHub, deno.dev); shows "Failed to fetch" offline; 53-week grid needs scroll |
| 8 | Recurring event | `calendars-recurring.tsx` | P1 | Editor card clipped (325→424px): preset chips + RRULE; 10/28 targets < 24px |
| 9 | Holidays & PTO | `calendars-holidays.tsx` | P0 | Same scroll desync as #5 (header scrolls, member rows `overflow-hidden`, 73→744px) at **all widths**; +50px header overflow |

### Patterns
1. **No view switching by breakpoint** (use `useMediaQuery` from `@orbit/ui/hooks/use-media-query` — note its `md` is **800px**, not Tailwind's 768px; align them).
2. **Fixed px timelines** (`DAY_W = 24`, `HOUR_W`, `HOUR_PX`) laid out with inline `style={{ width: N * W }}` — header in `overflow-x-auto`, rows in `overflow-hidden` → only the header scrolls. Put header + rows in **one** scroll container with a sticky name column.
3. **Toolbars** (`Today` / prev / next / view switch / New event) in non-wrapping rows.
4. **Event chips** as tiny absolutely positioned boxes with `text-[10px]` — unreadable/untappable on phones.
5. **Hover-only actions** in rows (`opacity-0 group-hover:opacity-100`: timezone remove L273, holidays remove L417).
6. `new Date()` / `Math.random` used in render (holidays, timezone, heatmap) — SSR/CSR mismatch risk.

---

## 1. Month view
- **Route:** `/c/calendars/month` · **File:** `apps/www/src/pages/showcase/calendars-month.tsx`
- **Measured:** **mobile page overflow 146px** — toolbar "TODAY · Day · Week · Month · + EVENT" at x=104–521. 28/59 text < 12px. Screenshot @375: grid fits but each day cell is ~45px; event chips show 1–2 letters ("Q…", "S…").
- **P1 — Header `flex items-end justify-between`** (L49) with nav + view switch + New event button. Mobile: title row + compact controls row; view switch as `Select`; FAB for new event.
- **P1 — Month grid `grid-cols-7 grid-rows-5`** (L116) with text chips — mobile: dots under the date number + tap a day → agenda list for that day below the grid.
- **P2 — Prev/next `size-8`** (L59, L71) 32px.
- **P2 — `px-8 py-8`** (L47).
- **P3 — `overflow-hidden rounded-xl`** (L105) clips "+N more" chips.

## 2. Week schedule
- **Route:** `/c/calendars/week` · **File:** `apps/www/src/pages/showcase/calendars-week.tsx`
- **Measured:** day columns **49px** wide (5 squeezed), event blocks clipped (19 of 41px content); 46/52 text < 12px. Screenshot @375: event titles 2–3 letters.
- **P1 — `grid-cols-[64px_repeat(5,1fr)]`** (L86, L109) — mobile: 1-day or 3-day view with swipe/scroll-snap; hour gutter `w-12`.
- **P1 — Absolute events** positioned by `HOUR_PX` (L116–143) — fine logic; but overlapping events in a 49px column are unusable.
- **P2 — `sm:border-r`** (L91, L127) — only responsive class; borders vanish < sm but layout doesn't change.

## 3. Agenda list
- **Route:** `/c/calendars/agenda` · **File:** `apps/www/src/pages/showcase/calendars-agenda.tsx`
- **Measured:** event text column squeezed to **72px**; 54/66 text < 12px. Screenshot @375: titles wrap one word per line next to time + attendee avatars.
- **P2 — Row `grid grid-cols-[80px_1fr] gap-3`** (L104) + attendee avatar stack inside `1fr` — move avatars to a meta line; time column 56px on mobile.
- **P2 — `px-10`** (L47).
- **P3 — Travel-gap separators** good.

## 4. Date range picker
- **Route:** `/c/calendars/date-range` · **File:** `apps/www/src/pages/showcase/calendars-date-range.tsx`
- **Measured:** **mobile page overflow 38px**; the picker spans x=−38…413 — centred by `grid place-items-center` (L34), so the **presets rail's left edge is cut off and unreachable**. Screenshot @375: "uick range / esterday / st 7 days…" clipped.
- **P0 — `grid-cols-[180px_1fr]`** (L36) presets + `grid grid-cols-2 gap-8/12` months (L80, L95): fixed ~700px content; no breakpoint.
- **P1 — Mobile pattern:** full-screen sheet with presets as horizontal chips, **one** month (vertical scrolling months), sticky footer "Apply".
- **P2 — Day cells** dense `grid-cols-7 gap-y-0.5` (L133) with `text-xs` — ~32px targets.
- **P2 — Footer `justify-between`** (L101) range text + Reset + Apply — crowd.

## 5. Timezone planner
- **Route:** `/c/calendars/timezone` · **File:** `apps/www/src/pages/showcase/calendars-timezone.tsx` (621 lines)
- **Measured:** 6 rows clipped (clientW 73 / scrollW 864) on **mobile, tablet and laptop**; **198/209 text nodes < 12px** (the most in the catalogue).
- **P0 — Scroll desync**: header hour ruler sits in `overflow-x-auto` (L225) while each zone row's track is `overflow-hidden` (L279). Scrolling the header doesn't move rows. Single scroll container (rows + header) with sticky 220px label column.
- **P1 — `grid-cols-[220px_1fr]`** (L223, L256) — label column 59% of a 375 screen. Mobile: label column ~110px (city + time), or transpose to a vertical list of zones with a horizontal "time scrubber".
- **P2 — Remove zone button `opacity-0 group-hover`** (L273) — invisible on touch.
- **P2 — Draggable meeting window** — check pointer/touch support.
- **P2 — Hour labels `text-[9px]/[10px]`.**

## 6. Mini calendar
- **Route:** `/c/calendars/mini` · **File:** `apps/www/src/pages/showcase/calendars-mini.tsx`
- **Measured:** clean at 375; 17/85 text < 12px.
- **P2 — Fixed `w-72` / `w-80` cards** (L28, L44) + page `p-8` → at 320px overflow (320 + 64 > 320). Use `w-full max-w-80`.
- **P2 — Nav buttons `size-6`** (L82, L88) 24px.
- **P3 — Day buttons `h-9`** good; event dots colour-only.

## 7. Contribution heatmap
- **Route:** `/c/calendars/year-heatmap` · **File:** `apps/www/src/pages/showcase/calendars-year-heatmap.tsx` (555 lines)
- **Measured:** h-scroll at mobile & tablet; screenshot @375 shows **"Failed to fetch"** error and skeletons — the screen calls `github-contributions-api.deno.dev`, `api.github.com/users/…` and `/events/public` at runtime (L78–88).
- **P1 — Live third-party dependency** in a showcase template: rate-limited (GitHub 60 req/h unauthenticated), CORS/network-dependent. For a production starter, data should come from props/loader; render a seeded dataset by default.
- **P1 — 53-week grid** (`grid-cols-[28px_1fr]`, L228, `gap-[3px]` cells) inside `overflow-x-auto` (L227): on mobile show last ~16 weeks (scroll start at the end), or switch to a month-by-month list.
- **P2 — Cell tooltip "Hover a day to see the date"** — hover-only; add tap.
- **P2 — Stats `grid-cols-3`** (L306) tight at 375.
- **P2 — Search `max-w-xs` + Load** (L131) fine.

## 8. Recurring event
- **Route:** `/c/calendars/recurring` · **File:** `apps/www/src/pages/showcase/calendars-recurring.tsx` (943 lines)
- **Measured:** editor card clipped (clientW 325 / scrollW 424); 10/28 targets < 24px; 56/115 text < 12px. Screenshot @375: preset chips wrap but FREQ segmented control ("Daily/Weekly/Monthly…") is cut.
- **P1 — Form rows `grid-cols-[110px_1fr]`** (L656) label + control: control area ~200px; segmented FREQ control doesn't wrap → clipped by `overflow-hidden` (L335). Stack label above control on mobile.
- **P1 — Preset bar `overflow-x-auto` + `flex-wrap`** (L385–390) — contradictory; pick horizontal scroll chips.
- **P2 — Weekday picker** 7 small buttons (L706) ~28px.
- **P2 — Interval `w-16`, count `w-20`** inputs (L453, L637) fine.
- **P2 — RRULE `overflow-x-auto font-mono text-[12px]`** (L766) good.
- **P3 — `lg:grid-cols-2`** editor/preview split (L342) good.

## 9. Holidays & PTO
- **Route:** `/c/calendars/holidays` · **File:** `apps/www/src/pages/showcase/calendars-holidays.tsx` (610 lines)
- **Measured:** **mobile page overflow 50px** (header actions "Find clearest week · Add member" x=40–398; legend hint at x=377–425); 7 rows clipped (73→744px) at **mobile, tablet and laptop**. Screenshot @tablet: header shows days 1–19, member rows show the same window but cannot be scrolled independently — any scroll moves only the header.
- **P0 — Scroll desync** — header `overflow-x-auto` (L308) vs rows `relative h-12 overflow-hidden` (L345, L422). Same fix as #5.
- **P1 — `grid-cols-[220px_1fr]`** (L304, L341, L394) label column.
- **P1 — `DAY_W = 24`** cells (L145) — 24px tap targets for toggling PTO; on mobile switch to per-member month list or a larger day width with horizontal scroll-snap.
- **P2 — Remove member `opacity-0 group-hover:opacity-100`** (L417).
- **P2 — Header `flex-wrap`** (L257) helps but inner action group doesn't wrap.
- **P2 — Popover `!w-72`** (L529) fine.
