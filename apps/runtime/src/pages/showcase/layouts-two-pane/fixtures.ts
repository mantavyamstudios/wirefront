// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { MailMessage } from "./schema";

/** The demo's clock; times are relative to it. */
export const now = "2026-04-28T12:00:00Z";

/** Demo data for the showcase, the generated mocks and tests. */
export const messages: MailMessage[] = [
  { id: "1", from: { name: "Maya Okafor" }, color: 2, subject: "Audit log query rewrite — ready for review", preview: "I rewrote the audit log query so the timeline page no longer hits the slow path. Can we land it tonight?", at: "2026-04-28T11:58:00Z", unread: true },
  { id: "2", from: { name: "James Lin" }, color: 3, subject: "Migration wrapped", preview: "All shards are caught up and the dual-write is off. Feel free to merge the cleanup PR whenever.", at: "2026-04-28T11:46:00Z", unread: true },
  { id: "3", from: { name: "Riya Patel" }, color: 5, subject: "Heads up — invite emails bouncing", preview: "Postmark is rejecting any address on big-corp.com. Looks like a DMARC change on their end.", at: "2026-04-28T11:00:00Z", unread: true },
  { id: "4", from: { name: "Dani Kim" }, color: 1, subject: "Loved the sidebar from yesterday", preview: "Bookmarked it for the next nav refresh. The pinned section in particular is a very nice touch.", at: "2026-04-28T09:00:00Z", unread: false },
  { id: "5", from: { name: "Alex Tran" }, color: 4, subject: "Pricing page copy is ready", preview: "Final draft is in the doc. I tightened the enterprise tier and pulled out the annual discount line.", at: "2026-04-27T15:00:00Z", unread: false },
  { id: "6", from: { name: "Ben Flores" }, color: 7, subject: "Permission scopes approved", preview: "Approved the new permission scopes for the API. See you on standup to walk through the rollout.", at: "2026-04-27T10:00:00Z", unread: false },
  { id: "7", from: { name: "Sara Quinn" }, color: 6, subject: "Empty-state copy direction", preview: "We should chat about whether to keep the playful tone or shift to something more direct.", at: "2026-04-27T09:00:00Z", unread: true },
  { id: "8", from: { name: "Theo Hart" }, color: 6, subject: "Onboarding metrics — week 3", preview: "Activation is up 6 points week-over-week. The new checklist is doing more work than I expected.", at: "2026-04-26T12:00:00Z", unread: false },
  { id: "9", from: { name: "Nina Brooks" }, color: 5, subject: "Design review notes", preview: "A few comments on the workspace switcher — mostly small, but one structural question about the org row.", at: "2026-04-25T12:00:00Z", unread: false },
  { id: "10", from: { name: "Owen Park" }, color: 8, subject: "Dust storm — bug bash on Thursday", preview: "Putting an hour on the calendar Thursday afternoon. Bring anything weird you've spotted in the new editor.", at: "2026-04-24T12:00:00Z", unread: true },
];

/** A sample body for whichever message opens. */
export const body = (m: MailMessage) =>
  [
    "Hey team,",
    `Quick update on the ${m.subject.toLowerCase()} workstream. We shipped the second pass of the timeline view this morning, and early numbers from the staged rollout suggest the slow query path is fully avoided for accounts under ten thousand events.`,
    "Let me know if anything looks off on your end. Happy to jump on a call this afternoon if it’s easier to walk through together.",
    `Thanks,\n${m.from.name}`,
  ].join("\n\n");

/** What the mocks return for `listMessages`. */
export const listMessages = { items: messages, unread: messages.filter((m) => m.unread).length };

/** What the mocks return for `getMessage`. */
export const getMessage: MailMessage = { ...(messages[2] as MailMessage), body: body(messages[2] as MailMessage) };
