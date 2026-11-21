// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { RailContext } from "./schema";

/** What the mocks return for `getRailContext`. Demo data for the showcase and tests. */
export const getRailContext: RailContext = {
  workspace: { name: "Acme inc.", detail: "Pro · 24 members" },
  user: { name: "Sam Rivera", online: true },
};

export const projects = [
  { id: "onboarding", name: "Onboarding redesign", color: 2 },
  { id: "q3", name: "Q3 planning", color: 3 },
  { id: "site", name: "Marketing site", color: 5 },
  { id: "dust", name: "Dust storm", color: 1 },
];

export const teams = [
  { id: "design", name: "design", members: 6 },
  { id: "engineering", name: "engineering", members: 24 },
  { id: "growth", name: "growth", members: 4 },
];
