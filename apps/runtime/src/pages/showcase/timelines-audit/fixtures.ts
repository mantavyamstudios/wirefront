// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { AuditLog } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const now = "2026-04-14T12:00:00Z";

export const listAuditEvents: AuditLog = {
  total: 218,
  events: [
    {
      id: "ev-1",
      actor: "Maya Okafor",
      action: "rotated",
      target: "API key acme-prod-key-04",
      kind: "key",
      severity: "warn",
      at: "2026-04-14T11:58:00Z",
      ip: "203.0.113.42",
    },
    {
      id: "ev-2",
      actor: "James Lin",
      action: "deleted",
      target: "workspace integration · Linear",
      kind: "delete",
      severity: "danger",
      at: "2026-04-14T11:28:00Z",
      ip: "198.51.100.7",
      diff: {
        before: '{"connected": true, "scope": "issues:rw"}',
        after: '{"connected": false}',
      },
    },
    {
      id: "ev-3",
      actor: "Riya Patel",
      action: "promoted",
      target: "Dani Kim → Admin",
      kind: "role",
      severity: "warn",
      at: "2026-04-14T11:00:00Z",
      ip: "203.0.113.18",
    },
    {
      id: "ev-4",
      actor: "Auto",
      action: "enabled",
      target: "SSO enforcement for @acme.dev",
      kind: "security",
      severity: "info",
      at: "2026-04-14T09:00:00Z",
    },
    {
      id: "ev-5",
      actor: "Mantavyam",
      action: "invited",
      target: "8 new members to Marketing",
      kind: "invite",
      severity: "info",
      at: "2026-04-14T07:00:00Z",
      ip: "203.0.113.91",
    },
  ],
};
