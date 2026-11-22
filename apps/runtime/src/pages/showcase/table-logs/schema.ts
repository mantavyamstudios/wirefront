// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const LogSeverity = z
  .enum(["debug", "info", "warn", "error"])
  .meta({ id: "LogSeverity" });
export type LogSeverity = z.infer<typeof LogSeverity>;

export const LogEntry = z
  .object({
    id: z.string(),
    at: z.iso.datetime(),
    severity: LogSeverity,
    service: z.string(),
    serviceVersion: z.string().optional(),
    /** The request or job this line belongs to. */
    requestId: z.string().nullable(),
    traceId: z.string().optional(),
    region: z.string().optional(),
    message: z.string(),
    /** HTTP status, for request logs. */
    status: z.int().optional(),
    durationMs: z.number().min(0).optional(),
    context: z.array(z.object({ label: z.string(), value: z.string() })),
    payload: z
      .object({ kind: z.enum(["json", "text"]), body: z.string() })
      .optional(),
    /** Where the time went; shares are worked out from the parts. */
    timing: z
      .array(z.object({ label: z.string(), ms: z.number().min(0) }))
      .optional(),
    stack: z.array(z.string()).optional(),
  })
  .meta({ id: "LogEntry" });
export type LogEntry = z.infer<typeof LogEntry>;

/** The backend operations this screen calls. New lines can also arrive over a stream (SSE or WebSocket). */
export const api = defineApi({
  listLogs: {
    method: "GET",
    path: "/logs",
    summary:
      'The latest log lines matching a filter such as "severity:error service:billing"',
    query: z.object({
      q: z.string().optional(),
      limit: z.int().min(1).max(500).optional(),
    }),
    response: z.array(LogEntry),
  },
  replayRequest: {
    method: "POST",
    path: "/requests/{requestId}/replay",
    summary: "Retry the request behind an error",
    params: z.object({ requestId: z.string() }),
  },
  notifyOncall: {
    method: "POST",
    path: "/oncall/notifications",
    summary: "Page whoever is on call about a log line",
    body: z.object({ entryId: z.string() }),
  },
});
