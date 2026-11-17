// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state.
// Not shipped by the registry; builders wire QuarterlyComparisonChart to their own backend.
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import { QuarterlyComparisonChart } from "./view";

export function ChartsBarGroupedShowcasePage() {
  const state = useShowcaseState();
  return (
    <QuarterlyComparisonChart
      data={state === "loading" || state === "error" ? undefined : state === "empty" ? { series: [], rows: [] } : fixtures.getPeriodComparison}
      error="Bookings didn’t load. Check your connection and try again."
      onRetry={() => {}}
      status={state === "loading" ? "loading" : state === "error" ? "error" : "ready"}
    />
  );
}
