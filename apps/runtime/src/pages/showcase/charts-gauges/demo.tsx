// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state.
// Not shipped by the registry; builders wire SloGauges to their own backend.
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import { SloGauges } from "./view";

export function ChartsGaugesShowcasePage() {
  const state = useShowcaseState();
  return (
    <SloGauges
      error="Objectives didn’t load. Check your connection and try again."
      objectives={
        state === "loading" || state === "error"
          ? undefined
          : state === "empty"
            ? []
            : fixtures.listObjectives
      }
      onRetry={() => {}}
      status={
        state === "loading" ? "loading" : state === "error" ? "error" : "ready"
      }
    />
  );
}
