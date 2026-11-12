#!/usr/bin/env tsx
// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
/**
 * Visual regression check: capture every design (light and dark) exactly as
 * `npm run snapshot` does and compare it with the committed preview.
 *
 *   npm run test:visual
 *   npm run test:visual -- --design=tables/members,charts/donut
 *
 * A screen fails when more than MAX_DIFF_RATIO of its pixels differ
 * (pixelmatch, anti-aliasing ignored), or when the sizes differ. Canvas
 * areas (endless particle animations) are left out of the comparison. For
 * every failure a diff image is written to .visual-diff/. When a change is
 * intended, update the previews with `npm run snapshot` and commit them.
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

import type { Rect } from "./lib/capture";
import { PREVIEW_SCALE, previewFile, previewTasks, runCaptures, taskKey } from "./lib/previews";

const DIFF_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../.visual-diff");
const MAX_DIFF_RATIO = 0.001;
const only = process.argv.find((a) => a.startsWith("--design="))?.split("=")[1]?.split(",");

/** Blank the given CSS-pixel rectangles so they don't count as differences. */
function blank(img: PNG, rects: Rect[]): void {
  for (const r of rects) {
    const x0 = Math.max(0, Math.floor(r.x * PREVIEW_SCALE));
    const y0 = Math.max(0, Math.floor(r.y * PREVIEW_SCALE));
    const x1 = Math.min(img.width, Math.ceil((r.x + r.width) * PREVIEW_SCALE));
    const y1 = Math.min(img.height, Math.ceil((r.y + r.height) * PREVIEW_SCALE));
    for (let y = y0; y < y1; y++) img.data.fill(0, (y * img.width + x0) * 4, (y * img.width + x1) * 4);
  }
}

async function main(): Promise<void> {
  rmSync(DIFF_DIR, { recursive: true, force: true });
  const failures = await runCaptures("visual", previewTasks(only), async (task, { png, canvases }) => {
    const key = taskKey(task);
    const file = previewFile(task);
    if (!existsSync(file)) {
      process.stdout.write(`[visual] ✗ ${key}: no committed preview (run npm run snapshot)\n`);
      return false;
    }
    const expected = PNG.sync.read(readFileSync(file));
    const actual = PNG.sync.read(png);
    if (expected.width !== actual.width || expected.height !== actual.height) {
      process.stdout.write(`[visual] ✗ ${key}: size ${actual.width}x${actual.height} vs preview ${expected.width}x${expected.height}\n`);
      return false;
    }
    blank(expected, canvases);
    blank(actual, canvases);
    const diff = new PNG({ width: actual.width, height: actual.height });
    const changed = pixelmatch(expected.data, actual.data, diff.data, actual.width, actual.height, { threshold: 0.1 });
    const ratio = changed / (actual.width * actual.height);
    if (ratio > MAX_DIFF_RATIO) {
      mkdirSync(DIFF_DIR, { recursive: true });
      writeFileSync(resolve(DIFF_DIR, `${task.category}__${task.design}--${task.mode}.png`), PNG.sync.write(diff));
      process.stdout.write(`[visual] ✗ ${key}: ${(ratio * 100).toFixed(2)}% of pixels changed (diff in .visual-diff/)\n`);
      return false;
    }
    return true;
  });
  process.exit(failures.length ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
