// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the editor with sample shapes. Not shipped by the registry.
import * as fixtures from "./fixtures";
import { CanvasEditor } from "./view";

export function LayoutsCanvasToolsShowcasePage() {
  return <CanvasEditor collaborators={fixtures.collaborators} defaultSelectedId="hero" defaultShapes={fixtures.getCanvas} onChange={() => {}} onShare={() => {}} />;
}
