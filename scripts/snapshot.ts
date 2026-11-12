#!/usr/bin/env tsx
// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
/**
 * Capture the homepage previews of every design, light and dark, into
 * apps/www/public/previews/<category>__<design>--<mode>.png. These committed
 * previews are also the baseline `npm run test:visual` compares against.
 *
 *   npm run snapshot                              # all designs
 *   npm run snapshot -- --design=tables/members   # some designs
 *   SNAPSHOT_ONLY_MISSING=1 npm run snapshot      # only designs without previews
 *
 * Starts its own fresh app server and retires it afterwards; captures are
 * deterministic and taken only once each screen has settled
 * (scripts/lib/previews.ts). CAPTURE_CONCURRENCY sets the number of
 * parallel pages (default 4).
 */
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";

import { PREVIEWS_DIR, previewFile, previewTasks, runCaptures } from "./lib/previews";

const only = process.argv.find((a) => a.startsWith("--design="))?.split("=")[1]?.split(",");
const onlyMissing = process.env.SNAPSHOT_ONLY_MISSING === "1";

async function main(): Promise<void> {
  await mkdir(PREVIEWS_DIR, { recursive: true });
  const tasks = previewTasks(only).filter((t) => !onlyMissing || !existsSync(previewFile(t)));
  if (tasks.length === 0) {
    console.log("[snapshot] nothing to capture.");
    return;
  }
  const failures = await runCaptures("snapshot", tasks, async (task, { png }) => {
    await writeFile(previewFile(task), png);
    return true;
  });
  process.exit(failures.length ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
