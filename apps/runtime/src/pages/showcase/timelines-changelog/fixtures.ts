// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { ChangelogEntry } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const product = "Acme";

export const listChangelog: ChangelogEntry[] = [
  {
    version: "v3.4",
    date: "2026-04-24",
    headline: "Audit log, palette, and more.",
    groups: [
      { kind: "new", items: ["Introduced workspace-level audit log retention (1 year on Business).", "Added a Linear-style command palette — try ⌘K from anywhere."] },
      { kind: "improved", items: ["Onboarding now skips empty steps and remembers progress.", "API token rotation surface is reachable from the keyboard."] },
      { kind: "fixed", items: ["Avatar uploads no longer fail silently on Safari < 17.", "CSV exports now respect the active filter set."] },
    ],
  },
  {
    version: "v3.3",
    date: "2026-04-10",
    groups: [
      { kind: "new", items: ["First version of the integrations directory."] },
      { kind: "fixed", items: ["Empty-state CTAs are now reachable via keyboard in inbox.", "Prevented occasional double-fire on the invite endpoint."] },
    ],
  },
  {
    version: "v3.2",
    date: "2026-03-28",
    groups: [
      { kind: "improved", items: ["Faster project switcher — under 80ms with 10k workspaces."] },
      { kind: "removed", items: ["Deprecated the legacy /v1/auth endpoint (sunset May 1)."] },
    ],
  },
];
