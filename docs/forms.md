# Forms — Responsive Audit

Category: `forms` · 4 screens · Route: `/c/forms/<slug>`

> Severity: **P0** content unreachable / unusable · **P1** major degradation · **P2** usability / a11y gap · **P3** polish. Metrics: see `docs/README.md`.

## Category summary

| # | Screen | File | Worst | Primary failure on mobile |
|---|--------|------|-------|---------------------------|
| 1 | Workspace settings | `forms-workspace-settings.tsx` | P0 | 220px settings nav + 180px section label column → form fields crushed/clipped |
| 2 | Invite teammates | `forms-invite-teammates.tsx` | P1 | Footer actions don't wrap: "Send" button pushed outside the card |
| 3 | Notification preferences | `forms-notifications.tsx` | P2 | 28/29 targets < 24px; switches unlabeled; descriptions truncated to nothing |
| 4 | Create API key | `forms-api-key.tsx` | P2 | Layout OK; small targets/micro type, fake `<select>` styling |

### Patterns shared across this category
1. **Settings-page skeleton has no mobile mode** — left nav as a permanent column (screen 1). Production pattern: on mobile, nav becomes a top `Select`/scrollable tab strip or a separate "Settings index" screen.
2. **Two-column "label | fields" sections** (`grid-cols-[180px_minmax(0,1fr)]`) without stacking below `md`.
3. **Sticky/fixed save bars** with desktop padding (`px-10`) and no `safe-area-inset-bottom`.
4. **Small controls**: 24–28px icon buttons, `text-[10px]` uppercase mono links (`+ ADD A PERSONAL NOTE`, `COPY LINK`) — hard to hit and read on touch.
5. Forms otherwise use `max-w-*` + `w-full` correctly — the fixes here are mostly stacking and wrapping, not redesign.

---

## 1. Workspace settings

- **Route:** `/c/forms/workspace-settings`
- **File:** `apps/www/src/pages/showcase/forms-workspace-settings.tsx`
- **Intent:** Two-column settings page (nav + sections) with sticky save bar.
- **Measured:** mobile — **page overflow 372px** (slug input rendered at x=573–747; 50 elements off-screen); 6 "squeezed" blocks (switch rows measured **34px** wide); 8/20 targets < 24px. Screenshot @375: nav takes ~35% width, main column text cut at the right edge ("Workspace iden…", "Defaults applied…"), inputs not visible in the first viewport.

**Flaws**
- **P0 — `L34 grid … grid-cols-[220px_1fr]`** — settings nav always docked.
- **P0 — Nested section grid `L214 grid-cols-[180px_minmax(0,1fr)] gap-x-10`** inside an already-narrow main column: 180px label + 40px gap leaves negative space for fields at ≤ 640px. Must be `grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)]`.
- **P1 — `main px-10 py-12`** (L68): 80px of horizontal padding on a 375px screen. Use `px-4 sm:px-6 lg:px-10`.
- **P1 — Fixed save bar `inset-x-0 bottom-0 … px-10`** (L179–180): label + 2 buttons in a non-wrapping row; no `pb-[env(safe-area-inset-bottom)]`; `pb-32` on main to compensate is magic-number.
- **P1 — Header `flex items-end justify-between`** (L69) has no wrap — the right-side action will collide with title on narrow widths.
- **P2 — Slug input (L108–119)** — prefix `orbit.so/` + input in a 36px-tall flex; on narrow screens prefix consumes most of the field. Stack hint or shorten prefix on mobile.
- **P2 — `SwitchRow` (L288) `flex justify-between gap-6`** — description squeezed to 34px when column collapses.
- **P2 — Native select restyled with absolute SVG chevron** (L250–270) — fine, but 36px tall (`h-9`); 44px on touch.
- **P3 — Danger zone nav item is visually a link but a button with no navigation semantics.**

**Target behaviour**
- Mobile: nav → horizontal scrollable tab strip (or `Select`) at top; sections single-column (label above fields); save bar full-width buttons, safe-area padded.
- Tablet: nav 180px; sections single-column.
- Desktop: as today.

**Acceptance**
- [ ] At 375px every input is ≥ 300px wide and fully visible.
- [ ] Save bar buttons visible and ≥ 44px tall, not overlapping the last field.

---

## 2. Invite teammates

- **Route:** `/c/forms/invite-teammates`
- **File:** `apps/www/src/pages/showcase/forms-invite-teammates.tsx`
- **Intent:** Chip-based email entry with per-chip role, personal note, invite link.
- **Measured:** mobile **page overflow 102px** (Send button at x=306–477); 5/11 targets < 24px; 11/22 text nodes < 12px. Console: **hydration mismatch** error. Screenshot @375: footer row has invite link + "COPY LINK" + "Send 1" — the Send button is pushed past the card's right border and clipped.

**Flaws**
- **P1 — Footer `L268 mt-6 flex items-center justify-between gap-3`** doesn't wrap: `CopyLinkButton` (truncating URL + label) + primary button exceed width. Mobile: stack (`flex-col-reverse sm:flex-row`) with full-width primary.
- **P1 — Chip role trigger is a 20px (`h-5`) mono uppercase pill** (L360) and the remove `×` is `size-5` (L416) — < 24px targets, hard to tap inside a dense chip.
- **P2 — Header role `SelectTrigger w-32 h-8`** (L170) + hidden-on-mobile label (`hidden sm:inline`, L162) — fine, but trigger 32px tall.
- **P2 — Micro-copy controls `text-[10px] uppercase tracking-[0.25em]`** ("+ Add a personal note", "Hide", stats line, L219–262) — too small to read/tap on phones.
- **P2 — Chip `PopoverPopup w-56`** (L379) not collision-aware for chips near the right edge (check Base UI positioner `collisionPadding`).
- **P2 — Hydration mismatch** logged on load (also seen on auth screens) — production-readiness issue, investigate generated IDs / theme-dependent render.
- **P3 — Chip input `min-w-[12ch]`** (L215) fine.

**Target behaviour**
- Mobile: chips wrap (already), footer stacked, role editing via bottom `Drawer` instead of tiny popover.
- Desktop: as today.

**Acceptance**
- [ ] Send button fully visible inside the card at 375px.
- [ ] Chip controls ≥ 24px (44px preferred).

---

## 3. Notification preferences

- **Route:** `/c/forms/notifications`
- **File:** `apps/www/src/pages/showcase/forms-notifications.tsx`
- **Intent:** Matrix of notification types × channels (email / push) with switches.
- **Measured:** **28/29 interactive targets < 24px** (switches are ~18px tall) at every width. Screenshot @375: layout holds, but descriptions are truncated to "When someone re…" and the column headers ("EMAIL"/"PUSH") float far from their switches.

**Flaws**
- **P1 — Switches have no accessible name** (L151–160): screen readers hear "switch, on" ×14 with no indication of which preference/channel. Need `aria-label={`${p.title} — Email`}` or `aria-labelledby` linking row title + column header.
- **P2 — Column headers are visual-only** (L115–124) in a separate strip; a real `<table>` or `role="grid"` with headers would give SR context and keep alignment.
- **P2 — Description `truncate`** (L145) → on mobile the explanatory text is lost. Use `line-clamp-2` or let it wrap.
- **P2 — Switch hit area < 24px.** Make whole cell (`w-16` wrapper) the label/hit area, ≥ 44px tall row on touch.
- **P2 — Column wrappers `w-16 gap-6`** (L149–161) = 152px fixed for controls → text column ≈ 140px at 375.
- **P3 — Dead code `{idx < SECTIONS.length - 1 ? null : null}`** (L168).

**Target behaviour**
- Mobile: each row → title + description full-width, then a 2-item inline control group labelled "Email" / "Push" under it (or keep columns but sticky header row).
- Desktop: as today.

**Acceptance**
- [ ] Every switch announces its purpose.
- [ ] Description text fully readable at 375px.

---

## 4. Create API key

- **Route:** `/c/forms/api-key`
- **File:** `apps/www/src/pages/showcase/forms-api-key.tsx`
- **Intent:** Centered card form → reveal-once secret.
- **Measured:** no overflow; 10/14 targets < 24px (scope checkboxes, copy button); 10/24 text nodes < 12px. Screenshot @375: renders well — good baseline example.

**Flaws**
- **P2 — Card-in-page on mobile** (`max-w-lg rounded-2xl border p-6`, L119) wastes ~40px of width; on `< sm` drop border/shadow and go edge-to-edge (`max-sm:border-0 max-sm:p-0`).
- **P2 — Copy button** (L98) `px-1.5 py-0.5 text-[11px]` ≈ 20px tall.
- **P2 — Scope labels `font-mono text-[11px]`**, "DESTRUCTIVE" tag `text-[9px]` (L176, L180).
- **P2 — Footer `flex justify-between`** (L204) — mono hint + 2 buttons; wraps poorly at 320px. Allow wrap / stack.
- **P3 — Secret is `truncate`d** (L91) — on mobile users can't visually verify the key; allow `break-all` in a multi-line block.
- **P3 — Container `min-h-svh items-center justify-center`** (L116): when form is taller than viewport (landscape phone) the top can be clipped — prefer `items-start sm:items-center` or `my-auto` on child.

**Acceptance**
- [ ] Copy action ≥ 44px tall on touch.
- [ ] Form scrollable from the top in landscape (no clipped heading).
