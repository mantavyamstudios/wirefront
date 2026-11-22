// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const InviteLink = z.object({ url: z.url() }).meta({ id: "InviteLink" });
export type InviteLink = z.infer<typeof InviteLink>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getInviteLink: {
    method: "GET",
    path: "/workspace/invite-link",
    summary: "The workspace's join link",
    response: InviteLink,
  },
});
