// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state.
// Not shipped by the registry; builders wire StatusPage to their own backend.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import { StatusPage } from "./view";

const demoNow = () => new Date(fixtures.now);

export function TimelinesStatusPageShowcasePage() {
  const state = useShowcaseState();
  return (
    <WirefrontProvider locale="en-US" now={demoNow} timeZone="UTC">
      <StatusPage
        data={state === "loading" || state === "error" ? undefined : state === "empty" ? { components: [], incidents: [] } : fixtures.getStatus}
        error="The status didn’t load. Check your connection and try again."
        host={fixtures.host}
        onRetry={() => {}}
        product={fixtures.product}
        status={state === "loading" ? "loading" : state === "error" ? "error" : "ready"}
      />
    </WirefrontProvider>
  );
}
