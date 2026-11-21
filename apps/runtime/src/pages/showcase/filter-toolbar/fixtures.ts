// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { ListedProject, ProjectsPage } from "./schema";
import type { ProjectsListQuery, SavedProjectView } from "./view";

/** The demo's clock; lastActiveAt values are relative to it. */
export const now = "2026-10-24T12:00:00Z";

const daysAgo = (days: number) => new Date(Date.parse(now) - days * 86_400_000).toISOString();

/** Demo data for the showcase, the generated mocks and tests. */
export const projects: (ListedProject & { owner: "me" | "team" | "other" })[] = [
  { id: "p1", name: "Atlas pricing v2", status: "active", owner: "me", ownerName: "You", lastActiveAt: daysAgo(1), members: 4 },
  { id: "p2", name: "Billing webhooks", status: "active", owner: "team", ownerName: "Platform", lastActiveAt: daysAgo(2), members: 3 },
  { id: "p3", name: "Q2 marketing site", status: "active", owner: "team", ownerName: "Brand", lastActiveAt: daysAgo(3), members: 6 },
  { id: "p4", name: "Audit log retention", status: "paused", owner: "team", ownerName: "Platform", lastActiveAt: daysAgo(12), members: 2 },
  { id: "p5", name: "Onboarding rewrite", status: "active", owner: "me", ownerName: "You", lastActiveAt: daysAgo(4), members: 3 },
  { id: "p6", name: "Mobile app refresh", status: "active", owner: "team", ownerName: "Mobile", lastActiveAt: daysAgo(8), members: 5 },
  { id: "p7", name: "Search relevance", status: "paused", owner: "other", ownerName: "Marc", lastActiveAt: daysAgo(22), members: 2 },
  { id: "p8", name: "Metrics migration", status: "archived", owner: "team", ownerName: "Infra", lastActiveAt: daysAgo(95), members: 4 },
  { id: "p9", name: "Particle field demo", status: "active", owner: "me", ownerName: "You", lastActiveAt: daysAgo(0), members: 1 },
  { id: "p10", name: "OAuth refresh tokens", status: "active", owner: "team", ownerName: "Platform", lastActiveAt: daysAgo(6), members: 3 },
  { id: "p11", name: "Legacy SSO sunset", status: "archived", owner: "team", ownerName: "Platform", lastActiveAt: daysAgo(140), members: 2 },
  { id: "p12", name: "Public changelog", status: "active", owner: "other", ownerName: "Lina", lastActiveAt: daysAgo(11), members: 2 },
  { id: "p13", name: "Email digest", status: "paused", owner: "me", ownerName: "You", lastActiveAt: daysAgo(38), members: 1 },
  { id: "p14", name: "Postgres upgrade", status: "active", owner: "team", ownerName: "Infra", lastActiveAt: daysAgo(14), members: 4 },
  { id: "p15", name: "Pricing page A/B", status: "active", owner: "other", ownerName: "Priya", lastActiveAt: daysAgo(5), members: 3 },
  { id: "p16", name: "Holiday landing page", status: "archived", owner: "team", ownerName: "Brand", lastActiveAt: daysAgo(220), members: 3 },
];

/** The query the demo opens with: the "Q2 — Active" view. */
export const defaultQuery: ProjectsListQuery = { page: 1, pageSize: 20, filters: { status: "active", activeWithinDays: 30 } };

export const savedViews: SavedProjectView[] = [{ id: "q2-active", label: "Q2 — Active", query: defaultQuery }];

/** What the mocks return for `listProjects`. */
export const listProjects: ProjectsPage = {
  items: projects.slice(0, 5).map(({ owner: _owner, ...p }) => p),
  total: 5,
  overall: projects.length,
};
