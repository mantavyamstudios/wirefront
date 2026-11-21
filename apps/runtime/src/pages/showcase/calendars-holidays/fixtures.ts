// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { TeamMember, TeamMonth } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const month = "2026-05";
export const team = "Acme team";

export const getTeamMonth: TeamMonth = {
  members: [
    { id: "m1", name: "Maya Okafor", role: "Engineering", days: [{ date: "2026-05-14", type: "remote" }, { date: "2026-05-15", type: "remote" }, { date: "2026-05-16", type: "remote" }] },
    { id: "m2", name: "James Lin", role: "Engineering", days: [{ date: "2026-05-06", type: "sick" }, { date: "2026-05-21", type: "vacation" }, { date: "2026-05-22", type: "vacation" }, { date: "2026-05-23", type: "vacation" }, { date: "2026-05-24", type: "vacation" }, { date: "2026-05-25", type: "vacation" }] },
    { id: "m3", name: "Riya Patel", role: "Engineering", days: [{ date: "2026-05-21", type: "vacation" }, { date: "2026-05-22", type: "vacation" }, { date: "2026-05-23", type: "vacation" }, { date: "2026-05-24", type: "vacation" }, { date: "2026-05-25", type: "vacation" }, { date: "2026-05-26", type: "vacation" }, { date: "2026-05-27", type: "vacation" }] },
    { id: "m4", name: "Dani Kim", role: "Design", days: [{ date: "2026-05-01", type: "vacation" }, { date: "2026-05-02", type: "vacation" }, { date: "2026-05-03", type: "vacation" }, { date: "2026-05-04", type: "vacation" }] },
    { id: "m5", name: "Mantavyam", role: "Marketing", days: [{ date: "2026-05-11", type: "remote" }, { date: "2026-05-12", type: "remote" }] },
    { id: "m6", name: "Alex Tran", role: "Product", days: [{ date: "2026-05-17", type: "sick" }] },
  ],
  holidays: [{ date: "2026-05-25", label: "Memorial Day" }],
};

export const addTeamMember: TeamMember = { id: "m7", name: "Avery Stone", role: "Support", days: [] };
