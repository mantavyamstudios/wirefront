#!/usr/bin/env tsx
// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
/**
 * Lint ratchet: existing lint debt may only shrink.
 *
 *   npm run lint:gate        # fail if any file has more errors/warnings of a rule than the baseline
 *   npm run lint:baseline    # record the current counts (run after fixing lint debt)
 *
 * lint-baseline.json holds, per file and rule, how many Biome errors and
 * warnings existed. New problems fail the gate; fixed ones must be locked
 * in with `npm run lint:baseline` so they can't come back. The full report
 * is always available with `npm run lint`.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BASELINE = resolve(ROOT, "lint-baseline.json");

/** file → rule → count of errors and warnings */
export type Counts = Record<string, Record<string, number>>;

interface Diagnostic {
  category: string;
  severity: string;
  location: { path: string };
}

export function countDiagnostics(diagnostics: Diagnostic[]): Counts {
  const counts: Counts = {};
  for (const d of diagnostics) {
    if (d.severity !== "error" && d.severity !== "warning") continue;
    const file = (counts[d.location.path] ??= {});
    file[d.category] = (file[d.category] ?? 0) + 1;
  }
  return sortCounts(counts);
}

function sortCounts(counts: Counts): Counts {
  return Object.fromEntries(
    Object.keys(counts)
      .sort()
      .map((f) => [f, Object.fromEntries(Object.entries(counts[f] ?? {}).sort(([a], [b]) => a.localeCompare(b)))]),
  );
}

export interface Comparison {
  /** Problems that are new or more frequent than the baseline. */
  regressions: string[];
  /** Problems that were fixed but are still in the baseline. */
  improvements: string[];
}

export function compare(baseline: Counts, current: Counts): Comparison {
  const regressions: string[] = [];
  const improvements: string[] = [];
  const files = new Set([...Object.keys(baseline), ...Object.keys(current)]);
  for (const file of [...files].sort()) {
    const rules = new Set([...Object.keys(baseline[file] ?? {}), ...Object.keys(current[file] ?? {})]);
    for (const rule of [...rules].sort()) {
      const before = baseline[file]?.[rule] ?? 0;
      const now = current[file]?.[rule] ?? 0;
      if (now > before) regressions.push(`${file}: ${rule} ${before} → ${now}`);
      else if (now < before) improvements.push(`${file}: ${rule} ${before} → ${now}`);
    }
  }
  return { regressions, improvements };
}

function runBiome(): Counts {
  const result = spawnSync("npx", ["biome", "lint", "--reporter=json", "--max-diagnostics=none"], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  const start = result.stdout.indexOf("{");
  if (start === -1) {
    throw new Error(`Biome produced no JSON report (exit ${result.status}):\n${result.stderr}`);
  }
  const report = JSON.parse(result.stdout.slice(start)) as { diagnostics: Diagnostic[] };
  return countDiagnostics(report.diagnostics);
}

const total = (c: Counts) => Object.values(c).reduce((n, rules) => n + Object.values(rules).reduce((a, b) => a + b, 0), 0);

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const current = runBiome();
  if (process.argv.includes("--update")) {
    writeFileSync(BASELINE, `${JSON.stringify(current, null, 2)}\n`);
    console.log(`lint baseline: ${total(current)} errors and warnings in ${Object.keys(current).length} files recorded.`);
  } else {
    if (!existsSync(BASELINE)) {
      console.error("lint-baseline.json is missing. Run `npm run lint:baseline`.");
      process.exit(1);
    }
    const baseline = JSON.parse(readFileSync(BASELINE, "utf8")) as Counts;
    const { regressions, improvements } = compare(baseline, current);
    if (regressions.length) {
      console.error(`Lint gate: ${regressions.length} new lint problem(s). Run \`npm run lint\` for details:\n  ${regressions.join("\n  ")}`);
      process.exit(1);
    }
    if (improvements.length) {
      console.error(
        `Lint gate: ${improvements.length} lint problem(s) fixed. Lock the progress in with \`npm run lint:baseline\` and commit lint-baseline.json:\n  ${improvements.join("\n  ")}`,
      );
      process.exit(1);
    }
    console.log(`Lint gate: no new problems (${total(current)} known, tracked in lint-baseline.json).`);
  }
}
