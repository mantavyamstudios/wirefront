// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { TourStep } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const steps: TourStep[] = [
  { id: "welcome", badge: "Welcome", title: "Welcome to Orbit.", body: "A quieter way to ship — projects, comments, and audit log all in one workspace. Three quick things before we drop you in." },
  { id: "projects", badge: "Step 1", title: "Projects are how you organise work.", body: "Bundle issues, docs, and members together. You can split into teams later — for now, one project is enough." },
  { id: "people", badge: "Step 2", title: "Bring people in when you’re ready.", body: "We won’t ping anyone until you say so. Drop in emails and we’ll send invites in your name." },
  { id: "keyboard", badge: "Step 3", title: "Keyboard-first, always.", body: "Press ⌘K anywhere to jump to anything. Press ? to see every shortcut. We won’t get in your way." },
];
