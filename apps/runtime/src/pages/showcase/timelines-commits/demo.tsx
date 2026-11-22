// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state.
// Not shipped by the registry; builders wire CommitGraph to their own backend.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import { CommitGraph } from "./view";

const demoNow = () => new Date(fixtures.now);

export function TimelinesCommitsShowcasePage() {
  const state = useShowcaseState();
  return (
    <WirefrontProvider locale="en-US" now={demoNow}>
      <CommitGraph
        branch={fixtures.branch}
        commits={
          state === "loading" || state === "error"
            ? undefined
            : state === "empty"
              ? []
              : fixtures.listCommits
        }
        error="Commits didn’t load. Check your connection and try again."
        onRetry={() => {}}
        repo={fixtures.repo}
        status={
          state === "loading"
            ? "loading"
            : state === "error"
              ? "error"
              : "ready"
        }
      />
    </WirefrontProvider>
  );
}
