# Layouts — Responsive Audit

Category: `layouts` · 12 screens · Route: `/c/layouts/<slug>`
Source map: `apps/www/src/pages/showcase/source-files.ts` → `layouts`

> Severity: **P0** content unreachable / screen unusable · **P1** major degradation (crushed, overlapping, clipped) · **P2** usability / a11y gap · **P3** polish.
> "Measured" = Playwright run at 375×812 (mobile), 768×1024 (tablet), 1024×768 (laptop), 1440×900 (desktop). See `docs/README.md` for metric definitions.

## Category summary

| # | Screen | File | Worst | Primary failure on mobile |
|---|--------|------|-------|---------------------------|
| 1 | Workspace rail | `sidebars-workspace-rail.tsx` | P0 | Fixed 260px rail + `1fr` main → main pane ~115px |
| 2 | Mini icon rail | `sidebars-mini-rail.tsx` | P2 | Works by accident; labels only via `title` hover |
| 3 | Docs tree | `sidebars-docs-tree.tsx` | P0 | 280px tree leaves ~95px for content |
| 4 | Inbox rail | `sidebars-inbox-rail.tsx` | P0 | 340px list leaves ~35px for conversation |
| 5 | App shell | `layouts-app-shell.tsx` | P0 | `grid-cols-[256px_1fr]` → `<main>` measured **48px** wide, blank |
| 6 | Two-pane | `layouts-two-pane.tsx` | P0 | 360px list → reading pane **15px** wide |
| 7 | Three-pane | `layouts-three-pane.tsx` | P0 | 64+240px rails; channel pane gone on mobile, 127px page overflow on tablet |
| 8 | Split resizable | `layouts-split-resizable.tsx` | P1 | 50/50 split at 375px, mouse-only resizer |
| 9 | Focus mode | `layouts-focus-mode.tsx` | P1 | Unfocused state overlays fixed 240px + 280px panels over article |
| 10 | Floating toolbar | `layouts-floating-toolbar.tsx` | P1 | Toolbar positioning wrong after scroll, no edge clamping, mouse-centric |
| 11 | Canvas tools | `layouts-canvas-tools.tsx` | P1 | Floating chrome overlaps; inspector covers half the canvas; mouse-only |
| 12 | Bottom nav | `layouts-bottom-nav.tsx` | P1 | 380px phone mockup on a 375px phone → clipped both sides |

### Patterns shared across this category

1. **Hard-coded grid tracks with no breakpoint** — `grid-cols-[260px_1fr]`, `[280px_1fr]`, `[340px_1fr]`, `[360px_1fr]`, `[64px_240px_1fr]`. None have a `md:`/`lg:` prefix, so the desktop layout is forced at every width. This is the single biggest failure in the catalogue.
2. **No mobile navigation pattern.** The UI package ships `@orbit/ui/sidebar` (auto-switches to a `Sheet` below `md` via `useMediaQuery("max-md")`), `@orbit/ui/sheet`, `@orbit/ui/drawer` — **none of the layout screens use them**. Every rail should collapse into an off-canvas drawer with a hamburger trigger in a top bar.
3. **List/detail screens don't do master→detail navigation.** On small screens, list and detail should be two stacked views (list → tap → detail with back button), not side-by-side.
4. **`h-svh` on `<aside>` inside a `min-h-svh` grid** — rails are locked to viewport height while the page can grow; works on desktop, but combined with mobile URL-bar resizing causes double scroll regions.
5. **Hover-only affordances** — `title=` tooltips, `group-hover:opacity-100` grips, mouse-only `onMouseDown`/`mousemove` drag. Nothing is reachable by touch; little by keyboard.
6. **Tiny type** — `text-[9px]` / `text-[10px]` mono labels are pervasive (e.g. 21 of 38 text nodes on Inbox rail are < 12px). Fine as desktop decoration, too small on phones (aim ≥ 11–12px on mobile).
7. **Tap targets** — nav rows are `py-1.5` (~32px tall). Measured: almost all interactive elements are < 44px on mobile (e.g. 29/29 on Three-pane, 33/33 on Canvas tools). Mobile rows should be ≥ 44px (`py-2.5` + `min-h-11`).

### Recommended target pattern (category-wide)

| Width | Behaviour |
|-------|-----------|
| `< md` (≤ 767px) | Single column. Top app bar (logo / title, hamburger, primary action). Rail → `Sidebar` in `Sheet` (off-canvas). List/detail → stacked views with back button. |
| `md` – `lg` (768–1023px) | Collapsible rail: icon-only (≈ 56–64px) with tooltips + expandable overlay; list/detail side by side only if list ≤ 320px and detail ≥ 400px. |
| `≥ lg` (1024px+) | Current desktop layouts. |

---

## 1. Workspace rail

- **Route:** `/c/layouts/workspace-rail`
- **File:** `apps/www/src/pages/showcase/sidebars-workspace-rail.tsx`
- **Intent:** Workspace switcher, sections, projects, user row.
- **Measured:** mobile **page overflow 32px** — `<main>` (`px-10`, min-content) is pushed to x=260–407. Mobile: 15/16 targets < 44px; 10/29 text nodes < 12px. Screenshot @375: rail takes ~70% of the screen, main pane text wraps one word per line ("Sidebar / showcase / — / content / omitted").

**Flaws**
- **P0 — Fixed two-column grid at all widths.** `L39 grid min-h-svh grid-cols-[260px_1fr]`. At 375px main gets ~115px. No breakpoint.
- **P0 — No off-canvas / drawer mode.** Rail is always docked. Needs `Sidebar` + `SidebarTrigger` (UI package) or `Sheet` with a top bar trigger below `md`.
- **P1 — `aside` is `h-svh` (L40)** while grid is `min-h-svh`: on mobile browsers with dynamic toolbars the rail and page scroll independently.
- **P2 — Nav rows ~32px tall** (`px-2 py-1.5 text-sm`, L75/L101/L129). Raise to ≥ 44px on touch (`min-h-11` / `max-md:py-2.5`).
- **P2 — "Quick find…" is a non-interactive `<span>` pretending to be a search input** (L58–66); `⌘K` hint shown on touch devices where there's no keyboard. Should be a button that opens a command/search sheet; hide `kbd` on `pointer: coarse`.
- **P2 — Micro type:** `text-[9px]` badge (L86), `text-[9px]` section labels (L180), `text-[10px]` plan line (L49).
- **P3 — Workspace switcher button has no `aria-haspopup`/`aria-expanded`; active item lacks `aria-current="page"`.**

**Target behaviour**
- Mobile: top bar (workspace avatar + name, hamburger, avatar). Rail content in a left `Sheet` (≈ 85vw, max 320px). Close on navigation.
- Tablet: collapsed 64px icon rail (reuse the Mini rail screen) with expandable overlay.
- Desktop: as today.

**Acceptance**
- [ ] At 375px the main pane is full-width and readable; rail reachable via a trigger.
- [ ] Rail rows ≥ 44px tall on touch.
- [ ] No double scroll regions on iOS Safari.

---

## 2. Mini icon rail

- **Route:** `/c/layouts/mini-rail`
- **File:** `apps/www/src/pages/showcase/sidebars-mini-rail.tsx`
- **Intent:** Collapsed 60px rail with workspace dots and active marker.
- **Measured:** no overflow; 11/11 targets < 44px (`size-9` = 36px). Screenshot @375: usable — a 60px rail is tolerable — but it still steals 16% of the width permanently.

**Flaws**
- **P1 — No mobile alternative.** On phones a persistent vertical rail is the wrong pattern; nav belongs in a bottom tab bar (≤ 5 primary items) or drawer. `L29 grid-cols-[60px_1fr]` has no breakpoint.
- **P2 — Labels only exist as `title=` (L37, L64).** `title` never shows on touch and isn't announced reliably; icon buttons need `aria-label` and a real `Tooltip` (UI package has `@orbit/ui/tooltip`). The showcase copy even says "hover for tooltips".
- **P2 — Workspace buttons all have `title="Workspace"`** — no distinguishing accessible name.
- **P2 — Targets 36×36px** (`size-9`). Bump to 44px on coarse pointers.
- **P2 — Badge `text-[8px]`** (L77) unreadable.
- **P3 — Active marker `-left-3`** relies on the rail's padding; it will be clipped if rail gets `overflow-hidden`.

**Target behaviour**
- Mobile: hide rail; render primary items as bottom nav (see screen 12) or in a drawer; workspaces in a sheet.
- Tablet/desktop: as today, with real tooltips.

**Acceptance**
- [ ] Every icon button has an accessible name and a tooltip that also opens on focus.
- [ ] At < 768px the rail is replaced by bottom nav or drawer.

---

## 3. Docs tree

- **Route:** `/c/layouts/docs-tree`
- **File:** `apps/www/src/pages/showcase/sidebars-docs-tree.tsx`
- **Intent:** Nested folder/file tree with expand/collapse and search.
- **Measured:** no overflow; 15/15 targets < 44px. Screenshot @375: tree fills ~75% width; main pane shows "Selected · events-projector" wrapped over 3 lines in ~95px.

**Flaws**
- **P0 — Fixed `grid-cols-[280px_1fr]` (L81), no breakpoint.**
- **P1 — Indentation is inline `style={{ paddingLeft: depth*14+12 }}` (L164).** Deep trees eat horizontal space on narrow screens; cap depth indentation on mobile or use a guide-line pattern.
- **P1 — Selecting a doc on mobile should close the drawer and show the content** — no such flow.
- **P2 — Tree semantics missing:** should be `role="tree"`/`treeitem` with `aria-expanded`, `aria-level`, arrow-key navigation; folders are plain buttons.
- **P2 — Rows `py-1` (~28px)** — too small for touch.
- **P2 — Search is a fake span with `/` kbd hint** (L90–98).

**Target behaviour**
- Mobile: content first; "Contents" button in top bar opens tree in a left `Sheet`; selecting a leaf closes it. Optional breadcrumb above content.
- Tablet: tree as collapsible overlay; desktop: docked.

**Acceptance**
- [ ] Content is full-width on phones; tree accessible from a trigger.
- [ ] Rows ≥ 40–44px on touch; tree ARIA roles present.

---

## 4. Inbox rail

- **Route:** `/c/layouts/inbox-rail`
- **File:** `apps/www/src/pages/showcase/sidebars-inbox-rail.tsx`
- **Intent:** Thread list rail with unread markers, tabs, archive.
- **Measured:** mobile **page overflow 73px** (`<main>` at x=340–448); **5/5 targets < 24px** (filter icon `p-1`, tab buttons, archive link); 21/38 text nodes < 12px. Screenshot @375: list fills ~90% width; conversation pane is a ~35px sliver with clipped "CONV…" text.

**Flaws**
- **P0 — Fixed `grid-cols-[340px_1fr]` (L81).** 340px is 91% of a 375px phone.
- **P0 — No list → detail navigation.** On mobile the list should be the whole screen and tapping a thread should push the conversation view.
- **P1 — Thread rows are `<li className="cursor-pointer">` (L116) with no button/link inside** — not keyboard-focusable, no role; on touch there's no active state.
- **P2 — Targets < 24px** (fails WCAG 2.2 AA 2.5.8): filter `p-1` (L94), tabs `px-2 py-1` with `text-[10px]` (L189), "Archive read" (L157).
- **P2 — Tabs are buttons without `role="tablist"/"tab"`/`aria-selected`.**
- **P2 — Unread dot at `left-1.5`** (L125) sits in 6px gutter — fine; but unread state is colour-only (no SR text).
- **P3 — Search is a fake span.**

**Target behaviour**
- Mobile: full-width list; tap → conversation screen with back arrow; tabs become a segmented control with ≥ 36px height.
- Tablet: list 300px + conversation (min 420px) or stacked if narrower.

**Acceptance**
- [ ] At 375px list is full-width, conversation reachable and full-width.
- [ ] All targets ≥ 24px (ideally 44px); threads are focusable links/buttons.

---

## 5. App shell

- **Route:** `/c/layouts/app-shell`
- **File:** `apps/www/src/pages/showcase/layouts-app-shell.tsx`
- **Intent:** Top bar + sidebar + main content (stats, activity).
- **Measured:** mobile — the content wrapper `grid grid-cols-[256px_1fr] overflow-hidden` is clipped (clientW 227 vs scrollW 304); **`<main>` measured 48px wide** with its own horizontal scroller (scrollW 165); stat cards & activity list "squeezed" (< 90px wide). Screenshot @375: main area is completely blank; sidebar row badges clipped at the right edge.

**Flaws**
- **P0 — `L90 grid grid-cols-[256px_1fr] overflow-hidden`** plus `aside w-64` (L91): sidebar never collapses, main collapses to ~0. `overflow-hidden` hides the evidence (no page scroll, content just vanishes).
- **P0 — No hamburger / sidebar trigger in the header** (L58–88).
- **P1 — Header doesn't adapt:** workspace switcher + `max-w-md` search + bell + avatar in one `flex` row (L58–88). At 375 "Acme Inc." wraps to two lines and search placeholder truncates. Mobile: collapse search to an icon button opening a search sheet.
- **P1 — `header` has `col-span-2`** (L58) in a grid that only defines rows (`grid-rows-[56px_1fr]`, L57) — vestigial; harmless but misleading.
- **P2 — `main` padding fixed `p-6`** (L186); use `p-4 md:p-6`.
- **P2 — Activity rows `truncate` the whole sentence** (L230) — on mobile the action text disappears entirely; allow 2-line clamp.
- **P2 — Timestamp `text-[10px] tracking-[0.2em]` uppercase** (L234) eats ~25% of a row at 375px.
- **P3 — Stats `grid-cols-1 sm:grid-cols-3`** (L199) is fine — it's the only responsive class in the file, but it never gets room to apply.

**Target behaviour**
- Mobile: header = hamburger, workspace name, search icon, avatar. Sidebar → `Sheet`. Main full-width, `p-4`.
- Tablet: icon rail (64px) + main; header search visible.
- Desktop: as today.
- Strongly recommended: rebuild with `@orbit/ui/sidebar` (`SidebarProvider`, `Sidebar`, `SidebarInset`, `SidebarTrigger`) which already implements this.

**Acceptance**
- [ ] `<main>` ≥ 343px wide at 375px; no clipped sidebar badges.
- [ ] Sidebar opens via trigger and traps focus; closes on route change / Esc.

---

## 6. Two-pane

- **Route:** `/c/layouts/two-pane`
- **File:** `apps/www/src/pages/showcase/layouts-two-pane.tsx`
- **Intent:** Inbox list + reading pane.
- **Measured:** mobile `<main>` (reading pane) measured **15px wide**; 3 squeezed blocks. Screenshot @375: list looks fine, but the selected message is invisible.

**Flaws**
- **P0 — `L146 grid-cols-[360px_1fr]`** with no breakpoint; reading pane collapses to 15px.
- **P0 — Selecting a message (`setSelectedId`) has no visible effect on mobile** — needs master/detail routing (state: `view = "list" | "detail"` below `md`) with a back button in the detail header.
- **P1 — Both panes `h-svh` with internal scroll** (L147, L231): on phones this creates nested scroll containers and hides the browser chrome collapse behaviour. Prefer document scroll on mobile.
- **P1 — Reading-pane toolbar (L244–275) is a row of icon buttons** + header; no overflow handling — at tablet width it needs an overflow `Menu`.
- **P2 — Composer is a fake "Reply…" div** (L311–316); on mobile, reply should be a sticky bottom composer.
- **P2 — List tabs (L155–172) `text-xs px-2 py-1`** — ~24px targets.
- **P3 — Body copy `max-w-3xl`** good; `px-6` could be `px-4` on mobile.

**Target behaviour**
- Mobile: list view → detail view (push), sticky reply bar.
- Tablet (768): list 300px + detail, or list overlay.
- Desktop: as today.

**Acceptance**
- [ ] At 375px tapping a message shows full-width detail with back navigation.
- [ ] Single scroll container per view on mobile.

---

## 7. Three-pane

- **Route:** `/c/layouts/three-pane`
- **File:** `apps/www/src/pages/showcase/layouts-three-pane.tsx`
- **Intent:** Slack-style workspace rail + channel list + message pane.
- **Measured:** mobile — **page overflow 288px**: `<main>` starts at x=304 and ends at x=663 (29 offending elements). **Tablet — 127px horizontal page overflow**; `<main>` and its header extend to x=895 on a 768px viewport (message text and header icons cut off). 29/29 targets < 44px; 28/75 text nodes < 12px.

**Flaws**
- **P0 — `L155 grid-cols-[64px_240px_1fr]`** with no breakpoint. 304px of chrome before content.
- **P0 — Tablet page overflow (127px)**: the `1fr` track can't shrink below the min-content of messages/header (no `min-w-0` on `<main>`, L307). Add `minmax(0,1fr)` / `min-w-0`.
- **P1 — Header (L308–334)** has 4 icon buttons + member pill in a non-wrapping row; description already `hidden md:inline` (only responsive class in the file) but the rest doesn't adapt.
- **P1 — Composer (L368–404) uses a `textarea` `min-h-[56px]` inside the pane**; on mobile it should be a sticky bottom bar respecting `env(safe-area-inset-bottom)`.
- **P1 — Thread reply chip `ml-12`** (L353) — fixed indent wastes space at 375px.
- **P2 — Workspace buttons only `title` (L164); `text-[9px]` badges (L261, L277).**
- **P2 — Channel/DM lists rows `py-1` (~28px).**

**Target behaviour**
- Mobile: two-level navigation — (1) workspace+channel list screen (rail as horizontal avatar strip or inside drawer), (2) channel screen with back button and sticky composer.
- Tablet: hide workspace rail into drawer; channel list 220px + messages.
- Desktop: three panes.

**Acceptance**
- [ ] No horizontal page overflow at 768px (`pageOverflowX = 0`).
- [ ] At 375px the message pane is reachable and full-width with sticky composer.

---

## 8. Split resizable

- **Route:** `/c/layouts/split-resizable`
- **File:** `apps/www/src/pages/showcase/layouts-split-resizable.tsx`
- **Intent:** Code editor + live preview with draggable divider.
- **Measured:** mobile — root `h-svh overflow-hidden` clips content (scrollW 525 vs 375: header doesn't fit); left pane (187px) clips editor (scrollW 218). Tablet has an inner horizontal scroller. Screenshot @375: code lines cut mid-token, preview card squeezed.

**Flaws**
- **P1 — Percentage split (`style={{ width: leftPct% }}`, L110) at every width.** At 375px each pane ≈ 187px. Mobile should switch to **tabs** ("Code" / "Preview") or vertical stacking (top/bottom split).
- **P1 — Resizer is mouse-only** (`onMouseDown`, `mousemove`/`mouseup`, L53–58, L121). No `pointer`/`touch` events → cannot resize on touch; no keyboard support despite `role="separator"` + `aria-valuenow` (needs `tabIndex=0`, ←/→ handling, `aria-controls`).
- **P1 — Header overflows**: breadcrumb + 3 actions + badge in a single row (L69–100) → root reports 525px content in 375px.
- **P2 — 6px (`w-1.5`) hit area for the separator** (L126); grip only visible on hover (`group-hover:opacity-100`, L130). Touch needs ≥ 24px hit area.
- **P2 — Clamp 15–85% is width-agnostic** — on tablet 15% = 115px, useless. Clamp in px (e.g. min 280px per pane) or collapse.
- **P3 — Status bar `text-[10px] tracking-[0.18em]`** (L218–221).

**Target behaviour**
- `< md`: Tabs (Code / Preview / Console) full-width; no resizer.
- `md–lg`: vertical stack or horizontal split with px clamps.
- `≥ lg`: as today, pointer events + keyboard resizer.

**Acceptance**
- [ ] Resizer works with touch (Pointer Events) and keyboard.
- [ ] At 375px code and preview each get the full width (tabbed).

---

## 9. Focus mode

- **Route:** `/c/layouts/focus-mode`
- **File:** `apps/www/src/pages/showcase/layouts-focus-mode.tsx`
- **Intent:** Distraction-free reading/writing with chrome that slides away.
- **Measured:** 50 "offender" elements at mobile — the hidden TOC aside sits at x=396–635 (off-screen, `opacity-0`, `pointer-events-none`) but is still in the DOM/a11y tree. Screenshot @375 (focused state): reads well. Tablet: fine while focused.

**Flaws**
- **P1 — Unfocused state assumes ≥ 1100px**: left nav `fixed w-60` (L111) and right TOC `fixed w-[280px]` (L157) slide in **on top of** the centred `max-w-2xl` article (L182) — the article isn't offset. At 768–1279px the panels cover text; at 375 they cover the entire screen with no close affordance except the floating button.
- **P1 — Hidden panels remain focusable** (only `opacity-0 pointer-events-none`); keyboard users tab into invisible links. Use `inert` / `hidden` / `aria-hidden` when collapsed.
- **P2 — Exit is Esc-only + a 40px floating button** (L306) bottom-right that collides with the viewer's shortcut-hints bar (also `fixed bottom-4 right-4`). Add `env(safe-area-inset-*)` offsets.
- **P2 — Title `text-4xl`** (L189) — fine, but body switches `text-lg` in focus (L193 etc.); on mobile `text-base`/`text-[17px]` reads better.
- **P2 — `⌘K`/`ESC` kbd hints shown on touch** (L78, L94).
- **P3 — Reading progress bar is static (`useState(34)`)** — not wired to scroll.

**Target behaviour**
- Mobile: nav → left drawer, TOC → bottom sheet or "On this page" disclosure at top; focus toggle in top bar.
- Tablet: one side panel at a time (TOC), as overlay with scrim.
- Desktop ≥ 1280: both panels docked, article offset (`lg:pl-60 xl:pr-[280px]`).

**Acceptance**
- [ ] Panels never cover article text without a scrim + close button.
- [ ] Collapsed panels are `inert`.

---

## 10. Floating toolbar

- **Route:** `/c/layouts/floating-toolbar`
- **File:** `apps/www/src/pages/showcase/layouts-floating-toolbar.tsx`
- **Intent:** Selection-anchored bubble menu over a document.
- **Measured:** no overflow (toolbar only renders after selection). Screenshot @375: article reads well (`max-w-3xl px-6`).

**Flaws**
- **P1 — Wrong coordinate space:** toolbar is `position: fixed` (L227) but positioned with `rect.top + window.scrollY` (L47, L95) — document coordinates. After any scroll the toolbar lands `scrollY` px too low (often off-screen).
- **P1 — No viewport clamping / flipping:** `-translate-x-1/2` centred on the selection; selections near the left/right edge on a phone push the ~300px toolbar off-screen. Needs collision handling (Base UI `Popover`/`Positioner` or floating-ui `shift`/`flip`).
- **P1 — Conflicts with native mobile selection UI:** iOS/Android show their own callout above the selection — the toolbar should sit **below** the selection on touch, or dock to the bottom above the keyboard.
- **P2 — Mouse-centric listeners** (`mouseup`, `mousedown`, L69–70). `selectionchange` exists (L71) but is added as an anonymous listener that is never removed (leak on unmount).
- **P2 — 28px buttons (`size-7`, L278)** — small for touch.
- **P3 — "Show toolbar" manual button positions relative to header + 120px** (L95) — arbitrary.

**Target behaviour**
- Desktop: anchored above selection with flip/shift.
- Touch: anchored below selection or docked bottom bar (above virtual keyboard, `visualViewport`-aware).

**Acceptance**
- [ ] Toolbar stays attached to selection after scrolling.
- [ ] Never renders outside the viewport at 375px.

---

## 11. Canvas tools

- **Route:** `/c/layouts/canvas-tools`
- **File:** `apps/www/src/pages/showcase/layouts-canvas-tools.tsx` (1,044 lines)
- **Intent:** Figma-style canvas with tool palette, collaborators, zoom, inspector, layers.
- **Measured:** root `h-svh overflow-hidden` clips 862px of content at both 375 and 768. **17/33 targets < 24px** (layer eye/lock toggles `size-4`, swatches), 22/23 text nodes < 12px. Screenshot @375: collaborator bar overlaps zoom controls; inspector (`w-72`) covers the lower half of the canvas and hides the status pill ("1 SELEC…").

**Flaws**
- **P1 — All chrome is absolutely positioned for desktop:** palette `top-3 left-3` (L650), collab bar `top-3 left-1/2` (L688), zoom `top-3 right-3` (L725), status `bottom-3 left-3` (L781), inspector `right-3 bottom-3 w-72` (L809). Below ~700px they collide.
- **P1 — Mouse-only interaction model:** `onMouseDown` on canvas (L447), `mousemove`/`mouseup` (L289–290), wheel zoom (L369), Space-to-pan keyboard. No Pointer Events, no pinch-zoom, no two-finger pan, no `touch-action: none` → page scroll fights the canvas on touch.
- **P1 — Inspector always open**: should be a collapsible bottom sheet on mobile (peek height ~25%), side panel on tablet+.
- **P2 — Tool tooltips `side="right"`** (L668) — fine on desktop; on touch tooltips never appear and the palette has no labels.
- **P2 — Tiny targets:** layer visibility/lock `size-4` (L951, L968), swatches, number fields `text-[11px]`.
- **P2 — Shortcut badges in tooltips irrelevant on touch.**

**Target behaviour**
- Mobile: bottom toolbar (tools horizontal, scrollable), top bar with zoom % + share + overflow menu, inspector/layers in a bottom `Drawer`. Pointer events + pinch.
- Tablet: palette left, inspector as collapsible right panel.
- Desktop: as today.

**Acceptance**
- [ ] No overlapping floating chrome at 375/768.
- [ ] Canvas pans/zooms with touch gestures; shapes draggable with pointer events.

---

## 12. Bottom nav

- **Route:** `/c/layouts/bottom-nav`
- **File:** `apps/www/src/pages/showcase/layouts-bottom-nav.tsx`
- **Intent:** Mobile tab-bar navigation (rendered inside a phone mockup).
- **Measured:** mobile — the phone frame `w-[380px] h-[760px]` is wider than the 375px viewport: overflows −2…378 px (page overflow 3px); because the parent is `flex items-center justify-center`, the **left edge is cut off and unreachable** (no scroll to negative offsets). 27/39 text nodes < 12px.

**Flaws**
- **P1 — The screen that *is* the mobile pattern is not usable on mobile.** Fixed `PhoneFrame` (L73) `w-[380px] h-[760px] border-8 rounded-[40px]` + page `px-6 py-12` (L38). On real phones it should drop the mockup and render full-bleed: `max-md:` remove frame/notch/status bar, nav `fixed bottom-0` with `pb-[env(safe-area-inset-bottom)]`.
- **P1 — Centred overflow** (`justify-center` with oversize child) clips the left side — classic unreachable-overflow bug.
- **P2 — Fake status bar / notch** (L75, L89–99) duplicated over the real device chrome on phones.
- **P2 — Tabs are `div`/`button` without `role="tablist"`/`aria-current`; labels `text-[10px]`** (L452, L488); badge `text-[9px]` (L483).
- **P2 — Raised "Create" FAB `-translate-y-3`** (L448) overlaps content above the nav; ensure scroll container has bottom padding ≥ nav height.
- **P3 — Nav height `h-[72px]`** — good target size, but no safe-area padding.

**Target behaviour**
- `< md`: full-screen app, real fixed bottom nav with safe-area insets; no mockup.
- `≥ md`: keep the phone mockup as a showcase frame (scale with `max-h-[calc(100svh-6rem)] aspect-[1/2]`).

**Acceptance**
- [ ] At 375px nothing is clipped; nav is fixed to the real viewport bottom.
- [ ] Tabs announce current page.
