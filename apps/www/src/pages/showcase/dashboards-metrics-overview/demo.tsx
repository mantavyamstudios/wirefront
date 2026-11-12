// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state.
// Not shipped by the registry; builders wire MetricsOverview to their own backend.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { useState } from "react";
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import type { Range } from "./schema";
import { MetricsOverview } from "./view";

const demoNow = () => new Date(fixtures.now);

export function DashboardsMetricsOverviewShowcasePage() {
  const state = useShowcaseState();
  const [range, setRange] = useState<Range>("30d");
  const data = state === "empty" ? fixtures.emptyOverview : fixtures.overviewFor(range);
  return (
    <WirefrontProvider now={demoNow}>
      <MetricsOverview
        activityHref="#activity"
        data={state === "loading" || state === "error" ? undefined : data}
        error="The metrics service didn’t respond. Check your connection and try again."
        onNewReport={() => {}}
        onRangeChange={setRange}
        onRetry={() => {}}
        range={range}
        status={state === "loading" ? "loading" : state === "error" ? "error" : "ready"}
        workspace={fixtures.workspace}
      />
    </WirefrontProvider>
  );
}
