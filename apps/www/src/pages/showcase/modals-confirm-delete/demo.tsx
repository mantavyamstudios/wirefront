// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to a simulated backend, with the dialog open.
// Not shipped by the registry; builders wire ConfirmDelete to their own backend.
import * as fixtures from "./fixtures";
import { ConfirmDelete } from "./view";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function demoDelete() {
  await wait(900);
}

export function ModalsConfirmDeleteShowcasePage() {
  return <ConfirmDelete defaultOpen onDelete={demoDelete} workspace={fixtures.getWorkspaceSummary} />;
}
