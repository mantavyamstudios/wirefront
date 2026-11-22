// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to fixture data and the previewed state.
// Not shipped by the registry; builders wire HomeDashboard to their own backend.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import { HomeDashboard } from "./view";

const demoNow = () => new Date(fixtures.now);
const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export function DashboardsHomeShowcasePage() {
  const state = useShowcaseState();
  return (
    <WirefrontProvider now={demoNow} timeZone="UTC">
      <HomeDashboard
        data={
          state === "loading" || state === "error"
            ? undefined
            : state === "empty"
              ? fixtures.emptyToday
              : fixtures.getToday
        }
        error="Your tasks didn’t load. Check your connection and try again."
        onNewTask={() => {}}
        onRetry={() => {}}
        onSetTaskDone={() => wait(400)}
        shortcuts={fixtures.shortcuts}
        stats={fixtures.stats}
        status={
          state === "loading"
            ? "loading"
            : state === "error"
              ? "error"
              : "ready"
        }
        userName={fixtures.userName}
      />
    </WirefrontProvider>
  );
}
