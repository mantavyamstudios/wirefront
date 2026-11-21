#!/usr/bin/env tsx
// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
/**
 * The built site (apps/www/out, runtime pages copied in), served the way
 * production serves it (wrangler, Workers static assets), in a real browser.
 *
 *   bun run build && bun run test:site
 *
 * Failure modes checked:
 * - a URL of the scheme (/{group}, /{group}/{kind}, /{group}/{kind}/{screen},
 *   /screens, /pricing, /preview, /demo, /r, the source API, llms) does not resolve,
 *   or an old /c/ address still answers;
 * - the screen page's iframe never shows the screen (no wf:ready / ready marker);
 * - moving to another screen reloads the iframe instead of messaging it,
 *   or leaves it on the old screen;
 * - the site's theme switch, or the toolbar's state, palette and direction
 *   controls, do not reach the iframe;
 * - a screen page is missing its generated reference (usage, props, backend
 *   contract), or the landing copy hard-codes a screen count;
 * - the source panel's JSON does not hold the screen's files;
 * - a gallery page lists the wrong screens;
 * - any console error or uncaught exception on the site or inside the iframe.
 */
import { type ChildProcess, spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type Frame, type Page } from "playwright";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 8791;
const BASE = `http://127.0.0.1:${PORT}`;
const TIMEOUT_MS = 30_000;

interface Manifest {
  groups: {
    slug: string;
    kinds: { slug: string; screens: { slug: string; title: string; files: string[]; states: string[] }[] }[];
  }[];
  totals: { screens: number };
}
const manifest = JSON.parse(readFileSync(resolve(ROOT, "apps/www/lib/screens/screens.manifest.json"), "utf8")) as Manifest;

const failures: string[] = [];
function check(ok: boolean, what: string) {
  console.log(`${ok ? "✓" : "✗"} ${what}`);
  if (!ok) failures.push(what);
}

async function startServer(): Promise<ChildProcess> {
  const child = spawn("bunx", ["wrangler", "dev", "--port", String(PORT), "--ip", "127.0.0.1"], {
    cwd: ROOT,
    env: { ...process.env, WRANGLER_SEND_METRICS: "false" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let log = "";
  child.stdout?.on("data", (d) => (log += d));
  child.stderr?.on("data", (d) => (log += d));
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`wrangler exited (${child.exitCode}):\n${log}`);
    const up = await fetch(`${BASE}/`).then((r) => r.ok, () => false);
    if (up) return child;
    await new Promise((r) => setTimeout(r, 1000));
  }
  child.kill();
  throw new Error(`wrangler did not answer on ${BASE} within 120 s:\n${log}`);
}

async function status(path: string): Promise<number> {
  return (await fetch(`${BASE}${path}`, { redirect: "manual" })).status;
}

async function screenFrame(page: Page): Promise<Frame> {
  const el = await page.waitForSelector('iframe[title="Screen preview"]', { timeout: TIMEOUT_MS });
  const frame = await el.contentFrame();
  if (!frame) throw new Error("the screen iframe has no frame");
  return frame;
}

/** Waits until the iframe shows /preview/{kind}/{screen} with its ready marker. */
async function waitForScreen(frame: Frame, kind: string, screen: string): Promise<boolean> {
  const path = `/preview/${kind}/${screen}`;
  return frame
    .waitForFunction(
      (p) => window.location.pathname.replace(/\/$/, "") === p && document.querySelector("[data-design-ready]") !== null,
      path,
      { timeout: TIMEOUT_MS },
    )
    .then(
      () => true,
      () => false,
    );
}

async function main() {
  const server = await startServer();
  const browser = await chromium.launch();
  try {
    const [group, kindEntry] = [manifest.groups[1], manifest.groups[1].kinds[3]]; // accounts / pricing
    const [first, second] = kindEntry.screens;
    const kind = kindEntry.slug;

    // URL scheme.
    const urls = [
      "/",
      "/pricing",
      "/screens",
      `/${group.slug}`,
      `/${group.slug}/${kind}`,
      `/${group.slug}/${kind}/${first.slug}`,
      `/preview/${kind}/${first.slug}`,
      "/demo",
      "/r/registry.json",
      `/api/screens/source/${kind}/${first.slug}`,
      "/llms.txt",
      `/llms-screens.mdx/${group.slug}/${kind}/${first.slug}`,
      "/docs",
      "/docs/wiring",
    ];
    for (const url of urls) check((await status(url)) === 200, `${url} answers 200`);
    check((await status(`/c/${kind}/${first.slug}`)) === 404, "old /c/ address is gone (404, no redirect)");

    // Source API.
    const source = (await (await fetch(`${BASE}/api/screens/source/${kind}/${first.slug}`)).json()) as {
      files: { path: string; html: string }[];
    };
    check(
      JSON.stringify(source.files.map((f) => f.path)) === JSON.stringify(first.files) && source.files.every((f) => f.html.length > 0),
      "source API returns the screen's files, highlighted",
    );

    const page = await browser.newPage({ viewport: { width: 1512, height: 982 } });
    const errors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(`${m.location().url}: ${m.text()}`);
    });
    page.on("pageerror", (e) => errors.push(`uncaught: ${e.message}`));

    // Galleries.
    await page.goto(`${BASE}/${group.slug}/${kind}`, { waitUntil: "networkidle" });
    const kindLinks = await page.$$eval(`a[href^="/${group.slug}/${kind}/"]`, (as) => [...new Set(as.map((a) => a.getAttribute("href")))]);
    check(kindLinks.length === kindEntry.screens.length, `/${group.slug}/${kind} lists its ${kindEntry.screens.length} screens (found ${kindLinks.length})`);
    await page.goto(`${BASE}/screens`, { waitUntil: "networkidle" });
    const allLinks = await page.$$eval("a[href]", (as) =>
      [...new Set(as.map((a) => a.getAttribute("href") ?? "").filter((h) => h.startsWith("/") && h.split("/").filter(Boolean).length === 3 && !h.startsWith("/docs")))],
    );
    check(allLinks.length === manifest.totals.screens, `/screens lists all ${manifest.totals.screens} screens (found ${allLinks.length})`);

    // Screen page: the iframe shows the screen.
    await page.goto(`${BASE}/${group.slug}/${kind}/${first.slug}`, { waitUntil: "load" });
    const frame = await screenFrame(page);
    check(await waitForScreen(frame, kind, first.slug), `iframe shows ${kind}/${first.slug}`);
    await frame.evaluate(() => {
      (window as unknown as { __wfSameDocument: boolean }).__wfSameDocument = true;
    });

    // Next screen: messaged, not reloaded.
    await page.click(`a[aria-label="Go to ${second.title}"]`);
    await page.waitForURL(`**/${group.slug}/${kind}/${second.slug}`, { timeout: TIMEOUT_MS });
    check(await waitForScreen(frame, kind, second.slug), `moving to ${kind}/${second.slug} switches the iframe's screen`);
    check(
      await frame.evaluate(() => (window as unknown as { __wfSameDocument?: boolean }).__wfSameDocument === true),
      "the iframe was not reloaded (same document)",
    );

    // Theme.
    const darkBefore = await frame.evaluate(() => document.documentElement.classList.contains("dark"));
    // The preview toolbar's theme button (the screen page has no navbar switch).
    await page.locator('button[aria-label^="Switch to"]:visible').first().click();
    const themed = await frame
      .waitForFunction((was) => document.documentElement.classList.contains("dark") !== was, darkBefore, { timeout: TIMEOUT_MS })
      .then(
        () => true,
        () => false,
      );
    check(themed, "the site's theme switch reaches the iframe");

    // Palette: the toolbar's accent palette reaches the iframe.
    await page.getByRole("button", { name: "Accent palette" }).click();
    await page.getByRole("menuitemradio", { name: "Indigo" }).click();
    check(
      await frame
        .waitForFunction(() => document.documentElement.getAttribute("data-palette") === "indigo", null, { timeout: TIMEOUT_MS })
        .then(() => true, () => false),
      "the toolbar's palette reaches the iframe",
    );

    // Direction: right to left, without a reload.
    await page.getByRole("button", { name: "RTL layout" }).click();
    check(
      await frame
        .waitForFunction(() => document.querySelector('[dir="rtl"]') !== null, null, { timeout: TIMEOUT_MS })
        .then(() => true, () => false),
      "the toolbar's direction switch lays the screen out right to left",
    );
    await page.getByRole("button", { name: "RTL layout" }).click();

    // Generated reference on the screen page.
    for (const id of ["installation", "usage", "props", "backend-contract", "dependencies"]) {
      check((await page.locator(`h2#${id}`).count()) === 1, `the screen page has its "${id}" reference section`);
    }

    // State: a screen that declares states switches between them.
    const stated = manifest.groups
      .flatMap((g) => g.kinds.flatMap((k) => k.screens.map((sc) => ({ g, k, sc }))))
      .find(({ sc }) => sc.states.includes("loading"));
    if (stated) {
      await page.goto(`${BASE}/${stated.g.slug}/${stated.k.slug}/${stated.sc.slug}`, { waitUntil: "load" });
      const statedFrame = await screenFrame(page);
      await waitForScreen(statedFrame, stated.k.slug, stated.sc.slug);
      await page.getByRole("button", { name: "Screen state" }).click();
      await page.getByRole("menuitemradio", { name: "Loading" }).click();
      check(
        await statedFrame
          .waitForFunction(() => new URLSearchParams(window.location.search).get("state") === "loading", null, { timeout: TIMEOUT_MS })
          .then(() => true, () => false),
        `the toolbar's state control shows ${stated.k.slug}/${stated.sc.slug} loading`,
      );
    } else {
      check(false, "a screen declares a loading state (none found to test the state control)");
    }

    // Landing copy: no hard-coded screen count.
    const home = await (await fetch(`${BASE}/`)).text();
    check(!new RegExp(`\\b${manifest.totals.screens}\\b (responsive|screens)`).test(home), "the landing page does not state a screen count");

    // Docs toolkit: ComponentPreview embeds the runtime, ComponentInstallation shows the registry command.
    await page.goto(`${BASE}/docs/installation`, { waitUntil: "load" });
    // The preview mounts once it scrolls into view.
    await page.locator("#component-preview").first().scrollIntoViewIfNeeded({ timeout: TIMEOUT_MS }).catch(() => null);
    const docsPreview = await page.waitForSelector('iframe[title="Team members preview"]', { timeout: TIMEOUT_MS }).catch(() => null);
    const docsFrame = await docsPreview?.contentFrame();
    check(Boolean(docsFrame && (await waitForScreen(docsFrame, "tables", "members"))), "docs ComponentPreview shows the screen from the runtime");
    const command = await page
      .getByText("npx shadcn@latest add https://wirefront.mantavyam.in/r/tables-members.json")
      .first()
      .isVisible({ timeout: TIMEOUT_MS })
      .catch(() => false);
    check(command, "docs ComponentInstallation shows the screen's shadcn command");

    check(errors.length === 0, `no console errors or uncaught exceptions${errors.length ? `:\n    ${errors.join("\n    ")}` : ""}`);
  } finally {
    await browser.close();
    server.kill();
  }

  if (failures.length > 0) {
    console.error(`\nSite checks failed (${failures.length}):\n  ${failures.join("\n  ")}`);
    process.exit(1);
  }
  console.log("\nSite checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
