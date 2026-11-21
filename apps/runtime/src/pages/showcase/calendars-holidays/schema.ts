// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const AbsenceType = z.enum(["vacation", "sick", "remote"]);
export type AbsenceType = z.infer<typeof AbsenceType>;

export const TeamMember = z
  .object({
    id: z.string(),
    name: z.string(),
    role: z.string().optional(),
    /** Days away or remote in the month, as YYYY-MM-DD. */
    days: z.array(z.object({ date: z.string(), type: AbsenceType })),
  })
  .meta({ id: "TeamMember" });
export type TeamMember = z.infer<typeof TeamMember>;

export const Holiday = z.object({ date: z.string(), label: z.string() }).meta({ id: "Holiday" });
export type Holiday = z.infer<typeof Holiday>;

export const TeamMonth = z.object({ members: z.array(TeamMember), holidays: z.array(Holiday) }).meta({ id: "TeamMonth" });
export type TeamMonth = z.infer<typeof TeamMonth>;

export const NewMember = z.object({ name: z.string().trim().min(1, "Enter a name."), role: z.string().trim().optional() }).meta({ id: "NewMember" });
export type NewMember = z.infer<typeof NewMember>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getTeamMonth: { method: "GET", path: "/team/time-off", summary: "Time off and holidays for a month", query: z.object({ month: z.string() }), response: TeamMonth },
  setTimeOff: {
    method: "PUT",
    path: "/team/{memberId}/time-off/{date}",
    summary: "Set or clear one day for a member (type null clears it)",
    params: z.object({ memberId: z.string(), date: z.string() }),
    body: z.object({ type: AbsenceType.nullable() }),
  },
  setHoliday: { method: "PUT", path: "/team/holidays/{date}", summary: "Mark or unmark a team holiday", params: z.object({ date: z.string() }), body: z.object({ on: z.boolean() }) },
  addTeamMember: { method: "POST", path: "/team/members", summary: "Add someone to the time-off calendar", body: NewMember, response: TeamMember },
  removeTeamMember: { method: "DELETE", path: "/team/members/{id}", summary: "Remove someone from the time-off calendar", params: z.object({ id: z.string() }) },
});
