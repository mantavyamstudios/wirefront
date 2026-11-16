// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const TicketPriority = z.enum(["p0", "p1", "p2"]).meta({ id: "TicketPriority" });
export type TicketPriority = z.infer<typeof TicketPriority>;

export const SlaBreach = z
  .object({
    id: z.string(),
    subject: z.string(),
    customer: z.string(),
    priority: TicketPriority,
    /** Which target is missed. */
    target: z.enum(["first-response", "resolution"]),
    /** When the target was due; the screen counts how far over it is. */
    dueAt: z.iso.datetime({ offset: true }),
  })
  .meta({ id: "SlaBreach" });
export type SlaBreach = z.infer<typeof SlaBreach>;

export const SupportAgent = z
  .object({
    id: z.string(),
    name: z.string(),
    resolved: z.number().int().nonnegative(),
    avgFirstResponseSeconds: z.number().nonnegative(),
    /** Average rating, 1–5. */
    csat: z.number().min(1).max(5),
    /** Share of their capacity in use, as a fraction. */
    load: z.number().min(0).max(1),
  })
  .meta({ id: "SupportAgent" });
export type SupportAgent = z.infer<typeof SupportAgent>;

export const QueueOverview = z
  .object({
    counts: z.object({
      open: z.number().int().nonnegative(),
      inProgress: z.number().int().nonnegative(),
      waiting: z.number().int().nonnegative(),
      resolved: z.number().int().nonnegative(),
    }),
    /** Most overdue first. */
    breaches: z.array(SlaBreach),
    firstResponse: z.object({
      avgSeconds: z.number().nonnegative(),
      /** Against the previous week, as a fraction (-0.38 = 38% faster). */
      change: z.number(),
      /** Average per hour over the last 24 hours, oldest first, in seconds. */
      hourly: z.array(z.number().nonnegative()),
    }),
    /** Ranked, best first. */
    agents: z.array(SupportAgent),
    /** Most used first. */
    tags: z.array(z.object({ name: z.string(), count: z.number().int().nonnegative() })),
  })
  .meta({ id: "QueueOverview" });
export type QueueOverview = z.infer<typeof QueueOverview>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getQueueOverview: {
    method: "GET",
    path: "/support/overview",
    summary: "Ticket counts, SLA breaches, first-response time, agents and tags for today",
    response: QueueOverview,
  },
});
