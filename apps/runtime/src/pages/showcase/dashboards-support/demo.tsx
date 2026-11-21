// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state.
// Not shipped by the registry; builders wire SupportQueue to their own backend.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import { SupportQueue } from "./view";

const demoNow = () => new Date(fixtures.now);

export function DashboardsSupportShowcasePage() {
  const state = useShowcaseState();
  return (
    <WirefrontProvider now={demoNow}>
      <SupportQueue
        breachesHref="#breaches"
        data={state === "loading" || state === "error" ? undefined : state === "empty" ? fixtures.emptyQueue : fixtures.getQueueOverview}
        error="The helpdesk didn’t respond. Check your connection and try again."
        onRetry={() => {}}
        scope={fixtures.scope}
        status={state === "loading" ? "loading" : state === "error" ? "error" : "ready"}
      />
    </WirefrontProvider>
  );
}
