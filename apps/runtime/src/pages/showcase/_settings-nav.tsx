// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Showcase only: the demo product's settings navigation, shared by the
// settings screens' demos. Builders pass their own groups to SettingsShell.
import type { SettingsNavGroup } from "@wirefront/ui/settings-shell";
import { BellIcon, CreditCardIcon, KeyRoundIcon, PaletteIcon, SettingsIcon, ShieldIcon, UserIcon, UsersIcon } from "lucide-react";

export const settingsNav: SettingsNavGroup[] = [
  {
    label: "Account",
    items: [
      { id: "profile", label: "Profile", href: "#profile", icon: <UserIcon /> },
      { id: "appearance", label: "Appearance", href: "#appearance", icon: <PaletteIcon /> },
      { id: "notifications", label: "Notifications", href: "#notifications", icon: <BellIcon /> },
      { id: "security", label: "Security", href: "#security", icon: <ShieldIcon /> },
    ],
  },
  {
    label: "Workspace",
    items: [
      { id: "general", label: "General", href: "#general", icon: <SettingsIcon /> },
      { id: "members", label: "Members & roles", href: "#members", icon: <UsersIcon /> },
      { id: "billing", label: "Billing", href: "#billing", icon: <CreditCardIcon /> },
    ],
  },
  {
    label: "Developer",
    items: [{ id: "developer", label: "API keys & webhooks", href: "#developer", icon: <KeyRoundIcon /> }],
  },
];

export const settingsBack = { href: "#app", label: "Back to Ridgeline" };
export const settingsUser = { name: "Ada Lindqvist", email: "ada@ridgeline.app" };
