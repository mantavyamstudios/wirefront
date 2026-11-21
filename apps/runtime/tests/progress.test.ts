// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
/** Slow-test alerts for long-running checks (scripts/lib/progress.ts). */
import { afterEach, describe, expect, it, vi } from "vitest";
import { trackProgress } from "../../../scripts/lib/progress";

afterEach(() => {
  vi.useRealTimers();
});

function setup(slowUnitMs: number, stallMs: number) {
  vi.useFakeTimers();
  let t = 0;
  const lines: string[] = [];
  const p = trackProgress("unit-test", {
    total: 3,
    slowUnitMs,
    stallMs,
    tickMs: 100,
    now: () => t,
    emit: (l) => lines.push(l),
    statusFile: false,
  });
  const advance = (ms: number) => {
    t += ms;
    vi.advanceTimersByTime(ms);
  };
  return { p, lines, advance };
}

describe("progress alerts", () => {
  it("stays quiet while units finish in time", () => {
    const { p, lines, advance } = setup(1_000, 5_000);
    p.start("a");
    advance(500);
    p.done("a");
    p.start("b");
    advance(900);
    p.done("b");
    expect(lines).toEqual([]);
  });

  it("alerts when one unit runs past the slow threshold, and again if it keeps running", () => {
    const { p, lines, advance } = setup(1_000, 60_000);
    p.start("slow-screen");
    advance(1_100);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/^\[alert\] unit-test: slow-screen has been running for 1s/);
    advance(500);
    expect(lines).toHaveLength(1);
    advance(600);
    expect(lines).toHaveLength(2);
  });

  it("alerts when nothing has finished for the stall threshold", () => {
    const { p, lines, advance } = setup(60_000, 2_000);
    p.start("a");
    p.start("b");
    advance(2_100);
    expect(lines.some((l) => /no progress for 2s \(0\/3 done; running: a, b\)/.test(l))).toBe(true);
  });

  it("prints a done line with the summary when finished", () => {
    const { p, lines } = setup(1_000, 1_000);
    p.finish("3/3 ok");
    expect(lines).toEqual(["[done] unit-test: 3/3 ok"]);
  });
});
