// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { DailyViews, PageviewStats, Range } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
const SHAPE = [18, 22, 19, 28, 24, 31, 35, 30, 38, 41, 36, 44, 48, 52, 46, 54, 58, 53, 61, 67, 62, 70, 75, 80, 72, 84, 90, 86, 95, 100];
const DAYS: Record<Range, number> = { "7d": 7, "30d": 30, "90d": 90 };
const END = Date.UTC(2026, 3, 25);

function daily(range: Range): DailyViews[] {
  const n = DAYS[range];
  return Array.from({ length: n }, (_, i) => {
    const shape = SHAPE[Math.floor((i / n) * SHAPE.length)] ?? 50;
    return {
      date: new Date(END - (n - 1 - i) * 86_400_000).toISOString().slice(0, 10),
      views: shape * 52,
      ...(i >= n - 4 ? { partial: true } : {}),
    };
  });
}

export function statsFor(range: Range): PageviewStats {
  const scale = DAYS[range] / 30;
  return {
    total: Math.round(128_430 * scale),
    change: 0.18,
    daily: daily(range),
    sources: [
      { id: "direct", label: "Direct", views: Math.round(4820 * scale) },
      { id: "search", label: "Search", views: Math.round(2940 * scale) },
      { id: "social", label: "Social", views: Math.round(2010 * scale) },
      { id: "referral", label: "Referral", views: Math.round(1450 * scale) },
      { id: "email", label: "Email", views: Math.round(880 * scale) },
      { id: "other", label: "Other", views: Math.round(510 * scale) },
    ],
    pages: [
      { path: "/", views: Math.round(14_280 * scale), change: 0.12 },
      { path: "/pricing", views: Math.round(6410 * scale), change: 0.34 },
      { path: "/docs/quickstart", views: Math.round(4180 * scale), change: 0.08 },
      { path: "/blog/launch", views: Math.round(3022 * scale), change: 2.2 },
      { path: "/changelog", views: Math.round(1840 * scale), change: -0.03 },
    ],
    countries: [
      { country: "US", share: 0.42 },
      { country: "GB", share: 0.14 },
      { country: "DE", share: 0.09 },
      { country: "CA", share: 0.07 },
      { country: "AU", share: 0.05 },
    ],
  };
}

export const getPageviews = statsFor("30d");

export const emptyStats: PageviewStats = { total: 0, change: 0, daily: [], sources: [], pages: [], countries: [] };
