// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const Task = z
  .object({
    id: z.string(),
    title: z.string(),
    /** A short tag, e.g. the project name. */
    project: z.string().optional(),
    /** Due date (ISO date). The screen says "Today" or "Tomorrow" when it can. */
    due: z.iso.date().optional(),
    done: z.boolean(),
  })
  .meta({ id: "Task" });
export type Task = z.infer<typeof Task>;

export const ScheduleEvent = z
  .object({
    id: z.string(),
    start: z.iso.datetime({ offset: true }),
    title: z.string(),
    /** A second line, e.g. "Weekly · 30m". */
    detail: z.string().optional(),
    /** Colour from the category palette (1–8). */
    category: z.number().int().min(1).max(8).optional(),
  })
  .meta({ id: "ScheduleEvent" });
export type ScheduleEvent = z.infer<typeof ScheduleEvent>;

export const Today = z
  .object({
    tasks: z.array(Task),
    /** Earliest first. */
    events: z.array(ScheduleEvent),
  })
  .meta({ id: "Today" });
export type Today = z.infer<typeof Today>;

export const SetTaskDoneInput = z.object({ id: z.string(), done: z.boolean() }).meta({ id: "SetTaskDoneInput" });
export type SetTaskDoneInput = z.infer<typeof SetTaskDoneInput>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getToday: {
    method: "GET",
    path: "/me/today",
    summary: "The signed-in user's tasks and events for today",
    response: Today,
  },
  setTaskDone: {
    method: "PATCH",
    path: "/tasks/{id}",
    summary: "Mark a task done or not done",
    params: z.object({ id: z.string() }),
    body: SetTaskDoneInput.pick({ done: true }),
    errors: { 404: "The task no longer exists" },
  },
});
