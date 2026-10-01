# Auth & Onboarding — Responsive Audit

Category: `auth` · 14 screens · Route: `/c/auth/<slug>`

> Severity: **P0** unusable · **P1** major degradation · **P2** usability / a11y gap · **P3** polish. Metrics: see `docs/README.md`.

## Category summary

Auth is the **most responsive category in the catalogue** — split layouts already hide the art panel below `lg`, and forms are `w-full max-w-*`. Remaining issues are mostly vertical-fit, footer-row wrapping, touch targets, keyboard-only hints and animated backgrounds that keep running while hidden.

| # | Screen | File | Worst | Main issue |
|---|--------|------|-------|-----------|
| 1 | Login | `login.tsx` (+ `auth-shell.tsx`) | P1 | `h-svh overflow-hidden` shell + centred column → top clipped in landscape; hidden particle canvas keeps animating; hydration error |
| 2 | Onboarding | `onboarding.tsx` | P1 | Same shell issues; 3-col fact grid at 375px |
| 3 | Waitlist landing | `waitlist.tsx` | P1 | `h-dvh w-dvw overflow-hidden`; CTA can overlap figure; `w-dvw` causes desktop h-scroll with scrollbars |
| 4 | Check your email | `auth-check-email.tsx` | P2 | Shell issues; links < 24px |
| 5 | Inset login | `inset-login.tsx` | P1 | Footer row `whitespace-nowrap` overflows ("Forgot…" clipped); `min-h-[680px]`; WebGL loop runs while hidden |
| 6 | Centered signin | `auth-centered-signin.tsx` | P2 | Footer links crowd; card chrome wastes width |
| 7 | Centered signup | `auth-centered-signup.tsx` | P2 | Decorative blobs `size-[40rem]` clipped (harmless) ; terms row cramped |
| 8 | Left signin | `auth-left-signin.tsx` | P2 | Good; `minmax(440px,1fr)` squeezes art at 1024 |
| 9 | Right signin | `auth-right-signin.tsx` | P2 | Footer `whitespace-nowrap` ×2 risks overflow at ≤ 360px |
| 10 | Glass signup | `auth-glass-signup.tsx` | P2 | `p-8` card at 375; heavy `backdrop-blur-xl` + 5 animated 60vmax blobs on mobile GPUs |
| 11 | OTP verify | `auth-otp-verify.tsx` | P2 | 6 OTP cells + separator tight at 320px |
| 12 | Reset password | `auth-reset-password.tsx` | P2 | Demo toggle `opacity-40` 10px text at bottom-right |
| 13 | Two-factor | `auth-two-factor.tsx` | P2 | OTP cells tight; small links |
| 14 | Magic link sent | `auth-magic-link-sent.tsx` | P3 | Infinite `animate-ping` / float animations ignore reduced motion |

### Patterns shared across this category
1. **`AuthSplitLayout` (packages/ui/src/components/ui/auth-split-layout.tsx)**: root `h-svh overflow-hidden`, right column `overflow-y-auto flex-col items-center justify-center`. When content is taller than the viewport (landscape phones ~375px tall, onboarding step 2 with many invitees, 200% zoom), **`justify-center` pushes the top of the form above the scroll origin — unreachable**. Fix: `justify-start` + child `my-auto`, or `safe center` alignment.
2. **Animated backgrounds never pause.** `ParticleField` (packages/ui/src/components/particle-field.tsx) and `MeshShader` (inset-login L256–366) run `requestAnimationFrame` loops even when their container is `hidden lg:block` (display:none on mobile/tablet), and ignore `prefers-reduced-motion` (only `orbit-avatar-field.tsx` and `auth-glass-signup.tsx` honour it repo-wide). Battery drain on phones. Add `IntersectionObserver`/`display` check and reduced-motion static frame.
3. **Keyboard-only hints on touch** (`⌘↵ to submit` in login L101–105). Hide on `(pointer: coarse)`.
4. **Footer link rows with `justify-between` + `whitespace-nowrap`** overflow on ≤ 360px.
5. **Card chrome on phones** — `Card` with border + padding inside `px-4` page leaves ~295px for inputs at 375px. On `< sm`, cards should go borderless/edge-to-edge.
6. **Tap targets** — password reveal button `p-1` + `size-4` = 24px; "Forgot password?" / "Sign up" text links ~16–20px tall.
7. **Hydration mismatch** console error on `login`, `onboarding`, `check-email` (all `AuthShell` → `AuthSplitLayout` → `ThemeToggle`, which renders theme-dependent icon on the server). Production-readiness issue.
8. **Inputs**: good — `type="email"`, `autoComplete`, labels present. Ensure `inputMode="numeric"` + `autoComplete="one-time-code"` on OTP fields (verify in OTP/2FA screens).

---

## 1. Login

- **Route:** `/c/auth/login` · **File:** `apps/www/src/pages/showcase/login.tsx` (+ `auth-shell.tsx`, `AuthSplitLayout`)
- **Intent:** Split layout: particle art left, magic-link + OAuth form right.
- **Measured:** no overflow at 375/768; all 5 targets < 44px; hydration error in console. Screenshot @375: clean single column, brand label top-left, theme toggle top-right.

**Flaws**
- **P1 — Vertical clipping risk** from `AuthSplitLayout` `h-svh overflow-hidden` + centred scroll column (see pattern 1). Reproduce at 812×375 landscape.
- **P1 — `ParticleField` keeps animating while hidden** below `lg` (pattern 2).
- **P2 — `⌘↵ to submit` hint** (L101–105) shown on phones.
- **P2 — Mobile brand label `absolute top-6 left-6`** (L24) and `ThemeToggle absolute top-6 right-6` overlap the form when the form is taller than the viewport (absolute inside scroll column) and collide with each other at ≤ 320px ("MANTAVYAM'S SCATCH PAD" uppercase tracking 0.2em ≈ 250px).
- **P2 — `AuthShell` right column `lg:w-[620px]`** override — at exactly 1024px: 620px form + 404px art; fine; at 1024–1100 art becomes narrow. Consider `lg:w-[min(620px,50%)]`.
- **P2 — Hydration mismatch** (pattern 7).

**Acceptance**
- [ ] At 812×375 the heading is reachable by scrolling.
- [ ] No rAF activity while art panel is `display:none`.

---

## 2. Onboarding

- **Route:** `/c/auth/onboarding` · **File:** `apps/www/src/pages/showcase/onboarding.tsx`
- **Intent:** 3-step wizard (workspace → invite → ready) inside `AuthShell`.
- **Measured:** clean at 375; hydration error.

**Flaws**
- **P1 — Step 2 list grows** (`L193 ul` of invitees) inside a vertically-centred, overflow-hidden shell → top clipping as list grows (pattern 1).
- **P2 — Invite row `flex gap-2`** (L178) input + Add button: fine; ensure button has `shrink-0`.
- **P2 — Ready step `grid grid-cols-3 gap-2`** (L251) fact cards with `truncate` values at ~100px each on 375 → values truncated. Use `grid-cols-1 sm:grid-cols-3` or 2-up.
- **P2 — Stepper `text-[10px] tracking-[0.3em]`** (L86) and remove links `text-[10px]` (L203) — small targets.
- **P3 — Back/continue footer `justify-between`** (L216) — fine; make primary full-width on mobile.

---

## 3. Waitlist landing

- **Route:** `/c/auth/waitlist` · **File:** `apps/www/src/pages/showcase/waitlist.tsx`
- **Intent:** Full-bleed particle figure with bottom CTA.
- **Measured:** no overflow at 375. Screenshot @375: figure fills top 2/3; headline sits over the lower part of the figure — readable thanks to gradient.

**Flaws**
- **P1 — `h-dvh w-dvw overflow-hidden`** (L8): `w-dvw` = 100dvw includes the vertical scrollbar width on desktop → horizontal overflow; content can't scroll if it exceeds viewport height (landscape phone: CTA block `pb-16` + figure overlap, heading may cover figure entirely).
- **P2 — Text over art relies on `textShadow` + gradients** — contrast not guaranteed on light theme.
- **P2 — CTA is `<a href="#">`** (L61) styled as a button; `h-10` (40px).
- **P2 — Particle animation ignores reduced motion** (pattern 2).
- **P3 — Fixed gradient sizes `1200px 800px`, `420px 220px`** (L23, L39) — tuned for desktop.

**Target behaviour:** `min-h-dvh w-full`, flex column (figure `flex-1 min-h-[40vh]`, copy block below), allow scroll.

---

## 4. Check your email

- **Route:** `/c/auth/check-email` · **File:** `apps/www/src/pages/showcase/auth-check-email.tsx`
- **Measured:** 2/5 targets < 24px (inline links); hydration error.

**Flaws**
- **P2 — Inline links** "Use a different email" / "contact support" (L81–96) are text-sm/xs inline anchors (~16–20px).
- **P2 — "Open mail app" button** has no `href` (`mailto:` / platform deep link) — on mobile this is the primary action.
- **P2 — Countdown text updates every second without `aria-live` politeness control** (announces too often if made live; currently silent — add a polite live region only on state change).
- Inherits shell issues (patterns 1, 2, 7).

---

## 5. Inset login

- **Route:** `/c/auth/inset-login` · **File:** `apps/www/src/pages/showcase/inset-login.tsx` (632 lines)
- **Intent:** Rounded inset frame: WebGL mesh gradient panel + sign-in form.
- **Measured:** mobile — 1 inner horizontal scroller; 3/9 targets < 24px. Screenshot @375: footer "Don't have an account? Sign up · Forgot…" overflows; "Forgot password?" clipped at the card edge.

**Flaws**
- **P1 — `FooterLinks` (L586–598) `flex justify-between` with two `whitespace-nowrap` children** → overflow at < 400px. Wrap (`flex-wrap gap-y-2`) or stack.
- **P1 — Right panel `min-h-[680px]`** (L373): forces ≥ 680px card height; with page `p-4` and outer `min-h-svh`, short viewports always scroll even for a small form; in landscape, card is taller than screen.
- **P1 — `MeshShader` WebGL rAF loop** runs while `hidden lg:block` (L148); DPR capped at 2 (good) but no visibility/reduced-motion guard.
- **P2 — Outer frame `p-4 md:p-10 lg:p-16` + `rounded-3xl border shadow-2xl`** (L23–24): on phones the inset frame wastes 32px + border. Go edge-to-edge below `sm`.
- **P2 — "Last used" badge `-top-2 absolute right-2 text-[9px]`** (L481) overlaps neighbouring button at narrow widths.
- **P2 — OAuth row `grid-cols-2`** (L462) with `truncate` labels — fine at 375, cramped at 320.

---

## 6. Centered signin

- **Route:** `/c/auth/centered-signin` · **File:** `apps/www/src/pages/showcase/auth-centered-signin.tsx`
- **Measured:** clean; 2/8 targets < 24px.

**Flaws**
- **P2 — `FooterLinks` `flex items-baseline justify-between`** (L192) — at 375 "Forgot password?" and "Don't have an account? Sign up" wrap into awkward 2-line columns (visible in screenshot).
- **P2 — Card `p-7`** (L23) inside `px-4` → ~270px input width at 375. Reduce to `p-5 sm:p-7` or borderless on mobile.
- **P2 — Container `min-h-svh items-center justify-center py-12`** (L20) — landscape clipping of top (pattern 1 variant: page scrolls, so this one is OK; verify).
- **P3 — Reveal-password button 24px** (L171).

---

## 7. Centered signup

- **Route:** `/c/auth/centered-signup` · **File:** `apps/www/src/pages/showcase/auth-centered-signup.tsx`
- **Measured:** root `overflow-hidden` clips decorative blobs (scrollW 603 @375) and 84px vertical (vclip) — decorative only, but `overflow-hidden` on the **page root** also means any real overflow would be hidden silently. 6/12 targets < 24px.

**Flaws**
- **P2 — Page root `relative min-h-svh overflow-hidden`** (L90): prefer clipping only the backdrop layer (`absolute inset-0 overflow-hidden`), never page content.
- **P2 — Backdrop `size-[40rem]` blur-3xl blobs** (L280–281) — expensive blur on mobile GPUs; reduce size below `md`.
- **P2 — Terms checkbox row** (L203–230) — checkbox target 16px; label links inline (~18px). Make whole row the label, ≥ 44px.
- **P2 — Benefit pills `text-[10px] tracking-[0.2em]`** (L267) wrap into 3 rows on 375 — consider hiding 3rd pill on mobile.
- **P3 — Strength meter label `min-w-[3.5rem] text-[10px]`** (L196).

---

## 8. Left signin

- **Route:** `/c/auth/left-signin` · **File:** `apps/www/src/pages/showcase/auth-left-signin.tsx`
- **Measured:** clean; 3/8 targets < 24px. Good reference implementation (`grid-cols-1 lg:grid-cols-[minmax(440px,1fr)_1.2fr]`).

**Flaws**
- **P2 — At `lg` (1024px)** form column `minmax(440px,1fr)` + art `1.2fr` → art ≈ 584px — fine; but testimonial `text-2xl p-8` and logo strip `gap-6` (L236) wrap/overflow at 1024–1100. Logo strip should `flex-wrap`.
- **P2 — Logo strip has Separators between items** (L238–240) that dangle when wrapped.
- **P3 — Small text links.**

---

## 9. Right signin

- **Route:** `/c/auth/right-signin` · **File:** `apps/www/src/pages/showcase/auth-right-signin.tsx`
- **Measured:** clean at 375; 3/8 targets < 24px.

**Flaws**
- **P2 — `FooterLinks` (L289–301)** `justify-between` + two `whitespace-nowrap` items → overflow at ≤ 360px (just fits at 375).
- **P2 — Card `max-w-sm px-6 py-8 shadow-sm`** (L150) inside `px-6` page: 279px inputs at 375.
- **P2 — Hero `DashboardMock` grid-cols-3 with `text-[9px]`** (L97–103) — desktop only, fine.
- **P3 — Hero hidden below `lg`**; consider a compact single-line value prop above the form on mobile.

---

## 10. Glass signup

- **Route:** `/c/auth/glass-signup` · **File:** `apps/www/src/pages/showcase/auth-glass-signup.tsx`
- **Measured:** backdrop layer clips (by design). 2/7 targets < 24px. Screenshot @375: renders well.

**Flaws**
- **P2 — Performance:** 5 blobs `h-[60vmax] w-[60vmax]` with keyframe animation (L90–120) behind `backdrop-blur-xl backdrop-saturate-150` (L17) — heavy compositing on low-end Android. Reduced-motion is honoured (L81) — good; also reduce blur radius below `md`.
- **P2 — Card `p-8`** at 375 → ~263px fields. Use `p-5 sm:p-8`.
- **P2 — Forces `dark` + hard-coded `bg-[#0a0a0c]` / `text-white`** (L15) — ignores theme; acceptable as a variant, document it.
- **P3 — Placeholder contrast `text-white/40`** (L212) below 4.5:1.

---

## 11. OTP verify

- **Route:** `/c/auth/otp-verify` · **File:** `apps/www/src/pages/showcase/auth-otp-verify.tsx`
- **Measured:** clean; 3/10 targets < 24px.

**Flaws**
- **P2 — 6 cells + separator** inside `max-w-sm` card with `CardPanel` padding — at 320px cells shrink to ~32px; verify `OTPField` cell min size ≥ 40px or reduce gap on mobile.
- **P2 — Ensure `inputMode="numeric"` and `autoComplete="one-time-code"`** for SMS autofill on iOS/Android (verify in `@orbit/ui/otp-field`).
- **P2 — "Cancel" back link `text-xs`** (L49) & "Resend" (L96) small targets.
- **P3 — Container `min-h-svh flex items-center`** — keyboard opening on mobile shrinks visual viewport; centred card may jump. Prefer top-aligned on mobile (`items-start pt-16 sm:items-center`).

---

## 12. Reset password

- **Route:** `/c/auth/reset-password` · **File:** `apps/www/src/pages/showcase/auth-reset-password.tsx`
- **Measured:** clean; 2/4 targets < 24px.

**Flaws**
- **P2 — Demo state toggle** (L56) `absolute right-4 bottom-4 text-[10px] opacity-40` — overlaps card on short screens; is showcase-only, should be visually separated or removed in production copy.
- **P2 — Back link / "Didn't get it" links** small.
- **P3 — `break-all` on email** (L148) good.

---

## 13. Two-factor

- **Route:** `/c/auth/two-factor` · **File:** `apps/www/src/pages/showcase/auth-two-factor.tsx`
- **Measured:** clean; 5/12 targets < 24px (OTP cells, links).

**Flaws**
- **P2 — OTP cells** (L138–152) same sizing concern as #11; `inputMode`/`autoComplete` check.
- **P2 — "Remember this device" row** (L155) label + switch; switch hit area < 24px — make whole row clickable.
- **P2 — Recovery-code toggle link** (L102) and support link (L115) small.
- **P3 — Recovery input `tracking-[0.2em]`** (L190) may overflow for long codes at 320px.

---

## 14. Magic link sent

- **Route:** `/c/auth/magic-link-sent` · **File:** `apps/www/src/pages/showcase/auth-magic-link-sent.tsx`
- **Measured:** clean.

**Flaws**
- **P2 — Infinite animations** (`animate-ping` 3s, 4 floating dots, L126–148) — no `motion-safe:` guard.
- **P2 — "use a different email" is `<a>` without `href`** (L113) — not focusable, not a link.
- **P3 — Card `p-8`** at 375; same chrome-width note.
