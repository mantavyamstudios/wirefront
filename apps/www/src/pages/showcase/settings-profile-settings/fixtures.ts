// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import type { Profile, ProfileZone } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const now = "2026-09-20T12:00:00.000Z";
export const product = "Ridgeline";
export const domain = "ridgeline.app";
export const takenUsernames = ["ada", "adal", "lindqvist", "admin", "support", "hello", "team", "ridgeline", "design"];

/** What the mocks return for `getProfile`. */
export const getProfile: Profile = {
  fullName: "Ada Lindqvist",
  publicName: "Ada",
  username: "adalindqvist",
  email: "ada@ridgeline.app",
  bio: "Design engineer on the platform team. I care about fast tools, tidy changelogs and good coffee.",
  timeZone: "Europe/Stockholm",
  avatar: { palette: "dusk", x: 0, y: 0, zoom: 1 },
};

/** What the mocks return for `checkUsername`. */
export const checkUsername = { available: true };

export const timeZones: ProfileZone[] = [
  { id: "Pacific/Honolulu", city: "Honolulu" },
  { id: "America/Los_Angeles", city: "Los Angeles" },
  { id: "America/Denver", city: "Denver" },
  { id: "America/Chicago", city: "Chicago" },
  { id: "America/New_York", city: "New York" },
  { id: "America/Sao_Paulo", city: "São Paulo" },
  { id: "Europe/London", city: "London" },
  { id: "Europe/Lisbon", city: "Lisbon" },
  { id: "Europe/Stockholm", city: "Stockholm" },
  { id: "Europe/Berlin", city: "Berlin" },
  { id: "Africa/Lagos", city: "Lagos" },
  { id: "Africa/Nairobi", city: "Nairobi" },
  { id: "Asia/Dubai", city: "Dubai" },
  { id: "Asia/Kolkata", city: "Mumbai" },
  { id: "Asia/Singapore", city: "Singapore" },
  { id: "Asia/Tokyo", city: "Tokyo" },
  { id: "Australia/Sydney", city: "Sydney" },
  { id: "Pacific/Auckland", city: "Auckland" },
];
