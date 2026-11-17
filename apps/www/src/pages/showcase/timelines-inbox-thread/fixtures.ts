// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { Thread } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const getThread: Thread = {
  id: "th-1",
  subject: "Audit log retention proposal",
  labels: ["#design", "#q2-roadmap"],
  starred: false,
  messages: [
    {
      id: "m1",
      from: { name: "Maya Okafor", email: "maya@acme.dev" },
      at: "2026-04-22T09:14:00Z",
      body: "Hi James — wanted to share the audit log retention proposal we discussed. The headline is that we lift Business plans from 30 days to 1 year, with deeper export controls. Curious where you’d push back.",
      attachments: [{ id: "f1", name: "audit-retention-proposal.pdf", bytes: 493568, href: "#file" }],
    },
    {
      id: "m2",
      from: { name: "James Lin", email: "james@acme.dev" },
      at: "2026-04-22T11:02:00Z",
      body: "Loved the framing. Two things: I’d want SSO logs included by default — half the customers who’ll buy this will buy it for SOC 2. And the export contract should match our existing CSV schema so we don’t break the SDK.",
      quoted: "we lift Business plans from 30 days to 1 year",
    },
    {
      id: "m3",
      from: { name: "Maya Okafor", email: "maya@acme.dev" },
      at: "2026-04-24T14:36:00Z",
      body: "Great calls — both folded in. Riya is taking the migration, I’m doing the UI. I’ll cut a draft PR by EOW. Want me to loop in legal for the retention copy?",
    },
  ],
};
