// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

/** What "Resend link" sends. */
export const ResendSignInLinkInput = z.object({ email: z.email() }).meta({ id: "ResendSignInLinkInput" });
export type ResendSignInLinkInput = z.infer<typeof ResendSignInLinkInput>;

/** The backend operations this screen calls. */
export const api = defineApi({
  resendSignInLink: {
    method: "POST",
    path: "/auth/magic-link",
    summary: "Send the sign-in link again",
    body: ResendSignInLinkInput,
    errors: { 429: "Too many links requested; try again later" },
  },
});
