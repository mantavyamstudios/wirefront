// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state.
// Other months show no events; the fixture covers April 2026.
// Not shipped by the registry; builders wire MonthCalendar to their own backend.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { useState } from "react";
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import { MonthCalendar } from "./view";

const demoNow = () => new Date(fixtures.now);

export function CalendarsMonthShowcasePage() {
  const state = useShowcaseState();
  const [month, setMonth] = useState(fixtures.month);
  return (
    <WirefrontProvider locale="en-US" now={demoNow} timeZone="UTC">
      <MonthCalendar
        error="The calendar didn’t load. Check your connection and try again."
        events={state === "loading" || state === "error" ? undefined : state === "empty" || month !== fixtures.month ? [] : fixtures.listMonthEvents}
        month={month}
        onCreateEvent={() => {}}
        onMonthChange={setMonth}
        onRetry={() => {}}
        status={state === "loading" ? "loading" : state === "error" ? "error" : "ready"}
      />
    </WirefrontProvider>
  );
}
