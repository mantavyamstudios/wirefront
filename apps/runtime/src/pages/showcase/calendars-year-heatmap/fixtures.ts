// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { ContributionYear } from "./schema";

/** Demo data for the showcase, the generated mocks and tests: a seeded, deterministic year. */
export const now = "2026-09-26T12:00:00Z";
const DAY_MS = 86_400_000;
const END = Date.UTC(2026, 8, 26);

function seeded(seed: number) {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sampleDays() {
  const rand = seeded(20260926);
  const start = END - 364 * DAY_MS;
  return Array.from({ length: 365 }, (_, n) => {
    const t = start + n * DAY_MS;
    const dow = new Date(t).getUTCDay();
    const weekend = dow === 0 || dow === 6;
    const r = rand();
    const count =
      r < (weekend ? 0.6 : 0.18) ? 0 : Math.round(rand() * (weekend ? 4 : 14));
    return { date: new Date(t).toISOString().slice(0, 10), count };
  });
}

export const getContributions: ContributionYear = {
  profile: {
    login: "mantavyam",
    name: "Mantavyam",
    bio: "Building ready-to-wire screens.",
    repos: 42,
    followers: 318,
    href: "#profile",
  },
  days: sampleDays(),
  commits: [
    {
      sha: "f3b9a21c0e",
      message: "fix(table): keep sticky column opaque",
      repo: "acme/web",
      at: "2026-09-26T09:12:00Z",
      href: "#f3b9a21",
    },
    {
      sha: "12cae71d4a",
      message: "feat(audit): persist 1y retention",
      repo: "acme/api",
      at: "2026-09-25T17:40:00Z",
      href: "#12cae71",
    },
    {
      sha: "8a204d3b77",
      message: "chore: bump @wirefront/ui",
      repo: "orbit/ui",
      at: "2026-09-25T11:05:00Z",
      href: "#8a204d3",
    },
    {
      sha: "7f10b5e912",
      message: "docs: wiring guide for calendars",
      repo: "orbit/ui",
      at: "2026-09-24T15:30:00Z",
      href: "#7f10b5e",
    },
    {
      sha: "4d99a0c351",
      message: "fix(api): retry on 5xx",
      repo: "acme/api",
      at: "2026-09-23T10:00:00Z",
      href: "#4d99a0c",
    },
  ],
};
