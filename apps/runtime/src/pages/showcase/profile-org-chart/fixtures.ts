// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { OrgPerson } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const company = "Acme";

export const listOrg: { people: OrgPerson[]; total: number } = {
  total: 28,
  people: [
    { id: "olive", name: "Olive Berg", title: "CEO", reportsCount: 3 },
    { id: "helena", name: "Helena Marsh", title: "VP Engineering", managerId: "olive", reportsCount: 2 },
    { id: "maya", name: "Maya Okafor", title: "Eng Manager · Audit", managerId: "helena", reportsCount: 3 },
    { id: "james", name: "James Lin", title: "Senior Engineer · API", managerId: "maya", reportsCount: 0 },
    { id: "riya", name: "Riya Patel", title: "Engineer · Billing", managerId: "maya", reportsCount: 0 },
    { id: "alex", name: "Alex Tran", title: "Engineer · Front-end", managerId: "maya", reportsCount: 0 },
    { id: "carlos", name: "Carlos Mendes", title: "Eng Manager · Platform", managerId: "helena", reportsCount: 3 },
    { id: "mia", name: "Mia Lloyd", title: "VP Design", managerId: "olive", reportsCount: 2 },
    { id: "dani", name: "Dani Kim", title: "Lead Designer", managerId: "mia", reportsCount: 0 },
    { id: "joon", name: "Joon Park", title: "Designer · Brand", managerId: "mia", reportsCount: 0 },
    { id: "elena", name: "Elena Vargas", title: "Head of Sales", managerId: "olive", reportsCount: 6 },
  ],
};

export const listReports: OrgPerson[] = [
  { id: "farah", name: "Farah Hassan", title: "Engineer · ML", managerId: "carlos", reportsCount: 0 },
  { id: "demarcus", name: "Demarcus Hall", title: "Engineer · Mobile", managerId: "carlos", reportsCount: 0 },
  { id: "nadia", name: "Nadia Costa", title: "Engineer · Infra", managerId: "carlos", reportsCount: 0 },
];
