// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state.
// Not shipped by the registry; builders wire RevenueMixDonut to their own backend.
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import { RevenueMixDonut } from "./view";

export function ChartsDonutShowcasePage() {
  const state = useShowcaseState();
  return (
    <RevenueMixDonut
      data={
        state === "loading" || state === "error"
          ? undefined
          : state === "empty"
            ? { slices: [] }
            : fixtures.getRevenueMix
      }
      error="The revenue mix didn’t load. Check your connection and try again."
      onRetry={() => {}}
      status={
        state === "loading" ? "loading" : state === "error" ? "error" : "ready"
      }
    />
  );
}
