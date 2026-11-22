// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { Commit } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const now = "2026-04-14T12:00:00Z";
export const repo = "acme/web";
export const branch = "main";

export const listCommits: Commit[] = [
  {
    sha: "f3b9a21",
    parents: ["12cae71"],
    lane: 0,
    author: "Maya",
    message: "feat(audit): persist 1y retention on Business plan",
    scope: "billing/audit",
    at: "2026-04-14T10:00:00Z",
    filesChanged: 8,
    additions: 142,
    deletions: 18,
    tag: "v3.4",
  },
  {
    sha: "12cae71",
    parents: ["4d99a0c", "8a204d3"],
    lane: 0,
    author: "Maya",
    message: "Merge branch 'feat/audit-log'",
    scope: "merge",
    at: "2026-04-14T09:50:00Z",
  },
  {
    sha: "8a204d3",
    parents: ["7f10b5e"],
    lane: 1,
    author: "James",
    message: "fix(table): respect filter in CSV export",
    scope: "tables",
    at: "2026-04-14T08:00:00Z",
    filesChanged: 3,
    additions: 24,
    deletions: 6,
  },
  {
    sha: "7f10b5e",
    parents: ["4d99a0c"],
    lane: 1,
    author: "James",
    message: "wip(table): wire export action menu",
    scope: "tables",
    at: "2026-04-14T07:00:00Z",
    filesChanged: 4,
    additions: 78,
    deletions: 22,
  },
  {
    sha: "4d99a0c",
    parents: ["2b10f7c"],
    lane: 0,
    author: "Riya",
    message: "chore: bump @wirefront/ui to 0.8.2",
    scope: "deps",
    at: "2026-04-14T04:00:00Z",
    filesChanged: 2,
    additions: 1,
    deletions: 1,
  },
  {
    sha: "9c8e3f1",
    parents: ["2b10f7c"],
    lane: 2,
    author: "Dani",
    message: "design(palette): tighter ⌘K row spacing",
    scope: "command",
    at: "2026-04-13T15:00:00Z",
    filesChanged: 1,
    additions: 12,
    deletions: 8,
  },
  {
    sha: "2b10f7c",
    parents: [],
    lane: 0,
    author: "Mantavyam",
    message: "release v3.4",
    scope: "release",
    at: "2026-04-13T11:00:00Z",
    filesChanged: 1,
    additions: 2,
    deletions: 2,
    tag: "v3.4",
  },
];
