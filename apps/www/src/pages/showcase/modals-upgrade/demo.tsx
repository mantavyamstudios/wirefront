// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to a simulated backend, with the dialog open.
// Not shipped by the registry; builders wire UpgradeDialog to their own backend.
import * as fixtures from "./fixtures";
import { UpgradeDialog } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function ModalsUpgradeShowcasePage() {
  // The demo stays on the page instead of following a checkout URL.
  return (
    <UpgradeDialog
      compareHref="#plans"
      currentPlan="Free"
      defaultOpen
      limit={fixtures.limit}
      onChoosePlan={async () => {
        await wait(800);
      }}
      plans={fixtures.listUpgradePlans}
    />
  );
}
