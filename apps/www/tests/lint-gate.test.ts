// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
/** The lint ratchet: existing debt may shrink, never grow (scripts/lint-gate.ts). */
import { describe, expect, it } from "vitest";
import { compare, countDiagnostics } from "../../../scripts/lint-gate";

const diag = (path: string, category: string, severity = "error") => ({ category, severity, location: { path } });

describe("lint gate", () => {
  it("counts errors and warnings per file and rule, ignoring infos", () => {
    expect(
      countDiagnostics([diag("a.tsx", "lint/x"), diag("a.tsx", "lint/x", "warning"), diag("a.tsx", "lint/y", "information"), diag("b.tsx", "lint/z")]),
    ).toEqual({ "a.tsx": { "lint/x": 2 }, "b.tsx": { "lint/z": 1 } });
  });

  it("passes when nothing changed", () => {
    const counts = { "a.tsx": { "lint/x": 2 } };
    expect(compare(counts, counts)).toEqual({ regressions: [], improvements: [] });
  });

  it("flags a new problem in a file, a new rule and a new file", () => {
    const { regressions } = compare({ "a.tsx": { "lint/x": 1 } }, { "a.tsx": { "lint/x": 2, "lint/y": 1 }, "b.tsx": { "lint/z": 1 } });
    expect(regressions).toEqual(["a.tsx: lint/x 1 → 2", "a.tsx: lint/y 0 → 1", "b.tsx: lint/z 0 → 1"]);
  });

  it("reports fixed problems so the baseline can be tightened", () => {
    const { regressions, improvements } = compare({ "a.tsx": { "lint/x": 2 } }, {});
    expect(regressions).toEqual([]);
    expect(improvements).toEqual(["a.tsx: lint/x 2 → 0"]);
  });
});
