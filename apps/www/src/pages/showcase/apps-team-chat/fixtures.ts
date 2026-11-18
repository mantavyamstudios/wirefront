// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import type { ChatChannel, ChatMessage, ChatPerson } from "./schema";

/** The demo clock; message times are relative to it. */
export const now = "2026-10-23T11:14:00Z";

/** Demo data for the showcase, the generated mocks and tests. */
export const me = "maya";
export const workspace = "Kestrel";

export const people: ChatPerson[] = [
  { id: "maya", name: "Maya Okafor", tone: "teal", title: "Head of Product", presence: "active" },
  { id: "priya", name: "Priya Raman", tone: "violet", title: "Product Designer", presence: "active" },
  { id: "jonas", name: "Jonas Weber", tone: "blue", title: "Growth", presence: "active" },
  { id: "leo", name: "Leo Marchetti", tone: "rose", title: "Mobile", presence: "away" },
  { id: "sam", name: "Sam Whitfield", tone: "amber", title: "Platform", presence: "active" },
  { id: "ana", name: "Ana Sousa", tone: "orange", title: "Research", presence: "offline" },
];

export const listChannels: ChatChannel[] = [
  {
    id: "design",
    name: "design",
    kind: "channel",
    topic: "Crit Thursdays 2pm · onboarding v3 in review",
    members: 14,
    pinned: ["d1", "d6"],
    messages: [
      {
        id: "d0",
        author: "ana",
        sentAt: "2026-10-22T16:48:00Z",
        text: "Synthesis from the five beta teams is in the research folder. Short version: nobody reads step 4.",
        reactions: [{ emoji: "😅", people: ["priya", "leo"] }],
      },
      {
        id: "d1",
        author: "priya",
        sentAt: "2026-10-23T09:12:00Z",
        text: "Onboarding v3 is up for crit at 2pm. Biggest change: we ask for the team name last, after people have seen their first project.",
        file: { name: "onboarding-v3.pdf", size: "2.4 MB", pages: 18 },
        reactions: [
          { emoji: "🔥", people: ["jonas", "leo", "sam"] },
          { emoji: "👀", people: ["ana", "maya"] },
        ],
        replies: [
          { id: "r1", author: "jonas", sentAt: "2026-10-23T09:20:00Z", text: "Love that it ends on their first project instead of a form." },
          { id: "r2", author: "ana", sentAt: "2026-10-23T09:31:00Z", text: "Can we test step 4 with the beta teams before we lock it?" },
          { id: "r3", author: "priya", sentAt: "2026-10-23T09:40:00Z", text: "@Ana yes, booked three sessions for Tuesday.", reactions: [{ emoji: "🙌", people: ["ana"] }] },
          { id: "r4", author: "leo", sentAt: "2026-10-23T10:15:00Z", text: "I'll bring the mobile prototype so we test both." },
        ],
      },
      {
        id: "d2",
        author: "leo",
        sentAt: "2026-10-23T09:24:00Z",
        text: "The empty project state on step 3 is so much calmer. Can we reuse it in the mobile app?",
        reactions: [{ emoji: "👍", people: ["priya", "maya"] }],
      },
      { id: "d3", author: "leo", sentAt: "2026-10-23T09:25:00Z", text: "Also, the progress dots feel small on phones. 6px is hard to read at arm's length." },
      {
        id: "d4",
        author: "jonas",
        sentAt: "2026-10-23T10:02:00Z",
        text: "From the pricing side: if team name comes last, can we still show the plan picker before invites? I need it for the Starter experiment.",
        replies: [
          { id: "r1", author: "priya", sentAt: "2026-10-23T10:06:00Z", text: "Yes, plan picker stays on step 2." },
          { id: "r2", author: "jonas", sentAt: "2026-10-23T10:07:00Z", text: "Perfect, thank you." },
        ],
      },
      {
        id: "d5",
        author: "maya",
        sentAt: "2026-10-23T10:05:00Z",
        text: "@Jonas plan picker stays where it is. Priya and I walked the whole flow yesterday.",
      },
      {
        id: "d6",
        author: "sam",
        sentAt: "2026-10-23T10:41:00Z",
        text: "Shipped the `ease-out-quint` token to the design system. Every transition in the app is under 250ms now.",
        reactions: [
          { emoji: "🎉", people: ["priya", "leo", "jonas", "ana"] },
          { emoji: "⚡", people: ["maya"] },
        ],
      },
    ],
  },
  {
    id: "eng-platform",
    name: "eng-platform",
    kind: "channel",
    topic: "Queue, webhooks, deploys · on-call: Sam",
    members: 9,
    unread: 3,
    messages: [
      { id: "e1", author: "sam", sentAt: "2026-10-23T08:02:00Z", text: "Webhook backlog is back to zero. Postmortem draft is in the doc, comments open until Monday." },
      { id: "e2", author: "sam", sentAt: "2026-10-23T08:03:00Z", text: "Three follow-ups: poison-message handling, consumer lag alert at 2 minutes, and a replay tool.", saved: true },
      {
        id: "e3",
        author: "jonas",
        sentAt: "2026-10-23T09:50:00Z",
        text: "Does the replay tool cover the Oct 21 window? Two customers asked.",
        reactions: [{ emoji: "👍", people: ["maya"] }],
      },
    ],
  },
  {
    id: "launches",
    name: "launches",
    kind: "channel",
    topic: "What's shipping and when",
    members: 32,
    mentions: 1,
    messages: [
      { id: "l1", author: "jonas", sentAt: "2026-10-23T11:02:00Z", text: "@Maya can you sign off the Starter pricing copy before 3pm? Release notes go out at 4." },
    ],
  },
  {
    id: "research",
    name: "research",
    kind: "channel",
    private: true,
    members: 5,
    topic: "Interview notes and synthesis",
    messages: [{ id: "x1", author: "ana", sentAt: "2026-10-22T15:10:00Z", text: "Uploaded the last two interview recordings." }],
  },
  {
    id: "random",
    name: "random",
    kind: "channel",
    muted: true,
    members: 41,
    topic: "Dogs, lunch, and the office plant",
    messages: [{ id: "z1", author: "leo", sentAt: "2026-10-23T08:30:00Z", text: "Someone watered the fern twice again. It's thriving out of spite." }],
  },
  {
    id: "dm-priya",
    name: "Priya Raman",
    kind: "dm",
    with: "priya",
    messages: [
      { id: "p1", author: "priya", sentAt: "2026-10-23T08:55:00Z", text: "Do you have 10 minutes before crit? I want a second pair of eyes on step 4." },
    ],
  },
  {
    id: "dm-sam",
    name: "Sam Whitfield",
    kind: "dm",
    with: "sam",
    unread: 1,
    messages: [{ id: "s1", author: "sam", sentAt: "2026-10-23T10:58:00Z", text: "Heads up: deploy freeze starts Thursday 6pm for the board demo." }],
  },
  {
    id: "dm-leo",
    name: "Leo Marchetti",
    kind: "dm",
    with: "leo",
    messages: [{ id: "o1", author: "leo", sentAt: "2026-10-22T18:12:00Z", text: "Venue options for Lisbon are in your email." }],
  },
];

/** Who answers in each channel when the demo sends a message there. */
export const autoReplies: Record<string, { author: string; text: string }> = {
  design: { author: "priya", text: "Good call. Adding it to the crit doc so we don’t lose it." },
  "eng-platform": { author: "sam", text: "On it. I’ll post an update here after standup." },
  launches: { author: "jonas", text: "Thanks! Locking the copy now." },
};

export const sendChatMessage: ChatMessage = { id: "sent", author: "maya", sentAt: now, text: "On it." };
export const replyInThread = { id: "reply", author: "maya", sentAt: now, text: "Agreed." };
export const createChannel: ChatChannel = { id: "new-channel", name: "new-channel", kind: "channel", members: 1, messages: [] };
export const openDirectMessage: ChatChannel = { id: "dm-ana", name: "Ana Sousa", kind: "dm", with: "ana", messages: [] };
