// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { Invitation, SendInvitesResult } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const autoJoinDomain = "acme.com";
export const inviteLink = "https://orbit.so/invite/8f3a2c";
export const defaultMessage = "Hey — joining us in Acme's workspace. Click the link to set up your account.";
export const defaultInvitees: Invitation[] = [
  { email: "alex@globex.com", role: "member" },
  { email: "priya@acme.com", role: "member" },
];

/** What the mocks return for `sendInvites`. */
export const sendInvites: SendInvitesResult = { sent: 1 };
