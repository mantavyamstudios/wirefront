// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import type { SplitShellItem, SplitShellUser } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const now = "2026-10-23T12:00:00Z";
export const user: SplitShellUser = { name: "Dara Achebe", subtitle: "Northwind Labs" };

/** What the mocks return for `listTasks`. */
export const listTasks: SplitShellItem[] = [
  { id: "t1", title: "Competitive scan: note apps", href: "#t1", state: "running", updatedAt: "2026-10-23T12:00:00Z" },
  { id: "t2", title: "Draft Q4 pricing memo", href: "#t2", state: "done", updatedAt: "2026-10-23T11:00:00Z" },
  { id: "t3", title: "Summarise churn interviews", href: "#t3", state: "done", updatedAt: "2026-10-21T09:00:00Z" },
  { id: "t4", title: "Onboarding email rewrite", href: "#t4", state: "idle", updatedAt: "2026-10-20T09:00:00Z" },
  { id: "t5", title: "Clean up the roadmap doc", href: "#t5", state: "idle", updatedAt: "2026-10-18T09:00:00Z" },
];
