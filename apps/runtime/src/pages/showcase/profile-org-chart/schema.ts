// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const OrgPerson = z
  .object({
    id: z.string(),
    name: z.string(),
    title: z.string(),
    /** Their manager's id; the person without one is the root. */
    managerId: z.string().optional(),
    /** Direct reports in total, including ones not loaded yet. */
    reportsCount: z.number().int().nonnegative(),
    avatarUrl: z.string().optional(),
  })
  .meta({ id: "OrgPerson" });
export type OrgPerson = z.infer<typeof OrgPerson>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listOrg: {
    method: "GET",
    path: "/org",
    summary: "The top of the org chart",
    response: z.object({ people: z.array(OrgPerson), total: z.number().int() }),
  },
  listReports: {
    method: "GET",
    path: "/org/{id}/reports",
    summary: "One manager's direct reports",
    params: z.object({ id: z.string() }),
    response: z.array(OrgPerson),
  },
});
