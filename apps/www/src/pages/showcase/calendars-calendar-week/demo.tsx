// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Showcase only: the calendar in devl.dev's frame with a fixed clock; changes save nowhere.
// Not shipped by the registry; builders wire CalendarWeek to their own backend.
import { ok } from "@wirefront/ui/wirefront/types";
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { DevlFrame } from "../_devl-frame";
import * as fixtures from "./fixtures";
import { CalendarWeek } from "./view";

const demoNow = () => new Date(fixtures.now);

export function CalendarsCalendarWeekShowcasePage() {
  return (
    <WirefrontProvider locale="en-US" now={demoNow} timeZone="UTC">
      <DevlFrame>
        <CalendarWeek calendars={fixtures.listCalendars} events={fixtures.listEvents} onDeleteEvent={async () => {}} onSaveEvent={async (ev) => ok(ev)} />
      </DevlFrame>
    </WirefrontProvider>
  );
}
