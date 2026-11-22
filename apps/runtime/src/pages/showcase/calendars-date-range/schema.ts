// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

/** An inclusive range of calendar days, as YYYY-MM-DD. */
export const DayRange = z
  .object({ from: z.string(), to: z.string() })
  .meta({ id: "DayRange" });
export type DayRange = z.infer<typeof DayRange>;

/** The backend operations this screen calls: none; the picked range goes to `onApply`. */
export const api = defineApi({});
