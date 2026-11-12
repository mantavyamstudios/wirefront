// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
/**
 * Settle trigger: every browser test (responsive audit, preview snapshots)
 * measures or captures a screen only once its layout is fully prepared.
 * There is no fixed delay and no "measure anyway" fallback.
 *
 * The trigger fires when, all at the same time:
 * - the design has mounted: the design route sets <html data-design-ready>
 *   in an effect that runs after the screen's own mount effects;
 * - the document has finished loading and web fonts are ready;
 * - every image that affects the layout has loaded (lazy images still
 *   outside the viewport are ignored, they never load until scrolled to);
 * - no entrance/exit animation is running (Motion and CSS transitions appear
 *   in document.getAnimations()). Infinite animations (spinners) and long
 *   ones of SETTLE_TIMER_MS or more (countdowns, progress timers) are part of
 *   the screen's steady state, not something to wait out: waiting for an
 *   undo countdown would dismiss the very toast under test;
 * - a fingerprint of every element's layout box (offset metrics, which
 *   ignore transforms) and every SVG element's attributes (charts animate
 *   path data, dash offsets and clip rects frame by frame without the Web
 *   Animations API) has stayed the same for SETTLE_QUIET_MS, checked every
 *   SETTLE_STEP_MS. An element that changed in every check for
 *   SETTLE_MOTION_MS is in continuous motion (a courier riding a route) and
 *   counts as steady state, like an infinite CSS animation.
 *
 * Long tasks are deliberately not a signal: endless canvas animations (the
 * particle fields) produce them every frame without changing the layout,
 * and hydration is already covered by data-design-ready.
 *
 * A design that crashed (its route error component marks
 * <html data-design-error>) fails at once with DesignCrashedError and the
 * real message, instead of waiting for a layout that will never be ready.
 *
 * A screen that never reaches that state is not measured. After
 * SETTLE_WATCHDOG_MS (a hang detector, not a measuring deadline) it fails
 * with LayoutNeverSettledError, because a layout that never settles is a
 * defect in itself.
 */
import type { Page } from "playwright";

export const SETTLE_QUIET_MS = 300;
export const SETTLE_TIMER_MS = 2000;
/** How often the layout is checked. */
export const SETTLE_STEP_MS = 100;
/** An element changing in every check for this long is in continuous motion: steady state. */
export const SETTLE_MOTION_MS = 5_000;
export const SETTLE_WATCHDOG_MS = Math.max(
  1,
  Number.parseInt(process.env.SETTLE_WATCHDOG_MS ?? "45000", 10) || 45_000,
);

/** The design crashed: the route's error component marked <html data-design-error>. */
export class DesignCrashedError extends Error {
  constructor(message: string) {
    super(`design crashed: ${message}`);
    this.name = "DesignCrashedError";
  }
}

export class LayoutNeverSettledError extends Error {
  constructor(watchdogMs: number, detail = `still changing after ${watchdogMs}ms`) {
    super(`layout never settled (${detail})`);
    this.name = "LayoutNeverSettledError";
  }
}

// Runs in the page: installs window.__wirefrontStep(timerMs, motionSteps),
// which reports whether the layout changed since the last step (ignoring
// elements in continuous motion), whether the page has loaded, whether a
// finite animation is running and whether the design crashed. Shared by the
// real-time trigger below and the virtual-time trigger used for captures
// (capture.ts). Kept as a plain string so the TS/esbuild
// transform can't inject helpers (e.g. `__name`) that don't exist in the
// browser.
export const PROBE = `(() => {
  if (window.__wirefrontStep) return;
  const root = document.documentElement;
  const animating = (timerMs) =>
    document.getAnimations().some((a) => {
      if (a.playState !== "running") return false;
      const end = a.effect && a.effect.getComputedTiming().endTime;
      return end !== Infinity && end < timerMs;
    });
  const imagesPending = () => {
    for (const img of document.images) {
      if (img.complete) continue;
      if (img.loading === "lazy") {
        const r = img.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
      }
      return true;
    }
    return false;
  };
  // Per-element change tracking. An element
  // that changed in every one of the last motionSteps steps is in continuous
  // motion (a courier riding a route) and is ignored, like an infinite CSS
  // animation; anything else changing means the layout hasn't settled.
  const history = new Map();
  window.__wirefrontStep = (timerMs, motionSteps) => {
    const els = document.body.getElementsByTagName("*");
    let changed = false;
    let moving = 0;
    const seen = new Set();
    for (let i = 0; i < els.length; i++) {
      const el = els[i];
      let v;
      if (el instanceof HTMLElement) v = el.offsetLeft + "," + el.offsetTop + "," + el.offsetWidth + "," + el.offsetHeight;
      else if (el instanceof SVGElement) { v = ""; for (const a of el.attributes) v += a.name + "=" + a.value + ";"; }
      else continue;
      seen.add(el);
      const h = history.get(el);
      if (!h) { history.set(el, { v, streak: 0 }); changed = true; continue; }
      if (h.v !== v) {
        h.v = v;
        h.streak += 1;
        if (h.streak < motionSteps) changed = true;
        else moving += 1;
      } else {
        h.streak = 0;
      }
    }
    for (const el of history.keys()) if (!seen.has(el)) { history.delete(el); changed = true; }
    const sw = root.scrollWidth + ":" + root.scrollHeight;
    if (history.__sw !== sw) { history.__sw = sw; changed = true; }
    return {
      changed,
      moving,
      crashed: root.getAttribute("data-design-error"),
      loaded:
        root.hasAttribute("data-design-ready") &&
        document.readyState === "complete" &&
        document.fonts.status === "loaded" &&
        !imagesPending(),
      animating: animating(timerMs),
    };
  };
})()`;

const SETTLE = `(async ({ quietMs, watchdogMs, timerMs, stepMs, motionSteps }) => {
  ${PROBE};
  const start = performance.now();
  return await new Promise((resolve) => {
    let quiet = 0;
    const done = (settled, error) => resolve({ settled, settleMs: Math.round(performance.now() - start), error });
    const tick = () => {
      const p = window.__wirefrontStep(timerMs, motionSteps);
      if (p.crashed !== null) return done(false, p.crashed);
      if (p.loaded && !p.changed && !p.animating) quiet += stepMs;
      else quiet = 0;
      if (quiet >= quietMs) return done(true);
      if (performance.now() - start >= watchdogMs) return done(false);
      setTimeout(tick, stepMs);
    };
    setTimeout(tick, stepMs);
  });
})`;

/**
 * Wait until the screen's layout is prepared (see above). Returns how long
 * that took; throws LayoutNeverSettledError if it never happened.
 */
export async function waitForSettledLayout(page: Page): Promise<number> {
  const result = (await page.evaluate(
    `${SETTLE}(${JSON.stringify({ quietMs: SETTLE_QUIET_MS, watchdogMs: SETTLE_WATCHDOG_MS, timerMs: SETTLE_TIMER_MS, stepMs: SETTLE_STEP_MS, motionSteps: SETTLE_MOTION_MS / SETTLE_STEP_MS })})`,
  )) as { settled: boolean; settleMs: number; error?: string };
  if (result.error !== undefined) throw new DesignCrashedError(result.error);
  if (!result.settled) throw new LayoutNeverSettledError(SETTLE_WATCHDOG_MS);
  return result.settleMs;
}
