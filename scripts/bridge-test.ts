#!/usr/bin/env tsx
// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
/**
 * The site ⇄ runtime message bridge (@wirefront/bridge), in a real browser.
 *
 *   bun run test:bridge
 *
 * A same-origin host page embeds one runtime iframe and drives it the way the
 * site does. Each failure mode the site depends on is checked:
 * - the runtime announces the screen it mounted (wf:ready with its ids);
 * - wf:navigate switches screens without reloading the document;
 * - wf:theme, wf:state and wf:dir reach the iframe's DOM / URL;
 * - wf:reset remounts the screen and announces it again;
 * - an unknown screen answers wf:error instead of staying silent;
 * - malformed messages are ignored.
 */
import { chromium, type Frame, type Page } from "playwright";
import { withAppServer } from "./lib/app-server";
import { readDesignMeta } from "./lib/registry-meta";

const TIMEOUT_MS = 30_000;

interface Seen {
  type: string;
  category?: string;
  design?: string;
  message?: string;
}

const failures: string[] = [];
function check(ok: boolean, what: string) {
  console.log(`${ok ? "✓" : "✗"} ${what}`);
  if (!ok) failures.push(what);
}

/** Waits for a message from the runtime whose fields all equal `match`'s, received after index `after`. */
async function waitForMessage(page: Page, match: Partial<Seen>, after: number): Promise<Seen | null> {
  try {
    const handle = await page.waitForFunction(
      ([after, match]) => {
        const seen = (window as unknown as { __seen: Seen[] }).__seen.slice(after);
        return seen.find((m) => Object.entries(match).every(([k, v]) => m[k as keyof Seen] === v)) ?? null;
      },
      [after, match] as const,
      { timeout: TIMEOUT_MS },
    );
    return (await handle.jsonValue()) as Seen;
  } catch {
    return null;
  }
}

const seenCount = (page: Page) => page.evaluate(() => (window as unknown as { __seen: unknown[] }).__seen.length);
const post = (page: Page, message: unknown) =>
  page.evaluate((m) => {
    const frame = document.querySelector("iframe") as HTMLIFrameElement;
    frame.contentWindow?.postMessage(m, window.location.origin);
  }, message);

function runtimeFrame(page: Page): Frame {
  const frame = page.frames().find((f) => f !== page.mainFrame());
  if (!frame) throw new Error("the runtime iframe is missing");
  return frame;
}

const withStates = readDesignMeta().find((d) => (d.states?.length ?? 0) > 1 && d.states?.includes("loading"));

await withAppServer("bridge", async (url) => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const pageErrors: string[] = [];
    page.on("pageerror", (e) => pageErrors.push(String(e).split("\n")[0] ?? ""));

    // A plain same-origin host document, served by the test itself, so no app code runs around the iframe.
    const host = `${url}/__bridge-host`;
    await page.route(host, (route) =>
      route.fulfill({
        contentType: "text/html",
        body: `<!doctype html><html><body style="margin:0"><script>
          window.__seen = [];
          window.addEventListener("message", (e) => {
            if (e.origin === location.origin && e.data && typeof e.data.type === "string") window.__seen.push(e.data);
          });
        </script><iframe src="/preview/tables/members" style="width:1280px;height:800px;border:0"></iframe></body></html>`,
      }),
    );
    await page.goto(host, { waitUntil: "domcontentloaded" });

    const first = await waitForMessage(page, { type: "wf:ready", category: "tables", design: "members" }, 0);
    check(first !== null, "runtime announces the first screen (wf:ready tables/members)");

    await runtimeFrame(page).evaluate(() => {
      (window as unknown as { __sameDocument: boolean }).__sameDocument = true;
    });

    let mark = await seenCount(page);
    await post(page, { type: "wf:navigate", category: "auth", design: "sign-in" });
    const switched = await waitForMessage(page, { type: "wf:ready", category: "auth", design: "sign-in" }, mark);
    check(switched !== null, "wf:navigate switches to auth/sign-in and announces it");
    const frame = runtimeFrame(page);
    check(
      await frame.evaluate(() => (window as unknown as { __sameDocument?: boolean }).__sameDocument === true),
      "switching screens keeps the same document (no reload)",
    );
    check(new URL(frame.url()).pathname === "/preview/auth/sign-in", "iframe URL follows the screen");

    await post(page, { type: "wf:theme", mode: "dark", palette: "crimson" });
    await frame
      .waitForFunction(() => document.documentElement.classList.contains("dark") && document.documentElement.dataset.palette === "crimson", null, { timeout: TIMEOUT_MS })
      .catch(() => null);
    check(await frame.evaluate(() => document.documentElement.classList.contains("dark")), "wf:theme dark reaches the iframe");
    check(await frame.evaluate(() => document.documentElement.dataset.palette === "crimson"), "wf:theme palette reaches the iframe");
    await post(page, { type: "wf:theme", mode: "light", palette: "graphite" });
    await frame.waitForFunction(() => !document.documentElement.classList.contains("dark"), null, { timeout: TIMEOUT_MS }).catch(() => null);
    check(await frame.evaluate(() => !document.documentElement.classList.contains("dark")), "wf:theme light reaches the iframe");

    await post(page, { type: "wf:dir", dir: "rtl" });
    await frame.waitForSelector('[dir="rtl"]', { timeout: TIMEOUT_MS }).catch(() => null);
    check((await frame.$('[dir="rtl"]')) !== null, "wf:dir rtl lays the screen out right to left");
    await post(page, { type: "wf:dir", dir: "ltr" });
    await frame.waitForFunction(() => !document.querySelector('[dir="rtl"]'), null, { timeout: TIMEOUT_MS }).catch(() => null);
    check(await frame.evaluate(() => !document.querySelector('[dir="rtl"]')), "wf:dir ltr restores left to right");

    if (withStates) {
      mark = await seenCount(page);
      await post(page, { type: "wf:navigate", category: withStates.category, design: withStates.slug });
      await waitForMessage(page, { type: "wf:ready", category: withStates.category, design: withStates.slug }, mark);
      await post(page, { type: "wf:state", state: "loading" });
      await frame.waitForURL(/state=loading/, { timeout: TIMEOUT_MS }).catch(() => null);
      check(/state=loading/.test(frame.url()), `wf:state loading reaches ${withStates.category}/${withStates.slug}`);
      await post(page, { type: "wf:state", state: "ready" });
      await frame.waitForURL((u) => !u.searchParams.has("state"), { timeout: TIMEOUT_MS }).catch(() => null);
      check(!new URL(frame.url()).searchParams.has("state"), "wf:state ready clears the state");
    } else {
      check(false, "a design with a loading state exists to test wf:state");
    }

    mark = await seenCount(page);
    await post(page, { type: "wf:reset" });
    check((await waitForMessage(page, { type: "wf:ready" }, mark)) !== null, "wf:reset remounts and announces again");

    mark = await seenCount(page);
    await post(page, { type: "wf:navigate", category: "tables", design: "no-such-screen" });
    const error = await waitForMessage(page, { type: "wf:error" }, mark);
    check(error !== null, "an unknown screen answers wf:error");

    mark = await seenCount(page);
    await post(page, { type: "wf:navigate", category: 42 });
    await post(page, { type: "wf:theme", mode: "sepia", palette: "graphite" });
    await page.waitForTimeout(500);
    check((await seenCount(page)) === mark, "malformed messages are ignored");

    check(pageErrors.length === 0, `no page errors${pageErrors.length ? `: ${pageErrors.join(" | ")}` : ""}`);
  } finally {
    await browser.close();
  }
});

if (failures.length > 0) {
  console.error(`\n${failures.length} bridge check(s) failed.`);
  process.exit(1);
}
console.log("\nBridge checks passed.");
