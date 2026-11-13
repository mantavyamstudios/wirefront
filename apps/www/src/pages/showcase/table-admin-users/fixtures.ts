// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import type { AdminUser, AdminUserDetails, AdminUsersPage } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const now = "2026-10-24T12:00:00Z";
export const orgName = "Larkfield Studio";
export const seats = 15;
export const currentUserId = "u1";

export const users: AdminUser[] = [
  { id: "u1", name: "Maya Lindgren", email: "maya@larkfield.studio", role: "owner", status: "active", twoFactor: true, teams: ["Leadership", "Design"], lastActiveAt: "2026-10-24T11:57:00Z", joinedAt: "2024-03-02T09:00:00Z", location: "Stockholm, SE" },
  { id: "u2", name: "Owen Adeyemi", email: "owen@larkfield.studio", role: "admin", status: "active", twoFactor: true, teams: ["Engineering", "Platform"], lastActiveAt: "2026-10-24T11:18:00Z", joinedAt: "2024-03-09T09:00:00Z", location: "Lagos, NG" },
  { id: "u3", name: "Priya Natarajan", email: "priya@larkfield.studio", role: "admin", status: "active", twoFactor: true, teams: ["Design"], lastActiveAt: "2026-10-24T09:00:00Z", joinedAt: "2024-04-14T09:00:00Z", location: "Bengaluru, IN" },
  { id: "u4", name: "Jonas Weber", email: "jonas@larkfield.studio", role: "member", status: "active", twoFactor: false, teams: ["Engineering"], lastActiveAt: "2026-10-23T12:00:00Z", joinedAt: "2024-05-03T09:00:00Z", location: "Berlin, DE" },
  { id: "u5", name: "Camila Reyes", email: "camila@larkfield.studio", role: "member", status: "active", twoFactor: true, teams: ["Marketing", "Content", "Events"], lastActiveAt: "2026-10-24T07:00:00Z", joinedAt: "2024-06-20T09:00:00Z", location: "Mexico City, MX" },
  { id: "u6", name: "Theo Laurent", email: "theo@larkfield.studio", role: "billing", status: "active", twoFactor: true, teams: ["Finance"], lastActiveAt: "2026-10-21T12:00:00Z", joinedAt: "2024-07-01T09:00:00Z", location: "Lyon, FR" },
  { id: "u7", name: "Hana Sato", email: "hana@larkfield.studio", role: "member", status: "active", twoFactor: true, teams: ["Engineering", "Platform"], lastActiveAt: "2026-10-24T11:45:00Z", joinedAt: "2024-08-12T09:00:00Z", location: "Osaka, JP" },
  { id: "u8", name: "Dev Malhotra", email: "dev@larkfield.studio", role: "member", status: "suspended", twoFactor: false, teams: ["Engineering"], lastActiveAt: "2026-09-09T12:00:00Z", joinedAt: "2024-09-05T09:00:00Z", location: "Toronto, CA" },
  { id: "u9", name: "Rosa Ferreira", email: "rosa.ferreira@gmail.com", role: "viewer", status: "active", twoFactor: false, teams: ["Clients"], lastActiveAt: "2026-10-17T12:00:00Z", joinedAt: "2025-01-18T09:00:00Z", location: "Porto, PT" },
  { id: "u10", name: "Sam Okoro", email: "sam@larkfield.studio", role: "member", status: "invited", twoFactor: false, teams: ["Design"], lastActiveAt: null, joinedAt: "2026-10-22T09:00:00Z" },
  { id: "u11", name: "", email: "lena@northpine.co", role: "viewer", status: "invited", twoFactor: false, teams: [], lastActiveAt: null, joinedAt: "2026-10-15T09:00:00Z" },
  { id: "u12", name: "Felix Brandt", email: "felix@larkfield.studio", role: "member", status: "active", twoFactor: true, teams: ["Support"], lastActiveAt: "2026-10-24T10:25:00Z", joinedAt: "2025-02-07T09:00:00Z", location: "Hamburg, DE" },
  { id: "u13", name: "Ama Mensah", email: "ama@larkfield.studio", role: "member", status: "active", twoFactor: false, teams: ["Content"], lastActiveAt: "2026-10-22T12:00:00Z", joinedAt: "2025-04-30T09:00:00Z", location: "Accra, GH" },
];

/** What the mocks return for `listUsers` (the first page, unfiltered). */
export const listUsers: AdminUsersPage = {
  items: users,
  total: users.length,
  summary: { seats, seatsUsed: 10, counts: { all: 13, active: 10, invited: 2, suspended: 1 }, activeWithoutTwoFactor: 3 },
};

/** What the mocks return for `getUserDetails` (Owen's). */
export const getUserDetails: AdminUserDetails = {
  devices: [
    { id: "d1", name: "MacBook Pro · Chrome", kind: "desktop", location: "Lagos, NG", lastActiveAt: "2026-10-24T11:18:00Z", current: true },
    { id: "d2", name: "iPhone · App", kind: "mobile", location: "Lagos, NG", lastActiveAt: "2026-10-21T08:00:00Z", current: false },
  ],
  activity: [
    { id: "a1", kind: "signin", text: "Signed in from Lagos, NG on Chrome", at: "2026-10-24T11:18:00Z" },
    { id: "a2", kind: "key", text: "Created API key “CI deploy”", at: "2026-10-21T15:00:00Z" },
    { id: "a3", kind: "role", text: "Role changed from Member to Admin by Maya Lindgren", at: "2026-10-02T10:00:00Z" },
    { id: "a4", kind: "2fa", text: "Turned on two-factor authentication", at: "2024-03-10T09:00:00Z" },
    { id: "a5", kind: "join", text: "Joined from an invite by Maya Lindgren", at: "2024-03-09T09:00:00Z" },
  ],
};
