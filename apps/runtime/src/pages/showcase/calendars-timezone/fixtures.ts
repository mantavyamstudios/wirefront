// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { QuickPick } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const now = "2026-04-14T15:00:00Z";
export const homeZone = "America/New_York";

/** Zones people can add. */
export const availableZones = [
  "Pacific/Honolulu",
  "America/Anchorage",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Sao_Paulo",
  "America/Argentina/Buenos_Aires",
  "Atlantic/Reykjavik",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Athens",
  "Africa/Lagos",
  "Africa/Nairobi",
  "Europe/Moscow",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
];

export const defaultZones = ["America/Los_Angeles", "America/New_York", "Europe/London", "Europe/Berlin", "Asia/Kolkata", "Asia/Tokyo"];

export const quickPicks: QuickPick[] = [
  { id: "ny-morning", label: "Mornings (NY)", start: 9, hours: 1 },
  { id: "overlap", label: "Afternoon overlap", start: 13, hours: 3 },
  { id: "late-eu", label: "Late EU", start: 11, hours: 1 },
  { id: "tokyo", label: "Tokyo morning", start: 19, hours: 1 },
];
