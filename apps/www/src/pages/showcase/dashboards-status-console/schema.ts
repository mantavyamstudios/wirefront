// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const ServiceHealth = z.enum(["operational", "degraded", "down"]).meta({ id: "ConsoleServiceHealth" });
export type ServiceHealth = z.infer<typeof ServiceHealth>;

export const ConsoleService = z
  .object({
    id: z.string(),
    name: z.string(),
    health: ServiceHealth,
    region: z.string().optional(),
    /** Current p95 latency in milliseconds. */
    p95Ms: z.number().nonnegative(),
    /** Recent p95 samples in milliseconds, oldest first, for the sparkline. */
    p95Trend: z.array(z.number().nonnegative()),
    /** Share of failed requests, as a fraction (0.024 = 2.4%). */
    errorRate: z.number().min(0).max(1),
    /** 30-day uptime, as a fraction (0.9999). */
    uptime: z.number().min(0).max(1),
  })
  .meta({ id: "ConsoleService" });
export type ConsoleService = z.infer<typeof ConsoleService>;

export const ConsolePerson = z
  .object({
    id: z.string(),
    name: z.string(),
    role: z.string().optional(),
    /** Avatar colour from the category palette (1–8). */
    category: z.number().int().min(1).max(8).optional(),
    /** Monitors and other bots get an icon instead of initials. */
    bot: z.boolean().optional(),
  })
  .meta({ id: "ConsolePerson" });
export type ConsolePerson = z.infer<typeof ConsolePerson>;

export const IncidentState = z.enum(["alert", "investigating", "identified", "monitoring", "resolved", "note"]).meta({ id: "IncidentState" });
export type IncidentState = z.infer<typeof IncidentState>;

export const IncidentUpdate = z
  .object({
    id: z.string(),
    at: z.iso.datetime({ offset: true }),
    state: IncidentState,
    text: z.string(),
    /** A person id. */
    by: z.string().optional(),
  })
  .meta({ id: "IncidentUpdate" });
export type IncidentUpdate = z.infer<typeof IncidentUpdate>;

export const Incident = z
  .object({
    id: z.string(),
    /** Your reference, e.g. "INC-318". */
    ref: z.string(),
    /** e.g. "SEV-2". */
    severity: z.string(),
    title: z.string(),
    startedAt: z.iso.datetime({ offset: true }),
    /** Oldest first. The latest non-note state is the incident's state. */
    updates: z.array(IncidentUpdate),
  })
  .meta({ id: "Incident" });
export type Incident = z.infer<typeof Incident>;

export const DeployStatus = z.enum(["succeeded", "rolling", "failed", "rolled-back"]).meta({ id: "DeployStatus" });
export type DeployStatus = z.infer<typeof DeployStatus>;

export const ConsoleDeploy = z
  .object({
    id: z.string(),
    sha: z.string(),
    message: z.string(),
    serviceId: z.string(),
    /** A person id. */
    authorId: z.string(),
    at: z.iso.datetime({ offset: true }),
    status: DeployStatus,
    /** 0–100 while rolling out. */
    progress: z.number().min(0).max(100).optional(),
  })
  .meta({ id: "ConsoleDeploy" });
export type ConsoleDeploy = z.infer<typeof ConsoleDeploy>;

export const OnCallSlot = z
  .object({
    personId: z.string(),
    /** IANA time zone, for their local time, e.g. "Europe/London". */
    timeZone: z.string(),
    /** Where they are, shown after their local time. */
    city: z.string(),
  })
  .meta({ id: "OnCallSlot" });
export type OnCallSlot = z.infer<typeof OnCallSlot>;

export const StatusOverview = z
  .object({
    services: z.array(ConsoleService),
    people: z.array(ConsolePerson),
    /** The open (or most recently resolved) incident; null when there is none. */
    incident: Incident.nullable(),
    /** Newest first. */
    deploys: z.array(ConsoleDeploy),
    onCall: z.object({ team: z.string(), until: z.iso.datetime({ offset: true }), primary: OnCallSlot, secondary: OnCallSlot }),
    /** Daily degraded minutes for the last 60 days, oldest first, and the overall uptime fraction. */
    uptime: z.object({ value: z.number().min(0).max(1), days: z.array(z.object({ date: z.iso.date(), degradedMinutes: z.number().nonnegative() })) }),
  })
  .meta({ id: "StatusOverview" });
export type StatusOverview = z.infer<typeof StatusOverview>;

export const PostUpdateInput = z.object({ text: z.string().trim().min(1).max(2000) }).meta({ id: "PostUpdateInput" });
export type PostUpdateInput = z.infer<typeof PostUpdateInput>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getStatus: {
    method: "GET",
    path: "/status",
    summary: "Services, the current incident, deploys, on-call and uptime for an environment",
    query: z.object({ environment: z.string() }),
    response: StatusOverview,
  },
  page: {
    method: "POST",
    path: "/on-call/{personId}/page",
    summary: "Page an on-call engineer",
    params: z.object({ personId: z.string() }),
  },
  postIncidentUpdate: {
    method: "POST",
    path: "/incidents/{incidentId}/updates",
    summary: "Add a note to the incident timeline",
    params: z.object({ incidentId: z.string() }),
    body: PostUpdateInput,
  },
  rollback: {
    method: "POST",
    path: "/deploys/{deployId}/rollback",
    summary: "Roll a deploy back",
    params: z.object({ deployId: z.string() }),
    errors: { 409: "That deploy can't be rolled back" },
  },
});
