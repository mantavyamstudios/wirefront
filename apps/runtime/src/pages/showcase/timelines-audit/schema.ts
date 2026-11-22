// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const AuditEvent = z
  .object({
    id: z.string(),
    /** Who did it; "Auto" or a service name for system actions. */
    actor: z.string(),
    /** The verb, e.g. "rotated". */
    action: z.string(),
    /** What it was done to, e.g. "API key acme-prod-key-04". */
    target: z.string().optional(),
    /** Picks the icon. */
    kind: z.enum(["key", "delete", "role", "security", "invite", "other"]),
    severity: z.enum(["info", "warn", "danger"]),
    /** When it happened (ISO 8601). */
    at: z.string(),
    ip: z.string().optional(),
    /** The change, when there is one to show. */
    diff: z.object({ before: z.string(), after: z.string() }).optional(),
  })
  .meta({ id: "AuditEvent" });
export type AuditEvent = z.infer<typeof AuditEvent>;

export const AuditLog = z
  .object({
    events: z.array(AuditEvent),
    /** Events in the whole period, when there are more than are shown. */
    total: z.number().int().nonnegative().optional(),
  })
  .meta({ id: "AuditLog" });
export type AuditLog = z.infer<typeof AuditLog>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listAuditEvents: {
    method: "GET",
    path: "/audit-events",
    summary: "Recent audit events, newest first",
    response: AuditLog,
  },
});
