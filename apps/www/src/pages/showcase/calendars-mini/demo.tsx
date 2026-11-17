// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the widget twice, compact and with the selected day's list.
// Not shipped by the registry; builders wire MiniCalendar to their own backend.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { useState } from "react";
import * as fixtures from "./fixtures";
import { MiniCalendar } from "./view";

const demoNow = () => new Date(fixtures.now);

export function CalendarsMiniShowcasePage() {
  const [month, setMonth] = useState(fixtures.month);
  const events = month === fixtures.month ? fixtures.listMiniEvents : [];
  return (
    <WirefrontProvider locale="en-GB" now={demoNow} timeZone="UTC">
      <div className="grid min-h-svh place-items-center bg-background p-4 sm:p-8">
        <div className="grid w-full max-w-80 grid-cols-1 gap-6 md:w-auto md:max-w-none md:grid-cols-2 md:items-start">
          <MiniCalendar className="md:w-72" events={events} month={month} onMonthChange={setMonth} openHref="#calendar" />
          <MiniCalendar className="md:w-80" events={events} month={month} onMonthChange={setMonth} showDayList />
        </div>
      </div>
    </WirefrontProvider>
  );
}
