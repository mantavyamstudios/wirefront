// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

/** An active filter shown as a removable chip. */
export const ActiveFilter = z
  .object({
    /** Your key for it, passed back when it's removed. */
    id: z.string(),
    /** What the chip says, e.g. "status:open". */
    label: z.string(),
  })
  .meta({ id: "ActiveFilter" });
export type ActiveFilter = z.infer<typeof ActiveFilter>;

/** No backend calls: this pattern renders the search and filters it's given. */
export const api = defineApi({});
