// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state.
// Not shipped by the registry; builders wire CohortRetention to their own backend.
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import { CohortRetention } from "./view";

export function ChartsCohortHeatmapShowcasePage() {
  const state = useShowcaseState();
  return (
    <CohortRetention
      cohorts={
        state === "loading" || state === "error"
          ? undefined
          : state === "empty"
            ? []
            : fixtures.listCohorts
      }
      error="Retention didn’t load. Check your connection and try again."
      onRetry={() => {}}
      status={
        state === "loading" ? "loading" : state === "error" ? "error" : "ready"
      }
    />
  );
}
