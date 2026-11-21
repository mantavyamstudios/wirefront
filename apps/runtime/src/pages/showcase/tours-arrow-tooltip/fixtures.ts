// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { TooltipStep } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const steps: TooltipStep[] = [
  { id: "status", target: "status", title: "Filter by status.", body: "Stack filters to narrow the list. Shift-click (or long-press) a value to multi-select." },
  { id: "assignee", target: "assignee", title: "See one person’s load.", body: "Pick a teammate to see only what’s on their plate." },
  { id: "priority", target: "priority", title: "Surface what’s urgent.", body: "Urgent and high-priority issues float to the top." },
  { id: "row", target: "row", title: "Open an issue.", body: "Each row opens in a side panel so you never lose your place." },
  { id: "new", target: "new", title: "Create an issue.", body: "Start typing a title — everything else is optional." },
];
