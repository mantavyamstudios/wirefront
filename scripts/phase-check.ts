#!/usr/bin/env tsx
// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
/**
 * The phase-tier checks (TESTING.md), one after another:
 *
 *   npm run test:phase
 *
 * bundle budget → install → browser → responsive audit → visual. Every check starts and
 * retires its own server, so only one runs at a time. All checks run even if
 * one fails; the summary lists each result and the exit code is non-zero if
 * any failed. Output streams through, including `[alert]` lines.
 */
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { trackProgress } from "./lib/progress";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHECKS: [name: string, args: string[]][] = [
  ["bundle", ["run", "test:bundle"]],
  ["install", ["run", "test:install"]],
  ["browser", ["run", "test:browser"]],
  ["responsive", ["run", "audit:responsive", "--", "--strict"]],
  ["visual", ["run", "test:visual"]],
];

function runCheck(args: string[]): Promise<number> {
  return new Promise((ok) => {
    const child = spawn("npm", args, { cwd: ROOT, stdio: ["ignore", "inherit", "inherit"] });
    child.on("close", (code) => ok(code ?? 1));
    child.on("error", () => ok(1));
  });
}

async function main(): Promise<void> {
  const progress = trackProgress("phase", { total: CHECKS.length, slowUnitMs: 20 * 60_000, stallMs: 30 * 60_000 });
  const results: string[] = [];
  for (const [name, args] of CHECKS) {
    const started = Date.now();
    progress.start(name);
    const code = await runCheck(args);
    progress.done(name, code === 0);
    results.push(`${code === 0 ? "✓" : "✗"} ${name} (${Math.round((Date.now() - started) / 1000)}s)`);
  }
  const failed = results.filter((r) => r.startsWith("✗")).length;
  progress.finish(`${results.join(" · ")}${failed ? ` — ${failed} failed` : ""}`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
