// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { PullRequest } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const now = "2026-04-14T12:00:00Z";

export const getPullRequest: PullRequest = {
  number: 128,
  repo: "acme/web",
  title: "Persist 1y audit log retention on Business plan",
  state: "open",
  head: "feat/audit-log",
  base: "main",
  commits: 14,
  files: 8,
  reviewers: [
    {
      id: "maya",
      name: "Maya Okafor",
      state: "approved",
      at: "2026-04-14T11:00:00Z",
    },
    {
      id: "james",
      name: "James Lin",
      state: "changes",
      at: "2026-04-14T09:00:00Z",
    },
    {
      id: "riya",
      name: "Riya Patel",
      state: "approved",
      at: "2026-04-14T11:40:00Z",
    },
    { id: "dani", name: "Dani Kim", state: "pending" },
  ],
  checks: [
    {
      id: "build-web",
      name: "build / web",
      status: "passed",
      durationMs: 134000,
    },
    {
      id: "build-api",
      name: "build / api",
      status: "passed",
      durationMs: 108000,
    },
    { id: "unit", name: "test / unit", status: "passed", durationMs: 182000 },
    { id: "e2e", name: "test / e2e", status: "passed", durationMs: 554000 },
    { id: "lint", name: "lint", status: "failing", durationMs: 21000 },
  ],
  events: [
    {
      id: "e6",
      type: "commit",
      summary: "James pushed 3 commits",
      detail: "feat(audit): wire retention setting",
      actor: "James Lin",
      at: "2026-04-14T11:48:00Z",
    },
    {
      id: "e5",
      type: "review",
      summary: "Riya approved",
      detail: "Looks great, thanks for splitting the migration.",
      actor: "Riya Patel",
      state: "approved",
      at: "2026-04-14T11:40:00Z",
    },
    {
      id: "e4",
      type: "comment",
      summary: "James left a comment",
      detail: "On line 42: any reason this isn’t memoised?",
      actor: "James Lin",
      at: "2026-04-14T11:00:00Z",
    },
    {
      id: "e3",
      type: "ci",
      summary: "lint failed",
      detail: "1 error in src/components/audit-log/row.tsx",
      state: "failing",
      at: "2026-04-14T10:00:00Z",
    },
    {
      id: "e2",
      type: "review",
      summary: "Maya approved",
      actor: "Maya Okafor",
      state: "approved",
      at: "2026-04-14T09:00:00Z",
    },
    {
      id: "e1",
      type: "opened",
      summary: "James opened pull request",
      detail: "feat(audit): persist 1y retention on Business plan",
      actor: "James Lin",
      at: "2026-04-14T07:00:00Z",
    },
  ],
};
