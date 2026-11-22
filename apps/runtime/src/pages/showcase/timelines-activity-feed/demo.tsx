// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state.
// "Load older" waits and then reports there's nothing older.
// Not shipped by the registry; builders wire ActivityFeed to their own backend.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { useState } from "react";
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import { ActivityFeed } from "./view";

const demoNow = () => new Date(fixtures.now);
const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export function TimelinesActivityFeedShowcasePage() {
  const state = useShowcaseState();
  const [hasMore, setHasMore] = useState(fixtures.listActivity.hasMore);
  return (
    <WirefrontProvider locale="en-US" now={demoNow} timeZone="UTC">
      <ActivityFeed
        error="Activity didn’t load. Check your connection and try again."
        events={
          state === "loading" || state === "error"
            ? undefined
            : state === "empty"
              ? []
              : fixtures.listActivity.events
        }
        hasMore={hasMore}
        onLoadMore={async () => {
          await wait(600);
          setHasMore(false);
        }}
        onRetry={() => {}}
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
