// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import type {
  Collaborator,
  DocComment,
  DocCursor,
  DocSuggestion,
  SharedDoc,
} from "./schema";

/** The demo clock; comment and edit times are relative to it. */
export const now = "2026-04-24T15:00:00Z";

/** Demo data for the showcase, the generated mocks and tests. */
export const listCollaborators: Collaborator[] = [
  { id: "mina", name: "Mina Park", initials: "MP", tone: "info" },
  { id: "scout", name: "Scout", initials: "S", tone: "success", agent: true },
  { id: "quill", name: "Quill", initials: "Q", tone: "violet", agent: true },
  { id: "theo", name: "Theo Brandt", initials: "TB", tone: "warning" },
];

export const getSharedDoc: SharedDoc = {
  id: "launch-narrative",
  title: "Orbit Calendar: launch narrative",
  path: ["Orbit", "Marketing"],
  status: "Draft",
  editedAt: "2026-04-24T14:59:50Z",
  authors: ["mina", "scout", "quill"],
  blocks: [
    { id: "title", type: "h1", text: "Orbit Calendar: launch narrative" },
    { id: "h-why", type: "h2", text: "Why now" },
    {
      id: "why",
      type: "p",
      text: "Small agencies run their week on calendars that were built for one person. Producers juggle three or four of them, and most clashes are found the morning they happen.",
      mark: { phrase: "built for one person", by: "scout" },
    },
    {
      id: "gap",
      type: "p",
      text: "Nobody owns the shared view. Studio leads keep a spreadsheet on the side, and it is out of date by Tuesday.",
    },
    { id: "h-story", type: "h2", text: "The story we tell" },
    {
      id: "story",
      type: "p",
      text: "Orbit Calendar is the planner the whole studio shares. Every booking, shoot and deadline sits on one page.",
    },
    {
      id: "promise",
      type: "p",
      text: "We lead with time saved, not features.",
    },
    { id: "h-proof", type: "h2", text: "Proof points" },
    {
      id: "p1",
      type: "li",
      text: "Pilot studios cut scheduling clashes by 41% in six weeks.",
      mark: { phrase: "41% in six weeks", by: "mina" },
    },
    {
      id: "p2",
      type: "li",
      text: "Producers saved about three hours a week on planning.",
    },
    {
      id: "p3",
      type: "li",
      text: "Nine of twelve interviewed agencies use three or more calendars today.",
    },
  ],
};

export const listDocComments: DocComment[] = [
  {
    id: "c1",
    block: "why",
    author: "scout",
    text: "Source for this: 9 of 12 interviewed agencies run three or more calendars. Want me to add the quote?",
    createdAt: "2026-04-24T14:58:00Z",
  },
  {
    id: "c2",
    block: "p1",
    author: "mina",
    text: "Can we lead with the agency count instead? It’s the stronger number.",
    createdAt: "2026-04-24T14:46:00Z",
    reply: {
      author: "scout",
      text: "Moved it up in the outline. Kept 41% as the second point.",
    },
  },
];

/** The suggestions the demo plays one after another. */
export const suggestions: DocSuggestion[] = [
  {
    id: "s1",
    block: "story",
    author: "quill",
    text: " No more checking three apps to know who’s free on Thursday.",
    note: "Added a concrete moment so the promise lands.",
  },
  {
    id: "s2",
    block: "promise",
    author: "quill",
    text: " Three hours back every week is the headline.",
    note: "Turned the principle into the number we lead with.",
  },
];
export const getPendingSuggestion: DocSuggestion =
  suggestions[0] as DocSuggestion;

/** Where Mina's caret wanders in the demo. */
export const minaStops: DocCursor[] = [
  { person: "mina", block: "gap", after: "shared view." },
  { person: "mina", block: "gap", after: "spreadsheet" },
  { person: "mina", block: "p2", after: "three hours" },
  { person: "mina", block: "gap", after: "Tuesday." },
];
export const scoutCursor: DocCursor = {
  person: "scout",
  block: "why",
  after: "built for one person",
  activity: "reading",
  idle: true,
};
