// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { ServiceStatus } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
const pct = (values: number[]) => values.map((v) => v / 100);

export const listServiceHealth: ServiceStatus[] = [
  {
    id: "api-gateway",
    name: "api-gateway",
    region: "iad1",
    owner: "platform",
    health: "healthy",
    rps: 12_400,
    p99Ms: 142,
    errorRate: 0.0004,
    errorTrend: pct([
      0.02, 0.03, 0.02, 0.04, 0.03, 0.02, 0.04, 0.05, 0.03, 0.04, 0.04, 0.04,
    ]),
    sloBudget: 0.86,
    uptime30d: 0.9996,
  },
  {
    id: "billing-svc",
    name: "billing-svc",
    region: "iad1",
    owner: "payments",
    health: "degraded",
    rps: 380,
    p99Ms: 814,
    errorRate: 0.014,
    errorTrend: pct([
      0.2, 0.3, 0.4, 0.6, 0.7, 0.9, 1.1, 1.2, 1.3, 1.4, 1.4, 1.4,
    ]),
    sloBudget: 0.21,
    uptime30d: 0.9942,
  },
  {
    id: "audit-log",
    name: "audit-log",
    region: "iad1",
    owner: "platform",
    health: "deploying",
    rps: 4200,
    p99Ms: 96,
    errorRate: 0.0002,
    errorTrend: pct([
      0.01, 0.01, 0.02, 0.01, 0.02, 0.02, 0.02, 0.02, 0.01, 0.02, 0.02, 0.02,
    ]),
    sloBudget: 0.94,
    uptime30d: 0.9999,
  },
  {
    id: "search",
    name: "search",
    region: "fra1",
    owner: "search",
    health: "healthy",
    rps: 6800,
    p99Ms: 218,
    errorRate: 0.0008,
    errorTrend: pct([
      0.06, 0.07, 0.08, 0.09, 0.07, 0.08, 0.08, 0.09, 0.08, 0.08, 0.08, 0.08,
    ]),
    sloBudget: 0.78,
    uptime30d: 0.9991,
  },
  {
    id: "notifications",
    name: "notifications",
    region: "iad1",
    owner: "growth",
    health: "healthy",
    rps: 920,
    p99Ms: 312,
    errorRate: 0.0012,
    errorTrend: pct([
      0.1, 0.11, 0.13, 0.12, 0.14, 0.12, 0.11, 0.13, 0.12, 0.12, 0.12, 0.12,
    ]),
    sloBudget: 0.66,
    uptime30d: 0.9988,
  },
  {
    id: "ingest",
    name: "ingest",
    region: "syd1",
    owner: "data",
    health: "down",
    rps: null,
    p99Ms: null,
    errorRate: 1,
    errorTrend: pct([0.1, 0.2, 0.4, 1.2, 8, 22, 64, 92, 100, 100, 100, 100]),
    sloBudget: 0,
    uptime30d: 0.9821,
  },
];
