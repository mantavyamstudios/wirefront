// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { Deploy } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const now = "2026-04-14T12:00:00Z";
export const project = "acme/web";

export const listDeploys: Deploy[] = [
  { id: "dpl_8a92", env: "production", branch: "main", sha: "f3b9a21", status: "in-progress", message: "feat(audit): persist 1y retention", author: "Maya Okafor", durationMs: 402000, at: "2026-04-14T11:53:18Z" },
  { id: "dpl_4f01", env: "production", branch: "main", sha: "2b10f7c", status: "succeeded", message: "release v3.4", author: "Mantavyam", durationMs: 318000, at: "2026-04-13T10:00:00Z" },
  { id: "dpl_31bc", env: "staging", branch: "main", sha: "4d99a0c", status: "succeeded", message: "chore: bump @wirefront/ui", author: "Riya Patel", durationMs: 92000, at: "2026-04-13T08:30:00Z" },
  { id: "dpl_22ae", env: "preview", branch: "feat/audit-log", sha: "12cae71", status: "succeeded", message: "Merge feat/audit-log", author: "Maya Okafor", durationMs: 124000, at: "2026-04-12T09:00:00Z" },
  { id: "dpl_19fc", env: "production", branch: "main", sha: "9b0c44e", status: "rolled-back", message: "fix(billing): retry on 5xx", author: "James Lin", durationMs: 262000, at: "2026-04-11T14:00:00Z" },
  { id: "dpl_0ff3", env: "preview", branch: "fix/csv-export", sha: "7f10b5e", status: "failed", message: "wip(table): wire export action menu", author: "James Lin", durationMs: 48000, at: "2026-04-10T16:00:00Z" },
  { id: "dpl_0a91", env: "staging", branch: "main", sha: "8a204d3", status: "succeeded", message: "fix(table): respect filter in CSV export", author: "James Lin", durationMs: 101000, at: "2026-04-09T11:00:00Z" },
];
