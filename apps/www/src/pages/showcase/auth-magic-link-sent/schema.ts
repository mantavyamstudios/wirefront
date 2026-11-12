// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

/** What resending submits: the address the first link went to. */
export const MagicLinkInput = z.object({ email: z.email() }).meta({ id: "MagicLinkInput" });
export type MagicLinkInput = z.infer<typeof MagicLinkInput>;

/** The backend operations this screen calls. */
export const api = defineApi({
  sendMagicLink: {
    method: "POST",
    path: "/auth/magic-link",
    summary: "Email a one-time sign-in link (again); earlier links stop working",
    body: MagicLinkInput,
    errors: { 429: "Too many links requested; try again later" },
  },
});
