// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import type { FolderFile, FolderMember, SubFolder } from "./schema";

/** The demo clock; edit times are relative to it. */
export const now = "2026-10-22T15:00:00Z";
const ago = (minutes: number) => new Date(Date.parse(now) - minutes * 60_000).toISOString();
const KB = 1024;
const MB = 1024 * KB;

/** Demo data for the showcase, the generated mocks and tests. */
export const me = "ak";
export const workspace = "Northwind";
export const path = [{ label: "Files", href: "#files" }, { label: "Marketing", href: "#marketing" }];

export const members: FolderMember[] = [
  { id: "ak", name: "Aiko Kato", initials: "AK", tone: "orange" },
  { id: "js", name: "Jonas Sand", initials: "JS", tone: "teal" },
  { id: "mv", name: "Mara Voss", initials: "MV", tone: "blue" },
  { id: "lo", name: "Lena Ortiz", initials: "LO", tone: "violet" },
];

const files: FolderFile[] = [
  { id: "f1", name: "Brand guidelines v3", kind: "doc", sizeBytes: 48 * KB, editedBy: "ak", editedAt: ago(12) },
  { id: "f2", name: "Logo explorations", kind: "image", sizeBytes: 6.2 * MB, editedBy: "mv", editedAt: ago(60), art: "logos" },
  { id: "f3", name: "Colour tokens", kind: "sheet", sizeBytes: 212 * KB, editedBy: "js", editedAt: ago(180) },
  { id: "f4", name: "Launch keynote", kind: "slides", sizeBytes: 18 * MB, editedBy: "ak", editedAt: ago(1500) },
  { id: "f5", name: "Type specimen", kind: "pdf", sizeBytes: 2.4 * MB, editedBy: "lo", editedAt: ago(1560) },
  { id: "f6", name: "Sizzle reel, cut 2", kind: "video", sizeBytes: 412 * MB, editedBy: "mv", editedAt: ago(4320) },
  { id: "f7", name: "Moodboard: warm", kind: "image", sizeBytes: 9.8 * MB, editedBy: "lo", editedAt: ago(4400), art: "moodboard" },
  { id: "f8", name: "Copy deck", kind: "doc", sizeBytes: 36 * KB, editedBy: "js", editedAt: "2026-10-18T10:00:00Z" },
  { id: "f9", name: "Asset inventory", kind: "sheet", sizeBytes: 88 * KB, editedBy: "ak", editedAt: "2026-10-16T10:00:00Z" },
  { id: "f10", name: "Social templates", kind: "slides", sizeBytes: 7.1 * MB, editedBy: "mv", editedAt: "2026-10-12T10:00:00Z" },
];

const folders: SubFolder[] = [
  { id: "press", name: "Press kit", files: [] },
  {
    id: "archive",
    name: "Archive 2025",
    files: [
      { id: "a1", name: "Old logo lockups", kind: "image", sizeBytes: 3.1 * MB, editedBy: "mv", editedAt: "2026-03-04T10:00:00Z", art: "logos" },
      { id: "a2", name: "Brand audit", kind: "pdf", sizeBytes: 5.6 * MB, editedBy: "lo", editedAt: "2026-02-21T10:00:00Z" },
      { id: "a3", name: "Agency shortlist", kind: "sheet", sizeBytes: 64 * KB, editedBy: "ak", editedAt: "2026-01-30T10:00:00Z" },
    ],
  },
];

export const getFolder = { name: "Brand refresh", files, folders, members };
export const storage = { usedGb: 42.6, totalGb: 100 };

/** Files the demo adds on each upload. */
export const uploads: Omit<FolderFile, "id" | "editedBy" | "editedAt">[] = [
  { name: "Press photos", kind: "image", sizeBytes: 14 * MB, art: "photo" },
  { name: "Founder headshots", kind: "image", sizeBytes: 8.4 * MB, art: "photo" },
  { name: "Fact sheet", kind: "pdf", sizeBytes: 1.2 * MB },
];
export const createDoc: FolderFile = { id: "new-doc", name: "Untitled doc", kind: "doc", sizeBytes: KB, editedBy: "ak", editedAt: now };
