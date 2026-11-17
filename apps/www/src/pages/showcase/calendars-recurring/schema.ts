// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

const WeekDay = z.enum(["MO", "TU", "WE", "TH", "FR", "SA", "SU"]);

export const RecurrenceRule = z
  .object({
    freq: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]),
    interval: z.number().int().min(1),
    /** Weekly: the days it falls on. */
    byday: z.array(WeekDay),
    /** Monthly by date: days of the month; -1 is the last day. */
    bymonthday: z.array(z.number().int()),
    /** Monthly by weekday: which one (1–4, or -1 for last). */
    bysetpos: z.number().int().nullable(),
    bydayPositional: z.array(WeekDay),
    monthlyMode: z.enum(["day", "weekday"]),
    end: z.discriminatedUnion("type", [
      z.object({ type: z.literal("never") }),
      z.object({ type: z.literal("until"), date: z.string() }),
      z.object({ type: z.literal("count"), count: z.number().int().min(1) }),
    ]),
  })
  .meta({ id: "RecurrenceRule" });
export type RecurrenceRule = z.infer<typeof RecurrenceRule>;

export const RecurrencePreset = z.object({ id: z.string(), label: z.string(), rule: RecurrenceRule.partial() }).meta({ id: "RecurrencePreset" });
export type RecurrencePreset = z.infer<typeof RecurrencePreset>;

/** The backend operations this screen calls. */
export const api = defineApi({
  saveRecurrence: {
    method: "PUT",
    path: "/events/{id}/recurrence",
    summary: "Save an event's recurrence rule",
    params: z.object({ id: z.string() }),
    body: z.object({ rule: RecurrenceRule, rrule: z.string() }),
  },
});
