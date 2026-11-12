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
 *   Animations API) has stayed the same for SETTLE_QUIET_MS.
 *
 * Long tasks are deliberately not a signal: endless canvas animations (the
 * particle fields) produce them every frame without changing the layout,
 * and hydration is already covered by data-design-ready.
 *
 * A screen that never reaches that state is not measured. After
 * SETTLE_WATCHDOG_MS (a hang detector, not a measuring deadline) it fails
 * with LayoutNeverSettledError, because a layout that never settles is a
 * defect in itself.
 */
import type { Page } from "playwright";

export const SETTLE_QUIET_MS = 300;
export const SETTLE_TIMER_MS = 2000;
export const SETTLE_WATCHDOG_MS = Math.max(
  1,
  Number.parseInt(process.env.SETTLE_WATCHDOG_MS ?? "45000", 10) || 45_000,
);

export class LayoutNeverSettledError extends Error {
  constructor(watchdogMs: number) {
    super(`layout never settled (still changing after ${watchdogMs}ms)`);
    this.name = "LayoutNeverSettledError";
  }
}

// Runs in the page. Kept as a plain string so the TS/esbuild transform can't
// inject helpers (e.g. `__name`) that don't exist in the browser.
const SETTLE = `(async ({ quietMs, watchdogMs, timerMs }) => {
  const start = performance.now();
  const root = document.documentElement;
  const fingerprint = () => {
    const els = document.body.getElementsByTagName("*");
    let out = root.scrollWidth + ":" + root.scrollHeight;
    for (let i = 0; i < els.length; i++) {
      const el = els[i];
      if (el instanceof HTMLElement) out += "|" + el.offsetLeft + "," + el.offsetTop + "," + el.offsetWidth + "," + el.offsetHeight;
      else if (el instanceof SVGElement) {
        out += "|s";
        for (const a of el.attributes) out += a.name + "=" + a.value + ";";
      }
    }
    return out;
  };
  const animating = () =>
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
  const prepared = () =>
    root.hasAttribute("data-design-ready") &&
    document.readyState === "complete" &&
    document.fonts.status === "loaded" &&
    !imagesPending() &&
    !animating();
  return await new Promise((resolve) => {
    let last = fingerprint();
    let stableSince = performance.now();
    const done = (settled, now) => resolve({ settled, settleMs: Math.round(now - start) });
    const tick = () => {
      const now = performance.now();
      const fp = fingerprint();
      if (fp !== last || !prepared()) {
        last = fp;
        stableSince = now;
      }
      if (now - stableSince >= quietMs) return done(true, now);
      if (now - start >= watchdogMs) return done(false, now);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
})`;

/**
 * Wait until the screen's layout is prepared (see above). Returns how long
 * that took; throws LayoutNeverSettledError if it never happened.
 */
export async function waitForSettledLayout(page: Page): Promise<number> {
  const result = (await page.evaluate(
    `${SETTLE}(${JSON.stringify({ quietMs: SETTLE_QUIET_MS, watchdogMs: SETTLE_WATCHDOG_MS, timerMs: SETTLE_TIMER_MS })})`,
  )) as { settled: boolean; settleMs: number };
  if (!result.settled) throw new LayoutNeverSettledError(SETTLE_WATCHDOG_MS);
  return result.settleMs;
}
