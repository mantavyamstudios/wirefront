// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { PublicProfile } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const now = "2026-04-26T12:00:00Z";

export const getProfile: PublicProfile = {
  name: "Maya Okafor",
  handle: "maya",
  headline: "Engineering at Acme",
  bio: "Building the audit log so security teams can sleep. Long-form on distributed systems, short-form on JS quirks. Coffee snob.",
  location: "Brooklyn, NY",
  email: "maya@acme.dev",
  website: "maya.dev",
  joinedAt: "2021-04-12",
  tags: ["react", "distributed-systems", "security", "design-systems"],
  stats: { following: 284, followers: 12400, posts: 412, stars: 8294 },
  following: false,
  projects: [
    { id: "orbit-ui", name: "@acme/orbit-ui", language: "TypeScript", stars: 4218, forks: 142, blurb: "Headless UI primitives built on Base UI.", href: "#orbit-ui" },
    { id: "particle-field", name: "particle-field", language: "TypeScript", stars: 1804, forks: 64, blurb: "Mouse-aware particle text rendering.", href: "#particle-field" },
    { id: "rrule-mini", name: "rrule-mini", language: "Rust", stars: 612, forks: 18, blurb: "Tiny RRULE parser, panic-free.", href: "#rrule-mini" },
  ],
  activity: [
    { id: "a1", verb: "merged", target: "PR #128 in @acme/web", at: "2026-04-26T10:00:00Z" },
    { id: "a2", verb: "starred", target: "vercel/next.js", at: "2026-04-25T12:00:00Z" },
    { id: "a3", verb: "released", target: "v3.4 in @acme/orbit-ui", at: "2026-04-23T12:00:00Z" },
  ],
};
