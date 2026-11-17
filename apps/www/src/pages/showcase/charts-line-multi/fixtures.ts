// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { SeriesOverTime } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const getDailyActiveUsers: SeriesOverTime = {
  series: [
    { id: "web", label: "Web" },
    { id: "ios", label: "iOS" },
    { id: "android", label: "Android" },
  ],
  points: [
    { date: "2026-04-01", values: { web: 120, ios: 62, android: 42 } },
    { date: "2026-04-02", values: { web: 142, ios: 70, android: 44 } },
    { date: "2026-04-03", values: { web: 138, ios: 68, android: 50 } },
    { date: "2026-04-04", values: { web: 152, ios: 78, android: 52 } },
    { date: "2026-04-05", values: { web: 168, ios: 88, android: 58 } },
    { date: "2026-04-06", values: { web: 174, ios: 92, android: 60 } },
    { date: "2026-04-07", values: { web: 198, ios: 96, android: 64 } },
    { date: "2026-04-08", values: { web: 210, ios: 102, android: 66 } },
    { date: "2026-04-09", values: { web: 195, ios: 110, android: 72 } },
    { date: "2026-04-10", values: { web: 218, ios: 116, android: 74 } },
    { date: "2026-04-11", values: { web: 232, ios: 124, android: 80 } },
    { date: "2026-04-12", values: { web: 248, ios: 130, android: 84 } },
    { date: "2026-04-13", values: { web: 264, ios: 138, android: 88 } },
    { date: "2026-04-14", values: { web: 252, ios: 144, android: 92 } },
    { date: "2026-04-15", values: { web: 280, ios: 152, android: 96 } },
    { date: "2026-04-16", values: { web: 296, ios: 158, android: 100 } },
    { date: "2026-04-17", values: { web: 314, ios: 164, android: 104 } },
    { date: "2026-04-18", values: { web: 322, ios: 170, android: 108 } },
    { date: "2026-04-19", values: { web: 308, ios: 178, android: 112 } },
    { date: "2026-04-20", values: { web: 332, ios: 186, android: 116 } },
    { date: "2026-04-21", values: { web: 348, ios: 194, android: 122 } },
    { date: "2026-04-22", values: { web: 358, ios: 202, android: 126 } },
    { date: "2026-04-23", values: { web: 372, ios: 210, android: 130 } },
    { date: "2026-04-24", values: { web: 388, ios: 218, android: 134 } },
    { date: "2026-04-25", values: { web: 402, ios: 224, android: 138 } },
    { date: "2026-04-26", values: { web: 414, ios: 232, android: 142 } },
    { date: "2026-04-27", values: { web: 428, ios: 240, android: 146 } },
    { date: "2026-04-28", values: { web: 446, ios: 248, android: 150 } },
    { date: "2026-04-29", values: { web: 458, ios: 256, android: 154 } },
    { date: "2026-04-30", values: { web: 472, ios: 262, android: 158 } },
  ],
};

/** The ranges the demo offers, by number of days. */
export const ranges = { "7d": 7, "30d": 30 };
