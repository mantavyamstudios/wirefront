// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { QueueOverview } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const now = "2026-04-25T15:00:00Z";
export const scope = "acme/help";

const ago = (minutes: number) => new Date(Date.parse(now) - minutes * 60_000).toISOString();

export const getQueueOverview: QueueOverview = {
  counts: { open: 84, inProgress: 32, waiting: 41, resolved: 612 },
  breaches: [
    { id: "T-8413", subject: "Audit log export missing recent entries", customer: "Vercel", priority: "p0", target: "resolution", dueAt: ago(41) },
    { id: "T-8412", subject: "Billing usage shows yesterday's totals", customer: "Resend", priority: "p1", target: "resolution", dueAt: ago(22) },
    { id: "T-8421", subject: "Webhooks not firing for delete events", customer: "Linear", priority: "p0", target: "first-response", dueAt: ago(14) },
    { id: "T-8398", subject: "SAML login redirect loop on iOS Safari", customer: "Supabase", priority: "p1", target: "first-response", dueAt: ago(4) },
  ],
  firstResponse: {
    avgSeconds: 9 * 60,
    change: -0.38,
    hourly: [18, 14, 16, 12, 10, 14, 11, 9, 8, 10, 7, 8, 6, 8, 9, 7, 6, 8, 7, 6, 5, 7, 6, 8].map((m) => m * 60),
  },
  agents: [
    { id: "a1", name: "Maya Okafor", resolved: 41, avgFirstResponseSeconds: 8 * 60, csat: 4.9, load: 0.74 },
    { id: "a2", name: "James Lin", resolved: 38, avgFirstResponseSeconds: 12 * 60, csat: 4.8, load: 0.62 },
    { id: "a3", name: "Riya Patel", resolved: 36, avgFirstResponseSeconds: 9 * 60, csat: 4.9, load: 0.81 },
    { id: "a4", name: "Dani Kim", resolved: 28, avgFirstResponseSeconds: 14 * 60, csat: 4.7, load: 0.55 },
  ],
  tags: [
    { name: "billing", count: 62 },
    { name: "auth", count: 48 },
    { name: "api", count: 41 },
    { name: "webhooks", count: 28 },
    { name: "ui-bug", count: 22 },
    { name: "perf", count: 14 },
  ],
};

export const emptyQueue: QueueOverview = {
  counts: { open: 0, inProgress: 0, waiting: 0, resolved: 0 },
  breaches: [],
  firstResponse: { avgSeconds: 0, change: 0, hourly: [] },
  agents: [],
  tags: [],
};
