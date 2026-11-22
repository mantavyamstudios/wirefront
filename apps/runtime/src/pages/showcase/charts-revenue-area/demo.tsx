// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state.
// Not shipped by the registry; builders wire RevenueBreakdownChart to their own backend.
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import { RevenueBreakdownChart } from "./view";

export function ChartsRevenueAreaShowcasePage() {
  const state = useShowcaseState();
  return (
    <RevenueBreakdownChart
      data={
        state === "loading" || state === "error"
          ? undefined
          : state === "empty"
            ? { months: [] }
            : fixtures.getRevenueBreakdown
      }
      error="Revenue didn’t load. Check your connection and try again."
      onRetry={() => {}}
      status={
        state === "loading" ? "loading" : state === "error" ? "error" : "ready"
      }
    />
  );
}
