// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const TaskPriority = z
  .enum(["low", "med", "high", "urgent"])
  .meta({ id: "TaskPriority" });
export type TaskPriority = z.infer<typeof TaskPriority>;

export const BoardTask = z
  .object({
    id: z.string(),
    key: z.string(),
    title: z.string(),
    /** `color` picks one of the eight category colours. */
    labels: z.array(
      z.object({ name: z.string(), color: z.int().min(1).max(8) })
    ),
    assignees: z.array(z.object({ id: z.string(), name: z.string() })),
    priority: TaskPriority,
    dueAt: z.iso.date().optional(),
    commentCount: z.int().min(0),
    attachmentCount: z.int().min(0),
    subtasks: z
      .object({ done: z.int().min(0), total: z.int().min(1) })
      .optional(),
  })
  .meta({ id: "BoardTask" });
export type BoardTask = z.infer<typeof BoardTask>;

export const BoardColumn = z
  .object({
    id: z.string(),
    name: z.string(),
    color: z.int().min(1).max(8),
    tasks: z.array(BoardTask),
  })
  .meta({ id: "BoardColumn" });
export type BoardColumn = z.infer<typeof BoardColumn>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getBoard: {
    method: "GET",
    path: "/sprints/{id}/board",
    summary: "A sprint's columns and their tasks",
    params: z.object({ id: z.string() }),
    response: z.object({
      name: z.string(),
      startsOn: z.iso.date(),
      endsOn: z.iso.date(),
      columns: z.array(BoardColumn),
    }),
  },
});
