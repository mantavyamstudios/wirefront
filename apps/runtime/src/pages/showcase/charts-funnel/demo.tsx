// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state.
// Not shipped by the registry; builders wire ConversionFunnel to their own backend.
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import { ConversionFunnel } from "./view";

export function ChartsFunnelShowcasePage() {
  const state = useShowcaseState();
  return (
    <ConversionFunnel
      data={
        state === "loading" || state === "error"
          ? undefined
          : state === "empty"
            ? { stages: [] }
            : fixtures.getFunnel
      }
      error="The funnel didn’t load. Check your connection and try again."
      onRetry={() => {}}
      status={
        state === "loading" ? "loading" : state === "error" ? "error" : "ready"
      }
    />
  );
}
