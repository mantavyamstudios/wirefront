// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import type { DriveFolder, DriveMember, DriveTemplate } from "./schema";

/** The demo clock; edit times are relative to it. */
export const now = "2026-10-24T15:00:00Z";
const ago = (minutes: number) => new Date(Date.parse(now) - minutes * 60_000).toISOString();

/** Demo data for the showcase, the generated mocks and tests. */
export const workspace = "Northwind";

export const members: DriveMember[] = [
  { id: "ak", name: "Aiko Kato", initials: "AK", tone: "orange" },
  { id: "js", name: "Jonas Sand", initials: "JS", tone: "teal" },
  { id: "mv", name: "Mara Voss", initials: "MV", tone: "blue" },
  { id: "lo", name: "Lena Ortiz", initials: "LO", tone: "violet" },
  { id: "rb", name: "Rui Barros", initials: "RB", tone: "rose" },
];

export const listFolders: DriveFolder[] = [
  { id: "brand", name: "Brand refresh", files: 128, sizeMb: 2380, tone: "orange", editedAt: ago(12), members: ["ak", "js", "mv"], shared: true, starred: true },
  { id: "research", name: "User research", files: 64, sizeMb: 912, tone: "teal", editedAt: ago(95), members: ["lo", "js"], shared: true },
  { id: "finance", name: "Finance 2026", files: 37, sizeMb: 48, tone: "lime", editedAt: ago(1440), members: ["rb"] },
  { id: "launch", name: "Orbit 3 launch", files: 211, sizeMb: 5120, tone: "rose", editedAt: ago(30), members: ["ak", "mv", "lo", "rb"], shared: true, starred: true },
  { id: "legal", name: "Contracts", files: 19, sizeMb: 22, tone: "slate", editedAt: ago(8640), members: ["rb", "ak"] },
  { id: "hiring", name: "Hiring loop", files: 42, sizeMb: 156, tone: "violet", editedAt: ago(300), members: ["js", "lo"], shared: true },
  { id: "offsite", name: "Offsite photos", files: 486, sizeMb: 14200, tone: "yellow", editedAt: ago(20160), members: ["mv"] },
  { id: "eng", name: "Engineering RFCs", files: 73, sizeMb: 31, tone: "blue", editedAt: ago(180), members: ["ak", "js"], starred: true },
];

export const listTemplates: DriveTemplate[] = [
  { id: "notes", name: "Meeting notes", kind: "doc" },
  { id: "brief", name: "Project brief", kind: "brief" },
  { id: "budget", name: "Budget", kind: "sheet" },
  { id: "roadmap", name: "Roadmap", kind: "roadmap" },
  { id: "retro", name: "Retro board", kind: "board" },
  { id: "mood", name: "Moodboard", kind: "moodboard" },
];

export const getStorage = { usedGb: 42.6, totalGb: 100 };
export const createFolder: DriveFolder = { id: "new-1", name: "Untitled folder", files: 0, sizeMb: 0, tone: "neutral", editedAt: now, members: [] };
