// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the editor with fixture presets; Save waits and goes nowhere.
// Not shipped by the registry; builders save the rule to their own backend.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import * as fixtures from "./fixtures";
import { RecurrenceEditor } from "./view";

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export function CalendarsRecurringShowcasePage() {
  return (
    <WirefrontProvider locale="en-US" timeZone="UTC">
      <RecurrenceEditor
        defaultRule={fixtures.defaultRule}
        onCancel={() => {}}
        onSave={() => wait(500)}
        presets={fixtures.presets}
        start={fixtures.start}
      />
    </WirefrontProvider>
  );
}
