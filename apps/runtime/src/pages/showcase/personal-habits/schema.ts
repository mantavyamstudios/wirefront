// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const HabitIcon = z.enum([
  "water",
  "journal",
  "stretch",
  "walk",
  "read",
  "sleep",
  "meditate",
  "veg",
  "lift",
  "music",
  "sun",
  "language",
  "bike",
]);
export type HabitIcon = z.infer<typeof HabitIcon>;
export const HabitTone = z.enum([
  "sky",
  "amber",
  "violet",
  "teal",
  "orange",
  "rose",
]);
export type HabitTone = z.infer<typeof HabitTone>;
export const HabitTime = z.enum(["morning", "anytime", "evening"]);
export type HabitTime = z.infer<typeof HabitTime>;
export const HabitGoal = z
  .object({ count: z.number().int().min(2), unit: z.string() })
  .meta({ id: "HabitGoal" });
export type HabitGoal = z.infer<typeof HabitGoal>;

export const NewHabit = z
  .object({
    name: z.string().min(1),
    icon: HabitIcon,
    tone: HabitTone,
    time: HabitTime,
    /** Count it several times a day instead of once. */ goal: HabitGoal.optional(),
  })
  .meta({ id: "NewHabit" });
export type NewHabit = z.infer<typeof NewHabit>;

export const Habit = NewHabit.extend({
  id: z.string(),
  /** Streak days carried in from before this week. */
  carry: z.number().int(),
  /** Seven values for the week from weekStart: 1 or 0, or the count for a counted habit. */
  week: z.array(z.number().int()).length(7),
  /** Index of the day it was created this week, if it is new. */
  since: z.number().int().optional(),
}).meta({ id: "Habit" });
export type Habit = z.infer<typeof Habit>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listHabits: {
    method: "GET",
    path: "/habits",
    summary: "Habits with this week's log",
    query: z.object({ weekStart: z.string() }),
    response: z.array(Habit),
  },
  logHabit: {
    method: "PUT",
    path: "/habits/{id}/log/{date}",
    summary: "Set a day's value for a habit",
    params: z.object({ id: z.string(), date: z.string() }),
    body: z.object({ value: z.number().int().min(0) }),
  },
  createHabit: {
    method: "POST",
    path: "/habits",
    summary: "Start a habit today",
    body: NewHabit,
    response: Habit,
  },
});
