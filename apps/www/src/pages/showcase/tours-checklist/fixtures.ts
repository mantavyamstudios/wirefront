// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { SetupTask } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const listSetupTasks: SetupTask[] = [
  { id: "create-project", title: "Create your first project", description: "Bundle issues, docs, and people in one place.", done: true },
  { id: "invite", title: "Invite a teammate", description: "Share work — invites are good for 7 days.", done: true },
  { id: "theme", title: "Pick a theme", description: "Light, dark, or follow your system. Tweak the palette to taste.", done: false },
  { id: "api-key", title: "Generate an API key", description: "Connect a script, CLI, or integration to your workspace.", done: false },
  { id: "first-deploy", title: "Ship something", description: "Trigger a deploy or close your first issue. Then it’s real.", done: false },
];
