// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { LocalePrefs } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const now = "2026-04-14T09:30:00Z";

export const getLocalePrefs: LocalePrefs = {
  language: "en-US",
  timeZone: "America/Los_Angeles",
  firstDay: "sun",
  dateFormat: "mdy-slash",
  timeFormat: "h12",
  currency: "USD",
  numberFormat: "us",
};

export const languages = ["en-US", "en-GB", "fr-FR", "de-DE", "ja-JP", "zh-CN", "es-ES", "pt-BR"];
export const timeZones = [
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Kolkata",
  "Australia/Sydney",
  "Pacific/Auckland",
  "Pacific/Honolulu",
];
export const currencies = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD"];
