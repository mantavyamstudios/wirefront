// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { Suggestion } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const listSuggestions: Suggestion[] = [
  { id: "helena", name: "Helena Marsh", role: "VP Engineering · Acme", city: "London, UK", followers: 8402, reason: "team", context: "Same team", mutuals: ["Maya Okafor", "James Lin", "Riya Patel", "Dani Kim"], bio: "Building the engineering org that ships boring software people love.", following: false },
  { id: "naomi", name: "Naomi Park", role: "Staff Engineer · Linear", city: "Seoul, KR", followers: 12100, reason: "topic", context: "Writes about distributed systems", mutuals: ["Maya Okafor", "Olive Berg"], bio: "Realtime sync, conflict-free CRDTs, very tired graphs.", following: false },
  { id: "oliver", name: "Oliver Bates", role: "Founder · Stitchstack", city: "Brooklyn, NY", followers: 4210, reason: "shared", context: "Followed by Maya Okafor", mutuals: ["Maya Okafor"], bio: "Indie tools for product teams. Newsletter Mondays.", following: true },
  { id: "priya", name: "Priya Shah", role: "Engineer · Vercel", city: "London, UK", followers: 21400, reason: "repo", context: "Contributes to @acme/orbit-ui", mutuals: ["Dani Kim", "James Lin"], bio: "Edge runtimes. Pretending to like vegetables.", following: false },
];
