// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

const Health = z.enum(["operational", "degraded", "outage"]);

export const StatusComponent = z
  .object({
    id: z.string(),
    name: z.string(),
    status: Health,
    /** Uptime over the shown days, 0–1. */
    uptime: z.number().min(0).max(1),
    /** One entry per day, oldest first (up to 90). */
    days: z.array(z.object({ date: z.string(), status: Health })),
  })
  .meta({ id: "StatusComponent" });
export type StatusComponent = z.infer<typeof StatusComponent>;

export const IncidentUpdate = z
  .object({
    id: z.string(),
    state: z.enum(["investigating", "identified", "monitoring", "resolved"]),
    at: z.string(),
    text: z.string(),
  })
  .meta({ id: "IncidentUpdate" });

export const Incident = z
  .object({
    id: z.string(),
    title: z.string(),
    affected: z.array(z.string()),
    severity: z.enum(["minor", "major", "critical"]),
    startedAt: z.string(),
    /** Set once it's over. */
    resolvedAt: z.string().optional(),
    /** Newest first. */
    updates: z.array(IncidentUpdate),
  })
  .meta({ id: "Incident" });
export type Incident = z.infer<typeof Incident>;

export const StatusSummary = z
  .object({
    components: z.array(StatusComponent),
    incidents: z.array(Incident),
  })
  .meta({ id: "StatusSummary" });
export type StatusSummary = z.infer<typeof StatusSummary>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getStatus: {
    method: "GET",
    path: "/status",
    summary: "Component health, daily history and recent incidents",
    response: StatusSummary,
  },
});
