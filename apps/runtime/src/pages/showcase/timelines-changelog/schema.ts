// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const ChangeGroup = z
  .object({ kind: z.enum(["new", "improved", "fixed", "removed"]), items: z.array(z.string()) })
  .meta({ id: "ChangeGroup" });
export type ChangeGroup = z.infer<typeof ChangeGroup>;

export const ChangelogEntry = z
  .object({
    version: z.string(),
    /** Release date, as YYYY-MM-DD. */
    date: z.string(),
    /** A one-line summary shown on a banner for the latest release. */
    headline: z.string().optional(),
    groups: z.array(ChangeGroup),
  })
  .meta({ id: "ChangelogEntry" });
export type ChangelogEntry = z.infer<typeof ChangelogEntry>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listChangelog: { method: "GET", path: "/changelog", summary: "Releases, newest first", response: z.array(ChangelogEntry) },
});
