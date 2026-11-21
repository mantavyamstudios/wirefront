// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { CommandGroup } from "./schema";

/** Commands the app always offers (wired in the builder's code). */
export const actions: CommandGroup[] = [
  {
    id: "suggestions",
    label: "Suggestions",
    items: [
      { id: "new-project", label: "Create new project", kind: "action", shortcut: "C P" },
      { id: "invite", label: "Invite teammate", hint: "via email", kind: "invite", shortcut: "I" },
      { id: "switch-workspace", label: "Switch workspace", hint: "Acme inc.", kind: "switch", shortcut: "⌘⇧W" },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    items: [
      { id: "profile-settings", label: "Open profile settings", kind: "settings", shortcut: "G P" },
      { id: "api-keys", label: "Manage API keys", kind: "settings" },
    ],
  },
];

/** What the mocks return for `searchCommands`. */
export const searchCommands: CommandGroup[] = [
  {
    id: "jump-to",
    label: "Jump to",
    items: [
      { id: "doc_handbook", label: "Onboarding handbook v3", hint: "Document", kind: "document" },
      { id: "prj_design", label: "design-system", hint: "Project", kind: "project" },
      { id: "ch_crit", label: "#design-crit", hint: "Channel", kind: "channel" },
      { id: "br_audit", label: "feat/audit-log", hint: "Branch", kind: "branch" },
    ],
  },
];
