// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { RevenueRange, RevenueSummary } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
const SERIES = [68.4, 71.2, 73.0, 76.8, 78.4, 82.1, 84.6, 88.3, 91.0, 95.7, 99.2, 103.4, 108.6, 112.0, 116.4, 121.2, 125.7, 128.9, 132.5, 134.4, 138.0, 140.1, 141.6, 142.4];
const MONTHS: Record<RevenueRange, number> = { "3m": 3, "12m": 12, "24m": 24 };

function month(offset: number) {
  // Months back from April 2026.
  const d = new Date(Date.UTC(2026, 3 - offset, 1));
  return d.toISOString().slice(0, 7);
}

export function revenueFor(range: RevenueRange): RevenueSummary {
  const n = MONTHS[range];
  return {
    trend: SERIES.slice(-n).map((k, i) => ({ month: month(n - 1 - i), mrr: Math.round(k * 1000) })),
    payingAccounts: 5783,
    movements: { new: 3800, expansion: 1400, contraction: 600, churn: 2500 },
    netRetention: { value: 1.12, change: 0.021 },
    plans: [
      { id: "enterprise", name: "Enterprise", mrr: 78_200, accounts: 41 },
      { id: "business", name: "Business", mrr: 41_600, accounts: 312 },
      { id: "pro", name: "Pro", mrr: 18_400, accounts: 1284 },
      { id: "starter", name: "Starter", mrr: 4200, accounts: 4126 },
    ],
    topAccounts: [
      { id: "a1", name: "Linear", plan: "Enterprise", mrr: 8400, change: 0.06 },
      { id: "a2", name: "Vercel", plan: "Enterprise", mrr: 6200, change: 0.12 },
      { id: "a3", name: "Supabase", plan: "Enterprise", mrr: 5800, change: 0.04 },
      { id: "a4", name: "Resend", plan: "Business", mrr: 4900, change: 0.21 },
      { id: "a5", name: "PlanetScale", plan: "Business", mrr: 4200, change: -0.03 },
      { id: "a6", name: "Cal.com", plan: "Business", mrr: 3800, change: 0.08 },
    ],
  };
}

export const getRevenue = revenueFor("24m");

export const emptyRevenue: RevenueSummary = {
  trend: [],
  payingAccounts: 0,
  movements: { new: 0, expansion: 0, contraction: 0, churn: 0 },
  netRetention: { value: 0, change: 0 },
  plans: [],
  topAccounts: [],
};
