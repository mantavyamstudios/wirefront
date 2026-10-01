# Timelines — Responsive Audit

Category: `timelines` · 12 screens · Route: `/c/timelines/<slug>`

> Severity: **P0** unusable · **P1** major degradation · **P2** usability / a11y gap · **P3** polish. Metrics: see `docs/README.md`.

## Category summary

Timelines are vertical lists, so they naturally survive narrow widths — the failures are **row grids with fixed tracks** (`grid-cols-[24px_120px_1fr_180px_auto]`, `[34px_1fr_auto]`, `[140px_1fr]`) and cards with `overflow-hidden` that silently clip trailing columns. Every screen uses `px-10 py-10` page padding. Micro type is the worst in the catalogue here (Commits 76/83, Deploys 59/67 text nodes < 12px).

| # | Screen | File | Worst | Primary issue |
|---|--------|------|-------|---------------|
| 1 | Audit trail | `timelines-audit.tsx` | P1 | `grid-cols-[34px_1fr_auto]` + "VIEW" → event text truncated ("rotated A…"); 5/5 targets < 24px |
| 2 | Notifications | `timelines-notifications.tsx` | P3 | Good; `max-w-md` card |
| 3 | Changelog | `timelines-changelog.tsx` | P1 | `grid-cols-[140px_1fr] gap-8` + sticky date aside → content column ~150px |
| 4 | Commits | `timelines-commits.tsx` | P1 | Commit messages truncated to ~4 chars; card clipped 293→383px |
| 5 | Approvals | `timelines-approvals.tsx` | P2 | Reviewers sidebar stacks below; fine |
| 6 | Pull request | `timelines-pull-request.tsx` | P2 | Header actions crowd; diff `pre` scroll |
| 7 | PR ops console | `timelines-pr-ops-console.tsx` | P1 | "Update branch" row squeezes message to 66px |
| 8 | Releases | `timelines-releases.tsx` | P2 | Pause / Roll back actions crowd footer |
| 9 | Status page | `timelines-status-page.tsx` | P2 | 90-day uptime bars `hidden sm:flex` — no mobile alternative |
| 10 | Deploys | `timelines-deploys.tsx` | P0 | 5-track row grid clipped (293→476px): commit/author columns hidden |
| 11 | Inbox thread | `timelines-inbox-thread.tsx` | P2 | 40px avatar gutter on every message; 5/9 targets < 24px |
| 12 | Activity feed | `timelines-activity-feed.tsx` | P3 | Clean; sticky day headers OK |

### Patterns
1. **`px-10 py-10`** page padding on 11/12 (pr-ops-console uses `px-6`).
2. **Fixed-track row grids inside `overflow-hidden` cards** — trailing info clipped without scroll (Deploys, Commits).
3. **Left gutters reserved for timeline rails/avatars** (32–40px) + right-hand meta — mobile should move meta under the text.
4. **Hover-only row actions** ("VIEW", copy, reactions) or tiny text links.
5. **Mono uppercase micro labels** for env/status pills (`text-[9px]`/`text-[10px]`).

---

## 1. Audit trail
- **Route:** `/c/timelines/audit` · **File:** `apps/www/src/pages/showcase/timelines-audit.tsx`
- **Measured:** clean overflow; **5/5 targets < 24px** ("VIEW" links); 23/39 text < 12px. Screenshot @375: "Maya Okafor rotated A…", "James Lin deleted w…" — the action object is truncated; IP/time meta wraps into 3 lines.
- **P1 — `grid grid-cols-[34px_1fr_auto] gap-3`** (L115) with a trailing "VIEW" column — move "View" into row tap / chevron.
- **P2 — Diff block `font-mono text-[11px] overflow-hidden`** (L146) — long values clipped; use `overflow-x-auto`/`break-all`.
- **P2 — `px-10`** (L96).

## 2. Notifications
- **Route:** `/c/timelines/notifications` · **File:** `apps/www/src/pages/showcase/timelines-notifications.tsx`
- **Measured:** clean; 2/5 targets < 24px (tabs, "Mark all read").
- **P2 — Card within `px-10` page** (L80) — on mobile this panel should be full-screen (it's a notification centre).
- **P2 — Tabs `text-xs`** small; unread dot colour-only.
- **P3 — Avatar badge** `absolute -bottom-1 -right-1 size-4` (L180) fine.

## 3. Changelog
- **Route:** `/c/timelines/changelog` · **File:** `apps/www/src/pages/showcase/timelines-changelog.tsx`
- **Measured:** clean overflow. Screenshot @375: date/version aside takes ~140px; entry content squeezed to ~150px (one or two words per line: "Introduced / workspace- / level audit").
- **P1 — `grid grid-cols-[140px_1fr] gap-8`** (L116) + `aside sticky top-8` (L118) — must stack below `md` (date/version as a header above each entry).
- **P2 — Hero image `aspect-[16/7]`** (L138) good fluid image.
- **P2 — Header `justify-between`** + Subscribe (L94) fine.

## 4. Commits
- **Route:** `/c/timelines/commits` · **File:** `apps/www/src/pages/showcase/timelines-commits.tsx`
- **Measured:** list card clipped (clientW 293 / scrollW 383); **76/83 text < 12px**. Screenshot @375: messages "fix(…", "wip(…", "chor…" — useless; SHA/copy column dominates.
- **P1 — Row `flex items-center gap-4 pr-4`** (≈L150–200) with graph gutter (absolute SVG `left-4`, L112) + avatar + message + tags + SHA + copy + files — too many fixed-width items. Mobile: message full-width line 1, author · time · SHA line 2.
- **P2 — Branch graph SVG** fixed — fine.
- **P2 — Tag pills `text-[9px]`** (L~170).

## 5. Approvals
- **Route:** `/c/timelines/approvals` · **File:** `apps/www/src/pages/showcase/timelines-approvals.tsx`
- **Measured:** clean; 28/54 text < 12px.
- **P2 — `lg:grid-cols-[1fr_280px]`** (L108) — reviewers panel stacks below a long activity list on mobile; consider reviewers summary at top.
- **P2 — Activity rows `grid-cols-[32px_1fr_auto]`** (L121) time column — OK, wraps.
- **P3 — Branch chip "feat/audit-log → main"** wraps.

## 6. Pull request
- **Route:** `/c/timelines/pull-request` · **File:** `apps/www/src/pages/showcase/timelines-pull-request.tsx` (793 lines)
- **Measured:** 1 inner h-scroll (diff); 63/127 text < 12px; 3/5 targets < 24px.
- **P2 — Header `flex items-start justify-between gap-6`** (L196) title + action buttons — buttons crowd title at 375.
- **P2 — `lg:grid-cols-[1fr_280px]`** (L232) sidebar (reviewers, labels) stacks after the whole timeline.
- **P2 — Merge box `lg:grid-cols-[1fr_auto]`** (L343) good.
- **P2 — Diff `pre overflow-x-auto text-[11px]`** (L624) — OK; consider wrap toggle on mobile.
- **P2 — File list `summary`** (L497) rows `justify-between font-mono text-xs` (L517) long paths.

## 7. PR ops console
- **Route:** `/c/timelines/pr-ops-console` · **File:** `apps/www/src/pages/showcase/timelines-pr-ops-console.tsx`
- **Measured:** 3 squeezed blocks ("This branch is out-of-date…" at **66px** wide); 44 targets, 0 < 24px (good sizes).
- **P1 — Update-branch row** (≈L225–260): icon + `min-w-0 flex-1` message + "Update branch" split button — button wins, message crushed. Stack button below on mobile.
- **P2 — Checks list** `group-hover:inline` "Details" link (L361) — hidden on touch beyond `sm:inline` (OK at ≥ 640, missing < 640 except via hover).
- **P2 — Progress ring `size-9`** (L273) fine.

## 8. Releases
- **Route:** `/c/timelines/releases` · **File:** `apps/www/src/pages/showcase/timelines-releases.tsx`
- **Measured:** clean; 12/27 text < 12px.
- **P2 — Stage rows `grid-cols-[32px_1fr_auto]`** (L43) with time column OK.
- **P2 — Footer `justify-between`** (L100) commit ref + Pause + Roll back — 3 items crowd; stack.
- **P2 — "Canary 5%" chips `240 OPS`, "rolling"** small.

## 9. Status page
- **Route:** `/c/timelines/status-page` · **File:** `apps/www/src/pages/showcase/timelines-status-page.tsx`
- **Measured:** clean; 25/38 text < 12px.
- **P2 — 90-day uptime bars `hidden gap-[2px] sm:flex`** (L202) — mobile shows only the percentage; provide a compact 30-day strip or sparkline instead of nothing.
- **P2 — Component rows** `w-20 text-right` uptime (L125) OK.
- **P2 — Incident timeline `grid-cols-[24px_1fr]`** (L173) fine.

## 10. Deploys
- **Route:** `/c/timelines/deploys` · **File:** `apps/www/src/pages/showcase/timelines-deploys.tsx`
- **Measured:** list clipped (clientW 293 / scrollW 476); **59/67 text < 12px**. Screenshot @375: env badge + author initials visible; commit message, branch, time and action column cut off.
- **P0 — `grid grid-cols-[24px_120px_1fr_180px_auto] gap-4 px-5`** (L75) inside `overflow-hidden` card (L70): 324px of fixed tracks + 64px gaps → `1fr` collapses; trailing columns clipped with no scroll. Mobile: status + env on line 1, commit message line 2, author · time line 3.
- **P1 — Header `flex items-end justify-between`** (L46) "All envs" + Refresh crowd title.

## 11. Inbox thread
- **Route:** `/c/timelines/inbox-thread` · **File:** `apps/www/src/pages/showcase/timelines-inbox-thread.tsx`
- **Measured:** clean; 5/9 targets < 24px (Reply/React text buttons, star).
- **P2 — Message `grid grid-cols-[40px_1fr] gap-4 px-5`** (L81) — 84px lost per message on mobile; put avatar inline with name.
- **P2 — Header actions `size-8`** (L61) fine; Reply/React `text-xs` links small.
- **P2 — Composer footer** (L147) fine.

## 12. Activity feed
- **Route:** `/c/timelines/activity-feed` · **File:** `apps/www/src/pages/showcase/timelines-activity-feed.tsx`
- **Measured:** clean; 1/1 target < 24px.
- **P3 — Sticky day header `sticky top-2`** (L152) good.
- **P3 — `px-10`** (L117); `max-w-2xl` good.
