// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state.
// Not shipped by the registry; builders wire ServiceHealth to their own backend.
import { useState } from "react";
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import type { HealthWindow } from "./schema";
import { ServiceHealth } from "./view";

export function DashboardsServicesShowcasePage() {
  const state = useShowcaseState();
  const [window, setWindow] = useState<HealthWindow>("1h");
  return (
    <ServiceHealth
      error="The metrics backend didn’t respond. Check your connection and try again."
      onRetry={() => {}}
      onWindowChange={setWindow}
      scope="acme/platform"
      services={state === "loading" || state === "error" ? undefined : state === "empty" ? [] : fixtures.listServiceHealth}
      status={state === "loading" ? "loading" : state === "error" ? "error" : "ready"}
      window={window}
    />
  );
}
