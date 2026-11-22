// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import type { Issue, IssueLabel, IssuePerson } from "./schema";

/** The demo clock; dates are relative to it. */
export const now = "2026-10-24T15:00:00Z";

/** Demo data for the showcase, the generated mocks and tests. */
export const me = "maya";
export const team = { name: "Platform", key: "PLT", workspace: "Kestrel" };
export const cycle = { name: "Cycle 42", endsAt: "2026-10-30" };

export const createIssue: Issue = {
  id: "PLT-232",
  title: "",
  status: "todo",
  priority: 0,
  assignee: "maya",
  created: "2026-10-24",
  activity: [{ who: "maya", text: "created the issue", at: now }],
};

export const people: IssuePerson[] = [
  { id: "maya", name: "Maya Okafor", tone: "teal" },
  { id: "sam", name: "Sam Whitfield", tone: "amber" },
  { id: "jonas", name: "Jonas Weber", tone: "blue" },
  { id: "leo", name: "Leo Marchetti", tone: "rose" },
  { id: "ana", name: "Ana Sousa", tone: "orange" },
  { id: "priya", name: "Priya Raman", tone: "violet" },
];

export const labels: IssueLabel[] = [
  { id: "bug", name: "Bug", tone: "rose" },
  { id: "feature", name: "Feature", tone: "violet" },
  { id: "infra", name: "Infra", tone: "sky" },
  { id: "perf", name: "Performance", tone: "amber" },
  { id: "docs", name: "Docs", tone: "emerald" },
];

export const listIssues: Issue[] = [
  {
    id: "PLT-231",
    title: "Poison messages stall the webhook consumer",
    status: "in_progress",
    priority: 1,
    assignee: "sam",
    labels: ["bug", "infra"],
    estimate: 3,
    due: "2026-10-24",
    created: "2026-10-21",
    description: [
      "A single malformed payload blocks the consumer for its partition. Retries keep it at the head of the queue, so deliveries behind it wait until the message expires.",
      "Move messages that fail three times to a dead-letter queue and keep the consumer moving. Surface them in the delivery dashboard with a one-click replay.",
    ],
    subtasks: [
      { title: "Dead-letter queue with 7-day retention", done: true },
      { title: "Skip after 3 failed attempts", done: true },
      { title: "Replay from the dashboard", done: false },
    ],
    activity: [
      { who: "jonas", text: "created the issue", at: "2026-10-21" },
      { who: "jonas", text: "set priority to Urgent", at: "2026-10-21" },
      {
        who: "sam",
        text: "Reproduced with a truncated JSON body from a customer integration. Patch is up behind a flag.",
        at: "2026-10-22",
        comment: true,
      },
    ],
  },
  {
    id: "PLT-224",
    title: "Replay tool for missed webhook deliveries",
    status: "in_progress",
    priority: 2,
    assignee: "jonas",
    labels: ["feature"],
    estimate: 5,
    due: "2026-10-30",
    created: "2026-10-19",
  },
  {
    id: "PLT-215",
    title: "Move job scheduler to the new queue",
    status: "in_progress",
    priority: 3,
    assignee: "maya",
    labels: ["infra"],
    estimate: 8,
    created: "2026-10-12",
  },
  {
    id: "PLT-218",
    title: "Rate limit headers missing on 429 responses",
    status: "in_review",
    priority: 3,
    assignee: "leo",
    labels: ["bug"],
    estimate: 1,
    created: "2026-10-17",
  },
  {
    id: "PLT-198",
    title: "Flaky test: delivery ordering under load",
    status: "in_review",
    priority: 4,
    assignee: "sam",
    labels: ["bug"],
    estimate: 2,
    created: "2026-10-09",
  },
  {
    id: "PLT-212",
    title: "p95 latency regression on /v2/events",
    status: "todo",
    priority: 1,
    assignee: "ana",
    labels: ["perf", "bug"],
    estimate: 3,
    due: "2026-10-25",
    created: "2026-10-20",
  },
  {
    id: "PLT-229",
    title: "Alert when consumer lag exceeds 2 minutes",
    status: "todo",
    priority: 2,
    assignee: "sam",
    labels: ["infra"],
    estimate: 2,
    created: "2026-10-22",
  },
  {
    id: "PLT-209",
    title: "Rotate signing secrets without downtime",
    status: "todo",
    priority: 3,
    labels: ["feature"],
    estimate: 5,
    created: "2026-10-15",
  },
  {
    id: "PLT-205",
    title: "Document retry semantics for webhooks",
    status: "todo",
    priority: 4,
    assignee: "priya",
    labels: ["docs"],
    estimate: 1,
    created: "2026-10-14",
  },
  {
    id: "PLT-196",
    title: "Per-endpoint delivery dashboard",
    status: "backlog",
    priority: 3,
    assignee: "priya",
    labels: ["feature"],
    created: "2026-10-08",
  },
  {
    id: "PLT-201",
    title: "Deprecate the v1 events endpoint",
    status: "backlog",
    priority: 4,
    labels: ["docs"],
    created: "2026-10-11",
  },
  {
    id: "PLT-185",
    title: "Batch webhook deliveries per endpoint",
    status: "backlog",
    priority: 0,
    labels: ["perf"],
    created: "2026-10-02",
  },
  {
    id: "PLT-190",
    title: "Upgrade Postgres to 17",
    status: "done",
    priority: 2,
    assignee: "leo",
    labels: ["infra"],
    estimate: 5,
    created: "2026-10-03",
  },
  {
    id: "PLT-188",
    title: "Add jitter to retry backoff",
    status: "done",
    priority: 3,
    assignee: "sam",
    labels: ["infra"],
    estimate: 1,
    created: "2026-10-01",
  },
];
