#!/usr/bin/env tsx
// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
/**
 * Per-screen bundle budget: what a builder's app ships for each screen.
 *
 *   npm run test:bundle               # fail if a screen outgrew its budget
 *   npm run test:bundle -- --update   # record current sizes in bundle-budget.json
 *
 * Each screen's shipped file (`<file>/view.tsx`, or the flat `<file>.tsx`) is
 * bundled the way an app would bundle it: minified ESM for the browser, with
 * React external (the app provides it) and everything else (Base UI, motion,
 * icons, the Wirefront helpers) included. The gzipped size is compared with
 * bundle-budget.json. A screen fails when it grows past its recorded size by
 * more than 10% plus 2 KB, or when it has no recorded size yet. Shrinking is
 * reported so the budget can be tightened with --update.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { build } from "esbuild";

import { SOURCE_FILES } from "../apps/www/src/pages/showcase/source-files";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SHOWCASE = resolve(ROOT, "apps/www/src/pages/showcase");
const BUDGET_FILE = resolve(ROOT, "bundle-budget.json");
const GROWTH = 0.1;
const SLACK_BYTES = 2048;

const update = process.argv.includes("--update");

const entries = Object.entries(SOURCE_FILES).flatMap(([category, map]) =>
  Object.entries(map ?? {}).map(([slug, file]) => {
    const folder = resolve(SHOWCASE, file, "view.tsx");
    return { key: `${category}/${slug}`, entry: existsSync(folder) ? folder : resolve(SHOWCASE, `${file}.tsx`) };
  }),
);

async function gzippedSize(entry: string): Promise<number> {
  const result = await build({
    entryPoints: [entry],
    bundle: true,
    write: false,
    outfile: "screen.js",
    minify: true,
    format: "esm",
    platform: "browser",
    target: "es2022",
    jsx: "automatic",
    logLevel: "silent",
    external: ["react", "react-dom", "react/jsx-runtime", "react-dom/client"],
    define: { "process.env.NODE_ENV": '"production"' },
    // Showcase-only aliases never appear in shipped files; resolve them anyway so a stray one fails loudly.
    alias: { "@": resolve(ROOT, "apps/www/src") },
  });
  const js = result.outputFiles.find((f) => f.path.endsWith(".js"));
  if (!js) throw new Error(`no JavaScript output for ${entry}`);
  return gzipSync(js.contents).length;
}

async function main() {
  const budget: Record<string, number> = existsSync(BUDGET_FILE) ? JSON.parse(readFileSync(BUDGET_FILE, "utf8")) : {};
  const sizes: Record<string, number> = {};
  const failures: string[] = [];
  const shrunk: string[] = [];
  const started = Date.now();

  for (const { key, entry } of entries) {
    const size = await gzippedSize(entry);
    sizes[key] = size;
    const limit = budget[key];
    if (limit === undefined) {
      if (!update) failures.push(`${key}: ${kb(size)} has no budget yet (run with --update and commit bundle-budget.json)`);
    } else if (size > limit * (1 + GROWTH) + SLACK_BYTES) {
      failures.push(`${key}: ${kb(size)} is over its budget of ${kb(limit)} (+${Math.round(((size - limit) / limit) * 100)}%)`);
    } else if (size < limit * (1 - GROWTH)) {
      shrunk.push(`${key}: ${kb(limit)} → ${kb(size)}`);
    }
  }

  const stale = Object.keys(budget).filter((k) => !(k in sizes));
  const total = Object.values(sizes).reduce((a, b) => a + b, 0);
  const largest = Object.entries(sizes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k, v]) => `${k} ${kb(v)}`);
  console.log(`[bundle] ${entries.length} screens in ${((Date.now() - started) / 1000).toFixed(1)}s; median ${kb(median(Object.values(sizes)))}, total ${kb(total)} gzipped`);
  console.log(`[bundle] largest: ${largest.join(", ")}`);

  if (update) {
    const sorted = Object.fromEntries(Object.entries(sizes).sort(([a], [b]) => a.localeCompare(b)));
    writeFileSync(BUDGET_FILE, `${JSON.stringify(sorted, null, 2)}\n`);
    console.log(`[bundle] recorded ${entries.length} budgets in bundle-budget.json`);
    return;
  }
  for (const s of shrunk) console.log(`[bundle] smaller (tighten with --update): ${s}`);
  for (const s of stale) console.log(`[bundle] budget for a screen that no longer exists (remove with --update): ${s}`);
  if (failures.length) {
    for (const f of failures) console.error(`[bundle] ✗ ${f}`);
    process.exit(1);
  }
  console.log(`[done] bundle: ${entries.length}/${entries.length} screens within budget`);
}

const kb = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`;
function median(values: number[]) {
  const s = [...values].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)] ?? 0;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
