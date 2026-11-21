// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { PullRequestDetail } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const now = "2026-04-14T12:00:00Z";

export const getPullRequestDetail: PullRequestDetail = {
  number: 3284,
  repo: "acme/web",
  title: "Persist 1y audit-log retention on Business plan",
  state: "open",
  author: "Mantavyam",
  head: "feat/audit-log",
  base: "main",
  body: "Adds 1-year retention for audit log entries on the Business plan. Closes the compliance gap flagged in #3211 — the read-side already supports per-plan retention, this PR only persists it on writes.",
  highlights: ["New retentionFor(plan) helper", "Migration adds retention_days with sensible defaults", "Backfill script in scripts/backfill-retention.ts"],
  commits: 3,
  files: 8,
  additions: 142,
  deletions: 18,
  requiredApprovals: 2,
  conflicts: false,
  upToDate: true,
  reviewers: [
    { id: "maya", name: "Maya Okafor", state: "approved", note: "active now" },
    { id: "james", name: "James Lin", state: "approved", note: "1h ago" },
    { id: "riya", name: "Riya Patel", state: "pending", note: "in NYC, asleep" },
  ],
  checks: [
    { id: "build-web", name: "build", context: "web", status: "passed", durationMs: 134000 },
    { id: "build-api", name: "build", context: "api", status: "passed", durationMs: 108000 },
    { id: "unit", name: "test", context: "unit", status: "passed", durationMs: 182000 },
    { id: "e2e", name: "test", context: "e2e", status: "passed", durationMs: 554000 },
    { id: "lint", name: "lint", context: "tsc", status: "passed", durationMs: 21000 },
    { id: "preview", name: "preview", context: "vercel", status: "passed", durationMs: 66000 },
    { id: "security", name: "security", context: "snyk", status: "passed", durationMs: 32000 },
    { id: "perf", name: "perf", context: "lighthouse", status: "running" },
  ],
  timeline: [
    {
      id: "t1",
      kind: "commit",
      actor: "Maya Okafor",
      at: "2026-04-14T11:48:00Z",
      commits: [
        { sha: "f3b9a21", message: "feat(audit): persist 1y retention on Business plan" },
        { sha: "12cae71", message: "Merge branch 'feat/audit-log'" },
        { sha: "8a204d3", message: "fix(table): respect filter in CSV export" },
      ],
    },
    { id: "t2", kind: "ci", at: "2026-04-14T11:50:00Z", passed: 7, total: 8, durationMs: 554000 },
    {
      id: "t3",
      kind: "comment",
      actor: "James Lin",
      at: "2026-04-14T11:52:00Z",
      body: "Could we extract the retention map so the api route doesn’t need to know about plan tiers? Otherwise this LGTM.",
      diff: {
        file: "apps/api/src/audit/retention.ts",
        line: 42,
        lines: [
          { kind: "context", n: 41, text: "export function retentionFor(plan: Plan): number {" },
          { kind: "del", n: 42, text: "  if (plan === 'business') return 365" },
          { kind: "add", n: 42, text: "  return RETENTION_BY_PLAN[plan] ?? DEFAULT_RETENTION" },
          { kind: "context", n: 43, text: "}" },
        ],
      },
    },
    { id: "t4", kind: "review", actor: "James Lin", at: "2026-04-14T11:54:00Z", state: "approved", summary: "Resolved with the inline suggestion. Thanks!" },
    { id: "t5", kind: "deploy", at: "2026-04-14T11:55:00Z", env: "preview", url: "audit-log-feat.preview.acme.dev", durationMs: 66000 },
    { id: "t6", kind: "review", actor: "Maya Okafor", at: "2026-04-14T11:57:00Z", state: "approved" },
    { id: "t7", kind: "status", actor: "Mantavyam", at: "2026-04-14T11:58:00Z", label: "marked ready for review" },
  ],
  labels: [
    { name: "audit", tone: "violet" },
    { name: "billing", tone: "amber" },
    { name: "needs-design-review", tone: "sky" },
  ],
  linkedIssues: [
    { number: 3211, title: "Business plan compliance gaps", href: "#3211" },
    { number: 3198, title: "Audit log retention story", href: "#3198" },
  ],
  milestone: { title: "v3.4 release", done: 9, total: 12, dueAt: "2026-04-16T12:00:00Z" },
};
