// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { SpotlightStep } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const steps: SpotlightStep[] = [
  {
    id: "search",
    target: "search",
    title: "Search anything.",
    body: "Type the first few letters of any project, page, or person. It also runs commands like “create issue” or “switch theme”.",
    kbd: "⌘K",
  },
  {
    id: "new",
    target: "new",
    title: "Start a project.",
    body: "Projects group docs, issues and people. You can move things between them later.",
  },
  {
    id: "projects",
    target: "projects",
    title: "Your projects live here.",
    body: "Pinned projects stay at the top. Drag to reorder, or open one to see its activity.",
  },
  {
    id: "invite",
    target: "invite",
    title: "Bring your team.",
    body: "Invite by email or share a link. New members get this tour too.",
  },
];
