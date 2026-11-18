// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

/** One period (e.g. a quarter) with a value per series; null where it hasn't happened yet. */
export const ComparisonRow = z
  .object({ label: z.string(), values: z.record(z.string(), z.number().nullable()) })
  .meta({ id: "ComparisonRow" });
export type ComparisonRow = z.infer<typeof ComparisonRow>;

export const PeriodComparison = z
  .object({
    /** The series to compare, oldest first, e.g. one per year. The newest is compared with the one before it. */
    series: z.array(z.object({ id: z.string(), label: z.string() })),
    rows: z.array(ComparisonRow),
  })
  .meta({ id: "PeriodComparison" });
export type PeriodComparison = z.infer<typeof PeriodComparison>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getPeriodComparison: { method: "GET", path: "/reports/bookings-by-quarter", summary: "Bookings per quarter for the last three years", response: PeriodComparison },
});
