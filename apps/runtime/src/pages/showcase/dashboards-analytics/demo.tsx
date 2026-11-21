// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state.
// Not shipped by the registry; builders wire PageviewAnalytics to their own backend.
import { useState } from "react";
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import type { Range } from "./schema";
import { PageviewAnalytics } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function DashboardsAnalyticsShowcasePage() {
  const state = useShowcaseState();
  const [range, setRange] = useState<Range>("30d");
  return (
    <PageviewAnalytics
      data={state === "loading" || state === "error" ? undefined : state === "empty" ? fixtures.emptyStats : fixtures.statsFor(range)}
      error="The analytics service didn’t respond. Check your connection and try again."
      onExport={() => wait(600)}
      onRangeChange={setRange}
      onRetry={() => {}}
      range={range}
      status={state === "loading" ? "loading" : state === "error" ? "error" : "ready"}
    />
  );
}
