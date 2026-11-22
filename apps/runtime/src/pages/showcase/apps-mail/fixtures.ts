// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import type { MailLabel, MailMessage, MailPerson, MailThread } from "./schema";

/** The demo clock; message times are relative to it. */
export const now = "2026-10-23T10:00:00Z";

/** Demo data for the showcase, the generated mocks and tests. */
export const account: MailPerson = {
  name: "Maya Okafor",
  email: "maya@kestrel.dev",
  tone: "teal",
};

const jonas: MailPerson = {
  name: "Jonas Weber",
  email: "jonas@kestrel.dev",
  tone: "blue",
};
const priya: MailPerson = {
  name: "Priya Raman",
  email: "priya@kestrel.dev",
  tone: "violet",
};
const ana: MailPerson = {
  name: "Ana Sousa",
  email: "ana@kestrel.dev",
  tone: "orange",
};
const noor: MailPerson = {
  name: "Noor Haddad",
  email: "noor@fieldnote.app",
  tone: "emerald",
};
const leo: MailPerson = {
  name: "Leo Marchetti",
  email: "leo@kestrel.dev",
  tone: "rose",
};
const sam: MailPerson = {
  name: "Sam Whitfield",
  email: "sam@kestrel.dev",
  tone: "amber",
};
const felix: MailPerson = {
  name: "Felix Bauer",
  email: "felix@bauer-legal.eu",
  tone: "sky",
};
const harbor: MailPerson = {
  name: "Harbor Bank",
  email: "statements@harborbank.example",
  tone: "teal",
};
const ellie: MailPerson = {
  name: "Ellie Park",
  email: "ellie.park@hey.example",
  tone: "violet",
};

export const listLabels: MailLabel[] = [
  { id: "product", name: "Product", tone: "violet" },
  { id: "customers", name: "Customers", tone: "sky" },
  { id: "finance", name: "Finance", tone: "emerald" },
  { id: "hiring", name: "Hiring", tone: "amber" },
];

export const listThreads: MailThread[] = [
  {
    id: "t1",
    subject: "Q4 pricing review, notes before Thursday",
    folder: "inbox",
    labels: ["finance"],
    unread: true,
    starred: true,
    messages: [
      {
        id: "m1",
        from: jonas,
        to: "to me, Priya",
        sentAt: "2026-10-20T16:12:00Z",
        body: [
          "Sharing the first pass of the Q4 pricing numbers so we're not reading them cold on Thursday.",
          "Short version: seat expansion is carrying us, but the Starter tier churns at 6.1% a month. I'd like us to decide whether we fold it into Team or raise the floor.",
        ],
        attachments: [
          { name: "q4-pricing-model.xlsx", size: "184 KB", kind: "sheet" },
        ],
      },
      {
        id: "m2",
        from: priya,
        to: "to Jonas, me",
        sentAt: "2026-10-21T10:03:00Z",
        body: [
          "Folding Starter into Team would break the self-serve path we just rebuilt. Can we model a $12 floor before we go there?",
        ],
      },
      {
        id: "m3",
        from: jonas,
        to: "to me, Priya",
        sentAt: "2026-10-23T09:41:00Z",
        body: [
          "Ran it. A $12 floor keeps 82% of Starter accounts and adds about $41k MRR by end of quarter. That's the scenario on tab 3.",
          "Maya, could you pressure-test the churn assumption before Thursday? You know the cohort data better than either of us.",
          "Thanks,\nJonas",
        ],
      },
    ],
  },
  {
    id: "t2",
    subject: "Rollout to 40 seats next week?",
    folder: "inbox",
    labels: ["customers"],
    unread: true,
    messages: [
      {
        id: "m1",
        from: noor,
        to: "to me",
        sentAt: "2026-10-23T09:02:00Z",
        body: [
          "Hi Maya, the pilot team has been living in Kestrel for three weeks and they won't give it back. We'd like to roll out to the remaining 40 seats on Monday.",
          "Two questions before I send the PO: can we keep our pilot workspace as-is, and is SSO included on the annual plan?",
          "Best,\nNoor",
        ],
      },
    ],
  },
  {
    id: "t3",
    subject: "Design crit: onboarding v3",
    folder: "inbox",
    labels: ["product"],
    unread: true,
    messages: [
      {
        id: "m1",
        from: priya,
        to: "to Product team",
        sentAt: "2026-10-23T08:15:00Z",
        body: [
          "Attached the v3 flow ahead of crit at 2pm. The big change: we ask for the team name last, after people have seen their first project.",
          "I'd love blunt feedback on step 4. It still feels like a form.",
        ],
        attachments: [
          { name: "onboarding-v3.pdf", size: "2.4 MB", kind: "pdf" },
          { name: "step-4-variants.png", size: "860 KB", kind: "image" },
        ],
      },
    ],
  },
  {
    id: "t4",
    subject: "Candidate packet: Staff Engineer, Platform",
    folder: "inbox",
    labels: ["hiring"],
    messages: [
      {
        id: "m1",
        from: ana,
        to: "to me, Sam",
        sentAt: "2026-10-22T17:40:00Z",
        body: [
          "Packet for Friday's debrief is attached: resume, take-home, and notes from the two technical rounds.",
          "Strong yes from systems design. Mixed signal on the collaboration round, so I'd like your read on it.",
        ],
        attachments: [
          { name: "packet-r-alvarez.pdf", size: "1.1 MB", kind: "pdf" },
        ],
      },
    ],
  },
  {
    id: "t5",
    subject: "Incident review: Oct 21 webhook delays",
    folder: "inbox",
    messages: [
      {
        id: "m1",
        from: sam,
        to: "to Engineering",
        sentAt: "2026-10-22T14:18:00Z",
        body: [
          "Draft review is up. Root cause was a queue consumer stuck on a poison message for 38 minutes; retries masked it until the backlog hit 120k.",
          "Three follow-ups, owners assigned. Comments welcome until Monday.",
        ],
      },
    ],
  },
  {
    id: "t6",
    subject: "Re: Lisbon offsite, venue shortlist",
    folder: "inbox",
    messages: [
      {
        id: "m1",
        from: account,
        to: "to Leo",
        sentAt: "2026-10-21T09:00:00Z",
        body: [
          "Anything with a big table and a door that closes works for me.",
        ],
      },
      {
        id: "m2",
        from: leo,
        to: "to me",
        sentAt: "2026-10-22T09:00:00Z",
        body: [
          "Down to two: a converted printworks in Marvila and a quinta 30 minutes out. The printworks wins on walkability, the quinta on sunsets.",
          "Need a call by Friday to hold the dates.",
        ],
      },
    ],
  },
  {
    id: "t7",
    subject: "Contract redlines v2",
    folder: "inbox",
    labels: ["finance"],
    messages: [
      {
        id: "m1",
        from: felix,
        to: "to me",
        sentAt: "2026-10-21T09:00:00Z",
        body: [
          "Second round of redlines attached. We accepted your liability cap; the open item is the 60-day termination notice.",
        ],
        attachments: [
          { name: "msa-redlines-v2.docx", size: "96 KB", kind: "doc" },
        ],
      },
    ],
  },
  {
    id: "t8",
    subject: "Your October statement is ready",
    folder: "inbox",
    messages: [
      {
        id: "m1",
        from: harbor,
        to: "to me",
        sentAt: "2026-10-20T09:00:00Z",
        body: [
          "Your statement for the account ending 0417 is ready to view in online banking.",
        ],
      },
    ],
  },
  {
    id: "t9",
    subject: "Coffee next week?",
    folder: "inbox",
    messages: [
      {
        id: "m1",
        from: ellie,
        to: "to me",
        sentAt: "2026-10-19T09:00:00Z",
        body: [
          "Back in town from Tuesday. That place by the canal still good?",
        ],
      },
    ],
  },
  {
    id: "s1",
    subject: "Re: Hiring plan for H1",
    folder: "sent",
    messages: [
      {
        id: "m1",
        from: account,
        to: "to Ana",
        sentAt: "2026-10-18T09:00:00Z",
        body: [
          "Looks right. Let's hold the second designer req until we see Q4 numbers.",
        ],
      },
    ],
  },
  {
    id: "s2",
    subject: "Board update draft",
    folder: "drafts",
    messages: [
      {
        id: "m1",
        from: account,
        to: "to Board",
        sentAt: "2026-10-17T09:00:00Z",
        body: [
          "Headline for the quarter: net revenue retention back above 120%.",
        ],
      },
    ],
  },
  {
    id: "a1",
    subject: "Your flight to Lisbon is confirmed",
    folder: "archive",
    messages: [
      {
        id: "m1",
        from: { name: "Gull Air", email: "trips@gullair.example", tone: "sky" },
        to: "to me",
        sentAt: "2026-10-12T09:00:00Z",
        body: [
          "Booking reference KX4Q2M. Check-in opens 24 hours before departure.",
        ],
      },
    ],
  },
];

export const storage = { usedGb: 11.2, totalGb: 30 };
export const quickReplies = [
  "Thanks, on it.",
  "Can we talk Thursday?",
  "Looks good to me.",
];
export const replyToThread: MailMessage = {
  id: "reply",
  from: account,
  to: "to Jonas",
  sentAt: now,
  body: ["Thanks, on it."],
};
export const sendMail: MailThread = {
  id: "sent-1",
  subject: "(no subject)",
  folder: "sent",
  messages: [
    {
      id: "m1",
      from: account,
      to: "to someone@example.com",
      sentAt: now,
      body: [],
    },
  ],
};
