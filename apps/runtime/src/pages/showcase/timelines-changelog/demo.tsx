// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state.
// Not shipped by the registry; builders wire ChangelogFeed to their own backend.
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import { ChangelogFeed } from "./view";

export function TimelinesChangelogShowcasePage() {
  const state = useShowcaseState();
  return (
    <ChangelogFeed
      entries={state === "loading" || state === "error" ? undefined : state === "empty" ? [] : fixtures.listChangelog}
      error="The changelog didn’t load. Check your connection and try again."
      onRetry={() => {}}
      product={fixtures.product}
      status={state === "loading" ? "loading" : state === "error" ? "error" : "ready"}
      subscribeHref="#rss"
    />
  );
}
