// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { Release } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const now = "2026-04-14T12:00:00Z";

export const getRelease: Release = {
  version: "v3.4.0-rc.2",
  triggeredBy: "maya@acme.dev",
  startedAt: "2026-04-14T11:46:00Z",
  commit: { sha: "f3b9a21", message: "feat(audit): persist 1y retention" },
  steps: [
    {
      id: "build",
      name: "Build",
      state: "done",
      detail: "Built 84 modules · cache hit 92%",
      durationMs: 134000,
    },
    {
      id: "tests",
      name: "Tests",
      state: "done",
      detail: "1,284 tests passed · 0 failed",
      durationMs: 182000,
    },
    {
      id: "staging",
      name: "Staging",
      state: "done",
      detail: "Deployed to staging.acme.dev",
      durationMs: 78000,
      region: "iad",
    },
    {
      id: "canary-5",
      name: "Canary 5%",
      state: "active",
      detail: "Smoke metrics within tolerance",
      startedAt: "2026-04-14T11:53:18Z",
      progress: 0.62,
      region: "iad, sfo",
    },
    {
      id: "canary-25",
      name: "Canary 25%",
      state: "queued",
      detail: "Promotes after canary holds 30m",
    },
    {
      id: "production",
      name: "Production 100%",
      state: "queued",
      detail: "Auto-promote on green",
    },
  ],
};
