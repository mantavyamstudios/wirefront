// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { BoardColumn } from "./schema";

const people = (...names: string[]) =>
  names.map((name) => ({ id: name.toLowerCase().replace(/\s+/g, "-"), name }));

/** Demo data for the showcase, the generated mocks and tests. */
export const columns: BoardColumn[] = [
  {
    id: "doing",
    name: "In progress",
    color: 3,
    tasks: [
      {
        id: "t1",
        key: "ENG-204",
        title: "Migrate billing webhooks to v3",
        labels: [{ name: "infra", color: 5 }],
        assignees: people("Lina Rodrigues", "Marco Kim"),
        priority: "high",
        dueAt: "2026-04-28",
        commentCount: 6,
        attachmentCount: 2,
        subtasks: { done: 4, total: 7 },
      },
      {
        id: "t2",
        key: "DSN-91",
        title: "Onboarding particle field micro-anim",
        labels: [
          { name: "design", color: 4 },
          { name: "polish", color: 1 },
        ],
        assignees: people("Priya Joshi"),
        priority: "med",
        dueAt: "2026-04-30",
        commentCount: 2,
        attachmentCount: 5,
      },
    ],
  },
  {
    id: "review",
    name: "Review",
    color: 1,
    tasks: [
      {
        id: "t3",
        key: "ENG-198",
        title: "Audit log retention policy",
        labels: [
          { name: "infra", color: 5 },
          { name: "security", color: 4 },
        ],
        assignees: people("Sam Chen"),
        priority: "urgent",
        dueAt: "2026-04-26",
        commentCount: 11,
        attachmentCount: 1,
      },
    ],
  },
];

/** What the mocks return for `getBoard`. */
export const getBoard = {
  name: "Sprint 24 board",
  startsOn: "2026-04-22",
  endsOn: "2026-05-05",
  columns,
};
