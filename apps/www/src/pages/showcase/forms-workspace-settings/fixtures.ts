// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { CreditCardIcon, KeyIcon, PuzzleIcon, ScrollTextIcon, SettingsIcon, ShieldAlertIcon, UsersIcon } from "lucide-react";
import type { GeneralSettings, UploadedAvatar } from "./schema";
import type { SettingsNavItem, TimeZoneOption } from "./view";

/** Demo data for the showcase, the generated mocks and tests. */
export const nav: SettingsNavItem[] = [
  { id: "general", label: "General", href: "#general", icon: SettingsIcon },
  { id: "members", label: "Members", href: "#members", icon: UsersIcon },
  { id: "billing", label: "Billing", href: "#billing", icon: CreditCardIcon },
  { id: "api-keys", label: "API keys", href: "#api-keys", icon: KeyIcon },
  { id: "integrations", label: "Integrations", href: "#integrations", icon: PuzzleIcon },
  { id: "audit-log", label: "Audit log", href: "#audit-log", icon: ScrollTextIcon },
  { id: "danger", label: "Danger zone", href: "#danger", icon: ShieldAlertIcon, danger: true },
];

export const timeZones: TimeZoneOption[] = [
  { value: "America/Los_Angeles", label: "Pacific (UTC−8)" },
  { value: "America/New_York", label: "Eastern (UTC−5)" },
  { value: "UTC", label: "UTC" },
  { value: "Europe/Berlin", label: "Central European (UTC+1)" },
  { value: "Asia/Tokyo", label: "Japan (UTC+9)" },
];

export const urlPrefix = "orbit.so/";

/** What the mocks return for `getGeneralSettings`. */
export const getGeneralSettings: GeneralSettings = {
  name: "Acme inc.",
  slug: "acme",
  timeZone: "America/New_York",
  dateFormat: "ymd",
  publicSignUp: true,
  requireAdminTwoFactor: true,
  showProjectIds: false,
};

/** What the mocks return for `uploadAvatar`. */
export const uploadAvatar: UploadedAvatar = { avatarUrl: "https://example.com/avatars/acme.png" };
