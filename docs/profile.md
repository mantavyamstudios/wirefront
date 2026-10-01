# Profile — Responsive Audit

Category: `profile` · 10 screens · Route: `/c/profile/<slug>`

> Severity: **P0** unusable · **P1** major degradation · **P2** usability / a11y gap · **P3** polish. Metrics: see `docs/README.md`.

## Category summary

Mixed. Card-grid screens (team grid, intros, skills) are fine; **row-grid screens with fixed tracks** (compact card, credentials, directory) and **side-by-side layouts without breakpoints** (presence rail, hero header) break badly. Compact card is the worst single visual failure in the catalogue: text from three columns renders on top of each other.

| # | Screen | File | Worst | Primary issue |
|---|--------|------|-------|---------------|
| 1 | Profile hero | `profile-hero.tsx` | P1 | Stats row +264px overflow; name collides with action buttons |
| 2 | Hover card | `profile-hover-card.tsx` | P2 | Hover-triggered pattern has no touch equivalent; fixed `w-80` |
| 3 | Team grid | `profile-team-grid.tsx` | P1 | Header search `w-…` + Invite → +33px; title wraps per word; 13/14 targets < 24px |
| 4 | Contact directory | `profile-directory.tsx` | P1 | +123px (search `w-72` + ⌘K); names truncated to 5 chars; hover-only actions |
| 5 | Compact user card | `profile-compact-card.tsx` | P0 | `grid-cols-[44px_1fr_140px_120px_28px]` → **name, role, status overlap**; +62px overflow |
| 6 | Org chart | `profile-org-chart.tsx` | P1 | Horizontal tree scrolls; connector line assumes 4 equal children |
| 7 | Skills matrix | `profile-skills.tsx` | P2 | 12/13 targets < 24px (Endorse); 51/70 text < 12px |
| 8 | Presence rail | `profile-presence-rail.tsx` | P0 | `grid-cols-[1fr_280px]` → intro column 82px, rail pushed off-screen (+93px) |
| 9 | Suggested intros | `profile-introductions.tsx` | P3 | Clean; dismiss `size-6` |
| 10 | Security credentials | `profile-credentials.tsx` | P1 | Session rows `grid-cols-[44px_1fr_140px_auto]` → device text 33px |

### Patterns
1. **Fixed multi-column row grids** for lists (compact card, credentials, directory). Mobile: avatar + 2-line text + trailing single action.
2. **Header search inputs with fixed widths** (`w-72`) and `⌘K` hints.
3. **Hover-only** (hover card concept, directory row actions `opacity-0 hover:opacity-100` on the actions container itself — never revealed by keyboard either).
4. **`px-10 py-10`** page padding on 7/10.

---

## 1. Profile hero
- **Route:** `/c/profile/hero` · **File:** `apps/www/src/pages/showcase/profile-hero.tsx`
- **Measured:** **mobile page overflow 264px** — stats "284 Following · 12.4k Followers · 8,294 Stars" (`ml-auto flex gap-4`) at x=388–639. Screenshot @375: "Maya Okafor" wraps beside avatar; "Message" button overlaps name block; second button clipped.
- **P1 — Identity row `-mt-12 flex items-end justify-between`** (L51) avatar `size-24` + name + action buttons — stack actions under identity on mobile, avatar `size-20`.
- **P1 — Stats row** with `ml-auto` in tabs/nav row (≈L100–118) — non-wrapping; move stats above tabs on mobile.
- **P2 — Tabs (Overview, Activity, Projects, Posts…)** — horizontal scroll with snap on mobile.
- **P2 — Cover `h-48`** (L38) — `h-32 sm:h-48`.
- **P2 — `px-8`** (L50).
- **P3 — Bio/meta `sm:grid-cols-[1fr_auto]`** (L76) and content `lg:grid-cols-[2fr_1fr]` (L121) good.

## 2. Hover card
- **Route:** `/c/profile/hover-card` · **File:** `apps/www/src/pages/showcase/profile-hover-card.tsx`
- **Measured:** clean; 3/4 targets < 24px (mention chips).
- **P2 — Interaction model**: mention → hover card is pointer-only. Touch: tap mention → `Popover`/bottom `Drawer` with the same card. Use `@orbit/ui/preview-card` (Base UI PreviewCard supports touch delay) or Popover fallback.
- **P2 — Card `w-80`** (L57) fixed — `w-[min(20rem,calc(100vw-2rem))]`.
- **P2 — Showcase layout `lg:grid-cols-[1fr_360px]`** (L13) fine.

## 3. Team grid
- **Route:** `/c/profile/team-grid` · **File:** `apps/www/src/pages/showcase/profile-team-grid.tsx`
- **Measured:** **mobile page overflow 33px** (Invite button x=326–408); **13/14 targets < 24px** (Email/Profile text links). Screenshot @375: "Meet / the / team" one word per line beside search.
- **P1 — Header `flex items-end justify-between`** (L46) title + search + Invite.
- **P2 — Card footer links** "Email · Profile" (L115) small.
- **P3 — Grid `sm:grid-cols-2`** (L76) good; consider `lg:grid-cols-3`.

## 4. Contact directory
- **Route:** `/c/profile/directory` · **File:** `apps/www/src/pages/showcase/profile-directory.tsx`
- **Measured:** **mobile page overflow 123px** — search box (`w-72` input, L60 + ⌘K) at x=142–498; 27/72 targets < 24px; 48/94 text < 12px. Screenshot @375: names truncated ("Nadia…", "Avery…").
- **P1 — Header search `w-72`** (L60) in `justify-between` (L49).
- **P1 — Body `grid-cols-[1fr_28px]`** (L68) list + A–Z rail — OK, but row `grid-cols-[40px_1fr_auto]` (L86) with 3 action icons (`size-7`) eats name width.
- **P2 — Row actions `opacity-0 hover:opacity-100`** on the action wrapper (L107) — never visible on touch, not on focus. Show a single `⋯` on mobile.
- **P2 — Letter rail `text-[10px]`** (L135) ~16px targets; on touch, implement drag-to-scrub.
- **P2 — Sticky letter headers** (L76) good.

## 5. Compact user card
- **Route:** `/c/profile/compact-card` · **File:** `apps/www/src/pages/showcase/profile-compact-card.tsx`
- **Measured:** **mobile page overflow 62px** (menu buttons at x=409–437, 25 elements off-screen). Screenshot @375: in every row, name, role and "ACTIVE NOW" text render **on top of each other** in the same ~40px column.
- **P0 — `grid grid-cols-[44px_1fr_140px_120px_28px] gap-3 px-4`** (L94): 332px fixed + 48px gaps + 32px padding = 412px > 343px available → `1fr` = 0, content of the min-width-0 column overflows into neighbours. Mobile: `grid-cols-[44px_1fr_auto]` with role/team on line 2 and status as a dot on the avatar.
- **P2 — Menu `size-7`** (L150) 28px.
- **P2 — `px-10`** (L83).

## 6. Org chart
- **Route:** `/c/profile/org-chart` · **File:** `apps/www/src/pages/showcase/profile-org-chart.tsx`
- **Measured:** inner h-scroll at mobile & tablet. Screenshot @375: CEO node + one report visible; siblings off to the sides.
- **P1 — Horizontal tree** inside `overflow-x-auto p-8` (L73) — mobile: indented vertical tree (collapsible), or "drill-down" (show one manager + direct reports, tap to go deeper).
- **P2 — Connector `absolute left-[12.5%] right-[12.5%]`** (L95) hard-codes 4 children; breaks for any other count or when nodes wrap.
- **P2 — Expand/collapse `size-6`** (L138, L146) 24px.

## 7. Skills matrix
- **Route:** `/c/profile/skills` · **File:** `apps/www/src/pages/showcase/profile-skills.tsx`
- **Measured:** clean overflow; **12/13 targets < 24px** ("Endorse" text buttons); 51/70 text < 12px.
- **P2 — Endorse buttons** `text-[10px]` uppercase (L66–75) — ≥ 32px on touch.
- **P2 — Proficiency dots** colour/shape only — add `aria-label` ("4 of 5").
- **P3 — `sm:grid-cols-2`** (L56) good.

## 8. Presence rail
- **Route:** `/c/profile/presence-rail` · **File:** `apps/www/src/pages/showcase/profile-presence-rail.tsx`
- **Measured:** **mobile page overflow 93px** — rail `aside` at x=188–468; intro paragraph squeezed to **82px**. Screenshot @375: intro text one word per line, rail cut off.
- **P0 — `grid max-w-4xl grid-cols-[1fr_280px] gap-6`** (L42) with no breakpoint.
- **P1 — Mobile pattern:** presence as a horizontal avatar strip ("Online now" chips) at the top, full list in a Sheet.
- **P2 — Stats `grid-cols-3`** (L53) fine; `p-8` page (L41).
- **P2 — Row action `size-7`** (L90).

## 9. Suggested intros
- **Route:** `/c/profile/introductions` · **File:** `apps/www/src/pages/showcase/profile-introductions.tsx`
- **Measured:** clean; 1/9 targets < 24px.
- **P3 — Dismiss `size-6`** (L126) 24px; Follow buttons fine.
- **P3 — `sm:grid-cols-2`** (L102) good; `px-10` (L91).

## 10. Security credentials
- **Route:** `/c/profile/credentials` · **File:** `apps/www/src/pages/showcase/profile-credentials.tsx`
- **Measured:** device text column squeezed to **33px**. Screenshot @375: "MacBook Pro / Arc 1.42 / Brooklyn, NY · this network" stacked one word per line; "SIGN OUT" wraps.
- **P1 — Session rows `grid-cols-[44px_1fr_140px_auto]`** (L83): 140px "active now / IP" column + action → stack meta on mobile.
- **P2 — Header "Sign out everywhere" button** (L67–78) crowds section title.
- **P2 — Badges "THIS DEVICE · TRUSTED" `text-[9px]`.**
- **P3 — Passkeys `grid-cols-[44px_1fr_auto]`** (L139) fine.
