#!/usr/bin/env tsx
// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
/**
 * Lint ratchet: lint errors may only shrink; warnings are reported, never fatal.
 *
 *   bun run lint:gate        # fail if any file has more errors of a rule than the baseline
 *   bun run lint:baseline    # record the current error counts (run after fixing lint debt)
 *
 * lint-baseline.json holds, per file and rule, how many Biome errors exist.
 * New errors fail the gate; fixed ones must be locked in with
 * `bun run lint:baseline` so they can't come back. Every warning is printed
 * (as a GitHub annotation in CI) and leaves the exit code alone. The full
 * report is always available with `bun run lint`.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BASELINE = resolve(ROOT, "lint-baseline.json");

/** file → rule → count of errors */
export type Counts = Record<string, Record<string, number>>;

interface Diagnostic {
  category: string;
  severity: string;
  message?: string;
  location: { path: string; start?: { line: number; column: number } };
}

export function countDiagnostics(diagnostics: Diagnostic[]): Counts {
  const counts: Counts = {};
  for (const d of diagnostics) {
    if (d.severity !== "error") continue;
    const file = counts[d.location.path] ?? {};
    counts[d.location.path] = file;
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

/** One line per warning: `path:line:column rule: message`. */
export function warningLines(diagnostics: Diagnostic[]): string[] {
  return diagnostics
    .filter((d) => d.severity === "warning")
    .map((d) => `${d.location.path}:${d.location.start?.line ?? 1}:${d.location.start?.column ?? 1} ${d.category}: ${d.message ?? ""}`.trim());
}

function reportWarnings(diagnostics: Diagnostic[]): void {
  const warnings = diagnostics.filter((d) => d.severity === "warning");
  if (warnings.length === 0) return;
  console.warn(`Lint gate: ${warnings.length} warning(s), reported and not fatal:\n  ${warningLines(warnings).join("\n  ")}`);
  if (process.env.GITHUB_ACTIONS === "true") {
    for (const d of warnings) {
      const line = d.location.start?.line ?? 1;
      const col = d.location.start?.column ?? 1;
      console.log(`::warning file=${d.location.path},line=${line},col=${col},title=${d.category}::${d.message ?? d.category}`);
    }
  }
}

function runBiome(): Diagnostic[] {
  const result = spawnSync("bunx", ["biome", "lint", "--reporter=json", "--max-diagnostics=none"], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  const start = result.stdout.indexOf("{");
  if (start === -1) {
    throw new Error(`Biome produced no JSON report (exit ${result.status}):\n${result.stderr}`);
  }
  const report = JSON.parse(result.stdout.slice(start)) as { diagnostics: Diagnostic[] };
  return report.diagnostics;
}

const total = (c: Counts) => Object.values(c).reduce((n, rules) => n + Object.values(rules).reduce((a, b) => a + b, 0), 0);

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const diagnostics = runBiome();
  const current = countDiagnostics(diagnostics);
  reportWarnings(diagnostics);
  if (process.argv.includes("--update")) {
    writeFileSync(BASELINE, `${JSON.stringify(current, null, 2)}\n`);
    console.log(`lint baseline: ${total(current)} errors in ${Object.keys(current).length} files recorded.`);
  } else {
    if (!existsSync(BASELINE)) {
      console.error("lint-baseline.json is missing. Run `bun run lint:baseline`.");
      process.exit(1);
    }
    const baseline = JSON.parse(readFileSync(BASELINE, "utf8")) as Counts;
    const { regressions, improvements } = compare(baseline, current);
    if (regressions.length) {
      console.error(`Lint gate: ${regressions.length} new lint error(s). Run \`bun run lint\` for details:\n  ${regressions.join("\n  ")}`);
      process.exit(1);
    }
    if (improvements.length) {
      console.error(
        `Lint gate: ${improvements.length} lint problem(s) fixed. Lock the progress in with \`bun run lint:baseline\` and commit lint-baseline.json:\n  ${improvements.join("\n  ")}`,
      );
      process.exit(1);
    }
    console.log(`Lint gate: no new errors (${total(current)} known, tracked in lint-baseline.json).`);
  }
}
