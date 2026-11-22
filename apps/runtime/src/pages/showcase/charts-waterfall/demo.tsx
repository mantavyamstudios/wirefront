// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state.
// Not shipped by the registry; builders wire ArrWaterfall to their own backend.
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import { ArrWaterfall } from "./view";

export function ChartsWaterfallShowcasePage() {
  const state = useShowcaseState();
  return (
    <ArrWaterfall
      data={
        state === "loading" || state === "error"
          ? undefined
          : fixtures.getArrMovement
      }
      error="ARR movement didn’t load. Check your connection and try again."
      onRetry={() => {}}
      status={
        state === "loading" ? "loading" : state === "error" ? "error" : "ready"
      }
    />
  );
}
