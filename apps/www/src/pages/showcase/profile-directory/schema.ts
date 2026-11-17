// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const Contact = z
  .object({ id: z.string(), name: z.string(), role: z.string(), email: z.string(), presence: z.enum(["online", "away", "off"]), avatarUrl: z.string().optional() })
  .meta({ id: "Contact" });
export type Contact = z.infer<typeof Contact>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listContacts: { method: "GET", path: "/directory", summary: "Everyone in the company directory", response: z.array(Contact) },
});
