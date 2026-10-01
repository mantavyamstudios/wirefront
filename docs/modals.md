# Modals — Responsive Audit

Category: `modals` · 10 screens · Route: `/c/modals/<slug>`

> Severity: **P0** unusable · **P1** major degradation · **P2** usability / a11y gap · **P3** polish. Metrics: see `docs/README.md`.

## Category summary

**None of these modals are real dialogs.** Each screen renders a faded fake page and an overlay `div` (`absolute inset-0 grid place-items-center bg-background/70 backdrop-blur-sm`) containing a styled box. Only one file imports `@orbit/ui/dialog` across the whole showcase folder. Consequences for production:
- no `role="dialog"`, `aria-modal`, labelled title; no focus trap, no initial focus, no Esc, no scroll lock, no return-focus;
- `absolute` inside a `min-h-svh` page instead of `fixed` to the viewport → on mobile, tall dialogs are centred in the *page*, and their top is pushed above the scroll origin (unreachable).

For the responsive pass, every modal should be rebuilt on `@orbit/ui/dialog` (desktop) with a **mobile variant**: bottom sheet (`@orbit/ui/drawer`) or full-screen dialog below `sm`, scrollable body with sticky header/footer, and `max-h-[calc(100dvh-2rem)]`.

| # | Screen | File | Worst | Primary issue |
|---|--------|------|-------|---------------|
| 1 | Confirm delete | `modals-confirm-delete.tsx` | P2 | Fine visually; not a real alertdialog |
| 2 | Share link | `modals-share-link.tsx` | P0 | Dialog renders **512px wide** on 375px → +137px overflow, right half off-screen |
| 3 | Upload files | `modals-upload-files.tsx` | P2 | Edge-to-edge box (no overlay padding); drag-drop copy on touch |
| 4 | Command palette | `modals-command-palette.tsx` | P2 | Keyboard-only hints; `pt-24` ok |
| 5 | Feedback | `modals-feedback.tsx` | P2 | Edge-to-edge; footer crowd |
| 6 | Shortcuts | `modals-shortcuts.tsx` | P2 | Keyboard-shortcut sheet shown on touch; `grid-cols-2` fixed |
| 7 | Upgrade | `modals-upgrade.tsx` | P0 | Taller than viewport, centred → heading pushed above top, unreachable |
| 8 | Export | `modals-export.tsx` | P2 | 7/11 targets < 24px; edge-to-edge |
| 9 | Create workspace | `modals-create-workspace.tsx` | P1 | Tall form centred → top/bottom at viewport edges; edge-to-edge |
| 10 | Two-factor setup | `modals-two-factor.tsx` | P1 | `grid-cols-[180px_1fr]` → content clipped (373→490px) |

### Patterns shared across this category
1. **Fake overlay** (`absolute inset-0` in a relative page, `L29–31` confirm-delete etc.) — must be `fixed inset-0` portal with `Dialog`.
2. **Overlay has no gutter** in 8/10 files (`grid place-items-center` without `px-4`): the `w-full max-w-*` box touches both screen edges on mobile, borders/radius look broken. Only confirm-delete (L31 `px-4`), command-palette (L66 `px-4`) and tours carousel do it right.
3. **No max-height / internal scroll** — body grows with content; on mobile the box exceeds the viewport (Upgrade, Create workspace, Two-factor).
4. **Footer rows** `flex items-center justify-between px-5 py-3` with helper text + 2 buttons — crowd at 375; stack or full-width buttons on mobile.
5. **Background "page" uses `px-10 py-10`** and fixed grids — decorative but adds noise; fine to keep.

---

## 1. Confirm delete
- **Route:** `/c/modals/confirm-delete` · **File:** `apps/www/src/pages/showcase/modals-confirm-delete.tsx`
- **Measured:** clean. Screenshot @375: well proportioned (has `px-4` gutter).
- **P2 — Not an `AlertDialog`** — needs `role="alertdialog"`, focus on the confirm input, Esc to cancel, destructive button disabled until match (verify).
- **P2 — Buttons right-aligned row** — on mobile full-width stacked (destructive last, or per platform convention).

## 2. Share link
- **Route:** `/c/modals/share-link` · **File:** `apps/www/src/pages/showcase/modals-share-link.tsx`
- **Measured:** **mobile page overflow 137px** — dialog box spans x=0…512 (50 offending elements). Screenshot @375: right side (link field, copy button, role selects) cut off.
- **P0 — Box `w-full max-w-lg`** (L31) inside an overlay without padding, and inner content with non-shrinking rows (link field + Copy button, person rows + role selects, L68–125) sets a min-content width > viewport. Needs `min-w-0` on flex children, truncating link field, and role control below name on mobile.
- **P1 — Overlay `grid place-items-center` without gutter** (L30).
- **P2 — People rows** (L105–125): avatar + name/email + role select — select squeezes name.
- **P2 — Footer** "Workspace defaults to viewer access" + Done (L130) fine.

## 3. Upload files
- **Route:** `/c/modals/upload-files` · **File:** `apps/www/src/pages/showcase/modals-upload-files.tsx`
- **Measured:** clean; edge-to-edge box at 375.
- **P2 — Drop zone copy "Drag and drop files here, or browse"** (L52–66) — on touch, show "Tap to choose files" and make the whole zone the button (it's a `<label>` — good).
- **P2 — Per-file remove/cancel `size-6`** (L116) 24px targets.
- **P2 — Overall progress + per-file progress bars lack `role="progressbar"`.**
- **P2 — No gutter** (L39).

## 4. Command palette
- **Route:** `/c/modals/command-palette` · **File:** `apps/www/src/pages/showcase/modals-command-palette.tsx`
- **Measured:** clean; 13/30 text < 12px. Screenshot @375: usable; shortcut glyphs (`↵ go`, `⌘K`) on every row.
- **P2 — Keyboard hints everywhere** (row shortcuts, footer "↑↓ navigate · ↵ select", L125) — hide on coarse pointers.
- **P2 — `pt-24` top offset** (L66): on mobile, when the virtual keyboard opens, list `max-h-[60vh]` (L80) uses layout viewport — use `dvh`/visualViewport so results aren't hidden behind the keyboard. Prefer full-screen palette on mobile.
- **P2 — Not using `@orbit/ui/command`** (exists in UI package) — no combobox/listbox semantics.

## 5. Feedback
- **Route:** `/c/modals/feedback` · **File:** `apps/www/src/pages/showcase/modals-feedback.tsx`
- **Measured:** clean; edge-to-edge.
- **P2 — Type picker `grid-cols-3`** (L71) — labels ("Something's broken") wrap to 2 lines at 375; fine.
- **P2 — Footer** checkbox "Include console logs" + Cancel + Send (L119) — crowded (screenshot: checkbox label wraps to 2 lines); stack on mobile.
- **P2 — No gutter** (L53).

## 6. Shortcuts
- **Route:** `/c/modals/shortcuts` · **File:** `apps/www/src/pages/showcase/modals-shortcuts.tsx`
- **Measured:** clean; edge-to-edge.
- **P2 — Content is keyboard shortcuts** — irrelevant on touch-only devices; the trigger should be hidden on `pointer: coarse`. If shown, `grid-cols-2 gap-x-8` (L78) → `grid-cols-1 sm:grid-cols-2`.
- **P2 — `max-h-[60vh]`** (L78) good, but use `dvh`.
- **P3 — Footer hint `⌘ /`** (L103).

## 7. Upgrade
- **Route:** `/c/modals/upgrade` · **File:** `apps/www/src/pages/showcase/modals-upgrade.tsx`
- **Measured:** no horizontal overflow, but vertically the box is taller than 812px; screenshot @375: the hero heading "Time to grow into a bigger plan" is partly above the top edge, plan cards fill the screen, footer below fold.
- **P0 — Vertical centring of oversize content** (overlay `grid place-items-center`, L38) — top unreachable. Use `items-start overflow-y-auto py-4` or a full-screen sheet on mobile with internal scroll.
- **P1 — Plan cards `grid-cols-1 sm:grid-cols-2`** (L64) stack → very tall; on mobile consider a segmented plan switcher.
- **P2 — "Recommended" badge `absolute -top-2 right-4`** (L76) fine.
- **P2 — `max-w-2xl rounded-2xl`** edge-to-edge (no gutter).

## 8. Export
- **Route:** `/c/modals/export` · **File:** `apps/www/src/pages/showcase/modals-export.tsx`
- **Measured:** 7/11 targets < 24px (radio + checkboxes).
- **P2 — Format radio cards / include checkboxes** — make full row the label, ≥ 44px.
- **P2 — Footer** "Estimated size ~3.4 MB" + Cancel + Export (L136) crowd.
- **P2 — No gutter** (L36).

## 9. Create workspace
- **Route:** `/c/modals/create-workspace` · **File:** `apps/www/src/pages/showcase/modals-create-workspace.tsx`
- **Measured:** no overflow; box nearly full-height at 812px tall — any shorter viewport clips (landscape / keyboard open).
- **P1 — No internal scroll / max-height** — with the virtual keyboard open (typing workspace name), the footer CTA becomes unreachable.
- **P2 — Footer `justify-between`** "Step 1 of 3 Workspace" + Cancel + Create (L149) — 3 items crowd (screenshot: step label wraps to 3 lines).
- **P2 — Visibility radio cards** good size; radios 16px.
- **P2 — No gutter** (L51).

## 10. Two-factor setup
- **Route:** `/c/modals/two-factor` · **File:** `apps/www/src/pages/showcase/modals-two-factor.tsx`
- **Measured:** box clipped (clientW 373, scrollW 490); 13/20 text nodes < 12px. Screenshot @375: secret key & OTP inputs cut off at the right.
- **P1 — `grid grid-cols-[180px_1fr] gap-5`** (L46) — QR column + instructions side by side; must stack below `sm`.
- **P1 — Recovery codes `grid-cols-4`** (L105) mono codes at ~70px each — wrap (“ZQX-PT4-9KH” breaks). `grid-cols-2 sm:grid-cols-4`.
- **P2 — Copy secret `size-6`** (L64).
- **P2 — On mobile, scanning a QR on the same device is impossible** — prioritise "Copy setup key" / "Open authenticator" deep link (`otpauth://`) on mobile.
