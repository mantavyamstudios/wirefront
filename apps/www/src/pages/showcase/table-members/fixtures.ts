// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { Member, MembersPage } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */

/** The demo's "now", so relative times ("2m ago") render the same everywhere. */
export const now = "2026-03-02T12:00:00.000Z";

export const members: Member[] = [
  { id: "mem_ada", name: "Ada Lovelace", email: "ada@calculus.dev", role: "owner", team: "Engineering", lastActiveAt: "2026-03-02T12:00:00.000Z", twoFactor: true, status: "active" },
  { id: "mem_grace", name: "Grace Hopper", email: "grace@cobol.io", role: "admin", team: "Engineering", lastActiveAt: "2026-03-02T11:58:00.000Z", twoFactor: true, status: "active" },
  { id: "mem_alan", name: "Alan Turing", email: "alan@enigma.uk", role: "admin", team: "Research", lastActiveAt: "2026-03-02T11:48:00.000Z", twoFactor: false, status: "active" },
  { id: "mem_linus", name: "Linus Torvalds", email: "linus@kernel.org", role: "member", team: "Engineering", lastActiveAt: "2026-03-02T11:00:00.000Z", twoFactor: true, status: "active" },
  { id: "mem_margaret", name: "Margaret Hamilton", email: "margaret@apollo.nasa", role: "member", team: "Research", lastActiveAt: "2026-03-01T15:00:00.000Z", twoFactor: true, status: "active" },
  { id: "mem_edsger", name: "Edsger Dijkstra", email: "edsger@graph.nl", role: "viewer", team: "Design", lastActiveAt: null, twoFactor: false, status: "invited" },
];

/** What the mocks return for `listMembers`. */
export const listMembers: MembersPage = { items: members, total: members.length };

/** What the mocks return for `inviteMember`. */
export const inviteMember: Member = {
  id: "mem_new",
  name: "barbara@liskov.dev",
  email: "barbara@liskov.dev",
  role: "member",
  lastActiveAt: null,
  twoFactor: false,
  status: "invited",
};

/** What the mocks return for `updateMemberRole`. */
export const updateMemberRole: Member = { id: "mem_linus", name: "Linus Torvalds", email: "linus@kernel.org", role: "admin", team: "Engineering", lastActiveAt: "2026-03-02T11:00:00.000Z", twoFactor: true, status: "active" };
