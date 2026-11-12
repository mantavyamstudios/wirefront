// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { Overview, Range } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */

/** The demo's "now", so relative times render the same everywhere. */
export const now = "2026-04-25T12:00:00.000Z";
export const workspace = "Acme inc.";

const DAYS: Record<Range, number> = { "7d": 7, "30d": 30, "90d": 90 };
const SHAPE = [12, 18, 14, 22, 19, 28, 24, 33, 29, 38, 34, 42];

/** A smooth daily series ending on `now`, the same every time. */
function points(range: Range) {
  const days = DAYS[range];
  const end = Date.UTC(2026, 3, 25);
  return Array.from({ length: days }, (_, i) => {
    const t = (i / (days - 1)) * (SHAPE.length - 1);
    const lo = SHAPE[Math.floor(t)] ?? 0;
    const hi = SHAPE[Math.ceil(t)] ?? lo;
    const value = Math.round((lo + (hi - lo) * (t - Math.floor(t))) * 300);
    return { date: new Date(end - (days - 1 - i) * 86_400_000).toISOString().slice(0, 10), value };
  });
}

/** What the mocks return for `getOverview`, per range. */
export function getOverview(range: Range): Overview {
  const series = points(range);
  return {
    period: { start: series[0]?.date ?? "2026-04-25", end: "2026-04-25" },
    metrics: [
      { id: "active-users", label: "Active users", value: 12_408, unit: "count", change: 0.082, goodWhen: "up" },
      { id: "mrr", label: "MRR", value: 48_600, unit: "currency", change: 0.124, goodWhen: "up" },
      { id: "churn", label: "Churn", value: 0.018, unit: "percent", change: -0.003, goodWhen: "down" },
      { id: "session", label: "Avg. session", value: 382, unit: "duration", change: -0.011, goodWhen: "up" },
    ],
    chart: { metricId: "active-users", points: series },
    activity: [
      { id: "act_1", actor: "Maya Okafor", action: "deployed", target: "main → production", at: "2026-04-25T11:58:00.000Z" },
      { id: "act_2", actor: "James Lin", action: "created", target: "PR #128 — audit log", at: "2026-04-25T11:52:00.000Z" },
      { id: "act_3", actor: "Riya Patel", action: "invited", target: "5 new members", at: "2026-04-25T11:39:00.000Z" },
      { id: "act_4", actor: "Dani Kim", action: "archived", target: "marketing-v1 project", at: "2026-04-25T11:00:00.000Z" },
      { id: "act_5", actor: "Alex Tran", action: "rolled back", target: "release 0.4.1", at: "2026-04-25T10:00:00.000Z" },
    ],
  };
}

/** A workspace with no data yet. */
export const emptyOverview: Overview = {
  period: { start: "2026-03-27", end: "2026-04-25" },
  metrics: getOverview("30d").metrics.map((m) => ({ ...m, value: 0, change: 0 })),
  chart: { metricId: "active-users", points: [] },
  activity: [],
};
