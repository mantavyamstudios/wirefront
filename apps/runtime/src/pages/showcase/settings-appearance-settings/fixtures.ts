// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import type { PreviewTask, ThemePrefs } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const factoryPrefs: ThemePrefs = { theme: "system", accent: "indigo", density: "default", textSize: 14, reduceMotion: false, sidebarIcons: true };
export const getThemePrefs = factoryPrefs;
export const workspace = "Ridgeline";

export const previewTasks: PreviewTask[] = [
  { id: "t1", title: "Finalize pricing page copy", owner: "Ravi Chen", due: "Today", dueToday: true, done: true },
  { id: "t2", title: "QA the onboarding emails", owner: "Mina Kova", due: "Tomorrow" },
  { id: "t3", title: "Record the walkthrough video", owner: "Ada Lindqvist", due: "Fri" },
  { id: "t4", title: "Sign-off on terms with legal", owner: "Theo Banks", due: "Nov 3", done: true },
  { id: "t5", title: "Prep the launch-day status page", owner: "Ines Abara", due: "Nov 4" },
  { id: "t6", title: "Write the changelog entry", owner: "Ada Lindqvist", due: "Nov 5" },
];
