#!/usr/bin/env tsx
// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
/**
 * Responsive audit: load every showcase design at several viewports and
 * record objective layout signals (page overflow, off-screen elements,
 * clipped containers, squeezed text, small tap targets, tiny text,
 * console errors). Findings are documented per screen in `docs/`.
 *
 *   npm run dev:www                            # in another terminal
 *   npm run audit:responsive                   # all designs, all viewports
 *   npm run audit:responsive -- --category=layouts,forms
 *   npm run audit:responsive -- --design=layouts/app-shell --screenshots
 *   npm run audit:responsive -- --viewports=mobile,tablet --strict
 *
 * Flags:
 *   --category=a,b      only these categories
 *   --design=cat/slug   only these designs (comma separated)
 *   --viewports=a,b     subset of mobile,tablet,laptop,desktop
 *   --screenshots       save viewport screenshots
 *   --strict            exit 1 if any design fails a gate (see GATES)
 *   --rtl               lay every screen out right-to-left (preview `dir=rtl`: dir and
 *                       Base UI's DirectionProvider, as a builder's RTL app would);
 *                       the report goes to report-rtl.json
 *
 * Env knobs:
 *   APP_URL             audit an already running server instead of starting
 *                       a fresh one (scripts/lib/app-server.ts)
 *   AUDIT_CONCURRENCY   default 4
 *   SETTLE_WATCHDOG_MS  default 45000: a screen whose layout hasn't settled by
 *                       then fails as "layout never settled" (scripts/lib/settle.ts)
 *
 * Output: `.audit/responsive/report.json` (+ `shots/` with --screenshots).
 */
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type Browser, type BrowserContext } from "playwright";

import { SOURCE_FILES } from "../apps/www/src/pages/showcase/source-files";
import { withAppServer } from "./lib/app-server";
import { type Progress, trackProgress } from "./lib/progress";
import { waitForSettledLayout } from "./lib/settle";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SHOWCASE_DIR = resolve(ROOT, "apps/www/src/pages/showcase");
const OUT_DIR = resolve(ROOT, ".audit/responsive");
const CONCURRENCY = Math.max(
  1,
  Number.parseInt(process.env.AUDIT_CONCURRENCY ?? "4", 10) || 4,
);

// `isMobile` stays false on purpose: Chromium's mobile emulation widens the
// layout viewport to fit overflowing content, which hides the very overflow
// we're trying to measure. Touch is still enabled for mobile/tablet.
const VIEWPORTS = [
  { name: "mobile", width: 375, height: 812, touch: true },
  { name: "tablet", width: 768, height: 1024, touch: true },
  { name: "laptop", width: 1024, height: 768, touch: false },
  { name: "desktop", width: 1440, height: 900, touch: false },
] as const;
type ViewportName = (typeof VIEWPORTS)[number]["name"];

// A design fails --strict if any of these are non-zero at a gated viewport.
// Clipped containers are reported but not gated: decorative layers are
// clipped intentionally and the metric can't tell them apart.
const GATED_VIEWPORTS: ViewportName[] = ["mobile", "tablet", "laptop"];
const GATES = ["pageOverflowX", "offenderCount", "squeezedCount", "targetSizeFails"] as const;

interface Metrics {
  vw: number;
  docW: number;
  pageOverflowX: number;
  offenderCount: number;
  offenders: Array<{ el: string; left: number; right: number }>;
  clippedCount: number;
  clipped: Array<{ el: string; clientW: number; scrollW: number }>;
  vclippedCount: number;
  vclipped: Array<{ el: string; clientH: number; scrollH: number }>;
  hscrollCount: number;
  squeezedCount: number;
  squeezed: Array<{ el: string; w: number; h: number }>;
  targets: number;
  lt24: number;
  lt44: number;
  /** Targets failing WCAG 2.2 SC 2.5.8 (under 24px with no spacing exception). */
  targetSizeFails: number;
  targetSizeExamples: string[];
  smallTargets: string[];
  textEls: number;
  tiny: number;
  errors: string[];
  /** How long the screen took to settle before it was measured. */
  settleMs: number;
}

type Result = Partial<Record<ViewportName, Metrics | { error: string }>>;

// Runs in the page. Kept as a plain string so the TS/esbuild transform can't
// inject helpers (e.g. `__name`) that don't exist in the browser.
const MEASURE = `(() => {
  const vw = window.innerWidth;
  const de = document.documentElement;
  const desc = (el) => {
    const cls = (el.getAttribute("class") || "").split(/\\s+/).slice(0, 8).join(" ");
    const txt = (el.innerText || el.getAttribute("aria-label") || "").trim().replace(/\\s+/g, " ").slice(0, 30);
    return el.tagName.toLowerCase() + (cls ? ".[" + cls + "]" : "") + (txt ? ' "' + txt + '"' : "");
  };
  const visible = (el) => {
    const s = getComputedStyle(el);
    if (s.display === "none" || s.visibility === "hidden" || +s.opacity === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const hasClippingAncestor = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      if (getComputedStyle(p).overflowX !== "visible") return true;
    }
    return false;
  };
  const all = [...document.body.querySelectorAll("*")].filter(
    (e) => !e.closest("script,style") && visible(e),
  );

  const wraps = (root) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.textContent.trim()) continue;
      range.selectNodeContents(n);
      const tops = new Set([...range.getClientRects()].map((q) => Math.round(q.top)));
      if (tops.size > 1) return true;
    }
    return false;
  };
  const offenders = [], clipped = [], vclipped = [], hscroll = [], squeezed = [];
  let textEls = 0, tiny = 0;
  for (const el of all) {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    if ((r.right > vw + 1 || r.left < -1) && !hasClippingAncestor(el)) {
      offenders.push({ el: desc(el), left: Math.round(r.left), right: Math.round(r.right) });
    }
    const overX = el.scrollWidth - el.clientWidth;
    if (overX > 4 && el.children.length > 0) {
      if ((s.overflowX === "hidden" || s.overflowX === "clip") && s.textOverflow !== "ellipsis") {
        clipped.push({ el: desc(el), clientW: el.clientWidth, scrollW: el.scrollWidth });
      } else if (s.overflowX === "auto" || s.overflowX === "scroll") {
        hscroll.push(el);
      }
    }
    if ((s.overflowY === "hidden" || s.overflowY === "clip") && el.scrollHeight - el.clientHeight > 24 && el.clientHeight > 100) {
      vclipped.push({ el: desc(el), clientH: el.clientHeight, scrollH: el.scrollHeight });
    }
    const t = (el.innerText || "").trim();
    // Squeezed = a narrow, tall box whose text actually wraps. A stack of short
    // single-line labels (e.g. a calendar hour rail) isn't squeezed.
    if (r.width < 90 && r.height > 80 && t.length > 60 && el.children.length < 30 && wraps(el)) {
      squeezed.push({ el: desc(el), w: Math.round(r.width), h: Math.round(r.height) });
    }
    if ([...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) {
      textEls++;
      if (parseFloat(s.fontSize) < 12) tiny++;
    }
  }

  const interactive = [...document.body.querySelectorAll(
    "button,a[href],input:not([type=hidden]),select,textarea,[role=button],[role=checkbox],[role=switch],[role=tab],[role=menuitem],[role=radio],[role=slider]",
  )].filter(visible);
  let lt24 = 0, lt44 = 0;
  const smallTargets = [];
  for (const el of interactive) {
    const r = el.getBoundingClientRect();
    const m = Math.min(r.width, r.height);
    if (m < 24) {
      lt24++;
      if (smallTargets.length < 5) smallTargets.push(desc(el) + " " + Math.round(r.width) + "x" + Math.round(r.height));
    }
    if (m < 44) lt44++;
  }

  // WCAG 2.2 SC 2.5.8 (target size, minimum): a target smaller than 24x24 still
  // passes if a 24px circle centred on it intersects no other target and no
  // other undersized target's circle. Links inside running text are exempt.
  const inText = (el) =>
    (el.tagName === "A" || el.tagName === "BUTTON") &&
    getComputedStyle(el).display.startsWith("inline") &&
    [...(el.parentElement?.childNodes ?? [])].some((n) => n !== el && n.nodeType === 3 && n.textContent.trim());
  // A control inside a <label> is activated by the whole label, so that is its target.
  const boxes = interactive.map((el) => ({ el, r: (el.closest("label") ?? el).getBoundingClientRect() }));
  // Visually hidden native inputs (1px, e.g. behind Base UI checkboxes) aren't pointer
  // targets; their visible control is measured on its own.
  const pointable = boxes.filter(({ r }) => r.width > 2 && r.height > 2);
  const small = pointable.filter(({ el, r }) => Math.min(r.width, r.height) < 24 && !inText(el));
  const centre = (r) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
  const circleHitsRect = (c, r) => {
    const dx = c.x - Math.max(r.left, Math.min(c.x, r.right));
    const dy = c.y - Math.max(r.top, Math.min(c.y, r.bottom));
    return dx * dx + dy * dy < 12 * 12;
  };
  // Nested or stacked boxes (e.g. a slider's thumb and its range input) are one control.
  const overlap = (a, b) => {
    const w = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
    const h = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
    return w > 0 && h > 0 && w * h >= 0.5 * Math.min(a.r.width * a.r.height, b.r.width * b.r.height);
  };
  const contains = (a, b) => a.el.contains(b.el) || b.el.contains(a.el) || overlap(a, b);
  const wcagFails = [];
  for (const t of small) {
    const c = centre(t.r);
    const clash =
      pointable.find((o) => o !== t && !contains(o, t) && circleHitsRect(c, o.r)) ??
      small.find((o) => {
        if (o === t || contains(o, t)) return false;
        const d = centre(o.r);
        return (c.x - d.x) ** 2 + (c.y - d.y) ** 2 < 24 * 24;
      });
    if (clash) wcagFails.push(desc(t.el) + " " + Math.round(t.r.width) + "x" + Math.round(t.r.height) + ", too close to " + desc(clash.el));
  }

  return {
    vw, docW: de.scrollWidth, pageOverflowX: Math.max(0, de.scrollWidth - vw),
    offenderCount: offenders.length,
    offenders: offenders.sort((a, b) => b.right - a.right).slice(0, 8),
    clippedCount: clipped.length,
    clipped: clipped.sort((a, b) => (b.scrollW - b.clientW) - (a.scrollW - a.clientW)).slice(0, 6),
    vclippedCount: vclipped.length,
    vclipped: vclipped.slice(0, 4),
    hscrollCount: hscroll.length,
    squeezedCount: squeezed.length,
    squeezed: squeezed.sort((a, b) => a.w - b.w).slice(0, 5),
    targets: interactive.length, lt24, lt44, smallTargets,
    targetSizeFails: wcagFails.length, targetSizeExamples: wcagFails.slice(0, 5),
    textEls, tiny,
  };
})()`;

interface Task {
  category: string;
  design: string;
}

function parseArgs(argv: string[]) {
  const get = (name: string) =>
    argv
      .find((a) => a.startsWith(`--${name}=`))
      ?.slice(name.length + 3)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  return {
    categories: get("category"),
    designs: get("design"),
    viewports: get("viewports") as ViewportName[] | undefined,
    screenshots: argv.includes("--screenshots"),
    rtl: argv.includes("--rtl"),
    strict: argv.includes("--strict"),
  };
}

function buildQueue(args: ReturnType<typeof parseArgs>): Task[] {
  const tasks: Task[] = [];
  for (const [category, designs] of Object.entries(SOURCE_FILES)) {
    if (!designs) continue;
    if (args.categories && !args.categories.includes(category)) continue;
    for (const [design, filename] of Object.entries(designs)) {
      if (args.designs && !args.designs.includes(`${category}/${design}`)) continue;
      // A flat screen is <file>.tsx; a ready-to-wire screen is a <file>/ folder.
      if (!existsSync(resolve(SHOWCASE_DIR, `${filename}.tsx`)) && !existsSync(resolve(SHOWCASE_DIR, filename, "view.tsx"))) {
        throw new Error(`[audit] ${category}/${design}: neither ${filename}.tsx nor ${filename}/view.tsx exists`);
      }
      tasks.push({ category, design });
    }
  }
  return tasks;
}

function failures(result: Result): string[] {
  const out: string[] = [];
  for (const vp of GATED_VIEWPORTS) {
    const m = result[vp];
    if (!m) continue;
    if ("error" in m) {
      out.push(`${vp}: ${m.error}`);
      continue;
    }
    for (const gate of GATES) {
      if (m[gate] > 0) out.push(`${vp}: ${gate}=${m[gate]}`);
    }
  }
  return out;
}

async function runWorker(
  base: string,
  progress: Progress,
  browser: Browser,
  viewports: (typeof VIEWPORTS)[number][],
  queue: Task[],
  results: Record<string, Result>,
  screenshots: boolean,
  total: number,
  rtl: boolean,
): Promise<void> {
  const contexts = new Map<ViewportName, BrowserContext>();
  for (const v of viewports) {
    const context = await browser.newContext({
      viewport: { width: v.width, height: v.height },
      deviceScaleFactor: 1,
      hasTouch: v.touch,
      isMobile: false,
    });
    contexts.set(v.name, context);
  }

  while (queue.length > 0) {
    const task = queue.shift();
    if (!task) break;
    const key = `${task.category}/${task.design}`;
    const result: Result = {};
    progress.start(key);

    for (const v of viewports) {
      const page = await contexts.get(v.name)!.newPage();
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(String(e).split("\n")[0]!.slice(0, 200)));
      try {
        // The viewer's validateSearch only accepts a string, and TanStack
        // JSON-parses search params, so `preview=1` arrives as a number.
        // Pass a JSON string to hide the viewer chrome.
        await page.goto(
          `${base}/c/${task.category}/${task.design}?preview=%221%22${rtl ? "&dir=%22rtl%22" : ""}`,
          { waitUntil: "networkidle", timeout: 45_000 },
        );
        // Only a settled layout is measured (scripts/lib/settle.ts).
        const settleMs = await waitForSettledLayout(page);
        const metrics = (await page.evaluate(MEASURE)) as Omit<Metrics, "errors" | "settleMs">;
        result[v.name] = { ...metrics, errors, settleMs };
        if (screenshots) {
          await page.screenshot({
            path: resolve(OUT_DIR, "shots", `${task.category}__${task.design}--${v.name}.png`),
          });
        }
      } catch (err) {
        result[v.name] = {
          error: err instanceof Error ? err.message.split("\n")[0]! : String(err),
        };
      }
      await page.close();
    }

    results[key] = result;
    const done = Object.keys(results).length.toString().padStart(3, " ");
    const failed = failures(result);
    progress.done(key, failed.length === 0);
    process.stdout.write(
      `[audit] [${done}/${total}] ${key}${failed.length ? ` ✗ ${failed.join(", ")}` : " ✓"}\n`,
    );
  }

  for (const ctx of contexts.values()) await ctx.close();
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const viewports = VIEWPORTS.filter(
    (v) => !args.viewports || args.viewports.includes(v.name),
  );
  if (viewports.length === 0) {
    console.error(
      `[audit] no matching viewports; choose from ${VIEWPORTS.map((v) => v.name).join(", ")}`,
    );
    process.exit(1);
  }

  const queue = buildQueue(args);
  if (queue.length === 0) {
    console.warn("[audit] no designs matched — nothing to do.");
    return;
  }

  await mkdir(OUT_DIR, { recursive: true });
  if (args.screenshots) await mkdir(resolve(OUT_DIR, "shots"), { recursive: true });

  const total = queue.length;
  console.log(
    `[audit] ${total} designs × ${viewports.map((v) => `${v.name} ${v.width}px`).join(", ")} · concurrency=${CONCURRENCY}`,
  );

  const t0 = Date.now();
  const results: Record<string, Result> = {};
  const progress = trackProgress("audit", { total, slowUnitMs: 60_000, stallMs: 120_000 });
  let baseUrl = "";
  await withAppServer("audit", async (base) => {
    baseUrl = base;
    const browser = await chromium.launch();
    try {
      await Promise.all(
        Array.from({ length: Math.min(CONCURRENCY, total) }, () =>
          runWorker(base, progress, browser, [...viewports], queue, results, args.screenshots, total, args.rtl),
        ),
      );
    } finally {
      await browser.close();
    }
  });

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    viewports,
    gates: { viewports: GATED_VIEWPORTS, metrics: GATES },
    results,
  };
  const reportPath = resolve(OUT_DIR, args.rtl ? "report-rtl.json" : "report.json");
  await writeFile(reportPath, JSON.stringify(report, null, 2));

  const failing = Object.entries(results).filter(([, r]) => failures(r).length > 0);
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  progress.finish(`${total - failing.length}/${total} designs pass the gates`);
  console.log(
    `[audit] ${total - failing.length}/${total} designs pass the gates in ${elapsed}s → ${reportPath}`,
  );

  if (args.strict && failing.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error("[audit] failed:", err);
  process.exit(1);
});
