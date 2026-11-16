// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { ProfileSummary } from "./schema";

/** What the mocks return for `getProfileSummary`. Demo data for the showcase and tests. */
export const getProfileSummary: ProfileSummary = {
  id: "lina",
  name: "Lina Rodrigues",
  headline: "Senior Engineer · Platform team",
  badge: "PRO",
  location: "Lisbon, PT · GMT",
  email: "lina@orbit.so",
  stats: [
    { label: "Reviews", value: 142 },
    { label: "PRs merged", value: 89 },
    { label: "On-call", value: 12, unit: "day" },
  ],
};
