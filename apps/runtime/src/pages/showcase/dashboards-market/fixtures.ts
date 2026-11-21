// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { MarketOverview, Quote } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
function series(base: number, drift: number) {
  const out: number[] = [base];
  for (let i = 1; i < 24; i++) {
    const noise = (Math.sin(i * 1.7 + base) * 0.5 + Math.cos(i * 0.6) * 0.3) * 0.6;
    out.push((out[i - 1] ?? base) * (1 + drift / 6 + noise / 100));
  }
  return out.map((v) => Math.round(v * 100) / 100);
}

const watchlist: Quote[] = [
  { symbol: "ACME", name: "Acme Holdings", price: 184.62, change: 0.0241, volume: 2_400_000, series: [178, 178.4, 179.1, 178.6, 179.5, 180.2, 181.0, 180.4, 181.2, 181.8, 181.4, 182.0, 182.6, 182.2, 182.9, 183.4, 183.0, 183.7, 183.9, 184.0, 184.4, 184.1, 184.6, 184.62] },
  { symbol: "LNRX", name: "Linear Inc", price: 412.18, change: 0.0142, volume: 812_000, series: series(412, 0.005) },
  { symbol: "VCRL", name: "Vercel Co", price: 248.42, change: 0.0412, volume: 1_200_000, series: series(238, 0.012) },
  { symbol: "SUPA", name: "Supabase", price: 84.61, change: -0.0084, volume: 964_000, series: series(85, -0.004) },
  { symbol: "RSND", name: "Resend", price: 52.18, change: 0.0861, volume: 2_100_000, series: series(48, 0.024) },
  { symbol: "PSCL", name: "PlanetScale", price: 38.42, change: -0.0218, volume: 612_000, series: series(39, -0.011) },
  { symbol: "CALC", name: "Cal.com", price: 76.94, change: 0.0062, volume: 428_000, series: series(76, 0.002) },
  { symbol: "MNTL", name: "Mintlify", price: 24.18, change: -0.0142, volume: 284_000, series: series(24.5, -0.008) },
];

export function overviewFor(symbol = "ACME"): MarketOverview {
  const featured = watchlist.find((q) => q.symbol === symbol) ?? (watchlist[0] as Quote);
  return {
    featured,
    portfolio: {
      value: 184_620,
      change: 4182,
      allocation: [
        { name: "Tech", share: 0.42 },
        { name: "Fintech", share: 0.23 },
        { name: "Devtools", share: 0.18 },
        { name: "Crypto", share: 0.09 },
        { name: "Cash", share: 0.08 },
      ],
    },
    watchlist: watchlist.filter((q) => q.symbol !== "ACME"),
    headlines: [
      { id: "n1", publishedAt: "2026-04-24T14:42:00Z", source: "WSJ", title: "Acme cleared by FTC for Linear acquisition", url: "#news-1" },
      { id: "n2", publishedAt: "2026-04-24T14:18:00Z", source: "Bloomberg", title: "Resend doubles MRR after enterprise launch", url: "#news-2" },
      { id: "n3", publishedAt: "2026-04-24T13:51:00Z", source: "Reuters", title: "Fed signals one more rate cut before EOY", url: "#news-3" },
      { id: "n4", publishedAt: "2026-04-24T13:14:00Z", source: "FT", title: "PlanetScale loses Slack as flagship customer", url: "#news-4" },
    ],
  };
}

export const getMarketOverview = overviewFor();
export const portfolioName = "Mantavyam's index";
