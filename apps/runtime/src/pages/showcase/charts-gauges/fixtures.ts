// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { Objective } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const listObjectives: Objective[] = [
  {
    id: "uptime",
    name: "API uptime",
    value: 99.94,
    target: 99.9,
    unit: "%",
    direction: "higher",
    detail: "30-day rolling · 13 incidents",
  },
  {
    id: "latency",
    name: "P95 latency",
    value: 248,
    target: 300,
    unit: "ms",
    direction: "lower",
    max: 600,
    detail: "All regions · /v3 endpoints",
  },
  {
    id: "budget",
    name: "Error budget left",
    value: 64,
    target: 50,
    unit: "%",
    direction: "higher",
    detail: "Burned 36% this quarter",
  },
];
