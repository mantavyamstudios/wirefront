// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

/** Pause notifications for new mail. */
export const SnoozeInput = z.object({ hours: z.int().min(1).max(168) }).meta({ id: "SnoozeInput" });
export type SnoozeInput = z.infer<typeof SnoozeInput>;

/** The backend operations this screen calls. */
export const api = defineApi({
  snoozeMail: { method: "POST", path: "/inbox/snooze", summary: "Pause new-mail notifications", body: SnoozeInput },
});
