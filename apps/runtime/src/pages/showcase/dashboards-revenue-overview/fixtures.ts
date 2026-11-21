// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import type { RevenueChannel, RevenueDay, RevenueMoment, RevenueStoryData } from "./schema";

/** Demo data for the showcase, the generated mocks and tests: two years of a small shop's sales, seeded so it never changes. */
const DAY = 86_400_000;
const pad2 = (n: number) => String(n).padStart(2, "0");
function parseDay(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}
function isoOf(t: number) {
  const d = new Date(t);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

function mulberry32(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const channels: RevenueChannel[] = [
  { key: "store", label: "Online store" },
  { key: "wholesale", label: "Wholesale" },
  { key: "market", label: "Marketplaces" },
  { key: "social", label: "Social shop" },
];

const moments: RevenueMoment[] = [
  {
    id: "spring-sale",
    date: "2025-04-24",
    endDate: "2025-04-28",
    kind: "promo",
    title: "Spring sale",
    phrase: "the spring sale",
    note: "20% off throws and bedding for five days, sent to the full list.",
    weight: 2,
  },
  {
    id: "marketplace-fees",
    date: "2025-06-02",
    kind: "pricing",
    channel: "market",
    title: "Marketplace fees went up",
    short: "Marketplace fees",
    note: "Listing fees rose to 9.5%, so marketplace prices went up to cover them.",
    weight: 2,
  },
  {
    id: "autumn-launch",
    date: "2025-09-23",
    endDate: "2025-09-29",
    kind: "promo",
    title: "Autumn collection launch",
    short: "Autumn launch",
    phrase: "the autumn launch",
    note: "Twelve new pieces in walnut and wool, launched with a lookbook email.",
    weight: 1,
  },
  {
    id: "starter-price",
    date: "2025-11-18",
    kind: "pricing",
    channel: "store",
    title: "Price change on Starter Set",
    short: "Starter Set price",
    note: "The Starter Set went from $68 to $58 to make it an easier first order.",
    weight: 2,
  },
  {
    id: "black-friday",
    date: "2025-11-28",
    endDate: "2025-12-01",
    kind: "promo",
    title: "Black Friday sale",
    short: "Black Friday",
    phrase: "the Black Friday sale",
    note: "25% off sitewide through Cyber Monday. Marketplaces ran the same discount.",
    weight: 3,
  },
  {
    id: "wholesale-partner",
    date: "2025-12-02",
    kind: "partner",
    channel: "wholesale",
    title: "Wholesale partner onboarded",
    short: "Wholesale partner",
    note: "Juniper & Pine took 14 lines for their four shops. The first order shipped on Dec 3.",
    weight: 3,
  },
  {
    id: "shipping-delay",
    date: "2025-12-08",
    endDate: "2025-12-10",
    kind: "incident",
    title: "Shipping delay",
    phrase: "the shipping delay",
    note: "A carrier backlog pushed delivery estimates to 6–8 days and checkout conversion fell.",
    weight: 3,
  },
  {
    id: "gift-guide",
    date: "2025-12-11",
    endDate: "2025-12-12",
    kind: "promo",
    title: "Gift guide email",
    short: "Gift guide",
    phrase: "the gift guide email",
    note: "The holiday gift guide went to 41,200 subscribers on Thursday morning.",
    weight: 2,
  },
];

const EFFECTS: { from: string; to: string; on: string[]; by: number[] }[] = [
  { from: "2024-11-29", to: "2024-12-02", on: ["store", "market", "social"], by: [1.55, 1.28, 1.22, 1.38] },
  { from: "2025-04-24", to: "2025-04-28", on: ["store", "social"], by: [1.34, 1.26, 1.22, 1.2, 1.14] },
  { from: "2025-06-02", to: "2025-12-12", on: ["market"], by: [0.84] },
  { from: "2025-09-23", to: "2025-09-29", on: ["store"], by: [1.26, 1.18, 1.14, 1.1, 1.08, 1.06, 1.04] },
  { from: "2025-11-18", to: "2025-12-12", on: ["store"], by: [1.04] },
  { from: "2025-11-28", to: "2025-12-01", on: ["store", "market", "social"], by: [1.85, 1.42, 1.32, 1.56] },
  { from: "2025-12-02", to: "2025-12-12", on: ["wholesale"], by: [1.3, 3.6, 2.3] },
  { from: "2025-12-08", to: "2025-12-10", on: ["store", "market"], by: [0.72, 0.6, 0.78] },
  { from: "2025-12-11", to: "2025-12-12", on: ["store", "social"], by: [1.26, 1.12] },
];

function sampleDays(): RevenueDay[] {
  const rand = mulberry32(1128);
  const end = Date.UTC(2025, 11, 12);
  const count = 728;
  const season = [0.84, 0.82, 0.9, 0.95, 0.97, 0.93, 0.9, 0.92, 0.98, 1.02, 1.03, 1.06];
  const week = [1.03, 0.94, 0.96, 0.98, 1.0, 1.04, 1.07];
  const out: RevenueDay[] = [];
  for (let i = 0; i < count; i++) {
    const t = end - (count - 1 - i) * DAY;
    const date = isoOf(t);
    const d = new Date(t);
    const p = i / (count - 1);
    const level = 5400 * (1 + 0.36 * p) * season[d.getUTCMonth()] * week[d.getUTCDay()];
    const shares: Record<string, number> = {
      store: 0.5 - 0.03 * p,
      wholesale: 0.14,
      market: 0.28 - 0.05 * p,
      social: 0.08 + 0.07 * p,
    };
    const byChannel: Record<string, number> = {};
    for (const key of Object.keys(shares)) {
      let boost = 1;
      for (const e of EFFECTS) {
        if (date < e.from || date > e.to || !e.on.includes(key)) continue;
        const offset = Math.round((t - parseDay(e.from)) / DAY);
        boost *= e.by[Math.min(offset, e.by.length - 1)];
      }
      const spread = key === "wholesale" ? 0.5 : 0.14;
      byChannel[key] = Math.round(level * shares[key] * boost * (1 + (rand() - 0.5) * spread));
    }
    out.push({ date, byChannel });
  }
  return out;
}


export const getRevenueStory: RevenueStoryData = { channels, days: sampleDays(), moments };

export const store = { name: "Fernwood Goods" };
export const user = { name: "Ines Moreau" };
/** When the demo data was last refreshed. */
export const updatedAt = "2025-12-12T17:58:00Z";
export const now = "2025-12-12T18:00:00Z";
