// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state.
// Not shipped by the registry; builders wire AuditTrail to their own backend.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import { AuditTrail } from "./view";

const demoNow = () => new Date(fixtures.now);

export function TimelinesAuditShowcasePage() {
  const state = useShowcaseState();
  return (
    <WirefrontProvider locale="en-US" now={demoNow}>
      <AuditTrail
        data={state === "loading" || state === "error" ? undefined : state === "empty" ? { events: [], total: 0 } : fixtures.listAuditEvents}
        error="The audit log didn’t load. Check your connection and try again."
        note="retained for 1 year on Business plan."
        onRetry={() => {}}
        onViewEvent={() => {}}
        status={state === "loading" ? "loading" : state === "error" ? "error" : "ready"}
      />
    </WirefrontProvider>
  );
}
