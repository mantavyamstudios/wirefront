// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const ProjectStatus = z.enum(["active", "paused", "archived"]).meta({ id: "ProjectStatus" });
export type ProjectStatus = z.infer<typeof ProjectStatus>;

/** A project as the list shows it. */
export const ListedProject = z
  .object({
    id: z.string(),
    name: z.string(),
    status: ProjectStatus,
    ownerName: z.string(),
    members: z.number().int().nonnegative(),
    lastActiveAt: z.iso.datetime(),
  })
  .meta({ id: "ListedProject" });
export type ListedProject = z.infer<typeof ListedProject>;

/** The filters the toolbar sets. Absent means "any". */
export const ProjectFilters = z
  .object({
    status: ProjectStatus.optional(),
    owner: z.enum(["me", "team"]).optional(),
    /** Only projects active within this many days. */
    activeWithinDays: z.number().int().positive().optional(),
  })
  .meta({ id: "ProjectFilters" });
export type ProjectFilters = z.infer<typeof ProjectFilters>;

/** The list query as query-string parameters. */
export const ProjectsQuery = z
  .object({
    page: z.int().min(1),
    pageSize: z.int().min(1).max(100),
    search: z.string().optional(),
  })
  .extend(ProjectFilters.shape)
  .meta({ id: "ProjectsQuery" });
export type ProjectsQuery = z.infer<typeof ProjectsQuery>;

export const ProjectsPage = z
  .object({
    items: z.array(ListedProject),
    /** Projects matching the query, across all pages. */
    total: z.number().int().nonnegative(),
    /** All projects, ignoring the query. */
    overall: z.number().int().nonnegative(),
  })
  .meta({ id: "ProjectsPage" });
export type ProjectsPage = z.infer<typeof ProjectsPage>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listProjects: {
    method: "GET",
    path: "/projects",
    summary: "One page of projects matching the search and filters",
    query: ProjectsQuery,
    response: ProjectsPage,
  },
});
