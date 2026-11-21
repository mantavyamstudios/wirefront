// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state.
// Not shipped by the registry; builders wire EngineeringVelocity to their own backend.
import { useState } from "react";
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import type { VelocityRange } from "./schema";
import { EngineeringVelocity } from "./view";

export function DashboardsEngineeringShowcasePage() {
  const state = useShowcaseState();
  const [range, setRange] = useState<VelocityRange>("30d");
  return (
    <EngineeringVelocity
      data={state === "loading" || state === "error" ? undefined : state === "empty" ? fixtures.emptyVelocity : fixtures.getVelocity}
      error="The metrics service didn’t respond. Check your connection and try again."
      onRangeChange={setRange}
      onRetry={() => {}}
      range={range}
      status={state === "loading" ? "loading" : state === "error" ? "error" : "ready"}
    />
  );
}
