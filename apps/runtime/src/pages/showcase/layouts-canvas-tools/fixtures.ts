// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { CanvasShape } from "./schema";
import type { CanvasCollaborator } from "./view";

/** What the mocks return for `getCanvas`. Demo data for the showcase and tests. */
export const getCanvas: CanvasShape[] = [
  { id: "hero", type: "rectangle", name: "Hero", x: 60, y: 220, width: 480, height: 280, fill: "#3b82f6", opacity: 100, visible: true, locked: false },
  { id: "card", type: "rectangle", name: "Card", x: 600, y: 80, width: 320, height: 180, fill: "#8b5cf6", opacity: 100, visible: true, locked: false },
  { id: "avatar", type: "ellipse", name: "Avatar", x: -60, y: 300, width: 120, height: 120, fill: "#10b981", opacity: 70, visible: true, locked: false },
];

export const collaborators: CanvasCollaborator[] = [
  { name: "Sana Kapoor", color: 4 },
  { name: "Mateo Ruiz", color: 2 },
  { name: "Jun Lee", color: 1 },
  { name: "Dana Vale", color: 3 },
];
