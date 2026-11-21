// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state.
// Not shipped by the registry; builders wire ChecksConsole to their own backend.
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import { ChecksConsole } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function TimelinesPrOpsConsoleShowcasePage() {
  const state = useShowcaseState();
  return (
    <ChecksConsole
      commandLineHref="#cli"
      error="Checks didn’t load. Check your connection and try again."
      onMerge={() => wait(800)}
      onReadyForReview={() => wait(500)}
      onRetry={() => {}}
      onUpdateBranch={() => wait(700)}
      pr={state === "loading" || state === "error" ? undefined : fixtures.getPrChecks}
      status={state === "loading" ? "loading" : state === "error" ? "error" : "ready"}
    />
  );
}
