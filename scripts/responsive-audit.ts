#!/usr/bin/env tsx
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
 *
 * Env knobs:
 *   AUDIT_BASE_URL      default http://localhost:4000
 *   AUDIT_CONCURRENCY   default 4
 *
 * Output: `.audit/responsive/report.json` (+ `shots/` with --screenshots).
 */
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type Browser, type BrowserContext } from "playwright";

import { SOURCE_FILES } from "../apps/www/src/pages/showcase/source-files";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SHOWCASE_DIR = resolve(ROOT, "apps/www/src/pages/showcase");
const OUT_DIR = resolve(ROOT, ".audit/responsive");
const BASE = process.env.AUDIT_BASE_URL ?? "http://localhost:4000";
const CONCURRENCY = Math.max(
  1,
  Number.parseInt(process.env.AUDIT_CONCURRENCY ?? "4", 10) || 4,
);
const SETTLE_MS = 700;

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
const GATES = ["pageOverflowX", "offenderCount", "squeezedCount"] as const;

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
  smallTargets: string[];
  textEls: number;
  tiny: number;
  errors: string[];
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
    strict: argv.includes("--strict"),
  };
}

async function reachable(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "GET" });
    return res.ok || (res.status >= 300 && res.status < 400);
  } catch {
    return false;
  }
}

function buildQueue(args: ReturnType<typeof parseArgs>): Task[] {
  const tasks: Task[] = [];
  for (const [category, designs] of Object.entries(SOURCE_FILES)) {
    if (!designs) continue;
    if (args.categories && !args.categories.includes(category)) continue;
    for (const [design, filename] of Object.entries(designs)) {
      if (args.designs && !args.designs.includes(`${category}/${design}`)) continue;
      if (!existsSync(resolve(SHOWCASE_DIR, `${filename}.tsx`))) {
        console.warn(
          `[audit] skipping ${category}/${design}: ${filename}.tsx is mapped in source-files.ts but doesn't exist`,
        );
        continue;
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
      out.push(`${vp}: load error`);
      continue;
    }
    for (const gate of GATES) {
      if (m[gate] > 0) out.push(`${vp}: ${gate}=${m[gate]}`);
    }
  }
  return out;
}

async function runWorker(
  browser: Browser,
  viewports: (typeof VIEWPORTS)[number][],
  queue: Task[],
  results: Record<string, Result>,
  screenshots: boolean,
  total: number,
): Promise<void> {
  const contexts = new Map<ViewportName, BrowserContext>();
  for (const v of viewports) {
    contexts.set(
      v.name,
      await browser.newContext({
        viewport: { width: v.width, height: v.height },
        deviceScaleFactor: 1,
        hasTouch: v.touch,
        isMobile: false,
      }),
    );
  }

  while (queue.length > 0) {
    const task = queue.shift();
    if (!task) break;
    const key = `${task.category}/${task.design}`;
    const result: Result = {};

    for (const v of viewports) {
      const page = await contexts.get(v.name)!.newPage();
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(String(e).split("\n")[0]!.slice(0, 200)));
      try {
        // The viewer's validateSearch only accepts a string, and TanStack
        // JSON-parses search params, so `preview=1` arrives as a number.
        // Pass a JSON string to hide the viewer chrome.
        await page.goto(
          `${BASE}/c/${task.category}/${task.design}?preview=%221%22`,
          { waitUntil: "networkidle", timeout: 45_000 },
        );
        await page.waitForTimeout(SETTLE_MS);
        const metrics = (await page.evaluate(MEASURE)) as Omit<Metrics, "errors">;
        result[v.name] = { ...metrics, errors };
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

  if (!(await reachable(BASE))) {
    console.error(
      `[audit] no server at ${BASE}. Start it (e.g. \`npm run dev:www\`) and re-run.`,
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
  const browser = await chromium.launch();
  const results: Record<string, Result> = {};
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, total) }, () =>
      runWorker(browser, [...viewports], queue, results, args.screenshots, total),
    ),
  );
  await browser.close();

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE,
    viewports,
    gates: { viewports: GATED_VIEWPORTS, metrics: GATES },
    results,
  };
  const reportPath = resolve(OUT_DIR, "report.json");
  await writeFile(reportPath, JSON.stringify(report, null, 2));

  const failing = Object.entries(results).filter(([, r]) => failures(r).length > 0);
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(
    `[audit] ${total - failing.length}/${total} designs pass the gates in ${elapsed}s → ${reportPath}`,
  );

  if (args.strict && failing.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error("[audit] failed:", err);
  process.exit(1);
});
