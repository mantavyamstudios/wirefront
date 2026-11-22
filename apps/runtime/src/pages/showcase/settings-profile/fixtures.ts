// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { AccountProfile } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const getAccountProfile: AccountProfile = {
  displayName: "Mantavyam",
  handle: "mantavyam",
  pronouns: "",
  bio: "",
  email: "hello@example.com",
  language: "en",
  timeZone: "America/New_York",
  avatarUrl: null,
};

export const languages = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "ja", label: "日本語" },
];

export const timeZones = [
  "America/Los_Angeles",
  "America/New_York",
  "UTC",
  "Europe/Berlin",
  "Asia/Tokyo",
];
