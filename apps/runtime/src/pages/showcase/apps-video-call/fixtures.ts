// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import type { CallMessage, CallPerson } from "./schema";

/** The demo clock; the call started 24 minutes earlier. */
export const now = "2026-10-24T10:44:13Z";

/** Demo data for the showcase, the generated mocks and tests. */
export const you: CallPerson = {
  id: "you",
  name: "Noor Haddad",
  title: "Product design",
  hue: "teal",
};

export const participants: CallPerson[] = [
  {
    id: "tomas",
    name: "Tomás Aguilar",
    title: "Design lead",
    hue: "sky",
    host: true,
  },
  { id: "priya", name: "Priya Raman", title: "Product", hue: "violet" },
  {
    id: "kenji",
    name: "Kenji Mori",
    title: "Engineering",
    hue: "amber",
    cameraOff: true,
  },
  {
    id: "ada",
    name: "Ada Okoye",
    title: "Research",
    hue: "emerald",
    muted: true,
  },
  { id: "lena", name: "Lena Fischer", title: "Engineering", hue: "rose" },
];

/** People who join and leave during the demo. */
export const dropIns: CallPerson[] = [
  {
    id: "felix",
    name: "Felix Brandt",
    title: "Support",
    hue: "orange",
    muted: true,
  },
  { id: "sol", name: "Sol Marín", title: "Marketing", hue: "indigo" },
  {
    id: "ines",
    name: "Inês Duarte",
    title: "Data",
    hue: "rose",
    cameraOff: true,
    muted: true,
  },
];

export const messages: CallMessage[] = [
  {
    id: "m1",
    authorId: "tomas",
    text: "Agenda: onboarding v3 flows, then empty states. Figma link in the invite.",
    sentAt: "2026-10-24T10:31:00Z",
  },
  {
    id: "m2",
    authorId: "priya",
    text: "Can we look at step 3 first? Support flagged it twice this week.",
    sentAt: "2026-10-24T10:33:00Z",
  },
];

/** Chat lines the demo posts while it runs. */
export const script = [
  { authorId: "lena", text: "The skip link on step 2 is tiny on mobile, fwiw" },
  { authorId: "ada", text: "Agree. 4 of 6 interviewees missed it entirely." },
  {
    authorId: "tomas",
    text: "Let’s take that as an action item. Noor, can you own it?",
  },
];

export const getCall = {
  title: "Design crit · Onboarding v3",
  startedAt: "2026-10-24T10:20:00Z",
  participants,
  messages,
};
export const meetingCode = "kst-wqpf-ndr";
export const devices = {
  microphones: [
    "Studio Display microphone",
    "MacBook Pro microphone",
    "AirPods Pro",
  ],
  cameras: ["FaceTime HD camera", "Studio Display camera"],
};
