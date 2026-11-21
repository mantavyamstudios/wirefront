// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state.
// Not shipped by the registry; builders wire AccountHealthScatter to their own backend.
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import { AccountHealthScatter } from "./view";

export function ChartsScatterShowcasePage() {
  const state = useShowcaseState();
  return (
    <AccountHealthScatter
      accounts={state === "loading" || state === "error" ? undefined : state === "empty" ? [] : fixtures.listAccountHealth}
      error="Account health didn’t load. Check your connection and try again."
      onRetry={() => {}}
      status={state === "loading" ? "loading" : state === "error" ? "error" : "ready"}
    />
  );
}
