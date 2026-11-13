// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { AuditEntry, AuditFilter, AuditPage } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const entries: AuditEntry[] = [
  { id: "ev_7", at: "2026-04-20T12:48:22.000Z", actor: { id: "u_ada", name: "Ada Lovelace" }, action: "auth.session.create", resource: "session_8412c", ip: "203.0.113.42", location: "Dublin, IE", outcome: "success" },
  { id: "ev_6", at: "2026-04-20T12:46:09.000Z", actor: { id: "u_grace", name: "Grace Hopper" }, action: "iam.role.update", resource: "user:linus → admin", ip: "198.51.100.7", location: "Boston, US", outcome: "success" },
  { id: "ev_5", at: "2026-04-20T12:42:41.000Z", actor: null, action: "auth.login.attempt", resource: "user:alan", ip: "45.92.180.220", location: "Tor exit node", outcome: "alert" },
  { id: "ev_4", at: "2026-04-20T12:38:11.000Z", actor: { id: "u_alan", name: "Alan Turing" }, action: "billing.method.add", resource: "card_••4242", ip: "203.0.113.91", location: "London, UK", outcome: "success" },
  { id: "ev_3", at: "2026-04-20T12:30:00.000Z", actor: { id: "u_linus", name: "Linus Torvalds" }, action: "kv.bucket.delete", resource: "bucket:tmp-archive", ip: "192.0.2.55", location: "Helsinki, FI", outcome: "denied" },
  { id: "ev_2", at: "2026-04-20T12:21:52.000Z", actor: { id: "u_margaret", name: "Margaret Hamilton" }, action: "secrets.rotate", resource: "key:wf_live_8f4a", ip: "198.51.100.18", location: "Boston, US", outcome: "success" },
  { id: "ev_1", at: "2026-04-20T12:18:04.000Z", actor: null, action: "webhook.delivery.failed", resource: "wh_2210 (×3)", ip: null, location: null, outcome: "alert" },
];

export const filters: AuditFilter[] = [
  { id: "outcome", field: "Outcome", op: "is any of", value: "Denied, Suspicious", tone: "include" },
  { id: "actor", field: "Actor", op: "is", value: "Ada Lovelace", tone: "include" },
  { id: "resource", field: "Resource", op: "contains", value: "auth", tone: "neutral" },
  { id: "ip", field: "IP", op: "is not", value: "internal", tone: "exclude" },
  { id: "when", field: "When", op: "in", value: "last 24h", tone: "neutral" },
];

/** What the mocks return for `listAuditEvents`. */
export const listAuditEvents: AuditPage = { items: entries, nextCursor: "ev_1", total: 1284 };
