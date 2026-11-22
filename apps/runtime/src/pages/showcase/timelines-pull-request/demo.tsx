// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state.
// Not shipped by the registry; builders wire PullRequestPage to their own backend.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import { PullRequestPage } from "./view";

const demoNow = () => new Date(fixtures.now);
const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export function TimelinesPullRequestShowcasePage() {
  const state = useShowcaseState();
  return (
    <WirefrontProvider locale="en-US" now={demoNow}>
      <PullRequestPage
        error="The pull request didn’t load. Check your connection and try again."
        onAddLabel={() => {}}
        onAddReviewer={() => {}}
        onMerge={() => wait(800)}
        onRetry={() => {}}
        pr={
          state === "loading" || state === "error"
            ? undefined
            : fixtures.getPullRequestDetail
        }
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
