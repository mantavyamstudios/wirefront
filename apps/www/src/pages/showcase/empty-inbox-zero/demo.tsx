// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the empty state in sample page chrome. Not shipped by the registry.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import dustyFieldSrc from "@/assets/figures/dusty-field.png";
import * as fixtures from "./fixtures";
import { InboxZero } from "./view";

const demoNow = () => new Date(fixtures.now);
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function EmptyInboxZeroShowcasePage() {
  return (
    <WirefrontProvider now={demoNow}>
      <InboxZero
        archiveHref="#archive"
        clearedThisWeek={fixtures.clearedThisWeek}
        illustration={dustyFieldSrc}
        lastMessageAt={fixtures.lastMessageAt}
        onSnooze={() => wait(600)}
      />
    </WirefrontProvider>
  );
}
