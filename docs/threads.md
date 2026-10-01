# Threads & Comments — Responsive Audit

Category: `threads` · 6 screens · Route: `/c/threads/<slug>`

> Severity: **P0** unusable · **P1** major degradation · **P2** usability / a11y gap · **P3** polish. Metrics: see `docs/README.md`.

## Category summary

Comment primitives (row, resolved, composer) are mostly fine width-wise but rely on **hover-revealed actions** (`opacity-0 group-hover:opacity-100`) and tiny reaction/reply targets (Comment row: 11/12 targets < 24px). The two layout-level screens (Inline thread, Side panel) and the mention popover use **fixed desktop geometry** and break on mobile.

| # | Screen | File | Worst | Primary issue |
|---|--------|------|-------|---------------|
| 1 | Inline thread | `threads-inline-thread.tsx` | P0 | `grid-cols-[minmax(0,1fr)_320px]` → document column **24px** wide (one word per line); +17px overflow |
| 2 | Side panel | `threads-side-panel.tsx` | P1 | `absolute right-0 w-[420px]` panel wider than phone → left edge cut |
| 3 | Comment row | `threads-comment-row.tsx` | P1 | 11/12 targets < 24px; "more" menu hover-only |
| 4 | @mention popover | `threads-mention-popover.tsx` | P1 | Popover at fixed `left-[100px] top-[100px] w-80` → +70px overflow; not caret-anchored |
| 5 | Resolved thread | `threads-resolved.tsx` | P2 | Hover-only menu; truncated preview |
| 6 | Rich composer | `threads-compose-rich.tsx` | P1 | Toolbar row overflows (+39px); keyboard hint visible at ≥ sm |

### Patterns
1. **Hover-only actions** — `threads-comment-row.tsx:108`, `threads-resolved.tsx:126` (`opacity-0 group-hover:opacity-100`). On touch: always show a `⋯` button, or long-press menu; add `focus-visible:opacity-100` / `group-focus-within:opacity-100` for keyboard.
2. **Reaction chips & reply links** `text-xs` ~20px.
3. **Margin-comment layout** (doc + right rail) has no mobile mode — mobile should show comment count markers inline and open threads in a bottom sheet.
4. **Composer on mobile** should be sticky to the bottom, aware of the virtual keyboard (`visualViewport`), with toolbar in a horizontally scrollable row.

---

## 1. Inline thread
- **Route:** `/c/threads/inline-thread` · **File:** `apps/www/src/pages/showcase/threads-inline-thread.tsx`
- **Measured:** **mobile page overflow 17px**; 15 elements off-screen (thread rail at x=72–392); highlighted paragraph squeezed to **24px**; 5/7 targets < 24px. Screenshot @375: document text renders one word per line in a narrow strip at the left; the thread rail takes the rest.
- **P0 — `mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)_320px] gap-10 px-8`** (L32): 320 + 40 + 64 = 424px fixed > 375.
- **Target:** `< lg` → single column document; highlighted anchor shows a comment badge; tapping opens the thread in a bottom `Drawer` (or below the paragraph). `≥ lg` → margin rail.
- **P2 — Aside `border-l pl-6`** (L67) — margin connector logic assumes side-by-side.
- **P2 — Reply input + Send** row; "⌘↵ to send" hint.

## 2. Side panel
- **Route:** `/c/threads/side-panel` · **File:** `apps/www/src/pages/showcase/threads-side-panel.tsx`
- **Measured:** root clips 401/375; 8/10 targets < 24px. Screenshot @375: panel starts left of the viewport ("onversation 4 REPLIES" — the "C" is cut).
- **P1 — `absolute right-0 top-0 z-40 flex h-full w-[420px]`** (L63) + divider `absolute right-[420px]` (L178). Use `Sheet side="right"` with `w-full sm:w-[420px]` (UI package has `@orbit/ui/sheet`).
- **P1 — Composer** at panel bottom (L166) should respect the keyboard/safe area.
- **P2 — Participant avatars / Subscribe** header row crowd at 375.
- **P2 — Background mock `grid-cols-[220px_1fr]`, `px-10`** (L185, L191).

## 3. Comment row
- **Route:** `/c/threads/comment-row` · **File:** `apps/www/src/pages/showcase/threads-comment-row.tsx`
- **Measured:** clean overflow; **11/12 targets < 24px** (reactions, add-reaction, reply, more). Screenshot @375: good layout; reaction chips ~20px tall.
- **P1 — More-menu `opacity-0 group-hover:opacity-100`** (L108) — invisible on touch and keyboard.
- **P2 — Reaction chips** — ≥ 32px tall on touch; add `aria-pressed` and counts in label.
- **P2 — "3 replies · Reply" links `text-xs`.**
- **P3 — `max-w-3xl px-6`** (L68) good.

## 4. @mention popover
- **Route:** `/c/threads/mention-popover` · **File:** `apps/www/src/pages/showcase/threads-mention-popover.tsx`
- **Measured:** **mobile page overflow 70px** — popover at x=125–445; 28/41 text < 12px. Screenshot @375: list extends past the right edge; "navigate / select" footer keys cut.
- **P1 — `absolute left-[100px] top-[100px] z-30 w-80`** (L57) — hard-coded; must anchor to the caret (Range rect) with flip/shift, `max-w-[calc(100vw-2rem)]`.
- **P1 — Mobile pattern:** mention suggestions as a full-width list docked above the virtual keyboard (like iMessage/Slack mobile).
- **P2 — Footer "↑↓ navigate · ↵ select"** (L119) keyboard-only.
- **P2 — Listbox semantics** (`role="listbox"`, `aria-activedescendant`) missing.

## 5. Resolved thread
- **Route:** `/c/threads/resolved` · **File:** `apps/www/src/pages/showcase/threads-resolved.tsx`
- **Measured:** clean; 11/21 text < 12px. Screenshot @375: preview text truncated to ~20 chars ("Should we keep th…") beside "Reopen".
- **P2 — Menu `opacity-0 group-hover:opacity-100`** (L126).
- **P2 — Header meta `hidden sm:flex`** (L111) — good responsive hide.
- **P2 — Row `flex` with Reopen button** squeezes preview; use 2-line clamp.
- **P3 — Filter tabs "Open 4 / Resolved 3"** (≈L52–70) fine.

## 6. Rich composer
- **Route:** `/c/threads/compose-rich` · **File:** `apps/www/src/pages/showcase/threads-compose-rich.tsx`
- **Measured:** **mobile page overflow 39px** — "Markdown supported" hint span at x=346–414 in the toolbar row; 1/14 targets < 24px.
- **P1 — Toolbar row `flex justify-between border-b pb-2`** (L44): 9 format buttons + hint don't fit 343px. Mobile: horizontally scrollable toolbar (`overflow-x-auto`), hide hint, or collapse formatting into an "Aa" popover.
- **P2 — Footer** "Replying to Maya" + Cancel + Reply (L113) — fine at 375; hint `hidden sm:flex` (L123) good.
- **P2 — Attachment chip** fine.
- **P3 — `max-w-3xl px-6`** (L33) good.
