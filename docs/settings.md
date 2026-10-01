# Settings — Responsive Audit

Category: `settings` · 12 screens · Route: `/c/settings/<slug>`

> Severity: **P0** unusable · **P1** major degradation · **P2** usability / a11y gap · **P3** polish. Metrics: see `docs/README.md`.

## Category summary

Settings pages are single-column (`max-w-3xl…6xl` + `px-8`) and several already use `sm:`/`lg:` steps — they mostly survive 375px. Failures come from **button rows that can't wrap** (coss `Button` is `shrink-0 whitespace-nowrap`), **fixed-width side columns inside rows** (`w-44`, `w-[68px]`, `grid-cols-[64px_160px_1fr_56px_64px_24px]`), and tiny switches/checkboxes.

> **There is no settings shell.** Each settings screen is a standalone page; none renders the settings navigation (that only exists in `forms/workspace-settings`, which is broken on mobile — see `docs/forms.md`). For production, a shared `SettingsLayout` with responsive nav is required.

| # | Screen | File | Worst | Primary issue |
|---|--------|------|-------|---------------|
| 1 | Profile | `settings-profile.tsx` | P2 | Fixed save bar `px-8`, no safe-area; avatar row OK |
| 2 | Appearance | `settings-appearance.tsx` | P2 | Hydration error; preview pane `grid-cols-[80px_1fr]` mini-app below content on mobile |
| 3 | Billing | `settings-billing.tsx` | P1 | Plan footer buttons clipped ("Cancel plan" cut; section 309→415px) |
| 4 | Integrations | `settings-integrations.tsx` | P3 | Clean; small tab chips |
| 5 | Security | `settings-security.tsx` | P1 | "Sign out of all other sessions" button forces **+87px** page overflow |
| 6 | Permissions | `settings-permissions.tsx` | P1 | Matrix sticky column `min-w-[240px]` leaves ~1 role column visible |
| 7 | Branding | `settings-branding.tsx` | P2 | 33/65 text nodes < 12px; colour popovers |
| 8 | Localization | `settings-localization.tsx` | P2 | 17/26 targets < 24px (radio cards, week-start buttons) |
| 9 | Webhooks | `settings-webhooks.tsx` | P0 | **+83px** header overflow; delivery rows 6 fixed tracks clipped (325→434px); 123/162 text < 12px |
| 10 | Privacy | `settings-privacy.tsx` | P1 | Export rows: `w-44` meta column squeezes description to 87px; 16/18 targets < 24px |
| 11 | Developer | `settings-developer.tsx` | P2 | **34/35 targets < 24px** (flag switches) |
| 12 | SSO | `settings-sso.tsx` | P1 | Attribute mapping `grid-cols-[1fr_auto_1fr_auto]` clipped; wizard steps stacked |

### Patterns shared across this category
1. **Page padding `px-8 py-12`** on every screen (except localization `px-6 sm:px-10`, webhooks `px-6`).
2. **Row = text block + button, `flex items-center justify-between`** — the button never shrinks/wraps (coss `Button` base class includes `shrink-0 whitespace-nowrap`), so long labels ("Sign out of all other sessions", "Compare plans · Cancel plan", "View docs · Add endpoint") overflow. Fix per-row: `flex-col items-start sm:flex-row sm:items-center`, or allow `whitespace-normal` on mobile.
3. **Fixed meta columns inside rows** (`w-44`, `w-[68px]`, `w-16`) — reflow meta under the title on mobile.
4. **Switches / checkboxes as sole targets** (~18–20px). Make whole row a `<label>`; ≥ 44px rows on touch.
5. **Sticky side preview panels** (`lg:sticky lg:top-12`, appearance/branding/localization) correctly stack below `lg` — but then the live preview ends up far below the controls. On mobile, consider a collapsible "Preview" disclosure near the top.
6. **Mono uppercase micro labels** — Webhooks 123/162 text nodes < 12px is the worst in the catalogue.

---

## 1. Profile
- **Route:** `/c/settings/profile` · **File:** `apps/www/src/pages/showcase/settings-profile.tsx`
- **Measured:** clean; 1/14 targets < 24px. Screenshot @375: good; save bar overlaps last field ("Bio") — relies on `pb-32`.
- **P2 — Fixed save bar** `fixed inset-x-0 bottom-0 … px-8 py-3` (L156–157): no `pb-[env(safe-area-inset-bottom)]`; on iOS the home indicator overlaps buttons.
- **P2 — `px-8`** (L21).
- **P2 — Native select with absolute icons** (L216–245): left icon `left-3` + chevron — OK; `h-9` 36px.
- **P3 — `SecurityRow`** (L248–290) `min-w-0 flex-1` + action — fine.

## 2. Appearance
- **Route:** `/c/settings/appearance` · **File:** `apps/www/src/pages/showcase/settings-appearance.tsx` (648 lines)
- **Measured:** clean; 21/54 text nodes < 12px; **hydration text mismatch** (`getOsScheme()` reads `window.matchMedia` during render, L76–80).
- **P2 — Hydration mismatch** — compute OS scheme in effect / `useSyncExternalStore` with server snapshot.
- **P2 — Mode cards `grid-cols-3`** (L108) at 375 ≈ 100px each with mini chrome previews (`MiniChrome w-[26px]` rail, L615) — readable but cramped; label row `justify-between` (L577).
- **P2 — Palette `grid-cols-3 sm:grid-cols-6`** (L141) good.
- **P2 — Density segmented `grid-cols-3 gap-1`** (L183) fine.
- **P2 — Preview pane** (L268–455) `grid-cols-[80px_1fr]` mock app with `text-[10px]` — on mobile pushed below all controls; add collapsible preview near top.
- **P3 — Preview `RailItem` marker `-left-2`** (L471).

## 3. Billing
- **Route:** `/c/settings/billing` · **File:** `apps/www/src/pages/showcase/settings-billing.tsx`
- **Measured:** plan section clipped (clientW 309 / scrollW 415) — `overflow-hidden` hides overflowing footer buttons. Screenshot @375: "Cancel plan" cut at card edge.
- **P1 — Plan footer** `flex items-center justify-between gap-3 p-4` (L57) with 2–3 buttons — no wrap, clipped by section `overflow-hidden` (L32).
- **P1 — Plan header** `flex justify-between gap-6 p-6` (L33): plan meta vs `$240` price block — OK at 375 but tight; stack at < 360.
- **P2 — Invoice rows** `flex gap-4 px-5` (L119–160): number + date + amount + status + external-link `p-1.5` icon — date `flex-1` squeezes; icon button ~26px.
- **P2 — Credit tiles `grid-cols-1 sm:grid-cols-3`** (L101) good.
- **P3 — `CreditCard` visual** (L163–184) fine.

## 4. Integrations
- **Route:** `/c/settings/integrations` · **File:** `apps/www/src/pages/showcase/settings-integrations.tsx`
- **Measured:** clean; 21/59 text nodes < 12px. Good reference: search + chips `flex-col sm:flex-row` (L122), grid `sm:grid-cols-2 lg:grid-cols-3` (L150).
- **P2 — Category chips** (L132–148) `text-[10px]` uppercase ~24px tall.
- **P3 — Card header `flex justify-between`** (L171) fine.

## 5. Security
- **Route:** `/c/settings/security` · **File:** `apps/www/src/pages/showcase/settings-security.tsx`
- **Measured:** **mobile page overflow 87px** — "Sign out of all other sessions" button spans x=133–462.
- **P1 — Sessions footer** `flex items-center justify-between gap-3 p-4` (L298–311) with long-label nowrap button. Stack on mobile, full-width destructive button.
- **P2 — 2FA hero** (L148–175): "Manage" button squeezes description into a narrow column (screenshot).
- **P2 — Sessions rows** hide meta via `hidden sm:flex` (L272) — good — but fixed `w-[68px]` action cells (L281, L287).
- **P2 — Passkey header** `justify-between` + "Add passkey" (L224–235) crowds title.
- **P2 — Recovery codes `grid-cols-2`** (L348) fine; warning banner `sm:flex-row` (L376) good.

## 6. Permissions
- **Route:** `/c/settings/permissions` · **File:** `apps/www/src/pages/showcase/settings-permissions.tsx`
- **Measured:** matrix scrolls horizontally on mobile (as intended); 28/60 text nodes < 12px.
- **P1 — Sticky capability column `min-w-[240px]`** (L300, L406) + role columns `w-[88px]` (L310): at 375 only ~1 role is visible beside the sticky column. Mobile: role picker (`Select`/tabs) + single-column capability list with state chips; or shrink sticky column to `min-w-[140px]`.
- **P2 — Roles sidebar `lg:grid-cols-[240px_minmax(0,1fr)]`** (L213) stacks above matrix — 5 role cards before the matrix; use horizontal scroll chips on mobile.
- **P2 — Sticky `thead`** (L296) inside `overflow-x-auto` (L294): sticky top doesn't work relative to page scroll in an overflow container — verify.
- **P2 — `PermCell`** buttons (L435) small targets.

## 7. Branding
- **Route:** `/c/settings/branding` · **File:** `apps/www/src/pages/showcase/settings-branding.tsx` (625 lines)
- **Measured:** clean; 33/65 text nodes < 12px; 3/17 targets < 24px.
- **P2 — Colour swatch popover `PopoverContent w-60`** with `grid-cols-6` presets (L144–169): swatch buttons small; consider Drawer on mobile.
- **P2 — Email preview** `grid-cols-[80px_1fr] font-mono text-[11px]` (L310) — fine; DNS records rows `sm:grid-cols-[160px_1fr]` (L337) good.
- **P2 — Logo zones `h-32`** (L426) "Drop or click to replace" — drag copy on touch.
- **P3 — `PalettePreview`** below controls on mobile.

## 8. Localization
- **Route:** `/c/settings/localization` · **File:** `apps/www/src/pages/showcase/settings-localization.tsx` (782 lines)
- **Measured:** clean; **17/26 targets < 24px** (radio cards inputs, week-start segmented buttons). Uses `px-6 sm:px-10` — one of few with responsive padding.
- **P2 — Date/number format radio cards** `grid-cols-1 sm:grid-cols-2/3` (L267, L387) — inputs are 16px radios; make whole card the hit area (likely already a label — verify).
- **P2 — First-day `grid-cols-2`** (L301) / segmented control small.
- **P2 — Timezone autocomplete popup** (L606–698) — mobile keyboard + popup height; ensure `max-h` uses `visualViewport`.
- **P2 — Preview week `grid-cols-7 gap-1.5`** (L473) fine.
- **P3 — `new Date()` in render** (formatDate/buildWeek) → potential SSR/CSR mismatch across timezones.

## 9. Webhooks
- **Route:** `/c/settings/webhooks` · **File:** `apps/www/src/pages/showcase/settings-webhooks.tsx` (697 lines)
- **Measured:** **mobile page overflow 83px** (header actions "View docs · Add endpoint" at x=168–458); deliveries panel clipped (325/434); **123/162 text nodes < 12px**; 7/23 targets < 24px.
- **P0 — Delivery rows** `grid w-full grid-cols-[64px_160px_1fr_56px_64px_24px] gap-3 px-4` (L510): 368px fixed + 60px gaps + 32px padding → the `1fr` (event/endpoint) column is **negative** at 375 and content is clipped by `overflow-hidden` (L466). Mobile: 2-line rows (status + event / endpoint + latency + time).
- **P1 — Header** `flex items-end justify-between gap-4` (L237) + 2 buttons — overflow.
- **P1 — Signing-secret bar** `flex flex-wrap justify-between` (L265) — wraps but secret field crushed ("whsec_…") next to description.
- **P2 — Endpoints table**: URL cell `max-w-[280px]` (L362) + event chips + status; inside `overflow-hidden` card (L335) — check scroll.
- **P2 — Expanded delivery `md:grid-cols-2`** payload blocks (L572) good; `pre max-h-56 overflow-auto` (L668) good.
- **P2 — Tooltip-only explanations** (L325 `TooltipPopup`) not reachable on touch.

## 10. Privacy
- **Route:** `/c/settings/privacy` · **File:** `apps/www/src/pages/showcase/settings-privacy.tsx`
- **Measured:** danger section clipped (309/354); description squeezed to **87px**; **16/18 targets < 24px** (export checkboxes, retention slider).
- **P1 — Export include rows** (L136–160): checkbox + label + meta + `w-16` size column → label squeezed (screenshot: "Files & uploads", "Activity log" wrap per word).
- **P1 — `DeleteRow` `w-44 text-right`** (L497) fixed meta column → description 87px.
- **P2 — Retention sliders** (L251–290) ticks `justify-between text-[10px]` labels may collide at 375.
- **P2 — Destructive footers** `flex justify-between p-4` (L380, L457) — button + text; stack.
- **P2 — `overflow-hidden` on danger section** (L304) hides overflow.

## 11. Developer
- **Route:** `/c/settings/developer` · **File:** `apps/www/src/pages/showcase/settings-developer.tsx`
- **Measured:** clean overflow; **34/35 targets < 24px** (feature-flag switches, copy buttons); 27/67 text nodes < 12px. Header uses `flex-wrap` (L201) — good.
- **P2 — Flag rows** (L240–290): name + badges `flex-wrap` (good) + description + switch; switch only target.
- **P2 — Terminal log `pre max-h-72 overflow-y-auto` + `whitespace-pre` lines** (L316–318): horizontal overflow becomes inner scroll; OK, but `text-[11px]`.
- **P2 — API usage tiles `sm:grid-cols-3`** (L350) good.

## 12. SSO
- **Route:** `/c/settings/sso` · **File:** `apps/www/src/pages/showcase/settings-sso.tsx` (620 lines)
- **Measured:** attribute mapping table clipped (259/274); 5/19 targets < 24px.
- **P1 — Wizard `md:grid-cols-[220px_1fr]`** (L171): below `md` the step list (5 steps) renders above the step content — users scroll past the stepper every time. Mobile: compact "Step 2 of 5" header + prev/next, steps in a disclosure.
- **P1 — Attribute mapping** `grid-cols-[1fr_auto_1fr_auto] gap-3 px-4` (L398, L408) with `w-16` "Required" column — clipped inside `overflow-hidden` (L397). Stack IdP attr → Orbit field per row on mobile.
- **P2 — `CopyRow`** (L360–378) value + `size-6` copy button — 24px target; values (ACS URL, Entity ID) need `break-all`.
- **P2 — Provider cards `sm:grid-cols-2 lg:grid-cols-4`** (L143) good.
- **P2 — Test result `pre overflow-x-auto`** (L510) fine.
- **P3 — Footer `justify-between px-5`** (L262) back/next — fine.
