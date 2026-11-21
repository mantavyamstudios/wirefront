// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state.
// Not shipped by the registry; builders wire TeamDirectory to their own backend.
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import { TeamDirectory } from "./view";

export function ProfileTeamGridShowcasePage() {
  const state = useShowcaseState();
  return (
    <TeamDirectory
      company={fixtures.company}
      error="The team didn’t load. Check your connection and try again."
      onInvite={() => {}}
      onRetry={() => {}}
      people={state === "loading" || state === "error" ? undefined : state === "empty" ? [] : fixtures.listTeammates}
      status={state === "loading" ? "loading" : state === "error" ? "error" : "ready"}
    />
  );
}
