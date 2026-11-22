// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import type { Note, NoteBlock, NoteBlockType, NoteFolder } from "./schema";

/** The demo clock; edit times are relative to it. */
export const now = "2026-10-24T10:00:00Z";

/** Demo data for the showcase, the generated mocks and tests. */
export const listNoteFolders: NoteFolder[] = [
  { id: "personal", name: "Personal", tone: "amber" },
  { id: "work", name: "Work", tone: "sky" },
  { id: "recipes", name: "Recipes", tone: "rose" },
  { id: "travel", name: "Travel", tone: "emerald" },
];

let seed = 0;
const b = (type: NoteBlockType, text: string, done?: boolean): NoteBlock => ({
  id: `b${++seed}`,
  type,
  text,
  done,
});

export const listNotes: Note[] = [
  {
    id: "n1",
    title: "Lisbon in May",
    folderId: "travel",
    updatedAt: "2026-10-24T09:41:00Z",
    pinned: true,
    blocks: [
      b(
        "p",
        "Five nights, flying in on the 14th. Staying in Príncipe Real, ten minutes up the hill from Bairro Alto."
      ),
      b("h2", "Before we go"),
      b("todo", "Renew passport", true),
      b("todo", "Book the 28 tram early, before the queues", true),
      b("todo", "Pack a travel adapter (type F)"),
      b("todo", "Download offline maps for Sintra"),
      b("h2", "Eat"),
      b("bullet", "Custard tarts warm from the oven, first morning"),
      b("bullet", "Grilled sardines somewhere in Alfama"),
      b("bullet", "Ask Rui for the tasca with no sign on the door"),
      b("h2", "Maybe"),
      b(
        "p",
        "Day trip to Cascais if the weather holds. Train from Cais do Sodré, 40 minutes."
      ),
    ],
  },
  {
    id: "n2",
    title: "Q4 planning",
    folderId: "work",
    updatedAt: "2026-10-23T16:20:00Z",
    pinned: true,
    blocks: [
      b("p", "Three bets for the quarter. Everything else waits for January."),
      b("h2", "Bets"),
      b(
        "bullet",
        "Self-serve onboarding: cut time to first project under 5 minutes"
      ),
      b("bullet", "Usage-based billing for teams over 50 seats"),
      b("bullet", "Kill the legacy export pipeline"),
      b("h2", "Owners"),
      b("todo", "Confirm onboarding owner with Mara", true),
      b("todo", "Draft billing RFC by Nov 3"),
      b("todo", "Get export deprecation date into the changelog"),
    ],
  },
  {
    id: "n3",
    title: "Weekend sourdough",
    folderId: "recipes",
    updatedAt: "2026-10-22T08:05:00Z",
    blocks: [
      b(
        "p",
        "500g flour (80% bread, 20% whole wheat), 375g water, 100g starter, 10g salt."
      ),
      b("h2", "Schedule"),
      b("todo", "Fri 9pm: feed starter", true),
      b("todo", "Sat 9am: mix, rest 1 hour", true),
      b("todo", "Sat 10am to 2pm: four sets of folds", true),
      b("todo", "Shape, then cold proof overnight"),
      b("todo", "Sun 8am: bake 250°C, 20 min lid on, 25 off"),
    ],
  },
  {
    id: "n4",
    title: "1:1 with Mara",
    folderId: "work",
    updatedAt: "2026-10-21T11:30:00Z",
    blocks: [
      b("h2", "Her topics"),
      b("bullet", "Wants more ownership of the design system"),
      b("bullet", "Feeling stretched across two squads"),
      b("h2", "Mine"),
      b(
        "bullet",
        "Promo packet timeline: draft due before the end of the month"
      ),
      b("todo", "Move her off the billing squad after the RFC lands"),
    ],
  },
  {
    id: "n5",
    title: "Gift ideas",
    folderId: "personal",
    updatedAt: "2026-10-18T19:12:00Z",
    blocks: [
      b("todo", "Dad: the hiking poles he keeps borrowing"),
      b("todo", "Ines: pottery class voucher", true),
      b("todo", "Sam: that out-of-print photo book (check secondhand)"),
      b("p", "Budget around €60 each. Order before Dec 10 for shipping."),
    ],
  },
  {
    id: "n6",
    title: "Reading list",
    folderId: "personal",
    updatedAt: "2026-10-12T22:40:00Z",
    blocks: [
      b("p", "Slowly working through the pile on the nightstand."),
      b("bullet", "The one about lighthouse keepers Jo recommended"),
      b("bullet", "Something short and funny for the flight"),
      b("bullet", "Finish the essay collection (stuck on chapter 6)"),
    ],
  },
  {
    id: "n7",
    title: "Apartment move",
    folderId: "personal",
    updatedAt: "2026-09-30T10:00:00Z",
    blocks: [
      b("todo", "Give notice to landlord", true),
      b("todo", "Book van for the 2nd", true),
      b("todo", "Forward mail"),
      b("todo", "Measure the alcove for the bookshelf"),
    ],
  },
];
export const createNote: Note = {
  id: "n-new",
  title: "",
  folderId: "personal",
  updatedAt: now,
  blocks: [{ id: "b-new", type: "p", text: "" }],
};
