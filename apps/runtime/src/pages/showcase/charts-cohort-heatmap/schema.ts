// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const Cohort = z
  .object({
    /** The signup month, as YYYY-MM. */
    month: z.string(),
    /** How many signed up. */
    size: z.number().int().nonnegative(),
    /** Percent (0–100) still active in each month since signup, starting with month 0. Shorter for newer cohorts. */
    retention: z.array(z.number().min(0).max(100)),
  })
  .meta({ id: "Cohort" });
export type Cohort = z.infer<typeof Cohort>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listCohorts: { method: "GET", path: "/reports/retention-cohorts", summary: "Monthly signup cohorts and their retention, oldest first", response: z.array(Cohort) },
});
