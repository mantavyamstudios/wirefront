// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const SetupTask = z.object({ id: z.string(), title: z.string(), description: z.string(), done: z.boolean() }).meta({ id: "SetupTask" });
export type SetupTask = z.infer<typeof SetupTask>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listSetupTasks: { method: "GET", path: "/me/setup-tasks", summary: "The onboarding checklist and what's done", response: z.array(SetupTask) },
  setSetupTask: { method: "PATCH", path: "/me/setup-tasks/{id}", summary: "Tick or untick a task", params: z.object({ id: z.string() }), body: z.object({ done: z.boolean() }) },
  hideSetupChecklist: { method: "POST", path: "/me/setup-tasks/hide", summary: "Hide the checklist for good" },
});
