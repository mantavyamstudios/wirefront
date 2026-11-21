// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const Hint = z.object({ id: z.string(), title: z.string(), body: z.string(), /** When the feature shipped (ISO date). */ addedAt: z.string().optional() }).meta({ id: "Hint" });
export type Hint = z.infer<typeof Hint>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listUnseenHints: { method: "GET", path: "/me/hints", summary: "Feature hints the user hasn't dismissed", response: z.array(Hint) },
  dismissHint: { method: "POST", path: "/me/hints/{id}/dismiss", summary: "Remember that a hint was seen", params: z.object({ id: z.string() }) },
});
