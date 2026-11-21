// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the picker opened on the last 14 days; Apply goes nowhere.
// Not shipped by the registry; builders pass the range on to their own filters.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import * as fixtures from "./fixtures";
import { DateRangePicker } from "./view";

const demoNow = () => new Date(fixtures.now);

export function CalendarsDateRangeShowcasePage() {
  return (
    <WirefrontProvider locale="en-US" now={demoNow} timeZone="UTC">
      <DateRangePicker defaultValue={fixtures.defaultRange} onApply={() => {}} />
    </WirefrontProvider>
  );
}
