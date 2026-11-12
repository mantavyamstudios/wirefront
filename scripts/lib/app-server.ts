// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
/**
 * Every browser check starts its own app server and retires it as soon as
 * it's done, so checks never measure stale code and never leave servers or
 * ports behind.
 *
 * - Fresh: `vite dev --force` re-optimises dependencies on every start, so a
 *   dependency upgrade can't be hidden behind a stale pre-bundle cache.
 * - Isolated: a free port chosen by the OS, its own process group.
 * - Warm: before the server is handed over, a design page (which imports
 *   every screen) is loaded until a load completes with no reload and the
 *   server log shows no further dependency optimisation, so no check page
 *   is reloaded mid-measurement by Vite's optimiser.
 * - Always retired: `stop()` kills the whole process group (SIGTERM, then
 *   SIGKILL after 5s). It also runs on exit, Ctrl-C, SIGTERM and uncaught
 *   errors, so an interrupted check still cleans up.
 *
 * - Observable: the server's output is kept in .test-status/server-<label>.log,
 *   and any dependency optimisation or reload after warm-up raises an
 *   [alert], so a page that fails mid-check can be traced to the server.
 *
 * Set APP_URL to test an already running server instead (nothing is started
 * or stopped then).
 */
import { type ChildProcess, spawn } from "node:child_process";
import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";
import { createServer } from "node:net";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const WWW = resolve(dirname(fileURLToPath(import.meta.url)), "../../apps/www");
const STATUS_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../../.test-status");
const START_LIMIT_MS = 120_000;
const WARMUP_LIMIT_MS = 180_000;
const WARMUP_QUIET_MS = 3_000;

export interface AppServer {
  url: string;
  stop: () => Promise<void>;
}

function freePort(): Promise<number> {
  return new Promise((ok, fail) => {
    const srv = createServer();
    srv.unref();
    srv.on("error", fail);
    srv.listen(0, "127.0.0.1", () => {
      const address = srv.address();
      const port = typeof address === "object" && address ? address.port : 0;
      srv.close(() => ok(port));
    });
  });
}

async function reachable(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5_000) });
    return res.status < 500;
  } catch {
    return false;
  }
}

const live = new Set<ChildProcess>();

function killGroup(child: ChildProcess, signal: NodeJS.Signals): void {
  if (child.pid === undefined || child.exitCode !== null) return;
  try {
    process.kill(-child.pid, signal); // the whole group: npm, vite and its workers
  } catch {
    try {
      child.kill(signal);
    } catch {
      /* already gone */
    }
  }
}

let hooksInstalled = false;
function installExitHooks(): void {
  if (hooksInstalled) return;
  hooksInstalled = true;
  const retireAll = () => {
    for (const child of live) killGroup(child, "SIGKILL");
  };
  process.on("exit", retireAll);
  for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"] as const) {
    process.on(sig, () => {
      retireAll();
      process.exit(130);
    });
  }
  process.on("uncaughtException", (err) => {
    retireAll();
    console.error(err);
    process.exit(1);
  });
}

/**
 * Load a design page until one load completes with no reload and the server
 * log has been free of dependency optimisation for WARMUP_QUIET_MS.
 */
async function warmUp(url: string, serverLog: () => string): Promise<void> {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    // Count full page loads only: client-side history updates (the router
    // normalising search params) are navigations too, but not reloads.
    let loads = 0;
    page.on("load", () => {
      loads += 1;
    });
    const started = Date.now();
    const optimisations = () => (serverLog().match(/optimiz|reloading/gi) ?? []).length;
    while (Date.now() - started < WARMUP_LIMIT_MS) {
      loads = 0;
      const before = optimisations();
      await page.goto(`${url}/c/tables/members?preview=1`, { waitUntil: "networkidle", timeout: 120_000 });
      await page.waitForTimeout(WARMUP_QUIET_MS);
      if (loads <= 1 && optimisations() === before) return;
    }
    throw new Error(`[server] still reloading after ${WARMUP_LIMIT_MS / 1000}s of warm-up:\n${serverLog().slice(-2000)}`);
  } finally {
    await browser.close();
  }
}

/** Start a fresh app server on a free port; resolve once it serves pages. */
export async function startAppServer(label: string): Promise<AppServer> {
  if (process.env.APP_URL) {
    const url = process.env.APP_URL.replace(/\/$/, "");
    console.log(`[server] ${label}: using APP_URL ${url} (not started or stopped by this check)`);
    return { url, stop: async () => {} };
  }
  installExitHooks();
  const port = await freePort();
  const url = `http://127.0.0.1:${port}`;
  const child = spawn("npx", ["vite", "dev", "--port", String(port), "--strictPort", "--host", "127.0.0.1", "--force"], {
    cwd: WWW,
    detached: true, // own process group, so stop() can kill everything it spawned
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, BROWSER: "none" },
  });
  live.add(child);
  let log = "";
  let warm = false;
  mkdirSync(STATUS_DIR, { recursive: true });
  const logFile = resolve(STATUS_DIR, `server-${label}.log`);
  writeFileSync(logFile, "");
  const keep = (d: Buffer) => {
    const text = d.toString();
    log = (log + text).slice(-20_000);
    appendFileSync(logFile, text);
    if (!warm) return;
    for (const line of text.split("\n")) {
      if (/optimiz|reloading|page reload/i.test(line)) {
        console.log(`[alert] ${label}: dev server after warm-up: ${line.trim()} (pages open now may reload; log: ${logFile})`);
      }
    }
  };
  child.stdout?.on("data", keep);
  child.stderr?.on("data", keep);

  const stop = async () => {
    if (!live.has(child)) return;
    live.delete(child);
    killGroup(child, "SIGTERM");
    const exited = await Promise.race([
      new Promise<boolean>((ok) => child.once("exit", () => ok(true))),
      new Promise<boolean>((ok) => setTimeout(() => ok(false), 5_000)),
    ]);
    if (!exited) killGroup(child, "SIGKILL");
    console.log(`[server] ${label}: retired ${url}`);
  };

  const started = Date.now();
  while (Date.now() - started < START_LIMIT_MS) {
    if (child.exitCode !== null) {
      live.delete(child);
      throw new Error(`[server] ${label}: dev server exited (code ${child.exitCode}) before serving:\n${log.slice(-3000)}`);
    }
    if (await reachable(url)) {
      try {
        await warmUp(url, () => log);
        warm = true;
      } catch (err) {
        await stop();
        throw err;
      }
      console.log(`[server] ${label}: fresh, warm server on ${url} (pid ${child.pid}) after ${Math.round((Date.now() - started) / 1000)}s`);
      return { url, stop };
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  await stop();
  throw new Error(`[server] ${label}: no response from ${url} within ${START_LIMIT_MS / 1000}s:\n${log.slice(-3000)}`);
}

/** Run `fn` with a fresh server and always retire it afterwards. */
export async function withAppServer<T>(label: string, fn: (url: string) => Promise<T>): Promise<T> {
  const server = await startAppServer(label);
  try {
    return await fn(server.url);
  } finally {
    await server.stop();
  }
}
