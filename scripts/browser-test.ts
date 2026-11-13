#!/usr/bin/env tsx
// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
/**
 * Browser check: load every screen in a real browser and fail on anything
 * that breaks at runtime.
 *
 *   npm run test:browser
 *   npm run test:browser -- --design=tables/members,auth/login
 *   npm run test:browser -- --update-a11y-baseline
 *
 * Starts its own fresh app server (scripts/lib/app-server.ts) and retires it
 * when done. Each screen is opened at desktop (1440x900) and mobile (375x812)
 * width and measured only once settled (scripts/lib/settle.ts). It fails on:
 * - uncaught page errors and console errors (React reports hydration
 *   mismatches as console errors in development);
 * - a crashed route (DesignCrashedError, with the message);
 * - a layout that never settles;
 * - new accessibility violations: axe-core with the WCAG 2.0/2.1 A and AA
 *   rules, counted per screen, viewport and rule against a11y-baseline.json,
 *   which may only shrink (same ratchet as the lint gate).
 * Console warnings are recorded in the report.
 *
 * Progress and slow-screen alerts: .test-status/browser.json and `[alert]`
 * lines (scripts/lib/progress.ts). Report: .audit/browser/report.json.
 */
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { type Browser, chromium } from "playwright";

import { SOURCE_FILES } from "../apps/www/src/pages/showcase/source-files";
import { withAppServer } from "./lib/app-server";
import { readyScreens } from "./lib/contract";
import { readDesignMeta } from "./lib/registry-meta";
import { trackProgress } from "./lib/progress";
import { SETTLE_TIMER_MS, waitForSettledLayout } from "./lib/settle";
import { compare, type Counts } from "./lint-gate";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, ".audit/browser");
const BASELINE = resolve(ROOT, "a11y-baseline.json");
const AXE_SOURCE = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];
const CONCURRENCY = Math.max(1, Number.parseInt(process.env.BROWSER_CONCURRENCY ?? "4", 10) || 4);
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 375, height: 812 },
] as const;

const args = process.argv.slice(2);
const updateBaseline = args.includes("--update-a11y-baseline");
const onlyDesigns = args.find((a) => a.startsWith("--design="))?.split("=")[1]?.split(",");

interface ScreenResult {
  errors: string[];
  warnings: string[];
  a11y: Record<string, number>;
  /** Each violating element (rule: selector — what axe found), so a new violation can be traced. */
  a11yNodes?: string[];
  settleMs?: number;
}

const designs = Object.entries(SOURCE_FILES)
  .flatMap(([category, map]) => Object.keys(map ?? {}).map((slug) => `${category}/${slug}`))
  .filter((d) => !onlyDesigns || onlyDesigns.includes(d));

// Every state a screen declares (designs.ts `states`) is checked too, keyed
// <design>~<state>@<viewport>; the default "ready" state keeps <design>@<viewport>.
const statesOf = new Map(readDesignMeta().map((d) => [`${d.category}/${d.slug}`, d.states ?? ["ready"]]));
// Ready-to-wire screens (SCREEN-CONTRACT.md, definition of done) must be axe
// clean in every state; the baseline only covers screens not yet converted.
const ready = new Set(readyScreens());
const isReady = (design: string) => {
  const [category, slug] = design.split("/");
  const file = SOURCE_FILES[category as keyof typeof SOURCE_FILES]?.[slug ?? ""];
  return file !== undefined && ready.has(file);
};

const unitKey = (design: string, state: string, viewport: string) =>
  state === "ready" ? `${design}@${viewport}` : `${design}~${state}@${viewport}`;

async function checkScreen(
  browser: Browser,
  base: string,
  design: string,
  state: string,
  vp: (typeof VIEWPORTS)[number],
): Promise<ScreenResult> {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await context.newPage();
  const result: ScreenResult = { errors: [], warnings: [], a11y: {} };
  page.on("pageerror", (e) => result.errors.push(`page error: ${String(e).split("\n")[0]?.slice(0, 300)}`));
  page.on("console", (m) => {
    const text = m.text().replace(/\s+/g, " ").slice(0, 400);
    if (m.type() === "error") result.errors.push(`console error: ${text}`);
    else if (m.type() === "warning") result.warnings.push(text);
  });
  try {
    // Real clock on purpose: this check is about runtime behaviour, and a frozen
    // browser clock would cause hydration mismatches the app doesn't have.
    const stateParam = state === "ready" ? "" : `&state=${state}`;
    await page.goto(`${base}/c/${design}?preview=%221%22${stateParam}`, { waitUntil: "networkidle", timeout: 60_000 });
    result.settleMs = await waitForSettledLayout(page);
    await page.addScriptTag({ content: AXE_SOURCE });
    const runAxe = async (only: { type: "tag" | "rule"; values: string[] }) =>
      (await page.evaluate(
        `axe.run(document, { runOnly: ${JSON.stringify(only)}, resultTypes: ["violations"] }).then((r) => r.violations.map((v) => [v.id, v.nodes.map((n) => n.target.join(" ") + " — " + (n.failureSummary || "").replace(/\\s+/g, " ").slice(0, 240))]))`,
      )) as [string, string[]][];
    let violations = await runAxe({ type: "tag", values: AXE_TAGS });
    // A screen whose demo adds content on a timer (a chat reply fading in) can
    // start an entrance animation after the layout settled; axe then measures
    // a half-transparent colour. Contrast is judged on what users read, so
    // let running finite animations finish and check contrast again. Logged,
    // never silent; anything still failing is reported as before.
    if (violations.some(([rule]) => rule === "color-contrast")) {
      const waited = (await page.evaluate(`(async () => {
        const finite = document.getAnimations().filter((a) => {
          if (a.playState !== "running") return false;
          const end = a.effect && a.effect.getComputedTiming().endTime;
          return end !== Infinity && end < ${SETTLE_TIMER_MS};
        });
        await Promise.all(finite.map((a) => a.finished.catch(() => undefined)));
        return finite.length;
      })()`)) as number;
      if (waited > 0) {
        const recheck = await runAxe({ type: "rule", values: ["color-contrast"] });
        const before = violations.find(([rule]) => rule === "color-contrast")?.[1].length ?? 0;
        const after = recheck.find(([rule]) => rule === "color-contrast")?.[1].length ?? 0;
        console.log(`[browser] note ${design}~${state}@${vp.name}: color-contrast measured during ${waited} running animation(s); rechecked after they finished: ${before} → ${after}`);
        violations = [...violations.filter(([rule]) => rule !== "color-contrast"), ...recheck.filter(([rule]) => rule === "color-contrast")];
      }
    }
    for (const [rule, nodes] of violations) {
      result.a11y[rule] = nodes.length;
      result.a11yNodes = [...(result.a11yNodes ?? []), ...nodes.map((n) => `${rule}: ${n}`)];
    }
  } catch (err) {
    result.errors.push(err instanceof Error ? err.message.split("\n")[0] ?? String(err) : String(err));
  } finally {
    await context.close();
  }
  return result;
}

async function main(): Promise<void> {
  const results: Record<string, ScreenResult> = {};
  const units = designs.flatMap((d) =>
    (statesOf.get(d) ?? ["ready"]).flatMap((state) => VIEWPORTS.map((vp) => ({ design: d, state, vp }))),
  );
  const progress = trackProgress("browser", { total: units.length, slowUnitMs: 30_000, stallMs: 90_000 });

  await withAppServer("browser", async (base) => {
    const browser = await chromium.launch();
    try {
      const queue = [...units];
      await Promise.all(
        Array.from({ length: CONCURRENCY }, async () => {
          for (let u = queue.shift(); u; u = queue.shift()) {
            const key = unitKey(u.design, u.state, u.vp.name);
            progress.start(key);
            const r = await checkScreen(browser, base, u.design, u.state, u.vp);
            if (isReady(u.design) && r.a11yNodes?.length) {
              r.errors.push(`ready-to-wire screens allow no a11y violations: ${r.a11yNodes[0]}`);
            }
            results[key] = r;
            progress.done(key, r.errors.length === 0);
            if (r.errors.length) process.stdout.write(`[browser] ✗ ${key}: ${r.errors[0]}\n`);
          }
        }),
      );
    } finally {
      await browser.close();
    }
  });

  const current: Counts = Object.fromEntries(
    Object.entries(results)
      .filter(([, r]) => Object.keys(r.a11y).length > 0)
      .map(([k, r]) => [k, r.a11y]),
  );
  mkdirSync(OUT, { recursive: true });
  writeFileSync(resolve(OUT, "report.json"), `${JSON.stringify(results, null, 2)}\n`);

  const errored = Object.entries(results).filter(([, r]) => r.errors.length > 0);
  const warned = Object.entries(results).filter(([, r]) => r.warnings.length > 0);
  for (const [k, r] of warned) process.stdout.write(`[browser] warning ${k}: ${r.warnings[0]}\n`);

  let a11yProblems: string[] = [];
  if (updateBaseline) {
    // With --design, replace only those designs' entries and keep the rest.
    const kept =
      onlyDesigns && existsSync(BASELINE)
        ? Object.fromEntries(
            Object.entries(JSON.parse(readFileSync(BASELINE, "utf8")) as Counts).filter(
              ([k]) => !onlyDesigns.some((d) => k.startsWith(`${d}@`) || k.startsWith(`${d}~`)),
            ),
          )
        : {};
    writeFileSync(BASELINE, `${JSON.stringify({ ...kept, ...current }, null, 2)}\n`);
    process.stdout.write(`[browser] a11y baseline recorded: ${Object.keys(current).length} screen/viewports with violations.\n`);
  } else if (!existsSync(BASELINE)) {
    a11yProblems = ["a11y-baseline.json is missing; run `npm run test:browser -- --update-a11y-baseline`."];
  } else {
    const baseline = JSON.parse(readFileSync(BASELINE, "utf8")) as Counts;
    // When only some designs ran, compare only those.
    const scoped = onlyDesigns
      ? Object.fromEntries(Object.entries(baseline).filter(([k]) => onlyDesigns.some((d) => k.startsWith(`${d}@`) || k.startsWith(`${d}~`))))
      : baseline;
    const { regressions, improvements } = compare(scoped, current);
    a11yProblems = regressions.map((r) => `new a11y violation: ${r}`);
    if (improvements.length && !onlyDesigns) {
      a11yProblems.push(
        ...improvements.map((i) => `fixed (lock in with --update-a11y-baseline): ${i}`),
      );
    }
  }
  for (const p of a11yProblems) process.stdout.write(`[browser] ✗ ${p}\n`);

  const ok = errored.length === 0 && a11yProblems.length === 0;
  progress.finish(
    `${units.length - errored.length}/${units.length} screen/viewports clean; ${warned.length} with warnings; ` +
      `${a11yProblems.length} a11y baseline problem(s)${ok ? "" : " — FAILED"}`,
  );
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
