// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the planner with a fixed clock; "Use this time" goes nowhere.
// Not shipped by the registry; builders save zones and book the window themselves.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import * as fixtures from "./fixtures";
import { MeetingPlanner } from "./view";

const demoNow = () => new Date(fixtures.now);

export function CalendarsTimezoneShowcasePage() {
  return (
    <WirefrontProvider locale="en-US" now={demoNow} timeZone={fixtures.homeZone}>
      <MeetingPlanner availableZones={fixtures.availableZones} defaultZones={fixtures.defaultZones} homeZone={fixtures.homeZone} onUseTime={() => {}} quickPicks={fixtures.quickPicks} />
    </WirefrontProvider>
  );
}
