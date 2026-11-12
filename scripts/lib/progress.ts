// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
/**
 * Progress tracking and slow-test alerts for long-running checks.
 *
 * Each check reports when it starts and finishes a unit of work (a screen, a
 * template). The tracker:
 * - writes a live status file, .test-status/<check>.json (done/total,
 *   what's running and for how long, recent alerts), so the state of a run
 *   can be read at any moment;
 * - prints an `[alert]` line when a unit runs longer than `slowUnitMs`
 *   (repeated every further `slowUnitMs`), and when no unit has finished for
 *   `stallMs`, so whoever watches the output can step in.
 *
 * Alerts never stop a check; limits and failures are the check's own job.
 * Watch a run with: grep --line-buffered "\[alert\]\|\[done\]" on its output.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const STATUS_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../../.test-status");

export interface ProgressOptions {
  total: number;
  /** A single unit taking longer than this raises an alert. */
  slowUnitMs: number;
  /** No unit finishing for this long raises an alert. */
  stallMs: number;
  /** How often the watchdog checks. Mostly for tests. */
  tickMs?: number;
  /** Where alerts go (defaults to stdout). */
  emit?: (line: string) => void;
  /** Write .test-status/<check>.json (defaults to true). */
  statusFile?: boolean;
  now?: () => number;
}

export interface Progress {
  start(unit: string): void;
  done(unit: string, ok?: boolean): void;
  finish(summary: string): void;
  readonly alerts: string[];
}

export function trackProgress(check: string, opts: ProgressOptions): Progress {
  const now = opts.now ?? Date.now;
  const emit = opts.emit ?? ((line: string) => process.stdout.write(`${line}\n`));
  const started = now();
  const running = new Map<string, { since: number; alertedAt: number }>();
  const alerts: string[] = [];
  let done = 0;
  let failed = 0;
  let lastFinish = started;
  let stallAlertedAt = 0;

  const writeStatus = (state: "running" | "finished", summary?: string) => {
    if (opts.statusFile === false) return;
    mkdirSync(STATUS_DIR, { recursive: true });
    const t = now();
    writeFileSync(
      resolve(STATUS_DIR, `${check}.json`),
      `${JSON.stringify(
        {
          check,
          state,
          summary,
          done,
          failed,
          total: opts.total,
          elapsedS: Math.round((t - started) / 1000),
          running: [...running].map(([unit, r]) => ({ unit, forS: Math.round((t - r.since) / 1000) })),
          alerts: alerts.slice(-20),
          updatedAt: new Date(t).toISOString(),
        },
        null,
        2,
      )}\n`,
    );
  };

  const alert = (msg: string) => {
    const line = `[alert] ${check}: ${msg}`;
    alerts.push(line);
    emit(line);
    writeStatus("running");
  };

  const check_ = () => {
    const t = now();
    for (const [unit, r] of running) {
      if (t - r.since >= opts.slowUnitMs && t - r.alertedAt >= opts.slowUnitMs) {
        r.alertedAt = t;
        alert(`${unit} has been running for ${Math.round((t - r.since) / 1000)}s (slow threshold ${opts.slowUnitMs / 1000}s)`);
      }
    }
    if (running.size > 0 && t - lastFinish >= opts.stallMs && t - stallAlertedAt >= opts.stallMs) {
      stallAlertedAt = t;
      alert(`no progress for ${Math.round((t - lastFinish) / 1000)}s (${done}/${opts.total} done; running: ${[...running.keys()].join(", ")})`);
    }
  };

  const timer = setInterval(check_, opts.tickMs ?? 5_000);
  timer.unref();
  writeStatus("running");

  return {
    alerts,
    start(unit) {
      running.set(unit, { since: now(), alertedAt: 0 });
      writeStatus("running");
    },
    done(unit, ok = true) {
      running.delete(unit);
      done += 1;
      if (!ok) failed += 1;
      lastFinish = now();
      writeStatus("running");
    },
    finish(summary) {
      clearInterval(timer);
      writeStatus("finished", summary);
      emit(`[done] ${check}: ${summary}`);
    },
  };
}
