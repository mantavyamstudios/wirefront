// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state.
// Not shipped by the registry; builders wire PresenceRail to their own backend.
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import { PresenceRail } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function ProfilePresenceRailShowcasePage() {
  const state = useShowcaseState();
  return (
    <PresenceRail
      error="Presence didn’t load. Check your connection and try again."
      meId={fixtures.me.id}
      onRetry={() => {}}
      onSetPresence={() => wait(300)}
      people={state === "loading" || state === "error" ? undefined : fixtures.listPresence}
      status={state === "loading" ? "loading" : state === "error" ? "error" : "ready"}
      workspace={fixtures.workspace}
    />
  );
}
