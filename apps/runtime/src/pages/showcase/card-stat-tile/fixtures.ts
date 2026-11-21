// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { Kpi } from "./schema";

/** What the mocks return for `listKpis`. Demo data for the showcase and tests. */
export const listKpis: Kpi[] = [
  { id: "mrr", label: "MRR", value: 48_200, kind: "money", currency: "USD", deltaPct: 12.4, series: [22, 28, 26, 31, 38, 42, 48] },
  { id: "active", label: "Active users", value: 12_840, kind: "number", deltaPct: 4.1, series: [10, 11, 11, 12, 12, 13, 13] },
  { id: "churn", label: "Churn", value: 1.8, kind: "percent", deltaPct: -0.6, series: [3, 2.8, 2.6, 2.4, 2.1, 2, 1.8], higherIsBetter: false },
  { id: "nps", label: "NPS", value: 62, kind: "number", deltaPct: 8, series: [48, 52, 55, 56, 58, 60, 62] },
];
