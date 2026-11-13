// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const Outcome = z.enum(["success", "denied", "alert"]).meta({ id: "AuditOutcome" });
export type Outcome = z.infer<typeof Outcome>;

export const AuditEntry = z
  .object({
    id: z.string(),
    at: z.iso.datetime(),
    /** Null for system events and anonymous attempts. */
    actor: z.object({ id: z.string(), name: z.string() }).nullable(),
    /** Dotted event name, e.g. "iam.role.update". */
    action: z.string(),
    /** What it acted on, as shown, e.g. "user:linus → admin". */
    resource: z.string(),
    ip: z.string().nullable(),
    location: z.string().nullable(),
    outcome: Outcome,
  })
  .meta({ id: "AuditEntry" });
export type AuditEntry = z.infer<typeof AuditEntry>;

/** An active filter, shown as a chip: "Actor is Ada Lovelace". */
export const AuditFilter = z
  .object({
    id: z.string(),
    field: z.string(),
    op: z.string(),
    value: z.string(),
    /** Colours the chip: include (green), exclude (red) or neutral. */
    tone: z.enum(["include", "exclude", "neutral"]),
  })
  .meta({ id: "AuditFilter" });
export type AuditFilter = z.infer<typeof AuditFilter>;

export const AuditPage = z
  .object({
    items: z.array(AuditEntry),
    /** Pass back to get older entries; null when there are none. */
    nextCursor: z.string().nullable(),
    /** Matching entries in total. */
    total: z.int().min(0),
  })
  .meta({ id: "AuditPage" });
export type AuditPage = z.infer<typeof AuditPage>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listAuditEvents: {
    method: "GET",
    path: "/audit-events",
    summary: "Security events, newest first; filters are your own query parameters",
    query: z.object({ cursor: z.string().optional(), limit: z.int().min(1).max(200) }),
    response: AuditPage,
  },
  exportAuditEvents: {
    method: "POST",
    path: "/audit-events/export",
    summary: "Send the matching events to the configured SIEM",
  },
});
