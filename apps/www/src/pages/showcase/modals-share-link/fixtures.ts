// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { LinkAccess, ShareMember } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const documentName = "Onboarding handbook v3";
export const documentMeta = "Last edited by Maya 2h ago · 14 collaborators";

export const members: ShareMember[] = [
  { id: "m1", name: "Maya Okafor", email: "maya@acme.dev", role: "owner" },
  { id: "m2", name: "James Lin", email: "james@acme.dev", role: "editor" },
  { id: "m3", name: "Riya Patel", email: "riya@acme.dev", role: "viewer" },
  { id: "m4", name: "Dani Kim", email: "dani@acme.dev", role: "editor" },
];

/** What the mocks return for `listAccess`. */
export const listAccess: { members: ShareMember[]; linkAccess: LinkAccess; linkUrl: string } = {
  members,
  linkAccess: "view",
  linkUrl: "https://acme.dev/d/onboarding-handbook-v3-3b9f2a",
};
