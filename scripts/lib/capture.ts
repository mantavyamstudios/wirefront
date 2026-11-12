// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
/**
 * Deterministic screen captures, shared by the preview snapshots and the
 * visual regression check, so the same screen renders the same pixels on
 * every run:
 * - Math.random is replaced with a seeded generator before any page code runs;
 * - the page runs on virtual time (Playwright's clock: Date, timers,
 *   requestAnimationFrame, performance.now), paused from the start so it only
 *   moves when the capture advances it. Loading (network, fonts, React's
 *   effects) happens with virtual time stopped; then the capture advances it in
 *   SETTLE_STEP_MS steps and checks the layout after each step, so every run
 *   sees the same timeline from the same instant, and timer-driven demos (an
 *   agent replay, a courier ride) are fast-forwarded instead of waited out;
 * - the screen is captured only once its layout has settled in virtual time;
 *   one still changing after VIRTUAL_CAP_MS of virtual time fails. Elements in
 *   continuous motion (changing in every step for SETTLE_MOTION_MS) are steady
 *   state, like infinite CSS animations; their position is still the same on
 *   every run because virtual time is;
 * - animations that run on real time instead of the virtual clock (CSS
 *   transitions and animations, and Web Animations API animations, which
 *   Motion uses for transforms and opacity) are made instant: zero duration
 *   and delay. Otherwise their real-time completions would interleave
 *   differently with the virtual timeline on every run. Previews therefore
 *   show each animation's end state;
 * - screenshots also finish any remaining finite animation and reset infinite
 *   ones to their first frame (Playwright `animations: "disabled"`).
 * Real-time checks (browser, audit) don't use this; they use settle.ts.
 *
 * Endless canvas animations (the particle fields) have no stable frame; their
 * rectangles are reported so the visual check can leave them out.
 */
import type { Page } from "playwright";
import { DesignCrashedError, LayoutNeverSettledError, PROBE, SETTLE_MOTION_MS, SETTLE_STEP_MS, SETTLE_TIMER_MS, SETTLE_WATCHDOG_MS } from "./settle";

export const CAPTURE_TIME = new Date("2026-04-14T09:30:00.000Z");
export const CAPTURE_SEED = 20260414;

// Plain string so the TS/esbuild transform can't inject helpers.
const SEED_RANDOM = `(() => {
  let s = ${CAPTURE_SEED} >>> 0;
  Math.random = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
})();`;

const SETTLE_QUIET_VIRTUAL_MS = 300;
const VIRTUAL_CAP_MS = 60_000;

// Plain string so the TS/esbuild transform can't inject helpers.
const INSTANT_ANIMATIONS = `(() => {
  const animate = Element.prototype.animate;
  Element.prototype.animate = function (keyframes, options) {
    const o = typeof options === "number" ? { duration: options } : { ...(options || {}) };
    o.duration = 0;
    o.delay = 0;
    o.endDelay = 0;
    return animate.call(this, keyframes, o);
  };
  const css = "*,*::before,*::after{transition-duration:0s!important;transition-delay:0s!important;animation-duration:0s!important;animation-delay:0s!important}";
  const add = () => {
    const style = document.createElement("style");
    style.setAttribute("data-wirefront-capture", "");
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", add, { once: true });
  else add();
})();`;

/** Make the page deterministic. Call once per page, before the first navigation. */
export async function makeDeterministic(page: Page): Promise<void> {
  await page.addInitScript(SEED_RANDOM);
  await page.addInitScript(INSTANT_ANIMATIONS);
  await page.clock.install({ time: CAPTURE_TIME });
  // install() alone lets virtual time keep flowing with real time.
  await page.clock.pauseAt(new Date(CAPTURE_TIME.getTime() + 1_000));
}

/**
 * Advance virtual time until the layout has settled. Returns the virtual time
 * it took. While the page is still loading (network, fonts, images, the ready
 * marker) or a CSS animation runs, real time passes too, since those don't
 * follow the virtual clock.
 */
export async function waitForSettledVirtual(page: Page): Promise<number> {
  await page.evaluate(PROBE);
  const realStart = Date.now();
  let virtual = 0;
  let quiet = 0;
  const motionSteps = SETTLE_MOTION_MS / SETTLE_STEP_MS;
  for (;;) {
    const p = (await page.evaluate(`window.__wirefrontStep(${SETTLE_TIMER_MS}, ${motionSteps})`)) as {
      changed: boolean;
      moving: number;
      crashed: string | null;
      loaded: boolean;
      animating: boolean;
    };
    if (p.crashed !== null) throw new DesignCrashedError(p.crashed);
    if (!p.loaded) {
      // Virtual time stays put while the page loads, so the timeline starts
      // at the same instant however long loading takes.
      if (Date.now() - realStart > SETTLE_WATCHDOG_MS) throw new LayoutNeverSettledError(SETTLE_WATCHDOG_MS, `still loading after ${SETTLE_WATCHDOG_MS}ms`);
      await page.waitForTimeout(50);
      continue;
    }
    if (!p.changed && !p.animating) {
      quiet += SETTLE_STEP_MS;
      if (quiet >= SETTLE_QUIET_VIRTUAL_MS) return virtual;
    } else {
      quiet = 0;
    }
    if (virtual >= VIRTUAL_CAP_MS) {
      throw new LayoutNeverSettledError(VIRTUAL_CAP_MS, `still changing after ${VIRTUAL_CAP_MS / 1000}s of virtual time`);
    }
    if (p.animating) await page.waitForTimeout(16);
    await page.clock.runFor(SETTLE_STEP_MS);
    virtual += SETTLE_STEP_MS;
  }
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Visible <canvas> rectangles in CSS pixels (left out of pixel comparison). */
export async function canvasRects(page: Page): Promise<Rect[]> {
  return (await page.evaluate(`[...document.querySelectorAll("canvas")]
    .map((c) => c.getBoundingClientRect())
    .filter((r) => r.width > 0 && r.height > 0)
    .map((r) => ({ x: r.x, y: r.y, width: r.width, height: r.height }))`)) as Rect[];
}

/** Open a design's preview, wait until it has settled and take a PNG of the viewport. */
export async function captureDesign(page: Page, url: string): Promise<{ png: Buffer; canvases: Rect[] }> {
  await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
  await waitForSettledVirtual(page);
  const canvases = await canvasRects(page);
  const png = await page.screenshot({ fullPage: false, animations: "disabled" });
  return { png, canvases };
}
