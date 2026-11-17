// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { MentionGroup, Mentionable } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const listMentionables: { members: Mentionable[]; groups: MentionGroup[] } = {
  members: [
    { id: "u1", name: "Maya Okafor", handle: "maya", team: "Engineering" },
    { id: "u2", name: "James Lin", handle: "james", team: "Engineering" },
    { id: "u3", name: "Riya Patel", handle: "riya", team: "Product" },
    { id: "u4", name: "Dani Kim", handle: "dani", team: "Design" },
    { id: "u5", name: "Alex Tran", handle: "alex", team: "Marketing" },
  ],
  groups: [
    { handle: "engineering", description: "5 people · Engineering team" },
    { handle: "design", description: "3 people · Design team" },
  ],
};

export const draft = "Hey @james — what do you think? Also @jam";
