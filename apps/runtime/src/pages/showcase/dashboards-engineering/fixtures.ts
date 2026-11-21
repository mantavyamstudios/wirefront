// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { Velocity } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
const MIN = 60;
const HOUR = 3600;

export const getVelocity: Velocity = {
  dora: {
    deployFrequency: { value: 14, change: 0.18, rating: "elite", trend: [9, 11, 10, 12, 11, 13, 14] },
    leadTime: { value: 2 * HOUR + 18 * MIN, change: -0.22, rating: "elite", trend: [180, 174, 165, 160, 152, 144, 138].map((m) => m * MIN) },
    changeFailureRate: { value: 0.042, change: 0.06, rating: "high", trend: [0.032, 0.034, 0.036, 0.038, 0.04, 0.041, 0.042] },
    timeToRestore: { value: 32 * MIN, change: -0.14, rating: "elite", trend: [48, 44, 41, 39, 36, 34, 32].map((m) => m * MIN) },
  },
  prWeeks: [
    { weekStart: "2026-04-27", merged: 38, open: 12, closed: 4 },
    { weekStart: "2026-05-04", merged: 42, open: 14, closed: 3 },
    { weekStart: "2026-05-11", merged: 51, open: 11, closed: 6 },
    { weekStart: "2026-05-18", merged: 47, open: 16, closed: 4 },
    { weekStart: "2026-05-25", merged: 58, open: 12, closed: 5 },
    { weekStart: "2026-06-01", merged: 64, open: 9, closed: 7 },
    { weekStart: "2026-06-08", merged: 61, open: 14, closed: 4 },
    { weekStart: "2026-06-15", merged: 73, open: 10, closed: 6 },
  ],
  ci: {
    passRate: 0.946,
    flakeRate: 0.018,
    avgDurationSeconds: 9 * MIN + 14,
    totalRuns: 8421,
    slowestJobs: [
      { name: "test/e2e", durationSeconds: 9 * MIN + 14 },
      { name: "build/docker", durationSeconds: 6 * MIN + 2 },
      { name: "visual/regression", durationSeconds: 4 * MIN + 41 },
    ],
  },
  contributors: [
    { id: "u1", name: "Maya Okafor", merged: 18, reviewed: 41, leadTimeSeconds: HOUR + 42 * MIN },
    { id: "u2", name: "James Lin", merged: 15, reviewed: 36, leadTimeSeconds: 2 * HOUR + 4 * MIN },
    { id: "u3", name: "Riya Patel", merged: 12, reviewed: 28, leadTimeSeconds: HOUR + 58 * MIN },
    { id: "u4", name: "Dani Kim", merged: 11, reviewed: 22, leadTimeSeconds: 3 * HOUR + 12 * MIN },
    { id: "u5", name: "Mantavyam", merged: 9, reviewed: 18, leadTimeSeconds: 2 * HOUR + 36 * MIN },
  ],
};

const flat = { value: 0, change: 0, rating: "low" as const, trend: [] };
export const emptyVelocity: Velocity = {
  dora: { deployFrequency: flat, leadTime: flat, changeFailureRate: flat, timeToRestore: flat },
  prWeeks: [],
  ci: { passRate: 0, flakeRate: 0, avgDurationSeconds: 0, totalRuns: 0, slowestJobs: [] },
  contributors: [],
};
