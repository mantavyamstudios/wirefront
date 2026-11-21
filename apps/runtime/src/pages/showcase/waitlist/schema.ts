// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

/** What "Join the waitlist" submits. Reuse it to validate the request on the server. */
export const JoinWaitlistInput = z.object({ email: z.email("Enter a valid email address.") }).meta({ id: "JoinWaitlistInput" });
export type JoinWaitlistInput = z.infer<typeof JoinWaitlistInput>;

/** The backend operations this screen calls. */
export const api = defineApi({
  joinWaitlist: {
    method: "POST",
    path: "/waitlist",
    summary: "Add an email to the waitlist. Respond 204 for addresses already on it too.",
    body: JoinWaitlistInput,
    errors: { 429: "Too many requests; try again later" },
  },
});
