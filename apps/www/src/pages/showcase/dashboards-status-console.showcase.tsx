// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Showcase only: renders the screen inside devl.dev's sans-serif frame.
// Not shipped by the registry; builders get StatusConsoleDemo from ./dashboards-status-console.
import { DevlFrame } from "./_devl-frame";
import { StatusConsoleDemo } from "./dashboards-status-console";

export function DashboardsStatusConsoleShowcasePage() {
  return (
    <DevlFrame>
      <StatusConsoleDemo />
    </DevlFrame>
  );
}
