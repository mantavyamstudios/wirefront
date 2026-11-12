// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
/**
 * Shared runner for preview captures: `npm run snapshot` writes the committed
 * previews and `npm run test:visual` compares fresh captures against them, so
 * both must capture in exactly the same way (viewport, scale, colour scheme,
 * determinism, settle trigger). Each run gets its own fresh app server, which
 * is retired afterwards, and reports progress with slow-screen alerts.
 */
import { resolve } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

import { SOURCE_FILES } from "../../apps/www/src/pages/showcase/source-files";
import { withAppServer } from "./app-server";
import { captureDesign, makeDeterministic, type Rect } from "./capture";
import { trackProgress } from "./progress";

export const PREVIEWS_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../../apps/www/public/previews");
export const PREVIEW_VIEWPORT = { width: 1440, height: 900 };
export const PREVIEW_SCALE = 2;
export const MODES = ["light", "dark"] as const;
export type Mode = (typeof MODES)[number];

export interface PreviewTask {
  category: string;
  design: string;
  mode: Mode;
}

export const previewFile = (t: PreviewTask) => resolve(PREVIEWS_DIR, `${t.category}__${t.design}--${t.mode}.png`);
export const taskKey = (t: PreviewTask) => `${t.category}/${t.design}--${t.mode}`;

/** Every design × colour scheme, optionally limited to `only` (category/design). */
export function previewTasks(only?: string[]): PreviewTask[] {
  return Object.entries(SOURCE_FILES).flatMap(([category, map]) =>
    Object.keys(map ?? {})
      .filter((design) => !only || only.includes(`${category}/${design}`))
      .flatMap((design) => MODES.map((mode) => ({ category, design, mode }))),
  );
}

export type CaptureHandler = (task: PreviewTask, capture: { png: Buffer; canvases: Rect[] }) => Promise<boolean>;

/**
 * Capture every task and pass it to `handle` (which returns false for a
 * failure). Returns the failures. Capture errors (a crashed design, a layout
 * that never settles) are failures too.
 */
export async function runCaptures(check: string, tasks: PreviewTask[], handle: CaptureHandler): Promise<string[]> {
  const concurrency = Math.max(1, Number.parseInt(process.env.CAPTURE_CONCURRENCY ?? "4", 10) || 4);
  const progress = trackProgress(check, { total: tasks.length, slowUnitMs: 30_000, stallMs: 90_000 });
  const failures: string[] = [];

  await withAppServer(check, async (base) => {
    const browser = await chromium.launch();
    try {
      const queue = [...tasks];
      await Promise.all(
        Array.from({ length: concurrency }, async () => {
          for (let t = queue.shift(); t; t = queue.shift()) {
            const key = taskKey(t);
            progress.start(key);
            // One context per capture: Playwright's clock belongs to the context,
            // and sharing one across workers raced clock setup with page closes.
            const context = await browser.newContext({
              viewport: PREVIEW_VIEWPORT,
              deviceScaleFactor: PREVIEW_SCALE,
              colorScheme: t.mode,
            });
            const page = await context.newPage();
            let ok = false;
            try {
              await makeDeterministic(page);
              ok = await handle(t, await captureDesign(page, `${base}/c/${t.category}/${t.design}?preview=1`));
              if (!ok) failures.push(key);
            } catch (err) {
              const msg = err instanceof Error ? (err.message.split("\n")[0] ?? "") : String(err);
              failures.push(`${key}: ${msg}`);
              process.stdout.write(`[${check}] ✗ ${key}: ${msg}\n`);
            } finally {
              await context.close();
              progress.done(key, ok);
            }
          }
        }),
      );
    } finally {
      await browser.close();
    }
  });

  progress.finish(`${tasks.length - failures.length}/${tasks.length} ok${failures.length ? ` — ${failures.length} failed` : ""}`);
  return failures;
}
