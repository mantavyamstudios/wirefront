// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: Reopen waits and then removes the thread. Not shipped by the registry;
// builders load listResolvedThreads and wire onReopen.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import * as fixtures from "./fixtures";
import { ResolvedThreads } from "./view";

const demoNow = () => new Date(fixtures.now);
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function ThreadsResolvedShowcasePage() {
  return (
    <WirefrontProvider locale="en-US" now={demoNow} timeZone="UTC">
      <ResolvedThreads onReopen={() => wait(400)} onShowOpen={() => {}} openCount={fixtures.listResolvedThreads.openCount} threads={fixtures.listResolvedThreads.threads} />
    </WirefrontProvider>
  );
}
