// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { PersonSummary } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const getPersonSummary: PersonSummary = {
  id: "maya",
  name: "Maya Okafor",
  handle: "maya",
  pronouns: "she/her",
  verified: true,
  bio: "Engineering at Acme. Building the audit log so security teams can sleep.",
  location: "Brooklyn, NY",
  joinedAt: "2021-04-12",
  following: 284,
  followers: 12400,
  mutuals: { names: ["James Lin", "Riya Patel", "Dani Kim"], more: 8 },
  isFollowing: false,
};

export const james: PersonSummary = {
  id: "james",
  name: "James Lin",
  handle: "jlin",
  pronouns: "he/him",
  bio: "Platform engineer. Tracking events, queues and the occasional pager.",
  location: "Toronto",
  joinedAt: "2022-01-09",
  following: 132,
  followers: 2810,
  mutuals: { names: ["Maya Okafor", "Riya Patel"], more: 3 },
  isFollowing: true,
};
