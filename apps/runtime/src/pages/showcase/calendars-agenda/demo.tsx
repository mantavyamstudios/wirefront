// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state.
// Not shipped by the registry; builders wire DayAgenda to their own backend.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import { DayAgenda } from "./view";

const demoNow = () => new Date(fixtures.now);

export function CalendarsAgendaShowcasePage() {
  const state = useShowcaseState();
  return (
    <WirefrontProvider locale="en-GB" now={demoNow} timeZone="UTC">
      <DayAgenda
        error="The agenda didn’t load. Check your connection and try again."
        events={
          state === "loading" || state === "error"
            ? undefined
            : state === "empty"
              ? []
              : fixtures.listAgenda
        }
        onRetry={() => {}}
        status={
          state === "loading"
            ? "loading"
            : state === "error"
              ? "error"
              : "ready"
        }
      />
    </WirefrontProvider>
  );
}
