// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state.
// Other weeks show no events; the fixture covers the week of 27 April 2026.
// Not shipped by the registry; builders wire WeekSchedule to their own backend.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { useState } from "react";
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import { WeekSchedule } from "./view";

const demoNow = () => new Date(fixtures.now);

export function CalendarsWeekShowcasePage() {
  const state = useShowcaseState();
  const [weekStart, setWeekStart] = useState(fixtures.weekStart);
  return (
    <WirefrontProvider locale="en-GB" now={demoNow} timeZone="UTC">
      <WeekSchedule
        error="The schedule didn’t load. Check your connection and try again."
        events={state === "loading" || state === "error" ? undefined : state === "empty" || weekStart !== fixtures.weekStart ? [] : fixtures.listWeekEvents}
        onRetry={() => {}}
        onWeekChange={setWeekStart}
        status={state === "loading" ? "loading" : state === "error" ? "error" : "ready"}
        weekStart={weekStart}
      />
    </WirefrontProvider>
  );
}
